import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import EventsAdmin from './EventsAdmin';
import SiteImagesAdmin from './SiteImagesAdmin';
import InquiriesAdmin from './InquiriesAdmin';
import { fetchInbox } from '../../lib/inquiriesAdmin';
import './Admin.css';

type Tab = 'events' | 'images' | 'inquiries';

export default function AdminDashboard() {
  const { session, loading, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('events');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!session) return;
    fetchInbox()
      .then((msgs) => setUnreadCount(msgs.filter((m) => m.unread).length))
      .catch(() => {});
  }, [session]);

  return (
    <div className="admin">
      <div className="admin-header">
        <div className="admin-logo">Signal. 管理画面</div>
        <div className="admin-tabs">
          <button type="button" className={`admin-tab${tab === 'events' ? ' is-active' : ''}`} onClick={() => setTab('events')}>
            イベント
          </button>
          <button type="button" className={`admin-tab${tab === 'images' ? ' is-active' : ''}`} onClick={() => setTab('images')}>
            写真
          </button>
          <button type="button" className={`admin-tab${tab === 'inquiries' ? ' is-active' : ''}`} onClick={() => setTab('inquiries')}>
            問い合わせ{unreadCount > 0 ? ` (${unreadCount})` : ''}
          </button>
        </div>
        {!loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {session ? (
              <>
                <span className="admin-muted">{session.user.email}</span>
                <button type="button" className="admin-button admin-button-secondary" onClick={() => signOut()}>
                  ログアウト
                </button>
              </>
            ) : (
              <>
                <span className="admin-error">未ログイン(保存・削除・アップロードはできません)</span>
                <Link to="/admin/login" className="admin-button">
                  ログイン
                </Link>
              </>
            )}
          </div>
        )}
      </div>
      <div className="admin-body">
        {tab === 'events' && <EventsAdmin />}
        {tab === 'images' && <SiteImagesAdmin />}
        {tab === 'inquiries' && <InquiriesAdmin onUnreadCountChange={setUnreadCount} />}
      </div>
    </div>
  );
}
