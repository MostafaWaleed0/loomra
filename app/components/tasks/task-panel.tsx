import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ColorUtils, DateUtils, TASK_CONFIG, UIUtils } from '@/lib/core';
import type { GoalWithStats, TaskPriority, TaskUpdates, TaskWithStats, UseGoalsReturn } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  CalendarIcon,
  CheckCircle2,
  Circle,
  Clock,
  Edit2,
  Filter,
  Flag,
  ListTodo,
  MoreVertical,
  Plus,
  Target,
  Trash2,
  Search,
  X,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { useState } from 'react';
import { DatePicker } from '../form/date-picker';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export type TaskFilter = 'all' | 'active' | 'completed';
export type TimeFilter = 'all' | 'today' | 'week' | 'overdue' | 'no-date';

interface PriorityConfig {
  value: TaskPriority;
  label: string;
  color: string;
  bgColor: string;
}

function getPriorityConfig(priority: TaskPriority): PriorityConfig {
  return TASK_CONFIG.PRIORITY_OPTIONS.find((p) => p.value === priority) || TASK_CONFIG.PRIORITY_OPTIONS[1];
}

interface PriorityBadgeProps {
  priority: TaskPriority;
}

function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = getPriorityConfig(priority);
  return (
    <Badge variant="outline" className={cn(ColorUtils.getPriorityColor(priority), 'transition-all hover:scale-105')}>
      <Flag className="size-3" />
      {config.label}
    </Badge>
  );
}

interface TaskEditRowProps {
  editingTitle: string;
  editingPriority: TaskPriority;
  editingDueDate: Date | undefined;
  onTitleChange: (title: string) => void;
  onPriorityChange: (priority: TaskPriority) => void;
  onDueDateChange: (date: Date | undefined) => void;
  onSave: () => void;
  onCancel: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  mode?: 'create' | 'edit';
}

function TaskEditRow({
  editingTitle,
  editingPriority,
  editingDueDate,
  onTitleChange,
  onPriorityChange,
  onDueDateChange,
  onSave,
  onCancel,
  onKeyDown,
  mode = 'edit'
}: TaskEditRowProps) {
  return (
    <div className="flex w-full items-center gap-2 animate-in fade-in duration-200">
      <Input
        value={editingTitle}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder={mode === 'create' ? 'Add a new task...' : 'Task title'}
        onKeyDown={onKeyDown}
        autoFocus
        className="flex-1 border-2 focus-visible:ring-2 focus-visible:ring-primary/50 transition-all"
      />

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-10 min-w-20 transition-all hover:border-primary/50 hover:shadow-sm">
            <Flag
              className={cn('size-4 mr-1 transition-transform group-hover:scale-110', getPriorityConfig(editingPriority).color)}
            />
            {getPriorityConfig(editingPriority).label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-48">
          <DropdownMenuLabel>Priority</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={editingPriority} onValueChange={(value) => onPriorityChange(value as TaskPriority)}>
            {TASK_CONFIG.PRIORITY_OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value} className="cursor-pointer">
                <Flag className={cn('size-4 mr-2', option.color)} />
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DatePicker date={editingDueDate} onSelect={onDueDateChange} mode="icon" side="left" />

      <Button
        variant="ghost"
        size="icon"
        onClick={onSave}
        aria-label={mode === 'create' ? 'Add task' : 'Save task'}
        className="size-10 hover:bg-green-50 hover:text-green-600 transition-all"
      >
        {mode === 'create' ? <Plus className="size-5 text-primary" /> : <CheckCircle2 className="size-5 text-green-600" />}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onCancel}
        aria-label="Cancel"
        className="size-10 hover:bg-red-50 hover:text-red-600 transition-all"
      >
        <X className="size-5 text-muted-foreground" />
      </Button>
    </div>
  );
}

interface TaskDisplayRowProps {
  task: TaskWithStats;
  selectedGoalId: string | null;
  goal: GoalWithStats | null;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPriorityChange: (priority: TaskPriority) => void;
}

