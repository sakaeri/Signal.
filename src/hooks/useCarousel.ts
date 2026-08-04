import { useCallback, useEffect, useRef, useState } from 'react';

export function useCarousel(length: number, intervalMs: number) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % length);
  }, [length]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + length) % length);
  }, [length]);

  const start = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(next, intervalMs);
  }, [next, intervalMs]);

  const pause = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    start();
    return () => pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start]);

  return { index, setIndex, next, prev, pause, resume: start };
}
