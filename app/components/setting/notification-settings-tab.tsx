import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { AppSettings } from '@/lib/tauri-api';
import { Bell, TrendingUp } from 'lucide-react';

interface NotificationSettingsTabProps {
  settings: AppSettings['notifications'];
  onUpdate: (settings: Partial<AppSettings['notifications']>) => Promise<boolean>;
}

export function NotificationSettingsTab({ settings, onUpdate }: NotificationSettingsTabProps) {
  const handleUpdate = async (field: keyof AppSettings['notifications'], value: any) => {
    await onUpdate({ [field]: value });
  };

  return (
    <Card className="border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 bg-linear-to-br from-primary/20 to-primary/10 rounded-lg border border-primary/20">
            <Bell className="h-4 w-4 text-primary" />
          </div>
          Notification Preferences
        </CardTitle>
        <CardDescription className="text-sm">Choose which notifications you want to receive</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Habit Reminders */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
          <div className="flex items-center gap-3">
            <Bell className="size-5 text-primary" />
            <div className="space-y-0.5">
              <Label htmlFor="habitReminders" className="text-sm font-semibold">
                Habit Reminders
              </Label>
              <p className="text-xs text-muted-foreground">Get reminded about your daily habits</p>
            </div>
          </div>
          <Switch
            id="habitReminders"
            checked={settings.habitReminders}
            onCheckedChange={(checked) => handleUpdate('habitReminders', checked)}
          />
        </div>

        {/* Goal Deadlines */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
          <div className="flex items-center gap-3">
            <TrendingUp className="size-5 text-chart-5" />
            <div className="space-y-0.5">
              <Label htmlFor="goalDeadlines" className="text-sm font-semibold">
                Goal Deadline Alerts
              </Label>
              <p className="text-xs text-muted-foreground">Notify when goals are approaching deadline</p>
            </div>
          </div>
          <Switch
            id="goalDeadlines"
            checked={settings.goalDeadlines}
            onCheckedChange={(checked) => handleUpdate('goalDeadlines', checked)}
          />
        </div>

        {/* Streak Milestones */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
          <div className="flex items-center gap-3">
            <TrendingUp className="size-5 text-chart-1" />
            <div className="space-y-0.5">
              <Label htmlFor="streakMilestones" className="text-sm font-semibold">
                Streak Milestones
              </Label>
              <p className="text-xs text-muted-foreground">Celebrate when you reach streak milestones</p>
            </div>
          </div>
          <Switch
            id="streakMilestones"
            checked={settings.streakMilestones}
            onCheckedChange={(checked) => handleUpdate('streakMilestones', checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
