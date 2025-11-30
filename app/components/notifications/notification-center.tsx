import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateUtils } from '@/lib/core';
import { NotificationUtils } from '@/lib/notifications/notification-utils';
import type { HabitCompletion, ScheduledNotification } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { AlertCircle, Bell, BellOff, Calendar, Check, CheckCircle2, Clock, RefreshCw, X, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

interface NotificationCardProps {
  notification: ScheduledNotification;
  onCancel: (habitId: string) => void;
  onDismiss: (notificationId: string) => void;
  onComplete?: (habitId: string, date: string) => Promise<void>;
  onSkip?: (habitId: string, date: string) => Promise<void>;
}

const getNotificationIcon = (type: string) => {
  const iconName = NotificationUtils.getNotificationIconName(type);
  const Icon = Icons[iconName as keyof typeof Icons] as React.ComponentType<any>;
  return Icon ? <Icon className="size-4" /> : <Icons.Bell className="size-4" />;
};

function NotificationCard({ notification, onCancel, onDismiss, onComplete, onSkip }: NotificationCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const scheduledDate = new Date(notification.scheduledTime);
  const timeUntil = NotificationUtils.getTimeUntilNotification(notification.scheduledTime);
  const formattedTime = NotificationUtils.formatTimeUntil(timeUntil);
  const isUrgent = NotificationUtils.isUrgentNotification(notification.scheduledTime);
  const isSoon = NotificationUtils.isSoonNotification(notification.scheduledTime);

  const colorClasses = NotificationUtils.getNotificationColor(notification.payload.type);

  const handleCancel = async () => {
    setIsCancelling(true);
    await onCancel(notification.habitId);
  };

  const handleAction = async (actionType: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      if (actionType === 'complete' && onComplete) {
        await onComplete(notification.habitId, notification.payload.scheduledFor);
        toast.success('Habit completed!');
      } else if (actionType === 'skip' && onSkip) {
        await onSkip(notification.habitId, notification.payload.scheduledFor);
        toast.info('Habit skipped');
      } else if (actionType === 'dismiss') {
        onDismiss(notification.id);
      }
      await onCancel(notification.habitId);
    } catch (error) {
      toast.error(`Failed to ${actionType} habit`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        'rounded-lg border p-4 transition-all duration-200 overflow-hidden',
        notification.status === 'pending' && 'bg-card hover:shadow-md',
        notification.status === 'sent' && 'opacity-60 bg-muted/30',
        notification.status === 'cancelled' && 'opacity-40',
        isUrgent && notification.status === 'pending' && 'border-2 border-red-500/50 animate-pulse',
        isCancelling && 'opacity-50 pointer-events-none'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant={notification.status === 'pending' ? 'default' : notification.status === 'sent' ? 'secondary' : 'outline'}
              className={cn('text-xs capitalize', notification.status === 'pending' && isUrgent && 'bg-red-500 text-white')}
            >
              {notification.status === 'pending' && isUrgent ? 'Urgent' : notification.status}
            </Badge>

            <Badge variant="outline" className={cn('text-xs capitalize', colorClasses)}>
              <span className="mr-1">{getNotificationIcon(notification.payload.type)}</span>
              {notification.payload.type.replace('_', ' ')}
            </Badge>

            {isSoon && notification.status === 'pending' && !isUrgent && (
              <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                Soon
              </Badge>
            )}
          </div>

          <div>
            <h4 className="font-medium text-base leading-tight">{notification.payload.title}</h4>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{notification.payload.body}</p>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5" />
              <span className="font-medium">
                {notification.status === 'pending' ? (
                  <span className={cn(isUrgent && 'text-red-500 font-semibold')}>In {formattedTime}</span>
                ) : (
                  'Sent'
                )}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              <span>
                {scheduledDate.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>

            <span className="text-muted-foreground/70">{DateUtils.formatDateForDisplay(notification.payload.scheduledFor)}</span>
          </div>

          {notification.payload.actions && notification.status === 'pending' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: isHovered ? 1 : 0, height: isHovered ? 'auto' : 0 }}
              className="flex gap-2 pt-2 border-t overflow-hidden"
            >
              {notification.payload.actions.map((action) => (
                <Button
                  key={action.action}
                  size="sm"
                  variant={action.action === 'complete' ? 'default' : 'outline'}
                  className="text-xs h-7"
                  onClick={() => handleAction(action.action)}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <RefreshCw className="size-3 mr-1 animate-spin" />
                  ) : (
                    <>
                      {action.action === 'complete' && <CheckCircle2 className="size-3 mr-1" />}
                      {action.action === 'skip' && <XCircle className="size-3 mr-1" />}
                    </>
                  )}
                  {action.title}
                </Button>
              ))}
            </motion.div>
          )}
        </div>

        <div className="flex gap-1 shrink-0">
          {notification.status === 'pending' && (
            <Button
              size="icon"
              variant="ghost"
              onClick={handleCancel}
              disabled={isCancelling}
              className="size-8 hover:bg-red-500/10 hover:text-red-600"
            >
              <X className="size-4" />
            </Button>
          )}
          {notification.status === 'sent' && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDismiss(notification.id)}
              className="size-8 hover:bg-green-500/10 hover:text-green-600"
            >
              <Check className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface NotificationCenterProps {
  notifications: ScheduledNotification[];
  onCancel: (habitId: string) => void;
  onDismiss: (notificationId: string) => void;
  onComplete?: (habitId: string, date: string) => Promise<void>;
  onSkip?: (habitId: string, date: string) => Promise<void>;
  completions?: HabitCompletion[];
  isLoading?: boolean;
  error?: string | null;
}

