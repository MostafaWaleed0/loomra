import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Sidebar, SidebarContent, SidebarHeader, SidebarSeparator } from '@/components/ui/sidebar';
import { ColorUtils, DateUtils, FormatUtils } from '@/lib/core';
import { SYSTEM_CONSTANTS, UI_CONFIG } from '@/lib/core/constants';
import { HabitFrequencyManager } from '@/lib/habit';
import { useHabitCalendar } from '@/lib/hooks/use-habit-calendar';
import { CompletionRecord, DateString, Habit, HabitCompletion, HabitStats, UseHabitsReturn } from '@/lib/types';
import { AlertCircle, Brain, CalendarIcon, CheckCircle, Circle, Heart, Loader2Icon, Target, X, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CompletionControl } from '../form/completion-control';
import { ValidatedSelect } from '../form/validated-select';
import { ValidatedTextarea } from '../form/validated-textarea';
import { HabitIcon } from '../habit-icon';

// ============================================================================
// INTERFACES
// ============================================================================

interface HabitStatusIconProps {
  isCompleted: boolean;
}

interface HabitViewProps {
  habit: Habit | null;
  completions: HabitCompletion[];
  selectedDate: DateString;
  onDateChange: (date: DateString) => void;
  onSetHabitCompletion: (
    habitId: string,
    date: DateString,
    completed: boolean,
    additionalData?: Partial<CompletionRecord>
  ) => void;
  onHabitSelect?: (habit: Habit | null) => void;
  habitsForDate: Habit[];
  stats: HabitStats;
  onDateSelect: (date: Date | undefined) => void;
  selectedDateObj: Date | undefined;
}

interface SidebarRightProps extends UseHabitsReturn {}

// ============================================================================
// COMPONENTS
// ============================================================================

const HabitStatusIcon = ({ isCompleted }: HabitStatusIconProps) =>
  isCompleted ? <CheckCircle className="size-4 text-green-600" /> : <Circle className="size-4 text-muted-foreground" />;