function TaskDisplayRow({ task, goal, onToggle, onEdit, selectedGoalId, onDelete, onPriorityChange }: TaskDisplayRowProps) {
  const GoalIcon = UIUtils.getIconComponent(goal?.icon || '');
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="flex items-start gap-3 w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Button
        onClick={onToggle}
        aria-label={task.done ? 'Mark as incomplete' : 'Mark as complete'}
        variant="ghost"
        size="icon"
        className="shrink-0 hover:scale-110 transition-transform"
      >
        {task.done ? (
          <CheckCircle2 className="size-5 text-green-600 animate-in zoom-in duration-200" />
        ) : (
          <Circle className="size-5 text-muted-foreground hover:text-green-600 transition-colors" />
        )}
      </Button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {selectedGoalId ? (
            <TooltipProvider delayDuration={5000}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'text-base font-medium truncate transition-all cursor-help',
                      task.done && 'line-through text-muted-foreground opacity-60'
                    )}
                  >
                    {task.title}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{task.title}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <div className={cn('text-base font-medium truncate', task.done && 'line-through text-muted-foreground')}>
              {task.title}
            </div>
          )}
          {task.priority && <PriorityBadge priority={task.priority} />}
        </div>

        <div className="flex flex-col gap-1">
          {goal && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground group/goal">
              <GoalIcon
                className="size-4 shrink-0 transition-transform group-hover/goal:scale-110"
                style={{ color: goal.color }}
              />
              <span className="truncate">{goal.title}</span>
            </div>
          )}
          {task.dueDate && (
            <div
              className={cn(
                'flex items-center gap-1.5 text-sm transition-colors',
                task.isOverdue
                  ? 'text-red-600 font-medium'
                  : task.daysUntilDue === 0
                  ? 'text-orange-600 font-medium'
                  : 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="size-4 shrink-0" />
              <span className="truncate">{DateUtils.formatDateForDisplay(task.dueDate, { format: 'relative' })}</span>
              {task.isOverdue && <AlertTriangle className="size-4 text-red-500 shrink-0 animate-pulse" />}
            </div>
          )}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn('size-8 transition-all', isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}
            aria-label="Open task actions menu"
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48" sideOffset={5}>
          <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
            <Edit2 className="mr-2 size-4" />
            Edit Task
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">Change Priority</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={task.priority || 'medium'}
            onValueChange={(value) => onPriorityChange(value as TaskPriority)}
          >
            {TASK_CONFIG.PRIORITY_OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value} className="cursor-pointer">
                <Flag className={cn('size-4 mr-2', option.color)} />
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={onDelete} variant="destructive" className="cursor-pointer">
            <Trash2 className="mr-2 size-4" />
            Delete Task
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function EmptyTaskState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in duration-500">
      <div className="rounded-full bg-linear-to-br from-primary/20 to-primary/5 p-6 mb-4 animate-in zoom-in duration-300">
        <ListTodo className="size-16 text-primary" />
      </div>
      <p className="text-lg text-foreground font-semibold mb-2">No tasks yet</p>
      <p className="text-sm text-muted-foreground max-w-sm">
        Click "Add Task" above to create your first task and start getting things done
      </p>
    </div>
  );
}

function sortTasks(tasks: TaskWithStats[]): TaskWithStats[] {
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) {
      return a.done ? 1 : -1;
    }

    if (!a.done) {
      if (a.isOverdue !== b.isOverdue) {
        return a.isOverdue ? -1 : 1;
      }

      if (a.dueDate && b.dueDate) {
        const comparison = DateUtils.calculateDaysBetween(a.dueDate, b.dueDate);
        if (comparison !== 0) return comparison;
      }

      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;

      const priorityOrder: Record<TaskPriority, number> = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority || 'medium'] - priorityOrder[a.priority || 'medium'];
      if (priorityDiff !== 0) return priorityDiff;
    }

    if (a.done && a.updatedAt && b.updatedAt) {
      return DateUtils.calculateDaysBetween(b.updatedAt, a.updatedAt);
    }

    if (a.createdAt && b.createdAt) {
      return DateUtils.calculateDaysBetween(b.createdAt, a.createdAt);
    }

    return 0;
  });
}

