import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { GoalStats } from '@/lib/types';
import { BarChart3, CheckCircle2, Target, TrendingUp } from 'lucide-react';

interface GoalStatsCardProps {
  stats: GoalStats;
}

export function GoalStatsCard({ stats }: GoalStatsCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatsCard icon={BarChart3} title="Total Goals" value={stats.totalGoals} subtitle="All goals" color="blue" />
      <StatsCard icon={Target} title="Active" value={stats.activeGoals} subtitle="In progress" color="green" />
      <StatsCard icon={CheckCircle2} title="Completed" value={stats.completedGoals} subtitle="Finished goals" color="green" />
      <ProgressStatCard progress={stats.avgProgress} />
    </div>
  );
}

export const StatsCard = ({
  icon: Icon,
  title,
  value,
  subtitle,
  color = 'blue'
}: {
  icon: React.ElementType;
  title: string;
  value: number | string;
  subtitle?: string;
  color?: 'blue' | 'green' | 'red' | 'yellow';
}) => {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    red: 'bg-red-50 border-red-200 text-red-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600'
  };

  return (
    <Card className="flex justify-center">
      <CardContent className="flex items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <span>{title}</span>
            <span className="text-muted-foreground font-medium">{value}</span>
          </CardTitle>

          {subtitle && <CardDescription className="mt-1">{subtitle}</CardDescription>}
        </div>

        <div className={`p-3 rounded-lg border ${colors[color]}`}>
          <Icon className="size-6" />
        </div>
      </CardContent>
    </Card>
  );
};

function ProgressStatCard({ progress }: { progress: number }) {
  const status = progress >= 75 ? 'Great momentum' : progress >= 40 ? 'On track' : 'Needs focus';

  return (
    <Card className="flex justify-center">
      <CardContent>
        <div className="flex justify-between items-center gap-10">
          <div className="w-full">
            <CardTitle className="flex items-center gap-2">
              <span>Avg Progress</span>
              <span className="text-muted-foreground font-medium">{progress}%</span>
            </CardTitle>
            <CardDescription className="mt-1 capitalize">{status}</CardDescription>
            <Progress value={progress} className="mt-2" />
          </div>
          <div className="p-3 rounded-lg bg-orange-50 text-orange-600">
            <TrendingUp className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
