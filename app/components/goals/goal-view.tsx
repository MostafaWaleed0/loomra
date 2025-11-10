'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useGoalForm } from '@/lib/hooks/use-goal-form';
import { useSettings } from '@/lib/context/settings-context';
import type { DeleteStrategy, Goal, GoalStats, GoalWithStats, Habit, TaskWithStats, UseGoalsReturn } from '@/lib/types';
import { motion } from 'framer-motion';
import { ArrowLeft, Award, CheckCircle2, Plus, Target, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SectionHeader } from '../layout/section-header';
import { TaskPanel } from '../tasks/task-panel';
import { EmptyState } from './empty-state';
import { FilterBar } from './filter-bar';
import { GoalCard } from './goal-card';
import { GoalDeleteDialog } from './goal-delete-dialog';
import { GoalDetailHeader } from './goal-detail-header';
import { GoalEditorDrawer } from './goal-drawer';
import { GoalMetadataGrid } from './goal-metadata-grid';
import { GoalNotesCard } from './goal-notes-card';
import { GoalProgressSection } from './goal-progress-section';
import { HabitsPanel } from './habits-panel';
import { AppSettings } from '@/lib/tauri-api';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

/* ---------------------------------------------------------------------------
   StatsCard
--------------------------------------------------------------------------- */
interface StatsCardProps {
  stats: GoalStats;
}

