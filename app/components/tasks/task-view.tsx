import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { useLocalState } from '@/lib/hooks/use-local-state';
import { UseTasksReturn } from '@/lib/types';
import { AlertTriangle, BarChart3, Calendar, CheckCircle2 } from 'lucide-react';
import { SectionHeader } from '../layout/section-header';
import { TaskPanel } from './task-panel';

const StatsCard = ({ icon: Icon, title, value, subtitle, color = 'blue' }: any) => {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    red: 'bg-red-50 border-red-200 text-red-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600'
  };

  return (
    <Card>
      <CardContent className="flex items-center justify-between">
        <div>
          <CardTitle className="flex items-center justify-between gap-1 w-fit">
            <span>{title}</span>
            <span className="text-muted-foreground font-medium">{value}</span>
          </CardTitle>
          <CardDescription>{subtitle && <p className="mt-1">{subtitle}</p>}</CardDescription>
        </div>
        <div className={`p-3 rounded-lg border ${colors[color as keyof typeof colors]}`}>
          <Icon className="size-6" />
        </div>
      </CardContent>
    </Card>
  );
};

export function TaskView({ tasks, stats, handleToggleTask, handleCreateTask, handleDeleteTask, handleEditTask }: UseTasksReturn) {
  const [taskFilter, setTaskFilter] = useLocalState('taskView.tasks.taskFilter', 'all');
  const [timeFilter, setTimeFilter] = useLocalState('taskView.tasks.timeFilter', 'all');

  return (
    <div>
      <SectionHeader title="Task" description="Organize, prioritize, and complete tasks efficiently." showButton={false} />
      <div>
        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            icon={BarChart3}
            title="Total Tasks"
            value={stats.totalTasks}
            subtitle={`${stats.completionRate}% completed`}
            color="blue"
          />
          <StatsCard icon={CheckCircle2} title="Completed" value={stats.completedTasks} subtitle="Tasks finished" color="green" />
          <StatsCard icon={AlertTriangle} title="Overdue" value={stats.overdueTasks} subtitle="Need attention" color="red" />
          <StatsCard icon={Calendar} title="Due Today" value={stats.pendingTasks} subtitle="Urgent tasks" color="yellow" />
        </div>
        <TaskPanel
          tasks={tasks}
          selectedGoalId={null}
          onCreateTask={handleCreateTask}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
          onEditTask={handleEditTask}
          taskFilter={taskFilter}
          timeFilter={timeFilter}
          onTaskFilterChange={setTaskFilter}
          onTimeFilterChange={setTimeFilter}
        />
      </div>
    </div>
  );
}
