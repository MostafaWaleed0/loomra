import { useLocalState } from '@/lib/hooks/use-local-state';
import { TaskPanel } from '../tasks/task-panel';
import type { TaskWithStats, UseTasksReturn } from '@/lib/types';

interface DashboardTasksProps {
  tasks: TaskWithStats[];
  onCreateTask: UseTasksReturn['handleCreateTask'];
  onToggleTask: UseTasksReturn['handleToggleTask'];
  onDeleteTask: UseTasksReturn['handleDeleteTask'];
  onEditTask: UseTasksReturn['handleEditTask'];
}

export function DashboardTasks({ tasks, onCreateTask, onToggleTask, onDeleteTask, onEditTask }: DashboardTasksProps) {
  const [taskFilter, setTaskFilter] = useLocalState('dashboard.tasks.taskFilter', 'all');
  const [timeFilter, setTimeFilter] = useLocalState('dashboard.tasks.timeFilter', 'all');

  return (
    <TaskPanel
      tasks={tasks}
      selectedGoalId={null}
      onCreateTask={onCreateTask}
      onToggleTask={onToggleTask}
      onDeleteTask={onDeleteTask}
      onEditTask={onEditTask}
      taskFilter={taskFilter}
      timeFilter={timeFilter}
      onTaskFilterChange={setTaskFilter}
      onTimeFilterChange={setTimeFilter}
    />
  );
}
