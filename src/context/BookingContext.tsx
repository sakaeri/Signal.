import { createContext, useContext, useState, useMemo, type ReactNode } from 'react';

interface BookingContextValue {
  selectedEventId: string | null;
  selectEvent: (id: string) => void;
  setSelectedEventId: (id: string) => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const value = useMemo<BookingContextValue>(
    () => ({
      selectedEventId,
      setSelectedEventId,
      selectEvent: (id: string) => {
        setSelectedEventId(id);
        setTimeout(() => {
          document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 30);
      },
    }),
    [selectedEventId],
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used within a BookingProvider');
  return ctx;
}
