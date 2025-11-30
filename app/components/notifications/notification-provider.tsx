import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Toaster } from '@/components/ui/sonner';
import { useNotificationManager } from '@/lib/hooks/use-notification-manager';
import type { DateString, Habit, HabitCompletion, NotificationSettings } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Bell, History, RefreshCw, Settings } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { NotificationCenter } from './notification-center';

interface NotificationProviderProps {
  habits: Habit[];
  completions: HabitCompletion[];
  onComplete: (habitId: string, date: DateString) => Promise<void>;
  onSkip: (habitId: string, date: DateString) => Promise<void>;
  settings: NotificationSettings;
  children: React.ReactNode;
}

export function NotificationProvider({ habits, completions, onComplete, onSkip, settings, children }: NotificationProviderProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showCleanDialog, setShowCleanDialog] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  const {
    scheduledNotifications,
    cancelNotification,
    getUpcomingNotifications,
    permissionGranted,
    isLoading,
    error,
    lastSync,
    rescheduleAll,
    refreshPermission,
    refreshScheduled,
    cleanNotificationHistory
  } = useNotificationManager({
    habits,
    completions,
    onComplete,
    onSkip,
    settings
  });

  const upcomingNotifications = getUpcomingNotifications();
  const pendingCount = upcomingNotifications.length;
  const urgentCount = upcomingNotifications.filter((n) => {
    const timeUntil = new Date(n.scheduledTime).getTime() - Date.now();
    return timeUntil < 5 * 60 * 1000; // Less than 5 minutes
  }).length;

  const handleDismiss = useCallback((notificationId: string) => {
    console.log('Dismissed notification:', notificationId);
    toast.success('Notification dismissed');
  }, []);

  const handleRefresh = useCallback(async () => {
    refreshScheduled();
  }, [refreshScheduled]);

  const handleRescheduleAll = useCallback(async () => {
    rescheduleAll();
  }, [rescheduleAll]);

  const handleCleanHistory = useCallback(async () => {
    setIsCleaning(true);
    try {
      const deleted = await cleanNotificationHistory(30);
      if (deleted > 0) {
        toast.success(`Cleaned ${deleted} old notification${deleted !== 1 ? 's' : ''}`);
      } else {
        toast.info('No old notifications to clean');
      }
    } catch (error) {
      toast.error('Failed to clean notification history');
    } finally {
      setIsCleaning(false);
      setShowCleanDialog(false);
    }
  }, [cleanNotificationHistory]);

  const handleRequestPermission = useCallback(async () => {
    const granted = await refreshPermission();
    if (granted) {
      toast.success('Notification permissions granted!');
    } else {
      toast.error('Notification permissions denied', {
        description: 'Please enable notifications in your system settings'
      });
    }
  }, [refreshPermission]);

  return (
    <>
      {children}

      {/* Sonner Toast Provider */}
      <Toaster
        position="top-right"
        expand={true}
        richColors
        closeButton
        theme="system"
        toastOptions={{
          className: 'group toast',
          classNames: {
            toast:
              'group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
            description: 'group-[.toast]:text-muted-foreground',
            actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
            cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground'
          }
        }}
      />

      {/* Floating Action Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="default"
              size="icon"
              className={cn(
                'size-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 relative',
                urgentCount > 0 && 'animate-pulse'
              )}
            >
              <Bell className="size-6" />
              <AnimatePresence>
                {pendingCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1"
                  >
                    <Badge
                      variant={urgentCount > 0 ? 'destructive' : 'default'}
                      className="size-6 rounded-full p-0 flex items-center justify-center text-xs font-bold shadow-md"
                    >
                      {pendingCount > 99 ? '99+' : pendingCount}
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="w-full sm:max-w-[600px] p-0 flex flex-col">
            <SheetHeader className="px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <SheetTitle className="flex items-center gap-2">
                    <Bell className="size-5" />
                    Notifications
                  </SheetTitle>
                  {lastSync && (
                    <p className="text-xs text-muted-foreground">Last synced: {new Date(lastSync).toLocaleTimeString()}</p>
                  )}
                </div>

                {/* Actions Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8">
                      <Settings className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleRefresh} disabled={isLoading}>
                      <RefreshCw className={cn('size-4 mr-2', isLoading && 'animate-spin')} />
                      Refresh
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleRescheduleAll}>
                      <Bell className="size-4 mr-2" />
                      Reschedule All
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowCleanDialog(true)}>
                      <History className="size-4 mr-2" />
                      Clean History
                    </DropdownMenuItem>
                    {!permissionGranted && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleRequestPermission}>
                          <AlertCircle className="size-4 mr-2" />
                          Request Permissions
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-hidden px-6 py-4">
              {/* Permission Warning */}
              {!permissionGranted && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="size-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-1">Notifications Disabled</p>
                      <p className="text-xs text-yellow-600/80 dark:text-yellow-400/80 mb-2">
                        Enable notifications to receive reminders for your habits.
                      </p>
                      <Button size="sm" variant="outline" onClick={handleRequestPermission} className="h-7 text-xs">
                        Enable Notifications
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Notification Center */}
              <NotificationCenter
                notifications={scheduledNotifications}
                onCancel={cancelNotification}
                onDismiss={handleDismiss}
                onComplete={onComplete}
                onSkip={onSkip}
                completions={completions}
                isLoading={isLoading}
                error={error}
              />
            </div>
          </SheetContent>
        </Sheet>
      </motion.div>

      {/* Clean History Dialog */}
      <AlertDialog open={showCleanDialog} onOpenChange={setShowCleanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clean Notification History?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete notifications older than 30 days. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCleaning}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCleanHistory} disabled={isCleaning}>
              {isCleaning ? (
                <>
                  <RefreshCw className="size-4 mr-2 animate-spin" />
                  Cleaning...
                </>
              ) : (
                'Clean History'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
