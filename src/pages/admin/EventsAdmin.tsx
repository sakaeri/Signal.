import { useEffect, useRef, useState } from 'react';
import type { DbEvent, DbEventImage, DbApplication } from '../../types/db';
import {
  fetchAdminEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  setEventThumbnail,
  addGalleryImage,
  removeEventImage,
  duplicateEventImages,
  type EventInput,
} from '../../lib/eventsAdmin';
import {
  fetchApplications,
  setApplicationStatus,
  setApplicationNotes,
  type ApplicationStatusField,
} from '../../lib/applicationsAdmin';
import { sendVenueInfoEmail } from '../../lib/api';
import { publicUrlFor } from '../../lib/storage';
import { formatDateLabel, formatCheckinTime } from '../../lib/formatDate';
import ImagePlaceholder from '../../components/ImagePlaceholder';
import '../../components/Events.css';
import './Admin.css';

const STATUS_FIELDS: { field: ApplicationStatusField; label: string }[] = [
  { field: 'status_venue_info_sent', label: '案内メール' },
  { field: 'status_kit_collected', label: 'キット回収' },
  { field: 'status_photos_developed', label: '写真現像' },
  { field: 'status_letter_mailed', label: '手紙郵送' },
];

function applicationsToCsv(rows: DbApplication[]): string {
  const headers = [
    'created_at',
    'name',
    'email',
    'country',
    'phone',
    'emergency_name',
    'emergency_relation',
    'emergency_phone',
    'message',
    ...STATUS_FIELDS.map((s) => s.label),
    'admin_notes',
  ];
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(
      [
        r.created_at,
        r.name,
        r.email,
        r.country,
        r.phone,
        r.emergency_name,
        r.emergency_relation,
        r.emergency_phone,
        r.message ?? '',
        ...STATUS_FIELDS.map((s) => (r[s.field] ? '済' : '未')),
        r.admin_notes ?? '',
      ]
        .map((v) => escape(String(v)))
        .join(','),
    );
  }
  return lines.join('\n');
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const EMPTY_FORM: EventInput = {
  startDate: '',
  endDate: '',
  capacity: 0,
  price: 0,
  shuttle: false,
  shuttleLocationJa: '',
  shuttleLocationEn: '',
  meetingPointJa: '',
  meetingPointEn: '',
  belongingsJa: '',
  belongingsEn: '',
  mapUrl: '',
  dayContactPhone: '',
  checkinTimeStart: '',
  checkinTimeEnd: '',
  titleJa: '',
  titleEn: '',
  placeJa: '',
  placeEn: '',
};

function isPastEvent(ev: DbEvent): boolean {
  const todayIso = new Date().toISOString().slice(0, 10);
  return (ev.end_date ?? ev.start_date) < todayIso;
}

function dbEventToForm(ev: DbEvent): EventInput {
  return {
    startDate: ev.start_date,
    endDate: ev.end_date ?? '',
    capacity: ev.capacity,
    price: ev.price,
    shuttle: ev.shuttle,
    shuttleLocationJa: ev.shuttle_location_ja ?? '',
    shuttleLocationEn: ev.shuttle_location_en ?? '',
    meetingPointJa: ev.meeting_point_ja ?? '',
    meetingPointEn: ev.meeting_point_en ?? '',
    belongingsJa: ev.belongings_ja ?? '',
    belongingsEn: ev.belongings_en ?? '',
    mapUrl: ev.map_url ?? '',
    dayContactPhone: ev.day_contact_phone ?? '',
    checkinTimeStart: ev.checkin_time_start.slice(0, 5),
    checkinTimeEnd: ev.checkin_time_end ? ev.checkin_time_end.slice(0, 5) : '',
    titleJa: ev.title_ja,
    titleEn: ev.title_en,
    placeJa: ev.place_ja,
    placeEn: ev.place_en,
  };
}

interface InlineEditableTextProps {
  as: 'div' | 'span';
  className?: string;
  value: string;
  placeholder: string;
  isActive: boolean;
  onActivate: () => void;
  onChange: (v: string) => void;
  onDone: () => void;
}