export function NotificationCenter({
  notifications,
  onCancel,
  onDismiss,
  onComplete,
  onSkip,
  completions = [],
  isLoading = false,
  error = null
}: NotificationCenterProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'sent' | 'cancelled'>('pending');

  const organizedNotifications = useMemo(() => {
    const pending = NotificationUtils.filterActiveNotifications(
      notifications.filter((n) => n.status === 'pending'),
      completions
    );
    const sent = notifications.filter((n) => n.status === 'sent');
    const cancelled = notifications.filter((n) => n.status === 'cancelled');

    return {
      pending: NotificationUtils.sortByScheduledTime(pending, true),
      sent: NotificationUtils.sortByScheduledTime(sent, false),
      cancelled: NotificationUtils.sortByScheduledTime(cancelled, false)
    };
  }, [notifications, completions]);

  const stats = useMemo(
    () => ({
      pending: organizedNotifications.pending.length,
      sent: organizedNotifications.sent.length,
      cancelled: organizedNotifications.cancelled.length,
      urgent: organizedNotifications.pending.filter((n) => NotificationUtils.isUrgentNotification(n.scheduledTime)).length
    }),
    [organizedNotifications]
  );

  const currentNotifications = organizedNotifications[activeTab];

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="pb-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-5" />
            Notification Center
          </CardTitle>

          <CardDescription className="flex items-center gap-2">
            {stats.pending > 0 ? (
              <>
                <span className="font-medium text-foreground">{stats.pending}</span>
                <span>upcoming</span>
                {stats.urgent > 0 && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-red-500 font-medium">{stats.urgent} urgent</span>
                  </>
                )}
              </>
            ) : (
              <span>No pending notifications</span>
            )}
          </CardDescription>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2"
          >
            <AlertCircle className="size-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </motion.div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <Bell className="size-8 text-muted-foreground" />
                </motion.div>
              </div>
            ) : currentNotifications.length === 0 ? (
              <EmptyState
                icon={<BellOff className="size-12" />}
                title="No pending notifications"
                description="You're all caught up!"
              />
            ) : (
              <ScrollArea className="h-[500px] pr-4">
                <AnimatePresence mode="popLayout">
                  <div className="space-y-3">
                    {currentNotifications.map((notification) => (
                      <NotificationCard
                        key={notification.id}
                        notification={notification}
                        onCancel={onCancel}
                        onDismiss={onDismiss}
                        onComplete={onComplete}
                        onSkip={onSkip}
                      />
                    ))}
                  </div>
                </AnimatePresence>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="sent" className="mt-0">
            {currentNotifications.length === 0 ? (
              <EmptyState
                icon={<Check className="size-12" />}
                title="No sent notifications"
                description="Notifications you've received will appear here."
              />
            ) : (
              <ScrollArea className="h-[500px] pr-4">
                <AnimatePresence mode="popLayout">
                  <div className="space-y-3">
                    {currentNotifications.map((notification) => (
                      <NotificationCard
                        key={notification.id}
                        notification={notification}
                        onCancel={onCancel}
                        onDismiss={onDismiss}
                        onComplete={onComplete}
                        onSkip={onSkip}
                      />
                    ))}
                  </div>
                </AnimatePresence>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="mt-0">
            {currentNotifications.length === 0 ? (
              <EmptyState
                icon={<X className="size-12" />}
                title="No cancelled notifications"
                description="Cancelled notifications will appear here."
              />
            ) : (
              <ScrollArea className="h-[500px] pr-4">
                <AnimatePresence mode="popLayout">
                  <div className="space-y-3">
                    {currentNotifications.map((notification) => (
                      <NotificationCard
                        key={notification.id}
                        notification={notification}
                        onCancel={onCancel}
                        onDismiss={onDismiss}
                        onComplete={onComplete}
                        onSkip={onSkip}
                      />
                    ))}
                  </div>
                </AnimatePresence>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <div className="text-muted-foreground mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
    </motion.div>
  );
}
