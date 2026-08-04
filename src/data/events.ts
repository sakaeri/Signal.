import type { Lang } from '../i18n/translations';

interface EventCopy {
  title: string;
  place: string;
  dateLabel: string;
}

export interface RawEvent {
  id: string;
  capacity: number;
  price: string;
  shuttle: boolean;
  checkinTime: { ja: string; en: string };
  ja: EventCopy;
  en: EventCopy;
}

export const RAW_EVENTS: RawEvent[] = [
  {
    id: 'asakusa',
    capacity: 12,
    price: '22,000',
    shuttle: false,
    checkinTime: { ja: '10:00〜12:00', en: '10:00–12:00' },
    ja: { title: '寺院ステイ・写経と散歩', place: '東京都・浅草の寺院', dateLabel: '2026年8月22日(土)〜23日(日)' },
    en: {
      title: 'Temple Stay: Sutra Copying & Walk',
      place: 'Tokyo — a temple in Asakusa',
      dateLabel: 'Aug 22 (Sat) – 23 (Sun), 2026',
    },
  },
  {
    id: 'yamanakako',
    capacity: 18,
    price: '38,000',
    shuttle: true,
    checkinTime: { ja: '13:00', en: '13:00' },
    ja: { title: '山中湖リトリート', place: '山梨県・山中湖畔', dateLabel: '2026年9月12日(土)〜13日(日)' },
    en: {
      title: 'Lake Yamanaka Retreat',
      place: 'Yamanashi — Lake Yamanaka',
      dateLabel: 'Sep 12 (Sat) – 13 (Sun), 2026',
    },
  },
  {
    id: 'okutama',
    capacity: 24,
    price: '12,000',
    shuttle: false,
    checkinTime: { ja: '9:00〜10:00', en: '9:00–10:00' },
    ja: { title: '奥多摩デイキャンプ', place: '東京都・奥多摩', dateLabel: '2026年10月4日(日) 日帰り' },
    en: { title: 'Okutama Day Camp', place: 'Tokyo — Okutama', dateLabel: 'Oct 4 (Sun), 2026 — Day trip' },
  },
  {
    id: 'awaji',
    capacity: 16,
    price: '68,000',
    shuttle: true,
    checkinTime: { ja: '11:00', en: '11:00' },
    ja: { title: '淡路島3日間リトリート', place: '兵庫県・淡路島', dateLabel: '2026年11月20日(金)〜22日(日)' },
    en: {
      title: '3-Day Awaji Island Retreat',
      place: 'Hyogo — Awaji Island',
      dateLabel: 'Nov 20 (Fri) – 22 (Sun), 2026',
    },
  },
];

export function getEventCopy(ev: RawEvent, lang: Lang): EventCopy {
  return ev[lang];
}