const HabitView = ({
  habit,
  completions,
  selectedDate,
  onDateChange,
  onSetHabitCompletion,
  onHabitSelect,
  habitsForDate,
  stats,
  onDateSelect,
  selectedDateObj
}: any) => {
  const {
    editFormData,
    currentMonth,
    statusInfo,
    canEditDay,
    calendarModifiers,
    calendarModifierClasses,
    handleDaySelect,
    handleGoToToday,
    updateFormField,
    handleSaveCompletion,
    setCurrentMonth
  } = useHabitCalendar(habit || ({} as Habit), completions, selectedDate, onDateChange, onSetHabitCompletion);

  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleSaveWithLoading = async (): Promise<void> => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    handleSaveCompletion();
    setIsSaving(false);
  };

  return (
    <Sidebar collapsible="none" className="sticky top-0 h-screen w-full max-w-110 hidden lg:flex">
      <SidebarHeader className="p-6">
        {habit ? (
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <HabitIcon habit={habit} />
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold truncate">{habit.name}</h3>
                <p className="text-sm text-muted-foreground">{habit.frequency?.summary}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="size-8 rounded-full" onClick={() => onHabitSelect?.(null)}>
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <CalendarIcon className="size-5" />
            <h2 className="text-lg font-semibold">Habit Calendar</h2>
          </div>
        )}
        {habit && (
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="capitalize">
                {habit.category}
              </Badge>
              <Badge variant="secondary" className="capitalize">
                {habit.priority}
              </Badge>
              <Badge variant="secondary">Started {DateUtils.formatDateForDisplay(habit.startDate)}</Badge>
            </div>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent className="flex-1 overflow-hidden">
        <div className="overflow-auto h-full flex flex-col p-6">
          <div className="space-y-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-center mb-4">
                  <Button size="sm" variant="outline" onClick={handleGoToToday}>
                    Today
                  </Button>
                </div>
                <Calendar
                  mode="single"
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  modifiers={calendarModifiers}
                  modifiersClassNames={calendarModifierClasses}
                  onDayClick={handleDaySelect}
                  showOutsideDays={false}
                  selected={selectedDateObj}
                  onSelect={onDateSelect}
                  className="w-full"
                />
              </CardContent>
            </Card>
            <SidebarSeparator />
            {habit && selectedDate && (
              <Card>
                <CardHeader className="flex items-center justify-between">
                  <CardTitle>{DateUtils.formatDateForDisplay(selectedDate)}</CardTitle>
                  {statusInfo && <Badge variant={statusInfo.variant}>{statusInfo.title}</Badge>}
                </CardHeader>
                <CardContent className="space-y-6">
                  {!canEditDay ? (
                    <div className="text-center py-8">
                      <AlertCircle className="size-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="font-medium mb-2">{statusInfo?.title || 'Not Scheduled'}</h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        {statusInfo?.description || 'This habit is not scheduled for this date.'}
                      </p>
                      <div className="rounded-lg bg-muted p-4">
                        <p className="text-sm">
                          <span className="font-medium">Frequency:</span> {HabitFrequencyManager.describe(habit.frequency || {})}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <Label>Progress</Label>
                        <CompletionControl
                          habit={habit}
                          completions={completions}
                          selectedDate={selectedDate}
                          onSetHabitCompletion={onSetHabitCompletion}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <ValidatedSelect
                          id="habit-mood"
                          label="Mood"
                          icon={<Heart className="size-4 text-red-500" />}
                          value={editFormData.mood}
                          onValueChange={updateFormField('mood')}
                          placeholder="Select mood 😊"
                          options={UI_CONFIG.STATUS_OPTIONS.MOOD}
                        />
                        <ValidatedSelect
                          id="habit-difficulty"
                          label="Difficulty"
                          icon={<Zap className="size-4 text-yellow-500" />}
                          value={editFormData.difficulty}
                          onValueChange={updateFormField('difficulty')}
                          placeholder="Select difficulty ⭐"
                          options={UI_CONFIG.STATUS_OPTIONS.DIFFICULTY}
                        />
                      </div>
                      <ValidatedTextarea
                        id="habit-note"
                        label={
                          <>
                            <Brain className="size-4 text-purple-500" />
                            Note
                          </>
                        }
                        value={editFormData.note || ''}
                        onChange={(value) => updateFormField('note')(value)}
                        placeholder="Add a note about this habit..."
                        maxLength={SYSTEM_CONSTANTS.VALIDATION.MAX_NOTE_LENGTH}
                      />
                      <div className="flex justify-end">
                        <Button size="sm" onClick={handleSaveWithLoading} disabled={isSaving} className="flex items-center gap-2">
                          {isSaving ? (
                            <>
                              <Loader2Icon className="size-4 animate-spin" />
                              Please wait
                            </>
                          ) : (
                            'Save Changes'
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            {!habit && (
              <Card>
                <CardHeader>
                  <CardTitle>{DateUtils.formatDateForDisplay(selectedDateObj)}</CardTitle>
                  <p className="text-sm text-muted-foreground">{FormatUtils.formatPlural(stats.dueToday, 'habit')} scheduled</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="size-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Progress</span>
                    </div>
                    <Badge variant="outline" className={ColorUtils.getCompletionColor(stats.percentage)}>
                      {FormatUtils.formatProgress(stats.completed, stats.dueToday, { showPercentage: false })}
                    </Badge>
                  </div>
                  {stats.dueToday > 0 && <Progress value={stats.percentage} className="h-2" />}
                  {habitsForDate.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">No habits scheduled for this date</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {habitsForDate.map((h: any) => (
                        <div
                          key={h.id}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <HabitStatusIcon isCompleted={Boolean(h.completedOnDate)} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{h.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{h.category}</span>
                              {h.actualAmount && h.actualAmount > 0 && (
                                <>
                                  <span>•</span>
                                  <span>
                                    {h.actualAmount}/{h.targetAmount} {h.unit}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div
                            className="size-3 rounded-full border-2 flex-shrink-0"
                            style={{
                              borderColor: h.color,
                              backgroundColor: h.completedOnDate ? h.color : 'transparent'
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SidebarRight({
  selectedHabit,
  completions,
  selectedDate,
  handleHabitSelect,
  setHabitCompletion,
  stats,
  getHabitsForDate,
  handleDateSelect
}: SidebarRightProps) {
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<DateString>(
    selectedHabit ? selectedDate || DateUtils.formatDate(new Date()) : ''
  );
  const selectedDateObj: Date | undefined = selectedDate ? DateUtils.createDateFromString(selectedDate) : undefined;
  const habitsForDate = getHabitsForDate(selectedDate);

  useEffect(() => {
    if (selectedHabit && !calendarSelectedDate) {
      setCalendarSelectedDate(selectedDate || DateUtils.formatDate(new Date()));
    } else if (!selectedHabit) {
      setCalendarSelectedDate('');
    }
  }, [selectedHabit, selectedDate, calendarSelectedDate]);

  return (
    <HabitView
      habit={selectedHabit}
      completions={completions}
      selectedDate={calendarSelectedDate}
      onDateChange={setCalendarSelectedDate}
      onSetHabitCompletion={setHabitCompletion}
      onHabitSelect={handleHabitSelect}
      habitsForDate={habitsForDate}
      stats={stats}
      onDateSelect={handleDateSelect}
      selectedDateObj={selectedDateObj}
    />
  );
}
