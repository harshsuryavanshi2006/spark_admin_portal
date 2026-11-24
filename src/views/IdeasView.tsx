import React, { useMemo, useState } from 'react';
import {
  Lightbulb,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  X,
  ArrowRight,
} from 'lucide-react';
import type {
  ClubSuggestion,
  IdeaStatus,
  StudentIdea,
  StudentProfile,
} from '../types/spark';
import { formatTimestamp } from '../lib/formatters';
import { formatFriendlyFirestoreError } from '../lib/firestoreError';

interface IdeasViewProps {
  ideas: StudentIdea[];
  clubSuggestions: ClubSuggestion[];
  profiles: StudentProfile[];
  loading: boolean;
  permissionLimited: boolean;
  onReviewIdea: (
    idea: StudentIdea,
    status: Exclude<IdeaStatus, 'pending'>,
    adminNote: string
  ) => Promise<void>;
  onOpenClubSuggestions: () => void;
  onToast: (message: string, tone?: 'success' | 'error') => void;
}

export function IdeasView({
  ideas,
  clubSuggestions,
  profiles,
  loading,
  permissionLimited,
  onReviewIdea,
  onOpenClubSuggestions,
  onToast,
}: IdeasViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | IdeaStatus>('all');
  const [reviewTarget, setReviewTarget] = useState<StudentIdea | null>(null);

  const profileMap = useMemo(() => {
    const map: Record<string, StudentProfile> = {};
    for (const p of profiles) map[p.id] = p;
    return map;
  }, [profiles]);

  const pendingClubCount = useMemo(
    () => clubSuggestions.filter((c) => c.status === 'pending').length,
    [clubSuggestions]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ideas.filter((idea) => {
      if (statusFilter !== 'all' && idea.status !== statusFilter) return false;
      if (!q) return true;
      const author =
        idea.author_name || (idea.user_id ? profileMap[idea.user_id]?.full_name : '') || '';
      return [idea.title, idea.category, idea.description, author]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [ideas, statusFilter, search, profileMap]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-hand text-2xl sm:text-3xl font-bold text-[#121A36]">
            Student Ideas
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Review campus initiatives and creative proposals submitted by students
          </p>
        </div>

        {pendingClubCount > 0 && (
          <button
            type="button"
            onClick={onOpenClubSuggestions}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#121A36] bg-[#FFE89E] hover:bg-[#FDE047] rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {pendingClubCount} Pending Club Requests
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#EFE6CE] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search idea title, category, or student…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-[#FDF9EE] border border-[#E7DFCA] rounded-xl focus:outline-none focus:bg-white focus:border-[#121A36]"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#F3EFE3] rounded-xl self-start md:self-auto">
          {(['all', 'pending', 'approved', 'declined'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === status
                  ? 'bg-white text-[#121A36] shadow-sm'
                  : 'text-slate-600 hover:text-[#121A36]'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {permissionLimited && ideas.length === 0 && (
        <div className="bg-[#FFF0C2]/60 border border-[#FDE39A] rounded-2xl p-4 text-xs text-[#121A36]">
          The shared Firestore rules do not currently expose a separate{' '}
          <span className="font-mono font-semibold">/student_ideas</span> or{' '}
          <span className="font-mono font-semibold">/ideas</span> collection for this portal.
          Club proposals remain active under Communities.
        </div>
      )}

      {/* Ideas List */}
      <div className="bg-white border border-[#EFE6CE] rounded-3xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#EAE4FF] text-[#121A36] flex items-center justify-center mx-auto">
              <Lightbulb className="w-6 h-6" />
            </div>
            <p className="mt-3 text-sm font-semibold text-[#121A36]">
              No idea submissions found
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Student ideas posted to /student_ideas or /ideas will show up here for review.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#EFE6CE]">
            {filtered.map((idea) => {
              const author =
                idea.author_name ||
                (idea.user_id ? profileMap[idea.user_id]?.full_name : undefined) ||
                idea.user_id ||
                'Student';
              return (
                <div
                  key={`${idea.source_collection}-${idea.id}`}
                  className="p-5 flex flex-col lg:flex-row lg:items-start justify-between gap-4 hover:bg-[#FDF9EE]/60 transition-colors"
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-base font-bold text-[#121A36]">{idea.title}</h2>
                      <span className="text-xs text-slate-500">
                        {idea.category || 'Campus Idea'} · By {author} ·{' '}
                        <span className="font-mono tabular-nums">
                          {formatTimestamp(idea.created_at)}
                        </span>
                      </span>
                    </div>

                    {idea.description && (
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {idea.description}
                      </p>
                    )}

                    {idea.admin_note && (
                      <div className="text-xs text-slate-600 bg-[#FDF9EE] border border-[#EFE6CE] rounded-xl px-3 py-2 mt-2">
                        <span className="font-semibold text-[#121A36]">Admin note:</span>{' '}
                        {idea.admin_note}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                        idea.status === 'approved'
                          ? 'text-emerald-700'
                          : idea.status === 'declined'
                          ? 'text-red-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {idea.status === 'approved' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : idea.status === 'declined' ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                      {idea.status.charAt(0).toUpperCase() + idea.status.slice(1)}
                    </span>

                    <button
                      type="button"
                      onClick={() => setReviewTarget(idea)}
                      className="px-4 py-2 text-xs font-semibold text-[#121A36] bg-[#FFE89E] hover:bg-[#FDE047] rounded-full transition-colors cursor-pointer"
                    >
                      {idea.status === 'pending' ? 'Review' : 'Update'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {reviewTarget && (
        <ReviewIdeaModal
          idea={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSubmit={async (status, note) => {
            await onReviewIdea(reviewTarget, status, note);
            onToast(
              `${status === 'approved' ? 'Approved' : 'Declined'} idea "${reviewTarget.title}"`
            );
            setReviewTarget(null);
          }}
          onError={(msg) => onToast(msg, 'error')}
        />
      )}
    </div>
  );
}

function ReviewIdeaModal({
  idea,
  onClose,
  onSubmit,
  onError,
}: {
  idea: StudentIdea;
  onClose: () => void;
  onSubmit: (status: Exclude<IdeaStatus, 'pending'>, note: string) => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [decision, setDecision] = useState<Exclude<IdeaStatus, 'pending'>>(
    idea.status === 'declined' ? 'declined' : 'approved'
  );
  const [adminNote, setAdminNote] = useState(idea.admin_note || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit(decision, adminNote);
    } catch (err) {
      const msg = formatFriendlyFirestoreError(err);
      setError(msg);
      onError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#121A36]/45 backdrop-blur-[1px]">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#121A36]">Review Student Idea</h2>
            <p className="text-xs text-slate-500 mt-0.5">{idea.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 leading-relaxed">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDecision('approved')}
              className={`py-2.5 px-4 text-sm font-semibold rounded-xl border transition-colors cursor-pointer ${
                decision === 'approved'
                  ? 'bg-emerald-700 border-emerald-700 text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Approve Idea
            </button>
            <button
              type="button"
              onClick={() => setDecision('declined')}
              className={`py-2.5 px-4 text-sm font-semibold rounded-xl border transition-colors cursor-pointer ${
                decision === 'declined'
                  ? 'bg-red-700 border-red-700 text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Decline Idea
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Admin Note
            </label>
            <textarea
              rows={3}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Share feedback with the student…"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#121A36]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold text-[#121A36] bg-[#FFE89E] hover:bg-[#FDE047] rounded-xl cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Decision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
