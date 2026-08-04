import { useEffect, useState } from 'react';
import type { DbEvent, DbEventImage } from '../../types/db';
import {
  fetchAdminEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  setEventThumbnail,
  addGalleryImage,
  removeEventImage,
  type EventInput,
} from '../../lib/eventsAdmin';
import { publicUrlFor } from '../../lib/storage';
import './Admin.css';

const EMPTY_FORM: EventInput = {
  id: '',
  sortOrder: 0,
  capacity: 0,
  remaining: 0,
  price: 0,
  shuttle: false,
  checkinTimeJa: '',
  checkinTimeEn: '',
  titleJa: '',
  titleEn: '',
  placeJa: '',
  placeEn: '',
  dateLabelJa: '',
  dateLabelEn: '',
};

function dbEventToForm(ev: DbEvent): EventInput {
  return {
    id: ev.id,
    sortOrder: ev.sort_order,
    capacity: ev.capacity,
    remaining: ev.remaining,
    price: ev.price,
    shuttle: ev.shuttle,
    checkinTimeJa: ev.checkin_time_ja,
    checkinTimeEn: ev.checkin_time_en,
    titleJa: ev.title_ja,
    titleEn: ev.title_en,
    placeJa: ev.place_ja,
    placeEn: ev.place_en,
    dateLabelJa: ev.date_label_ja,
    dateLabelEn: ev.date_label_en,
  };
}

export default function EventsAdmin() {
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [images, setImages] = useState<DbEventImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<EventInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const { events, images } = await fetchAdminEvents();
      setEvents(events);
      setImages(images);
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
    setForm({ ...EMPTY_FORM, sortOrder: events.length });
    setIsCreating(true);
    setEditingId(null);
    setFormError(null);
  }

  function startEdit(ev: DbEvent) {
    setForm(dbEventToForm(ev));
    setEditingId(ev.id);
    setIsCreating(false);
    setFormError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setIsCreating(false);
    setFormError(null);
  }

  async function handleSave() {
    setSaving(true);
    setFormError(null);
    try {
      if (isCreating) {
        if (!form.id.trim()) throw new Error('IDを入力してください(英数字・ハイフンのみ推奨)。');
        await createEvent(form);
      } else if (editingId) {
        await updateEvent(editingId, form);
      }
      await reload();
      cancelEdit();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(`「${id}」を削除しますか?この操作は取り消せません。`)) return;
    try {
      await deleteEvent(id);
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleThumbnailUpload(eventId: string, file: File) {
    const previous = images.find((i) => i.event_id === eventId && i.role === 'thumbnail');
    try {
      await setEventThumbnail(eventId, file, previous);
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
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

  const editingEvent = editingId ? events.find((e) => e.id === editingId) ?? null : null;
  const editingImages = editingId ? images.filter((i) => i.event_id === editingId) : [];
  const editingThumbnail = editingImages.find((i) => i.role === 'thumbnail');
  const editingGallery = editingImages.filter((i) => i.role === 'gallery').sort((a, b) => a.position - b.position);

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

      {(isCreating || editingEvent) && (
        <div className="admin-card">
          <div className="admin-section-title" style={{ fontSize: 17 }}>
            {isCreating ? '新規イベント' : `編集: ${editingEvent?.title_ja}`}
          </div>
          <div className="admin-form-grid">
            {isCreating && (
              <div className="admin-field">
                <label>ID(半角英数・ハイフン)</label>
                <input value={form.id} onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))} placeholder="例: hakone" />
              </div>
            )}
            <div className="admin-field">
              <label>並び順</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
              />
            </div>
            <div className="admin-field">
              <label>タイトル(日本語)</label>
              <input value={form.titleJa} onChange={(e) => setForm((f) => ({ ...f, titleJa: e.target.value }))} />
            </div>
            <div className="admin-field">
              <label>Title (English)</label>
              <input value={form.titleEn} onChange={(e) => setForm((f) => ({ ...f, titleEn: e.target.value }))} />
            </div>
            <div className="admin-field">
              <label>開催場所(日本語)</label>
              <input value={form.placeJa} onChange={(e) => setForm((f) => ({ ...f, placeJa: e.target.value }))} />
            </div>
            <div className="admin-field">
              <label>Place (English)</label>
              <input value={form.placeEn} onChange={(e) => setForm((f) => ({ ...f, placeEn: e.target.value }))} />
            </div>
            <div className="admin-field">
              <label>日程表示(日本語)</label>
              <input value={form.dateLabelJa} onChange={(e) => setForm((f) => ({ ...f, dateLabelJa: e.target.value }))} />
            </div>
            <div className="admin-field">
              <label>Date label (English)</label>
              <input value={form.dateLabelEn} onChange={(e) => setForm((f) => ({ ...f, dateLabelEn: e.target.value }))} />
            </div>
            <div className="admin-field">
              <label>集合時間(日本語)</label>
              <input value={form.checkinTimeJa} onChange={(e) => setForm((f) => ({ ...f, checkinTimeJa: e.target.value }))} />
            </div>
            <div className="admin-field">
              <label>Check-in time (English)</label>
              <input value={form.checkinTimeEn} onChange={(e) => setForm((f) => ({ ...f, checkinTimeEn: e.target.value }))} />
            </div>
            <div className="admin-field">
              <label>価格(円)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
              />
            </div>
            <div className="admin-field">
              <label>定員</label>
              <input
                type="number"
                value={form.capacity}
                onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) }))}
              />
            </div>
            <div className="admin-field">
              <label>残り枠</label>
              <input
                type="number"
                value={form.remaining}
                onChange={(e) => setForm((f) => ({ ...f, remaining: Number(e.target.value) }))}
              />
            </div>
            <div className="admin-field">
              <label>送迎</label>
              <select
                value={form.shuttle ? '1' : '0'}
                onChange={(e) => setForm((f) => ({ ...f, shuttle: e.target.value === '1' }))}
              >
                <option value="0">なし(現地集合・解散)</option>
                <option value="1">あり</option>
              </select>
            </div>
          </div>

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
                画像
              </div>

              <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                <div className="admin-image-slot">
                  <label className="admin-muted">サムネイル(カードに表示)</label>
                  <div className="admin-image-slot-preview">
                    {editingThumbnail ? (
                      <img src={publicUrlFor(editingThumbnail.storage_path)} alt="" />
                    ) : (
                      '未設定'
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleThumbnailUpload(editingEvent.id, file);
                      e.target.value = '';
                    }}
                  />
                </div>

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

      {events.map((ev) => {
        const thumb = images.find((i) => i.event_id === ev.id && i.role === 'thumbnail');
        return (
          <div className="admin-event-row" key={ev.id}>
            <div className="admin-event-thumb">
              {thumb ? <img src={publicUrlFor(thumb.storage_path)} alt="" /> : '画像なし'}
            </div>
            <div className="admin-event-info">
              <div className="admin-event-title">{ev.title_ja}</div>
              <div className="admin-event-meta">
                {ev.place_ja} ・ {ev.date_label_ja} ・ ¥{ev.price.toLocaleString()} ・ 残り{ev.remaining}/{ev.capacity}名
              </div>
            </div>
            <div className="admin-event-actions">
              <button type="button" className="admin-button admin-button-secondary" onClick={() => startEdit(ev)}>
                編集
              </button>
              <button type="button" className="admin-button admin-button-danger" onClick={() => handleDelete(ev.id)}>
                削除
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