/** Click-to-edit text used inside the live preview card: shows plain text, swaps to an input while active. */
function InlineEditableText({ as: Tag, className, value, placeholder, isActive, onActivate, onChange, onDone }: InlineEditableTextProps) {
  if (isActive) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onDone}
        onKeyDown={(e) => e.key === 'Enter' && onDone()}
        className={className}
        style={{
          display: 'block',
          font: 'inherit',
          fontWeight: 'inherit',
          color: 'inherit',
          border: 'none',
          borderBottom: '1px dashed #c67c4e',
          background: 'transparent',
          width: '100%',
        }}
      />
    );
  }
  return (
    <Tag className={className} onClick={onActivate} style={{ cursor: 'pointer' }}>
      {value || placeholder}
    </Tag>
  );
}

export default function EventsAdmin() {
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [images, setImages] = useState<DbEventImage[]>([]);
  const [applications, setApplications] = useState<DbApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [duplicateSourceId, setDuplicateSourceId] = useState<string | null>(null);
  const [form, setForm] = useState<EventInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [activeInlineField, setActiveInlineField] = useState<string | null>(null);
  const [pendingThumbnailFile, setPendingThumbnailFile] = useState<File | null>(null);
  const [pendingThumbnailPreviewUrl, setPendingThumbnailPreviewUrl] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreating || editingId) {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isCreating, editingId]);

  useEffect(() => {
    if (!pendingThumbnailFile) {
      setPendingThumbnailPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingThumbnailFile);
    setPendingThumbnailPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingThumbnailFile]);

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const [{ events, images }, applications] = await Promise.all([fetchAdminEvents(), fetchApplications()]);
      setEvents(events);
      setImages(images);
      setApplications(applications);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  function startCreate() {
    setForm(EMPTY_FORM);
    setIsCreating(true);
    setEditingId(null);
    setDuplicateSourceId(null);
    setFormError(null);
    setPendingThumbnailFile(null);
    setActiveInlineField(null);
  }

  function startEdit(ev: DbEvent) {
    setForm(dbEventToForm(ev));
    setEditingId(ev.id);
    setIsCreating(false);
    setDuplicateSourceId(null);
    setFormError(null);
    setPendingThumbnailFile(null);
    setActiveInlineField(null);
  }

  function startDuplicate(ev: DbEvent) {
    setForm({ ...dbEventToForm(ev), startDate: '', endDate: '' });
    setIsCreating(true);
    setEditingId(null);
    setDuplicateSourceId(ev.id);
    setFormError(null);
    setPendingThumbnailFile(null);
    setActiveInlineField(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setIsCreating(false);
    setDuplicateSourceId(null);
    setFormError(null);
    setPendingThumbnailFile(null);
    setActiveInlineField(null);
  }

  async function handleSave() {
    setSaving(true);
    setFormError(null);
    try {
      if (!form.startDate) throw new Error('開始日を選択してください。');
      if (!form.checkinTimeStart) throw new Error('集合時間を選択してください。');
      if (isCreating) {
        const newId = await createEvent(form);
        if (duplicateSourceId) await duplicateEventImages(duplicateSourceId, newId);
        if (pendingThumbnailFile) await setEventThumbnail(newId, pendingThumbnailFile);
        await reload();
        // Switch straight into editing the new event so the image upload section
        // (only shown while editing an existing event) is immediately available.
        setIsCreating(false);
        setDuplicateSourceId(null);
        setEditingId(newId);
        setPendingThumbnailFile(null);
      } else if (editingId) {
        await updateEvent(editingId, form);
        if (pendingThumbnailFile) await setEventThumbnail(editingId, pendingThumbnailFile, editingThumbnail);
        await reload();
        cancelEdit();
      }
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(ev: DbEvent) {
    if (!confirm(`「${ev.title_ja}」を削除しますか?この操作は取り消せません。`)) return;
    try {
      await deleteEvent(ev.id);
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  }

  /** Just stages the file locally — actually uploaded when 保存 is clicked, same as every other preview field. */
  function handlePreviewThumbnailPicked(file: File) {
    setPendingThumbnailFile(file);
  }

  async function handleGalleryUpload(eventId: string, file: File) {
    const count = images.filter((i) => i.event_id === eventId && i.role === 'gallery').length;
    try {
      await addGalleryImage(eventId, file, count);
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleRemoveImage(image: DbEventImage) {
    try {
      await removeEventImage(image);
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleToggleStatus(app: DbApplication, field: ApplicationStatusField) {
    const next = !app[field];
    setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, [field]: next } : a)));
    try {
      await setApplicationStatus(app.id, field, next);
    } catch (e) {
      setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, [field]: !next } : a)));
      alert(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleNotesBlur(app: DbApplication, notes: string) {
    if (notes === (app.admin_notes ?? '')) return;
    setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, admin_notes: notes || null } : a)));
    try {
      await setApplicationNotes(app.id, notes);
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
      await reload();
    }
  }

  async function handleSendVenueEmail(app: DbApplication) {
    if (!confirm(`${app.name}様(${app.email})に会場案内メールを送信しますか?`)) return;
    setSendingEmailId(app.id);
    try {
      await sendVenueInfoEmail(app.id);
      setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, status_venue_info_sent: true } : a)));
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setSendingEmailId(null);
    }
  }

  const editingEvent = editingId ? events.find((e) => e.id === editingId) ?? null : null;
  const editingImages = editingId ? images.filter((i) => i.event_id === editingId) : [];
  const editingThumbnail = editingImages.find((i) => i.role === 'thumbnail');
  const editingGallery = editingImages.filter((i) => i.role === 'gallery').sort((a, b) => a.position - b.position);

  const previewDateLabel = form.startDate ? formatDateLabel(form.startDate, form.endDate || null, 'ja') : '(開始日を入力してください)';
  const previewCheckinTime = form.checkinTimeStart
    ? formatCheckinTime(form.checkinTimeStart, form.checkinTimeEnd || null, 'ja')
    : '(集合時間を入力してください)';
  const previewThumbnailUrl =
    pendingThumbnailPreviewUrl ?? (editingThumbnail ? publicUrlFor(editingThumbnail.storage_path) : null);

  const upcomingEvents = events.filter((ev) => !isPastEvent(ev));
  const pastEvents = events
    .filter(isPastEvent)
    .slice()
    .reverse();

  const priceById = new Map(events.map((ev) => [ev.id, ev.price]));
  const totalRevenue = applications.reduce((sum, a) => sum + (priceById.get(a.event_id) ?? 0), 0);

  function renderEventRow(ev: DbEvent) {
    const thumb = images.find((i) => i.event_id === ev.id && i.role === 'thumbnail');
    const applicants = applications.filter((a) => a.event_id === ev.id);
    const isExpanded = expandedEventId === ev.id;
    return (
      <div key={ev.id}>
        <div className="admin-event-row">
          <div className="admin-event-thumb">{thumb ? <img src={publicUrlFor(thumb.storage_path)} alt="" /> : '画像なし'}</div>
          <div className="admin-event-info">
            <div className="admin-event-title">{ev.title_ja}</div>
            <div className="admin-event-meta">
              {ev.place_ja} ・ {formatDateLabel(ev.start_date, ev.end_date, 'ja')} ・{' '}
              {formatCheckinTime(ev.checkin_time_start, ev.checkin_time_end, 'ja')}集合
              {ev.shuttle && ev.shuttle_location_ja ? `(送迎: ${ev.shuttle_location_ja})` : ''} ・ ¥
              {ev.price.toLocaleString()} ・ 残り{ev.remaining}/{ev.capacity}名
            </div>
          </div>
          <div className="admin-event-actions">
            <button
              type="button"
              className={`admin-button admin-button-secondary${isExpanded ? ' is-selected' : ''}`}
              onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}
            >
              申し込み {applicants.length}件 {isExpanded ? '▲' : '▼'}
            </button>
            {!isPastEvent(ev) && (
              <button type="button" className="admin-button admin-button-secondary" onClick={() => startEdit(ev)}>
                編集
              </button>
            )}
            <button type="button" className="admin-button admin-button-secondary" onClick={() => startDuplicate(ev)}>
              複製
            </button>
            <button type="button" className="admin-button admin-button-danger" onClick={() => handleDelete(ev)}>
              削除
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="admin-card" style={{ marginTop: -8, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="admin-section-title" style={{ marginBottom: 0, fontSize: 14 }}>
                申し込み者一覧
              </div>
              <button
                type="button"
                className="admin-button admin-button-secondary"
                disabled={applicants.length === 0}
                onClick={() => downloadCsv(`applications-${ev.id}.csv`, applicationsToCsv(applicants))}
              >
                CSVダウンロード
              </button>
            </div>
            {applicants.length === 0 ? (
              <div className="admin-empty">申し込みはまだありません。</div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>申込日時</th>
                      <th>お名前</th>
                      <th>メール</th>
                      <th>国</th>
                      <th>電話番号</th>
                      <th>緊急連絡先</th>
                      <th>ご要望</th>
                      <th>対応状況</th>
                      <th>対応メモ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applicants.map((a) => {
                      const next = STATUS_FIELDS.find((s) => !a[s.field]);
                      return (
                      <tr key={a.id}>
                        <td>{new Date(a.created_at).toLocaleString('ja-JP')}</td>
                        <td>{a.name}</td>
                        <td>{a.email}</td>
                        <td>{a.country}</td>
                        <td>{a.phone}</td>
                        <td>
                          {a.emergency_name}({a.emergency_relation}) / {a.emergency_phone}
                        </td>
                        <td>{a.message || '—'}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                            {STATUS_FIELDS.filter((s) => a[s.field]).map((s) => (
                              <button
                                key={s.field}
                                type="button"
                                title="取り消す"
                                onClick={() => {
                                  if (confirm(`「${s.label}」を未対応に戻しますか?`)) handleToggleStatus(a, s.field);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  fontSize: 12,
                                  color: 'var(--color-ink-mute)',
                                  cursor: 'pointer',
                                  textDecoration: 'line-through',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                ✓ {s.label}
                              </button>
                            ))}
                            {next ? (
                              next.field === 'status_venue_info_sent' ? (
                                <button
                                  type="button"
                                  className="admin-button admin-button-secondary"
                                  style={{ padding: '6px 12px', fontSize: 12, whiteSpace: 'nowrap' }}
                                  disabled={sendingEmailId === a.id}
                                  onClick={() => handleSendVenueEmail(a)}
                                >
                                  {sendingEmailId === a.id ? '送信中…' : '→ 案内メールを送信'}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="admin-button admin-button-secondary"
                                  style={{ padding: '6px 12px', fontSize: 12, whiteSpace: 'nowrap' }}
                                  onClick={() => {
                                    if (confirm(`${a.name}様の「${next.label}」を完了にしますか?`)) handleToggleStatus(a, next.field);
                                  }}
                                >
                                  → {next.label}
                                </button>
                              )
                            ) : (
                              <span style={{ fontSize: 12, fontWeight: 600 }}>対応完了</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <input
                            type="text"
                            defaultValue={a.admin_notes ?? ''}
                            placeholder="メモ"
                            style={{ width: 140, border: 'none', borderBottom: '1px solid rgba(42,42,36,0.3)', background: 'none', fontSize: 13 }}
                            onBlur={(e) => handleNotesBlur(a, e.target.value)}
                          />
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="admin-section-title" style={{ marginBottom: 0 }}>
          開催イベント
        </div>
        <button type="button" className="admin-button" onClick={startCreate}>
          + 新規イベント
        </button>
      </div>

      {loading && <div className="admin-empty">読み込み中…</div>}
      {error && <div className="admin-error">{error}</div>}

      {!loading && !error && (
        <div className="admin-stats">
          <div className="admin-stat">
            <div className="admin-stat-value">{upcomingEvents.length}</div>
            <div className="admin-stat-label">開催予定</div>
          </div>
          <div className="admin-stat">
            <div className="admin-stat-value">{applications.length}</div>
            <div className="admin-stat-label">総申込者数</div>
          </div>
          <div className="admin-stat">
            <div className="admin-stat-value">¥{totalRevenue.toLocaleString()}</div>
            <div className="admin-stat-label">総売上</div>
          </div>
        </div>
      )}

      {(isCreating || editingEvent) && (
        <div className="admin-card" ref={formRef}>
          <div className="admin-section-title" style={{ fontSize: 17 }}>
            {isCreating ? (duplicateSourceId ? '複製して新規作成' : '新規イベント') : `編集: ${editingEvent?.title_ja}`}
          </div>
          <div className="admin-form-section-title">プレビュー(タップして直接入力できます)</div>
          <div className="event-card" style={{ maxWidth: 640, marginBottom: 8 }}>
            <div className="event-card-image" style={{ cursor: 'pointer' }} onClick={() => thumbnailInputRef.current?.click()} role="button" tabIndex={0}>
              {previewThumbnailUrl ? (
                <img src={previewThumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <ImagePlaceholder caption="タップして画像を追加" />
              )}
              <div
                className="event-card-date-badge"
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeInlineField !== 'dates') setActiveInlineField('dates');
                }}
              >
                {activeInlineField === 'dates' ? (
                  <span onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <input
                      type="date"
                      autoFocus
                      value={form.startDate}
                      onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                      style={{ font: 'inherit', border: 'none', background: 'transparent' }}
                    />
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                      style={{ font: 'inherit', border: 'none', background: 'transparent' }}
                    />
                    <button
                      type="button"
                      onClick={() => setActiveInlineField(null)}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700 }}
                    >
                      ✓
                    </button>
                  </span>
                ) : (
                  previewDateLabel
                )}
              </div>
            </div>
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePreviewThumbnailPicked(file);
                e.target.value = '';
              }}
            />
            <div className="event-card-body">
              <InlineEditableText
                as="div"
                className="event-card-place admin-tap-edit"
                value={form.placeJa}
                placeholder="開催場所(タップして入力)"
                isActive={activeInlineField === 'placeJa'}
                onActivate={() => setActiveInlineField('placeJa')}
                onChange={(v) => setForm((f) => ({ ...f, placeJa: v }))}
                onDone={() => setActiveInlineField(null)}
              />
              <InlineEditableText
                as="div"
                className="event-card-title admin-tap-edit"
                value={form.titleJa}
                placeholder="イベントタイトル(タップして入力)"
                isActive={activeInlineField === 'titleJa'}
                onActivate={() => setActiveInlineField('titleJa')}
                onChange={(v) => setForm((f) => ({ ...f, titleJa: v }))}
                onDone={() => setActiveInlineField(null)}
              />

              {activeInlineField === 'checkin' ? (
                <div className="event-card-checkin" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  集合時間
                  <input
                    type="time"
                    autoFocus
                    value={form.checkinTimeStart}
                    onChange={(e) => setForm((f) => ({ ...f, checkinTimeStart: e.target.value }))}
                  />
                  〜
                  <input
                    type="time"
                    value={form.checkinTimeEnd}
                    onChange={(e) => setForm((f) => ({ ...f, checkinTimeEnd: e.target.value }))}
                  />
                  <select
                    value={form.shuttle ? '1' : '0'}
                    onChange={(e) => setForm((f) => ({ ...f, shuttle: e.target.value === '1' }))}
                  >
                    <option value="0">現地集合</option>
                    <option value="1">送迎あり</option>
                  </select>
                  {form.shuttle && (
                    <input
                      value={form.shuttleLocationJa}
                      onChange={(e) => setForm((f) => ({ ...f, shuttleLocationJa: e.target.value }))}
                      placeholder="送迎ポイント(例: 新宿駅西口)"
                      style={{ font: 'inherit', border: 'none', borderBottom: '1px dashed #c67c4e', background: 'transparent' }}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveInlineField(null)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700 }}
                  >
                    ✓
                  </button>
                </div>
              ) : (
                <div className="event-card-checkin admin-tap-edit" onClick={() => setActiveInlineField('checkin')} style={{ cursor: 'pointer' }}>
                  集合時間 {previewCheckinTime} ({form.shuttle ? `送迎ポイント: ${form.shuttleLocationJa || '(未入力)'}` : '現地'})
                </div>
              )}

              <div className="event-card-footer">
                {activeInlineField === 'price' ? (
                  <span className="event-card-price">
                    ¥
                    <input
                      type="number"
                      autoFocus
                      value={form.price}
                      onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                      onBlur={() => setActiveInlineField(null)}
                      onKeyDown={(e) => e.key === 'Enter' && setActiveInlineField(null)}
                      style={{ font: 'inherit', color: 'inherit', border: 'none', borderBottom: '1px dashed #c67c4e', background: 'transparent', width: 90 }}
                    />
                    /人
                  </span>
                ) : (
                  <span className="event-card-price admin-tap-edit" onClick={() => setActiveInlineField('price')} style={{ cursor: 'pointer' }}>
                    ¥{form.price.toLocaleString('en-US')}/人
                  </span>
                )}
                {activeInlineField === 'capacity' ? (
                  <span className="event-card-select">
                    残り
                    <input
                      type="number"
                      autoFocus
                      value={form.capacity}
                      onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) }))}
                      onBlur={() => setActiveInlineField(null)}
                      onKeyDown={(e) => e.key === 'Enter' && setActiveInlineField(null)}
                      style={{ font: 'inherit', color: 'inherit', border: 'none', background: 'transparent', width: 50 }}
                    />
                    名 ▼
                  </span>
                ) : (
                  <span className="event-card-select admin-tap-edit" onClick={() => setActiveInlineField('capacity')} style={{ cursor: 'pointer' }}>
                    残り{form.capacity}名 ▼
                  </span>
                )}
              </div>
            </div>
          </div>
          <p className="admin-muted" style={{ marginTop: -4, marginBottom: 8 }}>
            画像・場所・タイトル・日付・集合時間・送迎・価格・定員は、上のプレビューを直接タップして入力できます。
          </p>

          <div className="admin-form-section-title">英語表記(海外のお客様向け)</div>
          <div className="admin-form-grid">
            <div className="admin-field">
              <label>Title (English)</label>
              <input value={form.titleEn} onChange={(e) => setForm((f) => ({ ...f, titleEn: e.target.value }))} />
            </div>
            <div className="admin-field">
              <label>Place (English)</label>
              <input value={form.placeEn} onChange={(e) => setForm((f) => ({ ...f, placeEn: e.target.value }))} />
            </div>
          </div>

          <div className="admin-form-section-title">集合について(集合時間・送迎は上のプレビューで入力できます)</div>
          <div className="admin-form-grid">
            {form.shuttle && (
              <div className="admin-field">
                <label>Pickup location (English)</label>
                <input
                  value={form.shuttleLocationEn}
                  onChange={(e) => setForm((f) => ({ ...f, shuttleLocationEn: e.target.value }))}
                  placeholder="e.g. Shinjuku Station West Exit"
                />
              </div>
            )}
            <div className="admin-field">
              <label>集合場所の詳細(日本語)</label>
              <textarea
                rows={2}
                value={form.meetingPointJa}
                onChange={(e) => setForm((f) => ({ ...f, meetingPointJa: e.target.value }))}
                placeholder="例: 現地駐車場入口の看板前"
              />
            </div>
            <div className="admin-field">
              <label>Meeting point details (English)</label>
              <textarea
                rows={2}
                value={form.meetingPointEn}
                onChange={(e) => setForm((f) => ({ ...f, meetingPointEn: e.target.value }))}
                placeholder="e.g. By the sign at the parking lot entrance"
              />
            </div>
            <div className="admin-field">
              <label>Googleマップのリンク</label>
              <input
                value={form.mapUrl}
                onChange={(e) => setForm((f) => ({ ...f, mapUrl: e.target.value }))}
                placeholder="https://maps.app.goo.gl/..."
              />
            </div>
            <div className="admin-field">
              <label>当日の緊急連絡先(電話番号)</label>
              <input
                value={form.dayContactPhone}
                onChange={(e) => setForm((f) => ({ ...f, dayContactPhone: e.target.value }))}
                placeholder="例: 090-1234-5678"
              />
            </div>
          </div>

          <div className="admin-form-section-title">持ち物(案内メールに使われます)</div>
          <div className="admin-form-grid">
            <div className="admin-field">
              <label>持ち物(日本語)</label>
              <textarea
                rows={2}
                value={form.belongingsJa}
                onChange={(e) => setForm((f) => ({ ...f, belongingsJa: e.target.value }))}
                placeholder="例: 動きやすい服装、タオル、飲み物"
              />
            </div>
            <div className="admin-field">
              <label>What to bring (English)</label>
              <textarea
                rows={2}
                value={form.belongingsEn}
                onChange={(e) => setForm((f) => ({ ...f, belongingsEn: e.target.value }))}
                placeholder="e.g. Comfortable clothes, a towel, water"
              />
            </div>
          </div>
          <p className="admin-muted" style={{ marginTop: 8 }}>
            集合場所の詳細・持ち物・地図リンク・緊急連絡先は公開ページには表示されません(社内・案内メール用の控えです)。お迎え場所は公開ページにも表示されます。
          </p>

          {formError && (
            <div className="admin-error" style={{ marginTop: 12 }}>
              {formError}
            </div>
          )}

          <div className="admin-form-actions">
            <button type="button" className="admin-button" onClick={handleSave} disabled={saving}>
              {saving ? '保存中…' : '保存'}
            </button>
            <button type="button" className="admin-button admin-button-secondary" onClick={cancelEdit}>
              キャンセル
            </button>
          </div>

          {editingEvent && (
            <div style={{ marginTop: 28, borderTop: '1px solid rgba(42,42,36,0.1)', paddingTop: 20 }}>
              <div className="admin-section-title" style={{ fontSize: 15 }}>
                ギャラリー画像
              </div>
              <p className="admin-muted" style={{ marginTop: -8, marginBottom: 12 }}>
                サムネイル(カード表示用)は上のプレビュー画像をタップして変更してください。ここは、タップで開くポップアップ用の複数枚のギャラリー写真です。
              </p>

              <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                <div className="admin-image-slot" style={{ flex: 1, minWidth: 260 }}>
                  <label className="admin-muted">ギャラリー(タップで開くポップアップ用、複数可)</label>
                  <div className="admin-gallery-grid">
                    {editingGallery.map((img) => (
                      <div className="admin-gallery-item" key={img.id}>
                        <img src={publicUrlFor(img.storage_path)} alt="" />
                        <button type="button" onClick={() => handleRemoveImage(img)} aria-label="削除">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleGalleryUpload(editingEvent.id, file);
                      e.target.value = '';
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && events.length === 0 && !isCreating && <div className="admin-empty">イベントがまだありません。</div>}

      {upcomingEvents.length > 0 && (
        <>
          <div className="admin-section-title" style={{ fontSize: 15, marginTop: 8 }}>
            開催予定
          </div>
          {upcomingEvents.map(renderEventRow)}
        </>
      )}

      {pastEvents.length > 0 && (
        <>
          <div className="admin-section-title" style={{ fontSize: 15, marginTop: 32 }}>
            過去のイベント
          </div>
          <div style={{ opacity: 0.7 }}>{pastEvents.map(renderEventRow)}</div>
        </>
      )}
    </div>
  );
}
