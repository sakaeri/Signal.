import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import EventsAdmin from './EventsAdmin';
import ApplicationsAdmin from './ApplicationsAdmin';
import SiteImagesAdmin from './SiteImagesAdmin';
import './Admin.css';

type Tab = 'events' | 'applications' | 'images';

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('events');

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
        <button type="button" className="admin-button admin-button-secondary" onClick={() => signOut()}>
          ログアウト
        </button>
      </div>
      <div className="admin-body">
        {tab === 'events' && <EventsAdmin />}
        {tab === 'applications' && <ApplicationsAdmin />}
        {tab === 'images' && <SiteImagesAdmin />}
      </div>
    </div>
  );
}
