import { useEffect, useState } from 'react';
import type { DbSiteImage } from '../../types/db';
import { fetchSiteImageRows, setSiteImage, clearSiteImage } from '../../lib/siteImagesAdmin';
import { fetchSiteSettings, setSiteSetting, DEFAULT_INQUIRY_EMAIL } from '../../lib/siteSettings';
import { publicUrlFor } from '../../lib/storage';
import './Admin.css';

const HERO_SLOTS = ['hero-main-0', 'hero-main-1', 'hero-main-2', 'hero-main-3', 'hero-main-4'];
const JOURNEY_SLOTS = ['flow-image-0', 'flow-image-1', 'flow-image-2', 'flow-image-3', 'flow-image-4'];

const JOURNEY_LABELS = ['① 到着', '② 手放す', '③ 好きなように', '④ 手紙を書く', '⑤ 帰還'];

function Slot({ slot, label, row, onChanged }: { slot: string; label: string; row?: DbSiteImage; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);

  async function handleUpload(file: File) {
    setBusy(true);
    try {
      await setSiteImage(slot, file, row);
      onChanged();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleClear() {
    if (!row) return;
    if (!confirm('この画像を既定(元の写真)に戻しますか?')) return;
    setBusy(true);
    try {
      await clearSiteImage(row);
      onChanged();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-image-slot">
      <label className="admin-muted">{label}</label>
      <div className="admin-image-slot-preview">
        {row ? <img src={publicUrlFor(row.storage_path)} alt="" /> : '既定の写真を使用中'}
      </div>
      <input
        type="file"
        accept="image/*"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = '';
        }}
      />
      {row && (
        <button type="button" className="admin-button admin-button-secondary" onClick={handleClear} disabled={busy}>
          既定に戻す
        </button>
      )}
    </div>
  );
}

export default function SiteImagesAdmin() {
  const [rows, setRows] = useState<DbSiteImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inquiryEmail, setInquiryEmail] = useState(DEFAULT_INQUIRY_EMAIL);
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      setRows(await fetchSiteImageRows());
      const settings = await fetchSiteSettings();
      if (settings.inquiry_email) setInquiryEmail(settings.inquiry_email);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleSaveInquiryEmail() {
    setSavingEmail(true);
    setEmailSaved(false);
    try {
      await setSiteSetting('inquiry_email', inquiryEmail.trim());
      setEmailSaved(true);
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingEmail(false);
    }
  }

  const rowFor = (slot: string) => rows.find((r) => r.slot === slot);

  return (
    <div>
      <div className="admin-section-title">サイトの写真</div>
      <p className="admin-muted" style={{ marginBottom: 20 }}>
        アップロードしなければ、元々入っている写真がそのまま表示されます。差し替えたいものだけアップロードしてください。
      </p>

      {loading && <div className="admin-empty">読み込み中…</div>}
      {error && <div className="admin-error">{error}</div>}

      {!loading && !error && (
        <div className="admin-card">
          <div className="admin-section-title" style={{ fontSize: 16 }}>
            問い合わせ用メールアドレス
          </div>
          <p className="admin-muted" style={{ marginTop: -8, marginBottom: 12 }}>
            申し込み完了画面に「メールが届かない場合はこちらへ」として表示されます。
          </p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="admin-field" style={{ flex: 1, minWidth: 240 }}>
              <input
                type="email"
                value={inquiryEmail}
                onChange={(e) => {
                  setInquiryEmail(e.target.value);
                  setEmailSaved(false);
                }}
              />
            </div>
            <button type="button" className="admin-button" onClick={handleSaveInquiryEmail} disabled={savingEmail}>
              {savingEmail ? '保存中…' : '保存'}
            </button>
            {emailSaved && <span className="admin-muted">保存しました</span>}
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="admin-card">
            <div className="admin-section-title" style={{ fontSize: 16 }}>
              ヒーロー(トップの大きい写真、5枚を順番に表示)
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {HERO_SLOTS.map((slot, i) => (
                <Slot key={slot} slot={slot} label={`${i + 1}枚目`} row={rowFor(slot)} onChanged={reload} />
              ))}
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-section-title" style={{ fontSize: 16 }}>
              体験の流れ(各ステップの写真)
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {JOURNEY_SLOTS.map((slot, i) => (
                <Slot key={slot} slot={slot} label={JOURNEY_LABELS[i]} row={rowFor(slot)} onChanged={reload} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