function StatsCard({ stats }: StatsCardProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Award className="size-4 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{stats.totalGoals}</p>
              <p className="text-xs text-muted-foreground">Total Goals</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Target className="size-4 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats.activeGoals}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold">{stats.completedGoals}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{stats.avgProgress}%</p>
              <p className="text-xs text-muted-foreground">Avg Progress</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   GoalDetailView
--------------------------------------------------------------------------- */

interface GoalDetailViewProps {
  goal: GoalWithStats;
  onBack: () => void;
  onUpdate: (goalId: string, updates: Partial<Goal>) => Promise<boolean>;
  onDelete: (goalId: string, strategy?: DeleteStrategy) => Promise<boolean>;
  onStatusChange: (goalId: string, action: 'completed' | 'active' | 'paused') => void;
  tasks: TaskWithStats[];
  onCreateTask: (title: string, goalId?: string, dueDate?: string) => void;
  onToggleTask: (taskId: string) => Promise<void>;
  onEditTask: (taskId: string, updates: Partial<TaskWithStats>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  getHabitsByGoalId: (goalId: string) => Habit[];
  isEditorOpen: boolean;
  setIsEditorOpen: (open: boolean) => void;
  shouldAnimate: boolean;
  setShouldAnimate: (value: boolean) => void;
  deadlineWarning: number;
  showProgressPercentage: boolean;
}

function GoalDetailView({
  goal,
  onBack,
  onUpdate,
  onDelete,
  onStatusChange,
  tasks,
  onCreateTask,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  getHabitsByGoalId,
  isEditorOpen,
  setIsEditorOpen,
  shouldAnimate,
  setShouldAnimate,
  deadlineWarning,
  showProgressPercentage
}: GoalDetailViewProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { formData, validationErrors, updateField, resetForm, hasErrors } = useGoalForm(goal);

  const goalTasks = tasks.filter((t) => t.goalId === goal.id);

  function handleEdit() {
    resetForm(goal);
    setIsEditorOpen(true);
  }

  function handleDeleteConfirm(strategy: DeleteStrategy) {
    onDelete(goal.id, strategy);
    onBack();
  }

  return (
    <motion.div
      variants={shouldAnimate ? pageVariants : undefined}
      initial={shouldAnimate ? 'initial' : false}
      animate={shouldAnimate ? 'animate' : false}
      onAnimationComplete={() => setShouldAnimate(false)}
      className="space-y-6"
    >
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="size-4 mr-2" />
        Back to Goals
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main section */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <GoalDetailHeader
              goal={goal}
              onEdit={handleEdit}
              onStatusChange={(action) => onStatusChange(goal.id, action)}
              onDelete={() => setDeleteDialogOpen(true)}
            />
            <CardContent>
              <div className="space-y-6">
                {showProgressPercentage && <GoalProgressSection goal={goal} />}
                <GoalMetadataGrid goal={goal} deadlineWarning={deadlineWarning} />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <TaskPanel
              tasks={goalTasks}
              selectedGoalId={goal.id}
              onCreateTask={onCreateTask}
              onToggleTask={onToggleTask}
              onDeleteTask={onDeleteTask}
              onEditTask={onEditTask}
              getTasksByGoal={(goalId) => tasks.filter((t) => t.goalId === goalId)}
              showFilter={false}
            />
            <HabitsPanel getHabitsByGoalId={getHabitsByGoalId} selectedGoalId={goal.id} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <GoalNotesCard
            notes={goal.notes || ''}
            onSave={(notes) => onUpdate(goal.id, { notes })}
            validationError={validationErrors?.notes}
          />
        </div>
      </div>

      <GoalDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        goal={goal}
        taskCount={goalTasks.length}
        onDelete={handleDeleteConfirm}
      />

      <GoalEditorDrawer
        selectedGoal={goal}
        open={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={(id, updates) => {
          if (id) onUpdate(id, updates);
          setIsEditorOpen(false);
        }}
        formData={formData}
        validationErrors={validationErrors}
        updateField={updateField}
        hasErrors={hasErrors}
      />
    </motion.div>
  );
}

/* ---------------------------------------------------------------------------
   GoalView
--------------------------------------------------------------------------- */
export interface GoalViewProps extends UseGoalsReturn {
  tasks: TaskWithStats[];
  onCreateTask: (title: string, goalId?: string, dueDate?: string) => void;
  onToggleTask: (taskId: string) => Promise<void>;
  onEditTask: (taskId: string, updates: Partial<TaskWithStats>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  getHabitsByGoalId: (goalId: string) => Habit[];
  settings: AppSettings['goals'];
}

export function GoalView({
  goals,
  selectedGoal,
  setSelectedGoal,
  stats,
  handleCreateGoal,
  handleUpdateGoal,
  handleDeleteGoal,
  markAsCompleted,
  markAsActive,
  pauseGoal,
  getFilteredGoals,
  tasks,
  onCreateTask,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  getHabitsByGoalId,
  settings
}: GoalViewProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const { resetForm } = useGoalForm(null);

  const filteredGoals = useMemo(() => {
    return getFilteredGoals({
      search: searchQuery || undefined,
      status: statusFilter !== 'all' ? (statusFilter as any) : undefined,
      priority: priorityFilter !== 'all' ? (priorityFilter as any) : undefined,
      completed: statusFilter === 'completed' || undefined,
      overdue: statusFilter === 'overdue' || undefined
    });
  }, [getFilteredGoals, searchQuery, statusFilter, priorityFilter]);

  function handleStatusChange(goalId: string, action: 'completed' | 'active' | 'paused') {
    const actions = {
      completed: () => markAsCompleted(goalId),
      active: () => markAsActive(goalId),
      paused: () => pauseGoal(goalId)
    };
    actions[action]();
  }

  function handleCreateNew() {
    resetForm();
    handleCreateGoal({ title: 'New Goal' });
  }

  function handleGoalSelect(goal: GoalWithStats) {
    setShouldAnimate(true);
    setSelectedGoal(goal);
    resetForm(goal);
  }

  function handleGoalBack() {
    setShouldAnimate(true);
    setSelectedGoal(null);
  }

  if (selectedGoal) {
    return (
      <GoalDetailView
        goal={goals.find((g) => g.id === selectedGoal.id) || (selectedGoal as GoalWithStats)}
        onBack={handleGoalBack}
        onUpdate={handleUpdateGoal}
        onDelete={handleDeleteGoal}
        onStatusChange={handleStatusChange}
        tasks={tasks}
        onCreateTask={onCreateTask}
        onToggleTask={onToggleTask}
        onEditTask={onEditTask}
        onDeleteTask={onDeleteTask}
        getHabitsByGoalId={getHabitsByGoalId}
        setIsEditorOpen={setIsEditorOpen}
        isEditorOpen={isEditorOpen}
        shouldAnimate={shouldAnimate}
        setShouldAnimate={setShouldAnimate}
        deadlineWarning={settings.deadlineWarningDays}
        showProgressPercentage={settings.showProgressPercentage}
      />
    );
  }

  return (
    <motion.div
      variants={shouldAnimate ? pageVariants : undefined}
      initial={shouldAnimate ? 'initial' : false}
      animate={shouldAnimate ? 'animate' : false}
      onAnimationComplete={() => setShouldAnimate(false)}
      className="space-y-6"
    >
      <SectionHeader
        title="Goals"
        description="Set clear milestones, monitor progress, and achieve your ambitions."
        onButtonClick={handleCreateNew}
        buttonLabel="New Goal"
      />

      <StatsCard stats={stats} />

      {goals.length > 0 && (
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
        />
      )}

      {filteredGoals.length === 0 ? (
        <EmptyState
          icon={Target}
          title={goals.length === 0 ? 'No goals yet' : 'No goals match your filters'}
          description={
            goals.length === 0
              ? 'Start by creating your first goal to begin tracking your progress.'
              : 'Try adjusting your search or filter criteria.'
          }
          action={goals.length === 0 ? { label: 'Create Your First Goal', onClick: handleCreateNew, icon: Plus } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              showProgressPercentage={settings.showProgressPercentage}
              onClick={() => handleGoalSelect(goal)}
              onEdit={() => {
                setSelectedGoal(goal);
                setIsEditorOpen(true);
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
