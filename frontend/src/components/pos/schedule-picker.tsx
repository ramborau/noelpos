'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

interface SchedulePickerProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  selectedTime: string | null;
  onTimeChange: (time: string | null) => void;
  disabledDates?: Date[];
}

export function SchedulePicker({
  date,
  onDateChange,
  selectedTime,
  onTimeChange,
  disabledDates = []
}: SchedulePickerProps) {
  // Generate time slots from 09:00 to 18:00 in 30-min intervals
  const timeSlots = React.useMemo(() => {
    const slots: string[] = [];
    for (let hour = 9; hour <= 18; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 18) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  }, []);

  // Disable past dates
  const isPastDate = (dateToCheck: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dateToCheck < today;
  };

  const isDateDisabled = (dateToCheck: Date) => {
    if (isPastDate(dateToCheck)) return true;
    return disabledDates.some(d =>
      d.getFullYear() === dateToCheck.getFullYear() &&
      d.getMonth() === dateToCheck.getMonth() &&
      d.getDate() === dateToCheck.getDate()
    );
  };

  return (
    <Card className="gap-0 p-0">
      <CardContent className="relative p-0 md:pr-48">
        <div className="p-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={onDateChange}
            defaultMonth={date || new Date()}
            disabled={isDateDisabled}
            showOutsideDays={false}
            className="bg-transparent p-0"
            formatters={{
              formatWeekdayName: (d) => {
                return d.toLocaleString('en-US', { weekday: 'short' });
              },
            }}
          />
        </div>
        <div className="no-scrollbar inset-y-0 right-0 flex max-h-72 w-full scroll-pb-4 flex-col gap-2 overflow-y-auto border-t p-4 md:absolute md:max-h-none md:w-48 md:border-t-0 md:border-l">
          <p className="text-sm font-medium text-gray-500 mb-2">Select Time</p>
          <div className="grid gap-2">
            {timeSlots.map((time) => (
              <Button
                key={time}
                type="button"
                variant={selectedTime === time ? 'default' : 'outline'}
                onClick={() => onTimeChange(time)}
                className="w-full shadow-none"
                size="sm"
              >
                {time}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 border-t px-4 py-3 md:flex-row">
        <div className="text-sm flex-1">
          {date && selectedTime ? (
            <>
              Scheduled for{' '}
              <span className="font-medium">
                {date?.toLocaleDateString('en-US', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </span>
              {' '}at <span className="font-medium">{selectedTime}</span>
            </>
          ) : (
            <span className="text-gray-500">Select a date and time for pickup</span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
