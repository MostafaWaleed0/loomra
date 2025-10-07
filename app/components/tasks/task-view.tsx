import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { AlertTriangle, BarChart3, Calendar, CheckCircle2 } from 'lucide-react';
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
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            <p>{value}</p>
            {subtitle && <p className="mt-1">{subtitle}</p>}
          </CardDescription>
        </div>
        <div className={`p-3 rounded-lg border ${colors[color as keyof typeof colors]}`}>
          <Icon className="size-6" />
        </div>
      </CardContent>
    </Card>
  );
};

export function TaskView({ tasks, stats, handleToggleTask, handleCreateTask, handleDeleteTask, handleEditTask }: any) {
  return (
    <div>
      <div className="flex items-start justify-between gap-6 mb-6">
        <header>
          <h1 className="text-3xl sm:text-4xl font-extrabold ">Task</h1>
          <p className="mt-1 text-secondary-foreground">Plan, track and celebrate progress.</p>
        </header>
      </div>

      <div>
        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            icon={BarChart3}
            title="Total Tasks"
            value={stats.total}
            subtitle={`${stats.completionRate}% completed`}
            color="blue"
          />
          <StatsCard icon={CheckCircle2} title="Completed" value={stats.completed} subtitle="Tasks finished" color="green" />
          <StatsCard icon={AlertTriangle} title="Overdue" value={stats.overdue} subtitle="Need attention" color="red" />
          <StatsCard icon={Calendar} title="Due Today" value={stats.dueToday} subtitle="Urgent tasks" color="yellow" />
        </div>
        <TaskPanel
          tasks={tasks}
          selectedGoalId={null}
          onCreateTask={handleCreateTask}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
          onEditTask={handleEditTask}
        />
      </div>
    </div>
  );
}
