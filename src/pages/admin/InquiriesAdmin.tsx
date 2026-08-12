import { useEffect, useState } from 'react';
import { fetchInbox, fetchThread, sendReply, type InboxMessage, type ThreadMessage } from '../../lib/inquiriesAdmin';
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
  const [replyDraft, setReplyDraft] = useState('');
  const [sending, setSending] = useState(false);

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
    setReplyDraft('');
    try {
      const msgs = await fetchThread(msg.threadId);
      setThread(msgs);
      const remainingUnread = (messages ?? []).filter((m) => m.threadId !== msg.threadId && m.unread).length;
      setMessages((prev) => prev?.map((m) => (m.threadId === msg.threadId ? { ...m, unread: false } : m)) ?? prev);
      onUnreadCountChange?.(remainingUnread);
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setThreadLoading(false);
    }
  }

  async function handleSendReply() {
    if (!selectedThreadId || !thread || thread.length === 0 || !replyDraft.trim()) return;
    const last = thread[thread.length - 1];
    const { email } = parseFromHeader(last.from);
    setSending(true);
    try {
      await sendReply({
        threadId: selectedThreadId,
        to: email,
        subject: last.subject,
        body: replyDraft.trim(),
        inReplyTo: last.messageIdHeader,
      });
      setReplyDraft('');
      setThread(await fetchThread(selectedThreadId));
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
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

            <div className="admin-card">
              <div className="admin-section-title" style={{ fontSize: 14 }}>
                返信する
              </div>
              <div className="admin-field" style={{ marginBottom: 12 }}>
                <textarea
                  style={{ minHeight: 120, width: '100%', boxSizing: 'border-box' }}
                  placeholder="返信内容を入力…"
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="admin-button"
                disabled={sending || !replyDraft.trim()}
                onClick={handleSendReply}
              >
                {sending ? '送信中…' : '返信を送信'}
              </button>
            </div>
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
