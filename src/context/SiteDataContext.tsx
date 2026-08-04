import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { publicUrlFor } from '../lib/storage';
import { mapEvents } from '../lib/mapEvent';
import type { DbEvent, DbEventImage, DbSiteImage } from '../types/db';
import type { EventRecord } from '../types/event';

const FETCH_TIMEOUT_MS = 15000;

function withTimeout(ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

interface SiteDataContextValue {
  events: EventRecord[];
  eventsLoading: boolean;
  eventsError: string | null;
  reloadEvents: () => Promise<void>;
  siteImages: Record<string, string>;
  siteImagesLoading: boolean;
  reloadSiteImages: () => Promise<void>;
}

const SiteDataContext = createContext<SiteDataContextValue | null>(null);

export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [siteImages, setSiteImages] = useState<Record<string, string>>({});
  const [siteImagesLoading, setSiteImagesLoading] = useState(true);

  const reloadEvents = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setEvents([]);
      setEventsError('Supabase is not configured (src/lib/supabase.ts / .env).');
      setEventsLoading(false);
      return;
    }
    setEventsLoading(true);
    setEventsError(null);
    const { signal, clear } = withTimeout(FETCH_TIMEOUT_MS);
    try {
      const [eventsRes, imagesRes] = await Promise.all([
        supabase.from('events').select('*').order('sort_order', { ascending: true }).abortSignal(signal),
        supabase.from('event_images').select('*').order('position', { ascending: true }).abortSignal(signal),
      ]);
      if (eventsRes.error) throw eventsRes.error;
      if (imagesRes.error) throw imagesRes.error;
      setEvents(mapEvents((eventsRes.data ?? []) as DbEvent[], (imagesRes.data ?? []) as DbEventImage[]));
    } catch (e) {
      console.error('[SiteDataProvider] Failed to load events:', e);
      setEventsError(e instanceof Error ? e.message : 'Failed to load events.');
    } finally {
      clear();
      setEventsLoading(false);
    }
  }, []);

  const reloadSiteImages = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setSiteImages({});
      setSiteImagesLoading(false);
      return;
    }
    setSiteImagesLoading(true);
    const { signal, clear } = withTimeout(FETCH_TIMEOUT_MS);
    try {
      const { data, error } = await supabase.from('site_images').select('*').abortSignal(signal);
      if (!error && data) {
        const map: Record<string, string> = {};
        for (const row of data as DbSiteImage[]) {
          map[row.slot] = publicUrlFor(row.storage_path);
        }
        setSiteImages(map);
      }
    } catch {
      // Non-critical: components fall back to their bundled default images.
    } finally {
      clear();
      setSiteImagesLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadEvents();
    reloadSiteImages();
  }, [reloadEvents, reloadSiteImages]);

  const value = useMemo<SiteDataContextValue>(
    () => ({ events, eventsLoading, eventsError, reloadEvents, siteImages, siteImagesLoading, reloadSiteImages }),
    [events, eventsLoading, eventsError, reloadEvents, siteImages, siteImagesLoading, reloadSiteImages],
  );

  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>;
}

export function useSiteData() {
  const ctx = useContext(SiteDataContext);
  if (!ctx) throw new Error('useSiteData must be used within a SiteDataProvider');
  return ctx;
}
