import { useEffect, useState } from 'react';
import { fetchInbox, fetchThread, type InboxMessage, type ThreadMessage } from '../../lib/inquiriesAdmin';
import './Admin.css';

function parseFromHeader(from: string): { name: string; email: string } {
  const match = from.match(/^(.*?)<(.+)>$/);
  if (match) return { name: match[1].trim().replace(/^"|"$/g, ''), email: match[2].trim() };
  return { name: from, email: from };
}

interface InquiriesAdminProps {
  onUnreadCountChange?: (count: number) => void;
}

export default function InquiriesAdmin({ onUnreadCountChange }: InquiriesAdminProps) {
  const [messages, setMessages] = useState<InboxMessage[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [thread, setThread] = useState<ThreadMessage[] | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const msgs = await fetchInbox();
      setMessages(msgs);
      onUnreadCountChange?.(msgs.filter((m) => m.unread).length);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openThread(msg: InboxMessage) {
    setSelectedThreadId(msg.threadId);
    setThread(null);
    setThreadLoading(true);
    try {
      setThread(await fetchThread(msg.threadId));
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setThreadLoading(false);
    }
  }

  if (selectedThreadId) {
    return (
      <div>
        <button
          type="button"
          className="admin-button admin-button-secondary"
          style={{ marginBottom: 16 }}
          onClick={() => {
            setSelectedThreadId(null);
            setThread(null);
          }}
        >
          ← 一覧に戻る
        </button>

        {threadLoading || !thread ? (
          <div className="admin-empty">読み込み中…</div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
              {thread.map((m) => (
                <div
                  key={m.id}
                  className="admin-card"
                  style={{
                    marginLeft: m.fromUs ? 40 : 0,
                    marginRight: m.fromUs ? 0 : 40,
                    background: m.fromUs ? '#f3ede0' : '#fff',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong>{m.fromUs ? '自分(返信)' : parseFromHeader(m.from).name || m.from}</strong>
                    <span className="admin-muted" style={{ fontSize: 12 }}>
                      {m.date}
                    </span>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.7 }}>{m.body}</div>
                </div>
              ))}
            </div>

            <a
              href="https://mail.google.com/mail/u/0/#all"
              target="_blank"
              rel="noreferrer"
              className="admin-button"
              style={{ display: 'inline-block', textDecoration: 'none' }}
            >
              Gmailで開いて返信する
            </a>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="admin-section-title" style={{ marginBottom: 0 }}>
          問い合わせ(signal@s-stylegolf.com)
        </div>
        <button type="button" className="admin-button admin-button-secondary" onClick={reload} disabled={loading}>
          {loading ? '更新中…' : '更新'}
        </button>
      </div>

      {loading && <div className="admin-empty">読み込み中…</div>}
      {error && <div className="admin-error">{error}</div>}

      {!loading && !error && messages && (
        messages.length === 0 ? (
          <div className="admin-empty">メールはまだありません。</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th></th>
                  <th>差出人</th>
                  <th>件名</th>
                  <th>プレビュー</th>
                  <th>日時</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((m) => (
                  <tr
                    key={m.id}
                    style={{ cursor: 'pointer', fontWeight: m.unread ? 700 : 400 }}
                    onClick={() => openThread(m)}
                  >
                    <td>{m.unread ? '●' : ''}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{parseFromHeader(m.from).name || m.from}</td>
                    <td>{m.subject}</td>
                    <td className="admin-muted" style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.snippet}
                    </td>
                    <td className="admin-muted" style={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                      {m.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
