'use client';

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
import { ColorUtils, DateUtils, TASK_CONFIG } from '@/lib/core';
import type { TaskPriority, TaskUpdates, TaskWithStats } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AlertTriangle, CalendarIcon, CheckCircle2, Circle, Edit2, Flag, ListTodo, MoreVertical, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { DatePicker } from '../form/date-picker';
import { Badge } from '../ui/badge';
import { TaskInput } from './task-input';

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
    <Badge variant="outline" className={ColorUtils.getPriorityColor(priority)}>
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
  onKeyDown
}: TaskEditRowProps) {
  return (
    <div className="flex w-full items-center gap-2">
      <Input
        value={editingTitle}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Task title"
        onKeyDown={onKeyDown}
        autoFocus
        className="flex-1"
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-10 min-w-[80px]">
            <Flag className="size-4 mr-1" />
            {getPriorityConfig(editingPriority).label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          <DropdownMenuLabel>Priority</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={editingPriority} onValueChange={(value) => onPriorityChange(value as TaskPriority)}>
            {TASK_CONFIG.PRIORITY_OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                <Flag className={cn('size-4 mr-2', option.color)} />
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DatePicker date={editingDueDate} onSelect={onDueDateChange} mode="icon" side="left" />

      <Button variant="ghost" size="icon" onClick={onSave} aria-label="Save task" className="size-10">
        <CheckCircle2 className="size-5 text-green-600" />
      </Button>

      <Button variant="ghost" size="icon" onClick={onCancel} aria-label="Cancel edit" className="size-10">
        <Circle className="size-5 text-muted-foreground" />
      </Button>
    </div>
  );
}

interface TaskDisplayRowProps {
  task: TaskWithStats;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPriorityChange: (priority: TaskPriority) => void;
}

function TaskDisplayRow({ task, onToggle, onEdit, onDelete, onPriorityChange }: TaskDisplayRowProps) {
  return (
    <>
      <Button onClick={onToggle} aria-label={task.done ? 'Mark as incomplete' : 'Mark as complete'} variant="ghost" size="icon">
        {task.done ? <CheckCircle2 className="size-5 text-green-600" /> : <Circle className="size-5 text-muted-foreground" />}
      </Button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <div className={cn('text-base font-medium truncate', task.done && 'line-through text-muted-foreground')}>
            {task.title}
          </div>
          {task.priority && <PriorityBadge priority={task.priority} />}
        </div>

        {task.dueDate && (
          <div
            className={cn(
              'flex items-center gap-1 text-sm',
              task.isOverdue ? 'text-red-600' : task.daysUntilDue === 0 ? 'text-orange-600' : 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="size-4 flex-shrink-0" />
            <span className="truncate">{DateUtils.formatDateForDisplay(task.dueDate, { format: 'relative' })}</span>
            {task.isOverdue && <AlertTriangle className="size-4 text-red-500 flex-shrink-0" />}
          </div>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="size-8" aria-label="Open task actions menu">
            <MoreVertical className="size-4" />
            <span className="sr-only">Open task menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={onEdit}>
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
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                <Flag className={cn('size-4 mr-2', option.color)} />
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={onDelete} variant="destructive">
            <Trash2 className="mr-2 size-4" />
            Delete Task
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

function EmptyTaskState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <ListTodo className="size-12 text-muted-foreground/50 mb-3" />
      <p className="text-sm text-muted-foreground font-medium">No tasks yet</p>
      <p className="text-xs text-muted-foreground mt-1">Add your first task above to get started!</p>
    </div>
  );
}

function sortTasks(tasks: TaskWithStats[]): TaskWithStats[] {
  return [...tasks].sort((a, b) => {
    const priorityOrder: Record<TaskPriority, number> = { high: 3, medium: 2, low: 1 };
    const aPriority = priorityOrder[a.priority || 'medium'];
    const bPriority = priorityOrder[b.priority || 'medium'];

    if (aPriority !== bPriority) return bPriority - aPriority;
    if (a.done !== b.done) return a.done ? 1 : -1;
    return 0;
  });
}

interface TaskPanelProps {
  tasks: TaskWithStats[];
  selectedGoalId: string | null;
  onCreateTask: (title: string, goalId?: string, dueDate?: string) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (taskId: string, updates: TaskUpdates) => void;
  getTasksByGoal?: (goalId: string | null) => TaskWithStats[] | undefined;
}

export function TaskPanel({
  tasks,
  selectedGoalId,
  onCreateTask,
  onToggleTask,
  onDeleteTask,
  onEditTask,
  getTasksByGoal
}: TaskPanelProps) {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [editingDueDate, setEditingDueDate] = useState<Date | undefined>(undefined);
  const [editingPriority, setEditingPriority] = useState<TaskPriority>('medium');

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

  const displayTasks = getTasksByGoal?.(selectedGoalId) || tasks;
  const sortedTasks = sortTasks(displayTasks);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <ListTodo className="size-6 text-primary" />
          Tasks
          {displayTasks.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({displayTasks.filter((t) => t.done).length}/{displayTasks.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        <TaskInput onCreate={(title, dueDate) => onCreateTask(title, selectedGoalId ?? undefined, dueDate)} />
        <div className="flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar max-h-96">
          {sortedTasks.map((task) => (
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
                  onToggle={() => onToggleTask(task.id)}
                  onEdit={() => handleStartEdit(task)}
                  onDelete={() => onDeleteTask(task.id)}
                  onPriorityChange={(priority) => handlePriorityChange(task.id, priority)}
                />
              )}
            </div>
          ))}

          {displayTasks.length === 0 && <EmptyTaskState />}
        </div>
      </CardContent>
    </Card>
  );
}
