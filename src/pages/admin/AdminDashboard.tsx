import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import EventsAdmin from './EventsAdmin';
import ApplicationsAdmin from './ApplicationsAdmin';
import SiteImagesAdmin from './SiteImagesAdmin';
import './Admin.css';

type Tab = 'events' | 'applications' | 'images';

export default function AdminDashboard() {
  const { session, loading, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('events');
  const [applicationsEventFilter, setApplicationsEventFilter] = useState('');

  function viewApplicationsFor(eventId: string) {
    setApplicationsEventFilter(eventId);
    setTab('applications');
  }

  return (
    <div className="admin">
      <div className="admin-header">
        <div className="admin-logo">Signal. 管理画面</div>
        <div className="admin-tabs">
          <button type="button" className={`admin-tab${tab === 'events' ? ' is-active' : ''}`} onClick={() => setTab('events')}>
            イベント
          </button>
          <button
            type="button"
            className={`admin-tab${tab === 'applications' ? ' is-active' : ''}`}
            onClick={() => setTab('applications')}
          >
            申し込み
          </button>
          <button type="button" className={`admin-tab${tab === 'images' ? ' is-active' : ''}`} onClick={() => setTab('images')}>
            写真
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
        {tab === 'events' && <EventsAdmin onViewApplications={viewApplicationsFor} />}
        {tab === 'applications' && (
          <ApplicationsAdmin eventFilter={applicationsEventFilter} onEventFilterChange={setApplicationsEventFilter} />
        )}
        {tab === 'images' && <SiteImagesAdmin />}
      </div>
    </div>
  );
}
