import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HABIT_CONFIG, WEEK_DAYS } from '@/lib/core/constants';
import { DateUtils, FormatUtils, ValidationUtils } from '@/lib/core';
import { HabitFrequencyManager } from '@/lib/habit';
import { HabitFormManager } from '@/lib/core';
import { Calendar, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { HabitFrequencyType } from '@/lib/types';
import { HabitFormSubComponentProps } from './type';

interface FrequencySelectorProps extends HabitFormSubComponentProps {
  setHabitForm: any;
  frequencyConfig: any;
  setFrequencyConfig: any;
}

export function FrequencySelector({
  habitForm,
  setHabitForm,
  frequencyConfig,
  setFrequencyConfig,
  updateField,
  validationErrors
}: FrequencySelectorProps) {
  const [calendarDays] = useState(() => DateUtils.generateMonthDays());
  const [frequencyErrors, setFrequencyErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);

  const currentFrequencyType = habitForm?.frequency.type || HABIT_CONFIG.FREQUENCIES.DAILY;

  // Initialize frequency configuration with proper defaults
  useEffect(() => {
    if (!frequencyConfig) {
      const config = HabitFormManager.initializeFrequencyFromHabit(habitForm?.frequency);

      // Ensure default values for each frequency type
      const enhancedConfig = {
        ...config,
        // Default for DAILY: all days if none specified
        selectedDays:
          config.selectedDays?.length > 0
            ? config.selectedDays
            : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],

        // Default for SPECIFIC_DATES: first day of month if none specified
        specificDates: config.specificDates?.length > 0 ? config.specificDates : [1],

        // Default for INTERVAL: 1 day if not specified
        intervalDays: config.intervalDays || 1,

        // Default for X_TIMES_PER_PERIOD: 3 times per week if not specified
        repetitionsPerPeriod: config.repetitionsPerPeriod || 3,
        period: config.period || 'week'
      };

      setFrequencyConfig(enhancedConfig);

      if (!habitForm?.frequency) {
        const defaultFrequency = HabitFrequencyManager.buildFromConfig(HABIT_CONFIG.FREQUENCIES.DAILY, enhancedConfig);

        setHabitForm((prev: any) => ({
          ...prev,
          frequency: { type: HABIT_CONFIG.FREQUENCIES.DAILY, value: defaultFrequency }
        }));
      }
    }
  }, [habitForm?.frequency, frequencyConfig, setFrequencyConfig, setHabitForm]);

  // Validation helper function
  const validateAndSetFrequency = useCallback(
    (type: HabitFrequencyType, configData: any) => {
      try {
        const newFrequency = HabitFrequencyManager.buildFromConfig(type, {
          ...frequencyConfig,
          ...configData
        });

        // Clear previous errors for this field
        setFrequencyErrors((prev) => ({ ...prev, [type]: '' }));
        setWarnings([]);

        // Additional validation based on type
        let isValid = true;
        let errorMessage = '';
        let warningMessages: string[] = [];

        switch (type) {
          case HABIT_CONFIG.FREQUENCIES.DAILY:
            if (!configData.selectedDays || configData.selectedDays.length === 0) {
              isValid = false;
              errorMessage = 'Please select at least one day for daily frequency.';
            } else if (configData.selectedDays.length === 7) {
              warningMessages.push('You have selected all days. Consider if this frequency is manageable.');
            }
            break;

          case HABIT_CONFIG.FREQUENCIES.INTERVAL:
            if (!configData.intervalDays || configData.intervalDays < 1) {
              isValid = false;
              errorMessage = 'Interval must be at least 1 day.';
            } else if (configData.intervalDays > 30) {
              warningMessages.push('Long intervals may make it harder to maintain consistency.');
            }
            break;

          case HABIT_CONFIG.FREQUENCIES.X_TIMES_PER_PERIOD:
            if (!configData.repetitionsPerPeriod || configData.repetitionsPerPeriod < 1) {
              isValid = false;
              errorMessage = 'Must specify at least 1 repetition per period.';
            } else {
              const maxReps = configData.period === 'week' ? 7 : 31;
              if (configData.repetitionsPerPeriod > maxReps) {
                isValid = false;
                errorMessage = `Cannot exceed ${maxReps} repetitions per ${configData.period}.`;
              }
            }
            break;

          case HABIT_CONFIG.FREQUENCIES.SPECIFIC_DATES:
            if (!configData.specificDates || configData.specificDates.length === 0) {
              isValid = false;
              errorMessage = 'Please select at least one date for specific dates frequency.';
            } else {
              const invalidDates = configData.specificDates.filter((date: number) => date < 1 || date > 31);
              if (invalidDates.length > 0) {
                isValid = false;
                errorMessage = 'All dates must be between 1 and 31.';
              } else if (configData.specificDates.length > 15) {
                warningMessages.push('Many specific dates selected. Consider using a different frequency type.');
              }
            }
            break;
        }

        if (isValid) {
          updateField('frequency')(newFrequency);
          setWarnings(warningMessages);
        } else {
          setFrequencyErrors((prev) => ({ ...prev, [type]: errorMessage }));
        }

        return isValid;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Invalid frequency configuration';
        setFrequencyErrors((prev) => ({ ...prev, [type]: errorMsg }));
        return false;
      }
    },
    [frequencyConfig, updateField]
  );

  const updateFrequency = useCallback(
    (type: HabitFrequencyType, configData: any) => {
      validateAndSetFrequency(type, configData);
    },
    [validateAndSetFrequency]
  );

  const handleTypeChange = useCallback(
    (newType: HabitFrequencyType) => {
      let newConfig = { ...frequencyConfig };

      // Set proper defaults for each frequency type
      switch (newType) {
        case HABIT_CONFIG.FREQUENCIES.DAILY:
          newConfig.selectedDays =
            newConfig.selectedDays?.length > 0
              ? newConfig.selectedDays
              : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
          break;

        case HABIT_CONFIG.FREQUENCIES.INTERVAL:
          newConfig.intervalDays = ValidationUtils.validateNumber(
            newConfig.intervalDays,
            HABIT_CONFIG.DEFAULTS.MIN_INTERVAL_DAYS || 1,
            HABIT_CONFIG.DEFAULTS.MIN_INTERVAL_DAYS || 1
          );
          break;

        case HABIT_CONFIG.FREQUENCIES.X_TIMES_PER_PERIOD:
          newConfig.repetitionsPerPeriod = ValidationUtils.validateNumber(
            newConfig.repetitionsPerPeriod,
            HABIT_CONFIG.DEFAULTS.MIN_REPETITIONS || 1,
            HABIT_CONFIG.DEFAULTS.MIN_REPETITIONS || 3
          );
          newConfig.period = newConfig.period || HABIT_CONFIG.PERIODS[0] || 'week';
          break;

        case HABIT_CONFIG.FREQUENCIES.SPECIFIC_DATES:
          newConfig.specificDates =
            newConfig.specificDates?.length > 0 ? ValidationUtils.validateArray(newConfig.specificDates) : [1]; // Default to 1st of month
          break;

        default:
          newType = HABIT_CONFIG.FREQUENCIES.DAILY;
          newConfig.selectedDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      }

      setFrequencyConfig(newConfig);
      updateFrequency(newType, newConfig);
    },
    [frequencyConfig, setFrequencyConfig, updateFrequency]
  );

  const handleIntervalChange = useCallback(
    (value: string) => {
      const { MIN_INTERVAL_DAYS = 1, MAX_INTERVAL_DAYS = 365 } = HABIT_CONFIG.DEFAULTS;
      const days = ValidationUtils.validateNumberInput(value, MIN_INTERVAL_DAYS, MAX_INTERVAL_DAYS, 1);

      if (days < MIN_INTERVAL_DAYS || days > MAX_INTERVAL_DAYS) {
        setFrequencyErrors((prev) => ({
          ...prev,
          interval: `Interval must be between ${MIN_INTERVAL_DAYS} and ${MAX_INTERVAL_DAYS} days.`
        }));
        return;
      }

      const newConfig = { ...frequencyConfig, intervalDays: days };
      setFrequencyConfig(newConfig);
      updateFrequency(HABIT_CONFIG.FREQUENCIES.INTERVAL, { intervalDays: days });
    },
    [frequencyConfig, setFrequencyConfig, updateFrequency]
  );

  const handleTimesChange = useCallback(
    (value: string) => {
      const { MIN_REPETITIONS = 1, MAX_REPETITIONS_WEEK = 7, MAX_REPETITIONS_MONTH = 31 } = HABIT_CONFIG.DEFAULTS;

      const period = frequencyConfig?.period || 'week';
      const maxReps = period === 'week' ? MAX_REPETITIONS_WEEK : MAX_REPETITIONS_MONTH;

      const times = ValidationUtils.validateNumberInput(value, MIN_REPETITIONS, maxReps, MIN_REPETITIONS);

      if (times < MIN_REPETITIONS || times > maxReps) {
        setFrequencyErrors((prev) => ({
          ...prev,
          times: `Repetitions must be between ${MIN_REPETITIONS} and ${maxReps} for ${period}.`
        }));
        return;
      }

      const newConfig = { ...frequencyConfig, repetitionsPerPeriod: times };
      setFrequencyConfig(newConfig);
      updateFrequency(HABIT_CONFIG.FREQUENCIES.X_TIMES_PER_PERIOD, {
        repetitionsPerPeriod: times,
        period
      });
    },
    [frequencyConfig, setFrequencyConfig, updateFrequency]
  );

  const handlePeriodChange = useCallback(
    (period: string) => {
      if (!HABIT_CONFIG.PERIODS.includes(period as any)) {
        console.warn(`Invalid period: ${period}`);
        setFrequencyErrors((prev) => ({ ...prev, period: `Invalid period: ${period}` }));
        return;
      }

      const repetitionsPerPeriod = frequencyConfig?.repetitionsPerPeriod || HABIT_CONFIG.DEFAULTS.MIN_REPETITIONS || 1;

      // Validate repetitions against new period limits
      const maxReps = period === 'week' ? 7 : 31;
      if (repetitionsPerPeriod > maxReps) {
        setFrequencyErrors((prev) => ({
          ...prev,
          period: `Current repetitions (${repetitionsPerPeriod}) exceed maximum for ${period} (${maxReps}).`
        }));
        return;
      }

      const newConfig = { ...frequencyConfig, period };
      setFrequencyConfig(newConfig);
      updateFrequency(HABIT_CONFIG.FREQUENCIES.X_TIMES_PER_PERIOD, {
        repetitionsPerPeriod,
        period
      });
    },
    [frequencyConfig, setFrequencyConfig, updateFrequency]
  );

  // Handle day toggle for daily frequency
  const handleDayToggle = useCallback(
    (dayKey: string, checked: boolean) => {
      const currentDays = ValidationUtils.validateArray(frequencyConfig?.selectedDays);
      const newSelectedDays = HabitFormManager.toggleArrayItem(currentDays, dayKey, checked);

      if (newSelectedDays.length === 0) {
        setFrequencyErrors((prev) => ({
          ...prev,
          days: 'At least one day must be selected for daily frequency.'
        }));
        return;
      }

      setFrequencyErrors((prev) => ({ ...prev, days: '' })); // Clear error
      const newConfig = { ...frequencyConfig, selectedDays: newSelectedDays };
      setFrequencyConfig(newConfig);
      updateFrequency(HABIT_CONFIG.FREQUENCIES.DAILY, { selectedDays: newSelectedDays });
    },
    [frequencyConfig, setFrequencyConfig, updateFrequency]
  );

  // Handle specific dates changes
  const handleDateToggle = useCallback(
    (date: number, checked: boolean) => {
      const currentDates = ValidationUtils.validateArray(frequencyConfig?.specificDates);
      const newSpecificDates = HabitFormManager.toggleArrayItem(currentDates, date, checked);

      if (newSpecificDates.length === 0) {
        setFrequencyErrors((prev) => ({
          ...prev,
          dates: 'At least one date must be selected for specific dates frequency.'
        }));
        return;
      }

      setFrequencyErrors((prev) => ({ ...prev, dates: '' })); // Clear error
      const newConfig = { ...frequencyConfig, specificDates: newSpecificDates };
      setFrequencyConfig(newConfig);
      updateFrequency(HABIT_CONFIG.FREQUENCIES.SPECIFIC_DATES, { specificDates: newSpecificDates });
    },
    [frequencyConfig, setFrequencyConfig, updateFrequency]
  );

  // Render error message component
  const renderError = (errorKey: string) => {
    const error = frequencyErrors[errorKey] || '';
    if (!error) return null;

    return (
      <Alert variant="destructive" className="mt-2">
        <AlertCircle className="size-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  };

  // Render warning component
  const renderWarnings = () => {
    if (warnings.length === 0) return null;

    return (
      <Alert className="mt-2 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
        <Info className="size-4 text-yellow-600 dark:text-yellow-400" />
        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
          {warnings.map((warning, index) => (
            <div key={index}>{warning}</div>
          ))}
        </AlertDescription>
      </Alert>
    );
  };

  // Render day selector with validation
  const renderDaySelector = useCallback(() => {
    const selectedDays = ValidationUtils.validateArray(frequencyConfig?.selectedDays);

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Select Days *</Label>
          <Badge variant="outline" className="text-xs">
            {FormatUtils.formatSelectionBadge(selectedDays.length, 'day')}
          </Badge>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {WEEK_DAYS.map((day) => {
            const isSelected = selectedDays.includes(day.key);

            return (
              <div
                key={day.key}
                className={`cursor-pointer rounded-lg border-2 p-2 text-center transition-all duration-200 hover:scale-105 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
                }`}
                onClick={() => handleDayToggle(day.key, !isSelected)}
              >
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`flex size-6 items-center justify-center rounded-full ${
                      isSelected ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="size-4 text-white" />}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-secondary-foreground'
                    }`}
                  >
                    {day.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        {renderError('days')}
      </div>
    );
  }, [frequencyConfig?.selectedDays, handleDayToggle, frequencyErrors, validationErrors]);

  // Generate current frequency description
  const frequencyDescription = habitForm?.frequency
    ? HabitFrequencyManager.describe(habitForm.frequency as any)
    : 'No frequency selected';

  // Loading state
  if (!frequencyConfig) {
    return (
      <Card className="border-0 shadow-none bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="size-5 text-blue-500" />
            Habit Frequency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading frequency options...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-none bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="size-5 text-blue-500" aria-hidden="true" />
          Habit Frequency
        </CardTitle>
        {/* Show current frequency description */}
        <p className="text-sm text-muted-foreground mt-2">
          <strong>Current:</strong> {frequencyDescription}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {renderWarnings()}

        {/* Frequency Type Selection */}
        <div className="space-y-3">
          <Label>Choose Frequency Type</Label>
          <div className="grid grid-cols-1 gap-3">
            {(
              HABIT_CONFIG.FREQUENCY_TYPES || [
                {
                  value: HABIT_CONFIG.FREQUENCIES.DAILY,
                  label: 'Daily',
                  description: 'Specific days of the week',
                  icon: Calendar
                },
                {
                  value: HABIT_CONFIG.FREQUENCIES.INTERVAL,
                  label: 'Interval',
                  description: 'Every N days',
                  icon: Calendar
                },
                {
                  value: HABIT_CONFIG.FREQUENCIES.X_TIMES_PER_PERIOD,
                  label: 'X Times Per Period',
                  description: 'X times per week/month',
                  icon: Calendar
                },
                {
                  value: HABIT_CONFIG.FREQUENCIES.SPECIFIC_DATES,
                  label: 'Specific Dates',
                  description: 'Specific days of the month',
                  icon: Calendar
                }
              ]
            ).map((type) => {
              const Icon = type.icon || Calendar;
              const isSelected = currentFrequencyType === type.value;

              return (
                <div
                  key={type.value}
                  className={`cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 hover:scale-[1.02] ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
                  }`}
                  onClick={() => handleTypeChange(type.value)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        isSelected ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                      }`}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{type.label}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{type.description}</p>
                    </div>
                    {isSelected && <CheckCircle2 className="size-5 text-blue-500" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Configuration Options */}
        <div className="bg-secondary rounded-xl p-4 border">
          {currentFrequencyType === HABIT_CONFIG.FREQUENCIES.DAILY && renderDaySelector()}

          {currentFrequencyType === HABIT_CONFIG.FREQUENCIES.INTERVAL && (
            <div className="space-y-4">
              <Label>Interval Configuration *</Label>
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
                  <span className="text-sm font-semibold text-secondary-foreground">Repeat every</span>
                  <Input
                    type="number"
                    value={frequencyConfig?.intervalDays || 1}
                    onChange={(e) => handleIntervalChange(e.target.value)}
                    className="w-20 text-center"
                    min={HABIT_CONFIG.DEFAULTS.MIN_INTERVAL_DAYS || 1}
                    max={HABIT_CONFIG.DEFAULTS.MAX_INTERVAL_DAYS || 365}
                  />
                  <span className="text-sm font-semibold text-secondary-foreground">
                    {(frequencyConfig?.intervalDays || 1) === 1 ? 'day' : 'days'}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                  <strong>Note:</strong> Interval counting starts from the habit's start date
                </div>
                {renderError('interval')}
              </div>
            </div>
          )}

          {currentFrequencyType === HABIT_CONFIG.FREQUENCIES.X_TIMES_PER_PERIOD && (
            <div className="space-y-3">
              <Label>Target Configuration *</Label>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
                <Input
                  type="number"
                  value={frequencyConfig?.repetitionsPerPeriod || 3}
                  onChange={(e) => handleTimesChange(e.target.value)}
                  className="w-20 text-center"
                  min={HABIT_CONFIG.DEFAULTS.MIN_REPETITIONS || 1}
                  max={
                    frequencyConfig?.period === 'week'
                      ? HABIT_CONFIG.DEFAULTS.MAX_REPETITIONS_WEEK || 7
                      : HABIT_CONFIG.DEFAULTS.MAX_REPETITIONS_MONTH || 31
                  }
                />
                <span className="text-sm font-semibold text-secondary-foreground">
                  {(frequencyConfig?.repetitionsPerPeriod || 3) === 1 ? 'Time' : 'Times'} per
                </span>
                <Select value={frequencyConfig?.period || 'week'} onValueChange={handlePeriodChange}>
                  <SelectTrigger className="w-fit h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(HABIT_CONFIG.PERIODS || ['week', 'month']).map((period) => (
                      <SelectItem key={period} value={period} className="capitalize">
                        {period}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {renderError('times')}
              {renderError('period')}
            </div>
          )}

          {currentFrequencyType === HABIT_CONFIG.FREQUENCIES.SPECIFIC_DATES && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Select Dates *</Label>
                <Badge variant="outline" className="text-xs">
                  {FormatUtils.formatSelectionBadge(frequencyConfig?.specificDates?.length || 0, 'date')}
                </Badge>
              </div>
              <div className="grid grid-cols-7 gap-2 p-3 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
                {calendarDays.map((calDay) => {
                  const isSelected = (frequencyConfig?.specificDates || []).includes(calDay.date);
                  return (
                    <div
                      key={`calendar-day-${calDay.day}`}
                      className={`w-8 h-8 rounded cursor-pointer transition-all duration-200 text-center flex items-center justify-center text-sm font-medium hover:scale-110 ${
                        isSelected
                          ? 'bg-purple-500 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900'
                      }`}
                      onClick={() => handleDateToggle(calDay.date, !isSelected)}
                    >
                      {calDay.day}
                    </div>
                  );
                })}
              </div>
              <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                <strong>Note:</strong> Select specific days of the month (1-31). For months with fewer days, dates like 30th and
                31st will be skipped automatically.
              </div>
              {renderError('dates')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
