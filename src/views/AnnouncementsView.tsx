import React, { useState } from 'react';
import { Megaphone, Send, Trash2 } from 'lucide-react';
import type { Announcement } from '../types/spark';
import { useSparkAuth } from '../context/SparkAuthContext';
import { formatTimestamp } from '../lib/formatters';

interface AnnouncementsViewProps {
  announcements: Announcement[];
  loading: boolean;
  permissionLimited: boolean;
  onCreateAnnouncement: (
    title: string,
    message: string,
    audience: string,
    createdBy: string
  ) => Promise<void>;
  onDeleteAnnouncement: (id: string) => Promise<void>;
  onToast: (message: string, tone?: 'success' | 'error') => void;
}

export function AnnouncementsView({
  announcements,
  loading,
  permissionLimited,
  onCreateAnnouncement,
  onDeleteAnnouncement,
  onToast,
}: AnnouncementsViewProps) {
  const { user } = useSparkAuth();
  const [title, setTitle] = useState('');
  const [audience, setAudience] = useState('All Students');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setSubmitting(true);
    try {
      await onCreateAnnouncement(
        title.trim(),
        message.trim(),
        audience,
        user?.email || 'Admin'
      );
      setTitle('');
      setMessage('');
      onToast('Announcement published to /announcements');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to publish announcement';
      onToast(
        msg.includes('permission') || msg.includes('Missing')
          ? 'Firestore rules for /announcements are not enabled on this shared database.'
          : msg,
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: Announcement) => {
    try {
      await onDeleteAnnouncement(item.id);
      onToast('Announcement removed');
    } catch (err) {
      onToast(
        err instanceof Error ? err.message : 'Unable to delete announcement',
        'error'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-hand text-2xl sm:text-3xl font-bold text-[#121A36]">
          Campus Announcements
        </h1>
        <p className="text-sm text-slate-600 mt-0.5">
          Broadcast event updates, deadlines, and community notices to Spark students
        </p>
      </div>

      {permissionLimited && (
        <div className="bg-[#FFF0C2]/60 border border-[#FDE39A] rounded-2xl p-4 text-xs text-[#121A36]">
          Notice: The current shared <span className="font-mono">firestore.rules</span> may not
          include read/write permissions for <span className="font-mono">/announcements</span>.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <section className="xl:col-span-5 bg-white border border-[#EFE6CE] rounded-3xl p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#EAE4FF] text-[#121A36] flex items-center justify-center">
              <Megaphone className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[#121A36]">New Announcement</h2>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Tech Fest 2026 Registration Closing Soon"
                className="w-full px-3.5 py-2 text-sm bg-[#FDF9EE] border border-[#E7DFCA] rounded-xl focus:outline-none focus:bg-white focus:border-[#121A36]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Audience
              </label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#FDF9EE] border border-[#E7DFCA] rounded-xl focus:outline-none focus:bg-white focus:border-[#121A36]"
              >
                <option value="All Students">All Students</option>
                <option value="Event Registrants">Event Registrants</option>
                <option value="Club Members">Club Members</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Message *
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write the announcement details…"
                className="w-full px-3.5 py-2 text-sm bg-[#FDF9EE] border border-[#E7DFCA] rounded-xl focus:outline-none focus:bg-white focus:border-[#121A36] resize-y"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !title.trim() || !message.trim()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#121A36] hover:bg-[#1E2A54] rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Publishing…' : 'Publish Announcement'}
            </button>
          </form>
        </section>

        <section className="xl:col-span-7 bg-white border border-[#EFE6CE] rounded-3xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#EFE6CE] flex items-center justify-between">
            <h2 className="text-base font-bold text-[#121A36]">
              Published Feed ({announcements.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No announcements published yet.
            </div>
          ) : (
            <ul className="divide-y divide-[#EFE6CE]">
              {announcements.map((item) => (
                <li key={item.id} className="p-5 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#121A36]">{item.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {item.audience || 'All Students'} ·{' '}
                      <span className="font-mono tabular-nums">
                        {formatTimestamp(item.created_at, true)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700 leading-relaxed">{item.message}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDelete(item)}
                    className="p-2 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                    aria-label={`Delete ${item.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