interface QuickAddTaskProps {
  onCreate: (title: string, dueDate?: string, priority?: TaskPriority) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

function QuickAddTask({ onCreate, isExpanded, onToggle }: QuickAddTaskProps) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [priority, setPriority] = useState<TaskPriority>('medium');

  function handleCreate() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    onCreate(trimmedTitle, dueDate?.toISOString(), priority);

    setTitle('');
    setDueDate(undefined);
    setPriority('medium');
    onToggle();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreate();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setTitle('');
      setDueDate(undefined);
      setPriority('medium');
      onToggle();
    }
  }

  function handleCancel() {
    setTitle('');
    setDueDate(undefined);
    setPriority('medium');
    onToggle();
  }

  if (!isExpanded) {
    return (
      <Button
        onClick={onToggle}
        className="w-full justify-start gap-2 h-12 text-base font-medium shadow-sm hover:shadow-md transition-all"
        variant="outline"
      >
        <Plus className="size-5" />
        Add Task
      </Button>
    );
  }

  return (
    <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-3">
      <TaskEditRow
        editingTitle={title}
        editingPriority={priority}
        editingDueDate={dueDate}
        onTitleChange={setTitle}
        onPriorityChange={setPriority}
        onDueDateChange={setDueDate}
        onSave={handleCreate}
        onCancel={handleCancel}
        onKeyDown={handleKeyDown}
        mode="create"
      />
      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3 ml-1">
        <Sparkles className="size-3" />
        <span>
          Press <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted rounded border">Enter</kbd> to add or{' '}
          <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted rounded border">Esc</kbd> to cancel
        </span>
      </div>
    </div>
  );
}

interface TaskPanelProps {
  tasks: TaskWithStats[];
  selectedGoalId: string | null;
  onCreateTask: (title: string, goalId?: string, dueDate?: string, priority?: TaskPriority) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (taskId: string, updates: TaskUpdates) => void;
  getTasksByGoal?: (goalId: string | null) => TaskWithStats[] | undefined;
  showFilter?: boolean;
  taskFilter?: TaskFilter;
  timeFilter?: TimeFilter;
  onTaskFilterChange?: (filter: TaskFilter) => void;
  onTimeFilterChange?: (filter: TimeFilter) => void;
  getGoalByTaskId: UseGoalsReturn['getGoalByTaskId'];
}

