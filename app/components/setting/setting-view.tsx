import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSettings } from '@/lib/context/settings-context';

import {
  AlertCircle,
  Bell,
  Calendar,
  Database,
  FileDown,
  FileUp,
  Loader2,
  Moon,
  Palette,
  RefreshCw,
  Settings2,
  Smartphone,
  Sun,
  Target,
  TrendingUp,
  Zap
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { ValidatedSelect } from '../form/validated-select';
import { GOAL_CONFIG } from '@/lib/core/constants';

interface SettingViewProps {
  isSettingVisible: boolean;
  setSettingVisible: (visible: boolean) => void;
}

export function SettingView({ isSettingVisible, setSettingVisible }: SettingViewProps) {
  const [activeTab, setActiveTab] = useState('general');
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    settings,
    isLoading,
    isSaving,
    error,
    updateAppearance,
    updateHabits,
    updateGoals,
    updateData,
    resetSettings,
    exportAllData,
    importAllData,
    importSettings,
    refreshSettings
  } = useSettings();

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const success = await importAllData(file);
      if (success) {
        toast.success('All Data Imported Successfully', {
          description: 'Your settings, habits, goals, and all application data have been successfully imported.'
        });
      } else {
        toast.error('Import Failed', {
          description: 'Failed to import data. Please check the file format and try again.'
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Import Error', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred during import.'
      });
    } finally {
      e.target.value = '';
    }
  };

  const handleExport = () => {
    exportAllData();
    toast.success('Settings Exported', {
      description: 'Your settings have been downloaded.'
    });
  };

  const handleResetAll = async () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      const success = await resetSettings();
      if (success) {
        toast.success('Settings Reset', {
          description: 'All settings have been reset to defaults.'
        });
      }
    }
  };
  console.log(settings.goals.defaultCategory);

  const tabIcons = {
    general: Palette,
    habits: Target,
    goals: TrendingUp,
    // notifications: Bell,
    data: Database,
    advanced: Zap
  };

  if (isLoading) {
    return (
      <Dialog open={isSettingVisible} onOpenChange={() => setSettingVisible(!isSettingVisible)}>
        <DialogContent className="sm:max-w-3xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isSettingVisible} onOpenChange={() => setSettingVisible(!isSettingVisible)}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="relative p-2.5 bg-linear-to-br from-primary/90 to-primary rounded-xl shadow-lg shadow-primary/20">
                  <Settings2 className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
              <div>
                <DialogTitle className="text-3xl font-bold">Settings</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">Personalize your experience</p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Error Alert */}
        {error && (
          <div className="px-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Main Content */}
        <div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Tab Navigation */}
            <div className="sticky top-0 z-10 border-b border-border/50 bg-card/95 backdrop-blur-sm px-6 pt-4">
              <TabsList className="w-full">
                {Object.entries(tabIcons).map(([key, Icon]) => (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md capitalize"
                  >
                    <Icon className="size-4" />
                    <span className="hidden md:inline">{key}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="p-6">
              {/* General Settings Tab */}
              <TabsContent value="general" className="space-y-4 mt-0">
                <Card className="border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="relative pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="p-2 bg-linear-to-br from-primary/20 to-primary/10 rounded-lg border border-primary/20">
                        <Palette className="h-4 w-4 text-primary" />
                      </div>
                      Appearance & Theme
                    </CardTitle>
                    <CardDescription className="text-sm">Customize your interface</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 relative">
                    <div className="space-y-2">
                      <Label htmlFor="theme" className="text-sm font-semibold">
                        Theme Mode
                      </Label>
                      <Select
                        value={theme}
                        onValueChange={(value) => {
                          setTheme(value);
                          updateAppearance({ theme: value as any });
                        }}
                      >
                        <SelectTrigger id="theme" className="h-10 border-border/50 hover:border-primary/50 transition-colors">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">
                            <div className="flex items-center gap-2">
                              <Sun className="h-4 w-4 text-amber-500" />
                              <span>Light Mode</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="dark">
                            <div className="flex items-center gap-2">
                              <Moon className="h-4 w-4 text-indigo-500" />
                              <span>Dark Mode</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="system">
                            <div className="flex items-center gap-2">
                              <Smartphone className="h-4 w-4" />
                              <span>System Default</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Calendar className="h-4 w-4 text-chart-2" />
                      Date & Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="week-start" className="text-sm font-semibold">
                          Week Starts On
                        </Label>
                        <Select
                          value={settings.appearance.weekStartsOn}
                          onValueChange={(value: any) => updateAppearance({ weekStartsOn: value })}
                        >
                          <SelectTrigger id="week-start" className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sunday">Sunday</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="timezone" className="text-sm font-semibold">
                          Timezone
                        </Label>
                        <Select
                          value={settings.appearance.timezone}
                          onValueChange={(value) => updateAppearance({ timezone: value })}
                        >
                          <SelectTrigger id="timezone" className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Auto-detect</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Habits Settings Tab */}
              <TabsContent value="habits" className="space-y-4 mt-0">
                <Card className="border-border/50 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Target className="h-4 w-4 text-primary" />
                      Habit Configuration
                    </CardTitle>
                    <CardDescription className="text-sm">Default values for new habits</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="default-priority" className="text-sm font-semibold">
                          Default Priority
                        </Label>
                        <Select
                          value={settings.habits.defaultPriority}
                          onValueChange={(value: any) => updateHabits({ defaultPriority: value })}
                        >
                          <SelectTrigger id="default-priority" className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low Priority</SelectItem>
                            <SelectItem value="medium">Medium Priority</SelectItem>
                            <SelectItem value="high">High Priority</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="default-time" className="text-sm font-semibold">
                          Reminder Time
                        </Label>
                        <Input
                          id="default-time"
                          type="time"
                          value={settings.habits.defaultReminderTime}
                          onChange={(e) => updateHabits({ defaultReminderTime: e.target.value })}
                          className="h-10"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-semibold">Default Reminders</Label>
                          <p className="text-xs text-muted-foreground">For new habits</p>
                        </div>
                        <Switch
                          checked={settings.habits.defaultReminder}
                          onCheckedChange={(checked) => updateHabits({ defaultReminder: checked })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Goals Settings Tab */}
              <TabsContent value="goals" className="space-y-4 mt-0">
                <Card className="border-border/50 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="h-4 w-4 text-chart-5" />
                      Goal Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <ValidatedSelect
                          id="default-goal-category"
                          label="Default Category"
                          value={settings.goals.defaultCategory ?? ''}
                          onValueChange={(value) => updateGoals({ defaultCategory: value })}
                          placeholder="Select category"
                          options={GOAL_CONFIG.CATEGORIES}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="deadline-warning" className="text-sm font-semibold">
                          Deadline Warning
                        </Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id="deadline-warning"
                            type="number"
                            value={settings.goals.deadlineWarningDays}
                            onChange={(e) => updateGoals({ deadlineWarningDays: parseInt(e.target.value) })}
                            className="h-10 max-w-24"
                          />
                          <span className="text-sm text-muted-foreground">days before</span>
                        </div>
                      </div>
                    </div>
                    <Separator />

                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-semibold">Progress %</Label>
                          <p className="text-xs text-muted-foreground">Show percentage</p>
                        </div>
                        <Switch
                          checked={settings.goals.showProgressPercentage}
                          onCheckedChange={(checked) => updateGoals({ showProgressPercentage: checked })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notifications Tab */}
              {/* <TabsContent value="notifications" className="space-y-4 mt-0">
                <Card className="border-border/50 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Bell className="h-4 w-4 text-chart-2" />
                      Notification Center
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries({
                      habitReminders: { label: 'Habit Reminders', desc: 'Scheduled habits' },
                      goalDeadlines: { label: 'Goal Deadlines', desc: 'Approaching deadlines' },
                      streakMilestones: { label: 'Streak Milestones', desc: 'Achievement celebrations' },
                      dailySummary: { label: 'Daily Summary', desc: 'End of day report' },
                      weeklySummary: { label: 'Weekly Report', desc: 'Progress insights' },
                      motivationalQuotes: { label: 'Motivational Quotes', desc: 'Daily inspiration' }
                    }).map(([key, { label, desc }]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50"
                      >
                        <div className="space-y-0.5">
                          <Label className="text-sm font-semibold">{label}</Label>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                        <Switch
                          checked={settings.notifications[key as keyof typeof settings.notifications]}
                          onCheckedChange={(checked) => updateNotifications({ [key]: checked })}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent> */}

              {/* Data Management Tab */}
              <TabsContent value="data" className="space-y-4 mt-0">
                <Card className="border-border/50 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Database className="h-4 w-4 text-chart-1" />
                      Data & Backup
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-semibold">Automatic Backups</Label>
                          <p className="text-xs text-muted-foreground">Secure local storage</p>
                        </div>
                        <Switch
                          checked={settings.data.autoBackup}
                          onCheckedChange={(checked) => updateData({ autoBackup: checked })}
                        />
                      </div>

                      {settings.data.autoBackup && (
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">Frequency</Label>
                          <Select
                            value={settings.data.backupFrequency}
                            onValueChange={(value: any) => updateData({ backupFrequency: value })}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    <Separator /> */}

                    <div className="grid md:grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="justify-start border-border/50 hover:border-chart-1/50"
                        onClick={handleExport}
                      >
                        <FileDown className="h-4 w-4 mr-2 text-chart-1" />
                        Export Data
                      </Button>
                      <Button
                        variant="outline"
                        className="justify-start border-border/50 hover:border-chart-2/50"
                        onClick={handleImportClick}
                      >
                        <FileUp className="h-4 w-4 mr-2 text-chart-2" />
                        Import Data
                      </Button>
                      <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Advanced Tab */}
              <TabsContent value="advanced" className="space-y-4 mt-0">
                <Card className="border-border/50 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Zap className="h-4 w-4 text-destructive" />
                      Advanced Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert className="border-destructive/20 bg-destructive/5">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <AlertDescription className="text-xs">
                        <strong>Warning:</strong> These actions cannot be undone.
                      </AlertDescription>
                    </Alert>

                    <div className="grid gap-3">
                      <Button
                        variant="outline"
                        className="justify-start h-12 border-border/50 hover:border-chart-5/50"
                        onClick={handleResetAll}
                        disabled={isSaving}
                      >
                        <RefreshCw className="h-4 w-4 mr-2 text-chart-5" />
                        Reset All Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
