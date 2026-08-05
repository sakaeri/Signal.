import { useEffect, useMemo, useState } from 'react';
import type { DbApplication, DbEvent } from '../../types/db';
import { fetchApplications } from '../../lib/applicationsAdmin';
import { fetchAdminEvents } from '../../lib/eventsAdmin';
import './Admin.css';

function toCsv(rows: DbApplication[], titleFor: (eventId: string) => string): string {
  const headers = [
    'created_at',
    'event',
    'name',
    'email',
    'country',
    'phone',
    'emergency_name',
    'emergency_relation',
    'emergency_phone',
    'message',
  ];
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(
      [
        r.created_at,
        titleFor(r.event_id),
        r.name,
        r.email,
        r.country,
        r.phone,
        r.emergency_name,
        r.emergency_relation,
        r.emergency_phone,
        r.message ?? '',
      ]
        .map((v) => escape(String(v)))
        .join(','),
    );
  }
  return lines.join('\n');
}

interface ApplicationsAdminProps {
  eventFilter: string;
  onEventFilterChange: (eventId: string) => void;
}

export default function ApplicationsAdmin({ eventFilter, onEventFilterChange }: ApplicationsAdminProps) {
  const [applications, setApplications] = useState<DbApplication[]>([]);
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchApplications(), fetchAdminEvents()])
      .then(([apps, { events }]) => {
        setApplications(apps);
        setEvents(events);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  const titleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const ev of events) map.set(ev.id, `${ev.title_ja}(${ev.start_date})`);
    return map;
  }, [events]);
  const titleFor = (eventId: string) => titleById.get(eventId) ?? eventId;

  const eventIds = useMemo(() => Array.from(new Set(applications.map((a) => a.event_id))).sort(), [applications]);
  const filtered = eventFilter ? applications.filter((a) => a.event_id === eventFilter) : applications;

  function handleExport() {
    const csv = toCsv(filtered, titleFor);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applications-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
        <div className="admin-section-title" style={{ marginBottom: 0 }}>
          申し込み一覧 ({filtered.length}件)
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <select value={eventFilter} onChange={(e) => onEventFilterChange(e.target.value)}>
            <option value="">すべての回</option>
            {eventIds.map((id) => (
              <option key={id} value={id}>
                {titleFor(id)}
              </option>
            ))}
          </select>
          <button type="button" className="admin-button admin-button-secondary" onClick={handleExport} disabled={filtered.length === 0}>
            CSVダウンロード
          </button>
        </div>
      </div>

      {loading && <div className="admin-empty">読み込み中…</div>}
      {error && <div className="admin-error">{error}</div>}
      {!loading && filtered.length === 0 && !error && <div className="admin-empty">申し込みはまだありません。</div>}

      {filtered.length > 0 && (
        <div className="admin-card admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>申込日時</th>
                <th>参加回</th>
                <th>お名前</th>
                <th>メール</th>
                <th>国</th>
                <th>電話番号</th>
                <th>緊急連絡先</th>
                <th>ご要望</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td>{new Date(a.created_at).toLocaleString('ja-JP')}</td>
                  <td>{titleFor(a.event_id)}</td>
                  <td>{a.name}</td>
                  <td>{a.email}</td>
                  <td>{a.country}</td>
                  <td>{a.phone}</td>
                  <td>
                    {a.emergency_name}({a.emergency_relation}) / {a.emergency_phone}
                  </td>
                  <td>{a.message || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
