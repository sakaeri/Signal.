import type { Lang } from '../i18n/translations';

const JA_WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
const EN_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDateLabel(startIso: string, endIso: string | null, lang: Lang): string {
  const start = parseIsoDate(startIso);
  const end = endIso ? parseIsoDate(endIso) : null;
  const isDayTrip = !end || end.getTime() === start.getTime();
  const y = start.getFullYear();

  if (lang === 'ja') {
    const sM = start.getMonth() + 1;
    const sD = start.getDate();
    const sW = JA_WEEKDAYS[start.getDay()];
    if (isDayTrip) return `${y}年${sM}月${sD}日(${sW}) 日帰り`;
    const eM = end.getMonth() + 1;
    const eD = end.getDate();
    const eW = JA_WEEKDAYS[end.getDay()];
    if (sM === eM) return `${y}年${sM}月${sD}日(${sW})〜${eD}日(${eW})`;
    return `${y}年${sM}月${sD}日(${sW})〜${eM}月${eD}日(${eW})`;
  }

  const sMonthName = EN_MONTHS[start.getMonth()];
  const sD = start.getDate();
  const sW = EN_WEEKDAYS[start.getDay()];
  if (isDayTrip) return `${sMonthName} ${sD} (${sW}), ${y} — Day trip`;
  const eMonthName = EN_MONTHS[end.getMonth()];
  const eD = end.getDate();
  const eW = EN_WEEKDAYS[end.getDay()];
  if (start.getMonth() === end.getMonth()) return `${sMonthName} ${sD} (${sW}) – ${eD} (${eW}), ${y}`;
  return `${sMonthName} ${sD} (${sW}) – ${eMonthName} ${eD} (${eW}), ${y}`;
}

export function formatCheckinTime(startTime: string, endTime: string | null, lang: Lang): string {
  const start = startTime.slice(0, 5);
  if (!endTime) return start;
  const end = endTime.slice(0, 5);
  return lang === 'ja' ? `${start}〜${end}` : `${start}–${end}`;
}
