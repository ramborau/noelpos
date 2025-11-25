'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Rider {
  id: number;
  name: string;
  mobile: string;
  status: string;
}

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onConfirm: (data: {
    date: Date;
    timeSlot: string;
    rider?: Rider;
  }) => void;
  isSubmitting?: boolean;
}

const TIME_SLOTS = [
  { id: '10:00-12:00', label: '10:00 AM - 12:00 PM', startHour: 10 },
  { id: '12:00-14:00', label: '12:00 PM - 2:00 PM', startHour: 12 },
  { id: '14:00-16:00', label: '2:00 PM - 4:00 PM', startHour: 14 },
  { id: '16:00-18:00', label: '4:00 PM - 6:00 PM', startHour: 16 },
  { id: '18:00-19:00', label: '6:00 PM - 7:00 PM', startHour: 18 },
];

export function ScheduleDialog({
  open,
  onOpenChange,
  title,
  onConfirm,
  isSubmitting = false,
}: ScheduleDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);

  // Fetch riders on mount
  useEffect(() => {
    fetchRiders();
  }, []);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedDate(undefined);
      setSelectedSlot(null);
      setSelectedRider(null);
    }
  }, [open]);

  const fetchRiders = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/riders/list.php`);
      const data = await res.json();
      if (data.success) {
        setRiders(data.data.filter((r: Rider) => r.status === 'active'));
      }
    } catch {
      console.error('Failed to fetch riders');
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isPastSlot = (slot: typeof TIME_SLOTS[0]) => {
    if (!selectedDate || !isToday(selectedDate)) return false;
    const now = new Date();
    return now.getHours() >= slot.startHour;
  };

  const canConfirm = selectedDate && selectedSlot;

  const handleConfirm = () => {
    if (!selectedDate || !selectedSlot) return;
    onConfirm({
      date: selectedDate,
      timeSlot: selectedSlot,
      rider: selectedRider || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[700px] max-w-[700px] p-0 gap-0 overflow-hidden" showCloseButton={false}>
        <DialogHeader className="p-4 pb-3 border-b">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-10 gap-0">
          {/* Left Side - Calendar (60%) */}
          <div className="col-span-6 p-4 border-r">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Select Date
            </Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                setSelectedSlot(null); // Reset slot when date changes
              }}
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today;
              }}
              className="rounded-md border-0 w-full"
            />
          </div>

          {/* Right Side - Slots & Rider (40%) */}
          <div className="col-span-4 p-4 space-y-4">
            {/* Time Slots */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Select Time Slot
              </Label>
              <div className="grid gap-2">
                {TIME_SLOTS.map((slot) => {
                  const isPast = isPastSlot(slot);
                  const isSelected = selectedSlot === slot.id;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={isPast || !selectedDate}
                      onClick={() => setSelectedSlot(slot.id)}
                      className={`w-full p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#00c307] bg-[#f0fdf4] text-[#075e54]'
                          : isPast || !selectedDate
                          ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                          : 'border-gray-200 hover:border-[#00c307]/50 hover:bg-[#f0fdf4]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{slot.label}</span>
                        {isSelected && (
                          <svg
                            className="w-4 h-4 text-[#00c307]"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                        {isPast && selectedDate && isToday(selectedDate) && (
                          <span className="text-xs text-gray-400">Past</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rider Selection */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Assign Rider (Optional)
              </Label>
              <Select
                value={selectedRider?.id.toString() || 'none'}
                onValueChange={(val) => {
                  if (val === 'none') {
                    setSelectedRider(null);
                  } else {
                    const rider = riders.find((r) => r.id.toString() === val);
                    setSelectedRider(rider || null);
                  }
                }}
                disabled={!selectedSlot}
              >
                <SelectTrigger className={`w-full cursor-pointer ${!selectedSlot ? 'opacity-50' : ''}`}>
                  <SelectValue placeholder="Select a rider (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No rider assigned</SelectItem>
                  {riders.map((rider) => (
                    <SelectItem key={rider.id} value={rider.id.toString()}>
                      {rider.name} - {rider.mobile}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!selectedSlot && (
                <p className="text-xs text-gray-400 mt-1">
                  Select a time slot first
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Full-width Confirm Button */}
        <button
          onClick={handleConfirm}
          disabled={!canConfirm || isSubmitting}
          className="w-full h-12 bg-[#00c307] hover:bg-[#00a506] text-white font-medium text-base rounded-b-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Processing...
            </>
          ) : (
            'Confirm'
          )}
        </button>
      </DialogContent>
    </Dialog>
  );
}
