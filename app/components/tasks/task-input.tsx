'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { DatePicker } from '../form/date-picker';
import { DateUtils } from '@/lib/core';

interface Props {
  onCreate: (title: string, date?: string) => void;
}

export function TaskInput({ onCreate }: Props) {
  const [val, setVal] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);

  const handleSubmit = () => {
    if (!val.trim()) return;
    onCreate(val.trim(), date ? DateUtils.formatDate(date) : undefined);
    setVal('');
    setDate(undefined);
  };

  const isDisabled = !val.trim();

  return (
    <div className="relative flex items-center gap-3 p-3 rounded-xl shadow-md border">
      {/* Task Title */}
      <Input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Type your task..."
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        aria-label="Enter task title"
      />

      <DatePicker id="task-deadline" date={date} onSelect={setDate} mode="icon" side="left" />

      <Button
        aria-label="Add task"
        size="sm"
        onClick={handleSubmit}
        disabled={isDisabled}
        className={cn(isDisabled && 'text-muted-foreground bg-muted')}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