export function TaskPanel({
  tasks,
  selectedGoalId,
  onCreateTask,
  onToggleTask,
  onDeleteTask,
  onEditTask,
  getTasksByGoal,
  getGoalByTaskId,
  showFilter = true,
  taskFilter: externalTaskFilter,
  timeFilter: externalTimeFilter,
  onTaskFilterChange,
  onTimeFilterChange
}: TaskPanelProps) {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [editingDueDate, setEditingDueDate] = useState<Date | undefined>(undefined);
  const [editingPriority, setEditingPriority] = useState<TaskPriority>('medium');
  const [isQuickAddExpanded, setIsQuickAddExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [internalTaskFilter, setInternalTaskFilter] = useState<TaskFilter>('all');
  const [internalTimeFilter, setInternalTimeFilter] = useState<TimeFilter>('all');

  const taskFilter = externalTaskFilter !== undefined ? externalTaskFilter : internalTaskFilter;
  const timeFilter = externalTimeFilter !== undefined ? externalTimeFilter : internalTimeFilter;

  const handleTaskFilterChange = (filter: TaskFilter) => {
    if (onTaskFilterChange) {
      onTaskFilterChange(filter);
    } else {
      setInternalTaskFilter(filter);
    }
  };

  const handleTimeFilterChange = (filter: TimeFilter) => {
    if (onTimeFilterChange) {
      onTimeFilterChange(filter);
    } else {
      setInternalTimeFilter(filter);
    }
  };

  function handleStartEdit(task: TaskWithStats): void {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
    setEditingDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
    setEditingPriority(task.priority || 'medium');
  }

  function handleSaveEdit(taskId: string): void {
    const trimmedTitle = editingTitle.trim();
    if (!trimmedTitle) return;

    const updates: TaskUpdates = {
      title: trimmedTitle,
      priority: editingPriority,
      dueDate: editingDueDate?.toISOString()
    };

    onEditTask(taskId, updates);
    handleCancelEdit();
  }

  function handleCancelEdit(): void {
    setEditingTaskId(null);
    setEditingTitle('');
    setEditingDueDate(undefined);
    setEditingPriority('medium');
  }

  function handlePriorityChange(taskId: string, newPriority: TaskPriority): void {
    onEditTask(taskId, { priority: newPriority });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, taskId: string): void {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit(taskId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  }

  function handleQuickAdd(title: string, dueDate?: string, priority?: TaskPriority): void {
    onCreateTask(title, selectedGoalId ?? undefined, dueDate, priority);
  }

  function isTaskInTimeFilter(task: TaskWithStats, filter: TimeFilter): boolean {
    if (filter === 'all') return true;
    if (filter === 'no-date') return !task.dueDate;
    if (!task.dueDate) return false;

    const todayStr = DateUtils.getCurrentDateString();
    const taskDateStr = DateUtils.formatDate(new Date(task.dueDate));

    switch (filter) {
      case 'today':
        return taskDateStr === todayStr;
      case 'week': {
        const weekEnd = DateUtils.addDays(todayStr, 7);
        return !DateUtils.isDateBefore(taskDateStr, todayStr) && DateUtils.isDateBefore(taskDateStr, weekEnd);
      }
      case 'overdue':
        return DateUtils.isDateBefore(taskDateStr, todayStr) && !task.done;
      default:
        return true;
    }
  }

  const displayTasks = getTasksByGoal?.(selectedGoalId) || tasks;

  const filteredTasks = displayTasks.filter((task) => {
    if (taskFilter === 'active' && task.done) return false;
    if (taskFilter === 'completed' && !task.done) return false;

    if (searchQuery.trim() && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return isTaskInTimeFilter(task, timeFilter);
  });

  const sortedTasks = sortTasks(filteredTasks);
  const activeTasks = displayTasks.filter((t) => !t.done).length;
  const completedTasks = displayTasks.filter((t) => t.done).length;

  const todayTasks = displayTasks.filter((t) => isTaskInTimeFilter(t, 'today')).length;
  const weekTasks = displayTasks.filter((t) => isTaskInTimeFilter(t, 'week')).length;
  const overdueTasks = displayTasks.filter((t) => isTaskInTimeFilter(t, 'overdue')).length;
  const noDateTasks = displayTasks.filter((t) => !t.dueDate).length;

  const completionRate = displayTasks.length > 0 ? Math.round((completedTasks / displayTasks.length) * 100) : 0;

  return (
    <Card className="shadow-lg border-primary/10">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="rounded-lg bg-primary/10 p-2">
              <ListTodo className="size-6 text-primary" />
            </div>
            <div className="flex flex-col">
              <span>Tasks</span>
              {displayTasks.length > 0 && (
                <span className="text-xs font-normal text-muted-foreground mt-0.5">
                  {completionRate}% complete · {activeTasks} active
                </span>
              )}
            </div>
          </CardTitle>

          {showFilter && displayTasks.length > 0 && (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 transition-all hover:shadow-sm">
                    <Clock className="size-4" />
                    <span className="hidden sm:inline">
                      {timeFilter === 'all' && 'All Time'}
                      {timeFilter === 'today' && 'Today'}
                      {timeFilter === 'week' && 'This Week'}
                      {timeFilter === 'overdue' && 'Overdue'}
                      {timeFilter === 'no-date' && 'No Date'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel>Filter by Time</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup
                    value={timeFilter}
                    onValueChange={(value) => handleTimeFilterChange(value as TimeFilter)}
                  >
                    <DropdownMenuRadioItem value="all">
                      All Time
                      <span className="ml-auto text-xs text-muted-foreground">{displayTasks.length}</span>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="today">
                      Today
                      <span className="ml-auto text-xs text-muted-foreground">{todayTasks}</span>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="week">
                      This Week
                      <span className="ml-auto text-xs text-muted-foreground">{weekTasks}</span>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="overdue">
                      Overdue
                      <span className="ml-auto text-xs text-muted-foreground">{overdueTasks}</span>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="no-date">
                      No Date
                      <span className="ml-auto text-xs text-muted-foreground">{noDateTasks}</span>
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 transition-all hover:shadow-sm">
                    <Filter className="size-4" />
                    <span className="hidden sm:inline">
                      {taskFilter === 'all' && 'All'}
                      {taskFilter === 'active' && 'Active'}
                      {taskFilter === 'completed' && 'Completed'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuLabel>Filter Tasks</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup
                    value={taskFilter}
                    onValueChange={(value) => handleTaskFilterChange(value as TaskFilter)}
                  >
                    <DropdownMenuRadioItem value="all">
                      All Tasks
                      <span className="ml-auto text-xs text-muted-foreground">{displayTasks.length}</span>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="active">
                      Active
                      <span className="ml-auto text-xs text-muted-foreground">{activeTasks}</span>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="completed">
                      Completed
                      <span className="ml-auto text-xs text-muted-foreground">{completedTasks}</span>
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {displayTasks.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="pl-9 pr-9 h-10 transition-all focus-visible:ring-2"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 size-8 hover:bg-transparent"
                onClick={() => setSearchQuery('')}
              >
                <X className="size-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <QuickAddTask
          onCreate={handleQuickAdd}
          isExpanded={isQuickAddExpanded}
          onToggle={() => setIsQuickAddExpanded(!isQuickAddExpanded)}
        />

        {displayTasks.length > 0 && (
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
            {sortedTasks.map((task) => {
              const goalData = getGoalByTaskId ? getGoalByTaskId(task.id) : null;

              return (
                <div
                  key={task.id}
                  className={cn(
                    'group flex items-start gap-3 rounded-xl border px-4 py-3 transition-all',
                    task.done
                      ? 'bg-muted/20 opacity-75'
                      : 'bg-secondary/30 hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm'
                  )}
                >
                  {editingTaskId === task.id ? (
                    <TaskEditRow
                      editingTitle={editingTitle}
                      editingPriority={editingPriority}
                      editingDueDate={editingDueDate}
                      onTitleChange={setEditingTitle}
                      onPriorityChange={setEditingPriority}
                      onDueDateChange={setEditingDueDate}
                      onSave={() => handleSaveEdit(task.id)}
                      onCancel={handleCancelEdit}
                      onKeyDown={(e) => handleKeyDown(e, task.id)}
                    />
                  ) : (
                    <TaskDisplayRow
                      task={task}
                      goal={goalData}
                      selectedGoalId={selectedGoalId}
                      onToggle={() => onToggleTask(task.id)}
                      onEdit={() => handleStartEdit(task)}
                      onDelete={() => onDeleteTask(task.id)}
                      onPriorityChange={(priority) => handlePriorityChange(task.id, priority)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {filteredTasks.length === 0 && displayTasks.length > 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Filter className="size-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground font-medium">
              No {taskFilter !== 'all' && taskFilter} {timeFilter !== 'all' && timeFilter} tasks
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {taskFilter === 'active' && 'All tasks are completed!'}
              {taskFilter === 'completed' && 'No completed tasks yet'}
              {timeFilter === 'today' && 'No tasks due today'}
              {timeFilter === 'week' && 'No tasks due this week'}
              {timeFilter === 'overdue' && 'Great! No overdue tasks'}
              {timeFilter === 'no-date' && 'All tasks have due dates'}
            </p>
          </div>
        )}

        {displayTasks.length === 0 && <EmptyTaskState />}
      </CardContent>
    </Card>
  );
}
