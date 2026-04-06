import React, { createContext, useContext, useState } from 'react';
import { format } from 'date-fns';

interface PeriodContextValue {
  selectedDay: string;         // 'YYYY-MM-DD'
  setSelectedDay: (day: string) => void;
  periodKey: string;           // derived: selectedDay.slice(0, 7)
  isCurrentPeriod: boolean;    // periodKey === current month
  isToday: boolean;            // selectedDay === today
  goToToday: () => void;
  goToPreviousDay: () => void;
  goToNextDay: () => void;     // no-op if isToday
}

const PeriodContext = createContext<PeriodContextValue | undefined>(undefined);

export function PeriodProvider({ children }: { children: React.ReactNode }) {
  const currentMonth = format(new Date(), 'yyyy-MM');
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [selectedDay, setSelectedDay] = useState<string>(todayStr);

  const periodKey = selectedDay.slice(0, 7);
  const isCurrentPeriod = periodKey === currentMonth;
  const isToday = selectedDay === todayStr;

  function goToToday() {
    setSelectedDay(format(new Date(), 'yyyy-MM-dd'));
  }

  function goToPreviousDay() {
    const d = new Date(selectedDay + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() - 1);
    setSelectedDay(d.toISOString().split('T')[0]);
  }

  function goToNextDay() {
    if (isToday) return;
    const d = new Date(selectedDay + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + 1);
    const next = d.toISOString().split('T')[0];
    // Never allow navigating past today
    if (next <= todayStr) {
      setSelectedDay(next);
    }
  }

  return (
    <PeriodContext.Provider
      value={{ selectedDay, setSelectedDay, periodKey, isCurrentPeriod, isToday, goToToday, goToPreviousDay, goToNextDay }}
    >
      {children}
    </PeriodContext.Provider>
  );
}

export function usePeriodContext(): PeriodContextValue {
  const ctx = useContext(PeriodContext);
  if (!ctx) throw new Error('usePeriodContext must be used within PeriodProvider');
  return ctx;
}
