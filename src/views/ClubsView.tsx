import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Search,
  Users,
  X,
} from 'lucide-react';
import type {
  Club,
  ClubMembership,
  ClubSuggestion,
  StudentProfile,
  SuggestionStatus,
} from '../types/spark';
import { formatTimestamp, getInitials } from '../lib/formatters';
import { formatFriendlyFirestoreError } from '../lib/firestoreError';

interface ClubsViewProps {
  clubs: Club[];
  clubMemberships: ClubMembership[];
  suggestions: ClubSuggestion[];
  profiles: StudentProfile[];
  loading: boolean;
  onReviewSuggestion: (
    suggestion: ClubSuggestion,
    status: Exclude<SuggestionStatus, 'pending'>,
    adminNote: string,
    createClubIfApproved: boolean
  ) => Promise<void>;
  onCreateClub: (name: string) => Promise<void>;
  onToast: (message: string, tone?: 'success' | 'error') => void;
}

export function ClubsView({
  clubs,
  clubMemberships,
  suggestions,
  profiles,
  loading,
  onReviewSuggestion,
  onCreateClub,
  onToast,
}: ClubsViewProps) {
  const [subTab, setSubTab] = useState<'clubs' | 'suggestions'>('clubs');
  const [search, setSearch] = useState('');
  const [suggestionFilter, setSuggestionFilter] = useState<'all' | SuggestionStatus>('all');
  const [rosterClub, setRosterClub] = useState<Club | null>(null);
  const [reviewTarget, setReviewTarget] = useState<ClubSuggestion | null>(null);
  const [newClubOpen, setNewClubOpen] = useState(false);

  const profileMap = useMemo(() => {
    const map: Record<string, StudentProfile> = {};
    for (const p of profiles) map[p.id] = p;
    return map;
  }, [profiles]);

  const membershipsByClub = useMemo(() => {
    const map: Record<string, ClubMembership[]> = {};
    for (const m of clubMemberships) {
      if (!map[m.club_id]) map[m.club_id] = [];
      map[m.club_id].push(m);
    }
    return map;
  }, [clubMemberships]);

  const pendingCount = useMemo(
    () => suggestions.filter((s) => s.status === 'pending').length,
    [suggestions]
  );

  const filteredClubs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clubs;
    return clubs.filter((c) => c.name.toLowerCase().includes(q));
  }, [clubs, search]);

  const filteredSuggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return suggestions.filter((s) => {
      if (suggestionFilter !== 'all' && s.status !== suggestionFilter) return false;
      if (!q) return true;
      const proposer = profileMap[s.user_id];
      const text = [s.club_name, s.category, s.reason, proposer?.full_name, s.user_id]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return text.includes(q);
    });
  }, [suggestions, suggestionFilter, search, profileMap]);

  const rosterMembers = useMemo(() => {
    if (!rosterClub) return [];
    const list = membershipsByClub[rosterClub.id] || [];
    return list.map((m) => ({
      membership: m,
      profile: profileMap[m.user_id] || null,
    }));
  }, [rosterClub, membershipsByClub, profileMap]);

  return (
    <div className="space-y-5">
      {/* Sub-navigation & Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setSubTab('clubs')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                subTab === 'clubs'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active Clubs ({clubs.length})
            </button>
            <button
              type="button"
              onClick={() => setSubTab('suggestions')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                subTab === 'suggestions'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Club Suggestions ({pendingCount} pending)
            </button>
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                subTab === 'clubs' ? 'Search clubs…' : 'Search club name, category, proposer…'
              }
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-600"
            />
          </div>
        </div>

        {subTab === 'clubs' ? (
          <button
            type="button"
            onClick={() => setNewClubOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Club
          </button>
        ) : (
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start lg:self-auto">
            {(['all', 'pending', 'approved', 'declined'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSuggestionFilter(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  suggestionFilter === status
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {subTab === 'clubs' ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredClubs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm font-semibold text-slate-900">No clubs found</p>
              <p className="mt-1 text-xs text-slate-500">
                Create a club directly or approve student club suggestions.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                    <th className="py-3 px-5">Club Name</th>
                    <th className="py-3 px-4">Club ID</th>
                    <th className="py-3 px-4 text-right">Reported Count</th>
                    <th className="py-3 px-4 text-right">Roster Records</th>
                    <th className="py-3 px-5 text-right">Roster</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {filteredClubs.map((club) => {
                    const syncedMembers = membershipsByClub[club.id]?.length || 0;
                    return (
                      <tr key={club.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-5 font-semibold text-slate-900">{club.name}</td>
                        <td className="py-3.5 px-4 text-xs font-mono text-slate-500">{club.id}</td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                          {club.member_count ?? 0}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                          {syncedMembers}
                        </td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setRosterClub(club)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Users className="w-3.5 h-3.5" />
                            View Roster
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredSuggestions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm font-semibold text-slate-900">No club suggestions found</p>
              <p className="mt-1 text-xs text-slate-500">
                Student proposals submitted from Spark will appear here for review.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredSuggestions.map((s) => {
                const proposer = profileMap[s.user_id];
                const proposerLabel =
                  proposer?.full_name ||
                  (proposer?.username ? `@${proposer.username}` : s.user_id || 'Student');

                return (
                  <div
                    key={s.id}
                    className="p-5 flex flex-col lg:flex-row lg:items-start justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <h3 className="text-base font-semibold text-slate-900">{s.club_name}</h3>
                        <span className="text-xs text-slate-500">
                          {s.category || 'General'} · Proposed by {proposerLabel} ·{' '}
                          <span className="font-mono tabular-nums">
                            {formatTimestamp(s.created_at)}
                          </span>
                        </span>
                      </div>

                      {s.reason && (
                        <p className="text-sm text-slate-700 leading-relaxed">{s.reason}</p>
                      )}

                      {s.admin_note && (
                        <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mt-2">
                          <span className="font-semibold text-slate-800">Admin note:</span>{' '}
                          {s.admin_note}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                          s.status === 'approved'
                            ? 'text-emerald-700'
                            : s.status === 'declined'
                            ? 'text-red-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {s.status === 'approved' ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : s.status === 'declined' ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                        {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                      </span>

                      <button
                        type="button"
                        onClick={() => setReviewTarget(s)}
                        className="px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                      >
                        {s.status === 'pending' ? 'Review' : 'Update Decision'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Club Roster Drawer */}
      {rosterClub && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-[1px]">
          <div className="w-full max-w-md bg-white h-full border-l border-slate-200 shadow-xl flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">{rosterClub.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
                  {rosterMembers.length} membership records · {rosterClub.member_count ?? 0}{' '}
                  reported count
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRosterClub(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                aria-label="Close roster"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {rosterMembers.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  No student memberships found in /club_memberships for this club yet.
                </div>
              ) : (
                <ul className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                  {rosterMembers.map(({ membership, profile }) => {
                    const name =
                      profile?.full_name ||
                      (profile?.username ? `@${profile.username}` : membership.user_id);
                    const sub = [
                      profile?.department,
                      profile?.year ? `Yr ${profile.year}` : '',
                      profile?.division ? `Div ${profile.division}` : '',
                    ]
                      .filter(Boolean)
                      .join(' · ');
                    return (
                      <li
                        key={membership.id}
                        className="px-4 py-3 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center shrink-0">
                            {getInitials(name)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-slate-900 truncate">
                              {name}
                            </div>
                            <div className="text-xs text-slate-500 truncate">
                              {sub || membership.user_id}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-mono tabular-nums text-slate-500 shrink-0">
                          {formatTimestamp(membership.created_at)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review Suggestion Modal */}
      {reviewTarget && (
        <ReviewSuggestionModal
          suggestion={reviewTarget}
          alreadyClubExists={clubs.some(
            (c) => c.name.trim().toLowerCase() === reviewTarget.club_name.trim().toLowerCase()
          )}
          onClose={() => setReviewTarget(null)}
          onSubmit={async (status, adminNote, createClubIfApproved) => {
            await onReviewSuggestion(reviewTarget, status, adminNote, createClubIfApproved);
            onToast(
              `${status === 'approved' ? 'Approved' : 'Declined'} suggestion "${
                reviewTarget.club_name
              }"`
            );
            setReviewTarget(null);
          }}
          onError={(msg) => onToast(msg, 'error')}
        />
      )}

      {/* New Club Modal */}
      {newClubOpen && (
        <NewClubModal
          onClose={() => setNewClubOpen(false)}
          onCreate={async (name) => {
            await onCreateClub(name);
            onToast(`Created club "${name}"`);
            setNewClubOpen(false);
          }}
          onError={(msg) => onToast(msg, 'error')}
        />
      )}
    </div>
  );
}

function ReviewSuggestionModal({
  suggestion,
  alreadyClubExists,
  onClose,
  onSubmit,
  onError,
}: {
  suggestion: ClubSuggestion;
  alreadyClubExists: boolean;
  onClose: () => void;
  onSubmit: (
    status: Exclude<SuggestionStatus, 'pending'>,
    adminNote: string,
    createClubIfApproved: boolean
  ) => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [decision, setDecision] = useState<Exclude<SuggestionStatus, 'pending'>>(
    suggestion.status === 'declined' ? 'declined' : 'approved'
  );
  const [adminNote, setAdminNote] = useState(suggestion.admin_note || '');
  const [createClub, setCreateClub] = useState(!alreadyClubExists);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit(decision, adminNote, decision === 'approved' && createClub);
    } catch (err) {
      const msg = formatFriendlyFirestoreError(err);
      setError(msg);
      onError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-[1px]">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Review Club Suggestion</h2>
            <p className="text-xs text-slate-500 mt-0.5">{suggestion.club_name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 leading-relaxed">
              {error}
            </div>
          )}

          {suggestion.reason && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed">
              <span className="font-semibold text-slate-900">Student reason:</span>{' '}
              {suggestion.reason}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">Decision</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecision('approved')}
                className={`py-2.5 px-4 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
                  decision === 'approved'
                    ? 'bg-emerald-700 border-emerald-700 text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => setDecision('declined')}
                className={`py-2.5 px-4 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
                  decision === 'declined'
                    ? 'bg-red-700 border-red-700 text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Decline
              </button>
            </div>
          </div>

          {decision === 'approved' && !alreadyClubExists && (
            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={createClub}
                onChange={(e) => setCreateClub(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
              />
              Also add &ldquo;{suggestion.club_name}&rdquo; to active /clubs directory
            </label>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Admin Note (visible to student)
            </label>
            <textarea
              rows={3}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Provide approval guidance or feedback for declining…"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 resize-y"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg cursor-pointer disabled:opacity-50 ${
                decision === 'approved'
                  ? 'bg-emerald-700 hover:bg-emerald-800'
                  : 'bg-red-700 hover:bg-red-800'
              }`}
            >
              {saving
                ? 'Saving…'
                : decision === 'approved'
                ? 'Confirm Approval'
                : 'Confirm Decline'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NewClubModal({
  onClose,
  onCreate,
  onError,
}: {
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onCreate(name.trim());
    } catch (err) {
      const msg = formatFriendlyFirestoreError(err);
      setError(msg);
      onError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-[1px]">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Add Active Club</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 leading-relaxed">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Club Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Robotics & Autonomous Systems Club"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create Club'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
