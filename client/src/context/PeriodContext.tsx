import React, { createContext, useContext, useState } from 'react';
import { format } from 'date-fns';

interface PeriodContextValue {
  periodKey: string;
  setPeriodKey: (key: string) => void;
  isCurrentPeriod: boolean;
}

const PeriodContext = createContext<PeriodContextValue | undefined>(undefined);

export function PeriodProvider({ children }: { children: React.ReactNode }) {
  const currentMonth = format(new Date(), 'yyyy-MM');
  const [periodKey, setPeriodKey] = useState<string>(currentMonth);

  const isCurrentPeriod = periodKey === currentMonth;

  return (
    <PeriodContext.Provider value={{ periodKey, setPeriodKey, isCurrentPeriod }}>
      {children}
    </PeriodContext.Provider>
  );
}

export function usePeriodContext(): PeriodContextValue {
  const ctx = useContext(PeriodContext);
  if (!ctx) throw new Error('usePeriodContext must be used within PeriodProvider');
  return ctx;
}
