import React, { useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Users, X } from 'lucide-react';
import type { EventRegistration, EventStatus, SparkEvent } from '../types/spark';
import type { EventFormInput } from '../hooks/useSparkData';
import { normalizeTags } from '../lib/formatters';
import { formatFriendlyFirestoreError } from '../lib/firestoreError';
import { SafeImage } from '../components/SafeImage';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface EventsViewProps {
  events: SparkEvent[];
  registrations: EventRegistration[];
  loading: boolean;
  onCreateEvent: (input: EventFormInput) => Promise<string>;
  onUpdateEvent: (id: string, input: Partial<EventFormInput>) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
  onViewRegistrations: (eventId: string) => void;
  onToast: (message: string, tone?: 'success' | 'error') => void;
  createOpenExternal?: boolean;
  onCloseCreateExternal?: () => void;
}

const EMPTY_FORM: EventFormInput = {
  title: '',
  tag: '',
  status: 'upcoming',
  date: '',
  time: '',
  place: '',
  tags: [],
  image: '',
  description: '',
  registration_open: true,
};

export function EventsView({
  events,
  registrations,
  loading,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
  onViewRegistrations,
  onToast,
  createOpenExternal = false,
  onCloseCreateExternal,
}: EventsViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | EventStatus>('all');
  const [regFilter, setRegFilter] = useState<'all' | 'open' | 'closed'>('all');

  const [editingEvent, setEditingEvent] = useState<SparkEvent | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SparkEvent | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const modalOpen = isCreating || createOpenExternal || Boolean(editingEvent);

  const regCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of registrations) {
      map[r.event_id] = (map[r.event_id] || 0) + 1;
    }
    return map;
  }, [registrations]);

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((ev) => {
      if (statusFilter !== 'all' && ev.status !== statusFilter) return false;
      if (regFilter === 'open' && !ev.registration_open) return false;
      if (regFilter === 'closed' && ev.registration_open) return false;
      if (!q) return true;
      const tagsText = normalizeTags(ev.tags).join(' ').toLowerCase();
      return (
        ev.title.toLowerCase().includes(q) ||
        ev.tag.toLowerCase().includes(q) ||
        ev.place.toLowerCase().includes(q) ||
        tagsText.includes(q)
      );
    });
  }, [events, search, statusFilter, regFilter]);

  const handleCloseModal = () => {
    setIsCreating(false);
    setEditingEvent(null);
    onCloseCreateExternal?.();
  };

  const handleToggleRegistration = async (ev: SparkEvent) => {
    setBusyId(ev.id);
    try {
      await onUpdateEvent(ev.id, { registration_open: !ev.registration_open });
      onToast(
        !ev.registration_open
          ? `Opened registration for "${ev.title}"`
          : `Closed registration for "${ev.title}"`
      );
    } catch (err) {
      onToast(formatFriendlyFirestoreError(err), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleStatusChange = async (ev: SparkEvent, nextStatus: EventStatus) => {
    setBusyId(ev.id);
    try {
      await onUpdateEvent(ev.id, { status: nextStatus });
      onToast(`Updated "${ev.title}" status to ${nextStatus}`);
    } catch (err) {
      onToast(formatFriendlyFirestoreError(err), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await onDeleteEvent(deleteTarget.id);
      onToast(`Deleted event "${deleteTarget.title}"`);
      setDeleteTarget(null);
    } catch (err) {
      onToast(formatFriendlyFirestoreError(err), 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, tag, or venue…"
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-600"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['all', 'upcoming', 'ongoing', 'past'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  statusFilter === status
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status === 'all'
                  ? 'All'
                  : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          <select
            value={regFilter}
            onChange={(e) => setRegFilter(e.target.value as 'all' | 'open' | 'closed')}
            aria-label="Filter by registration state"
            className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="all">All Registration States</option>
            <option value="open">Registration Open</option>
            <option value="closed">Registration Closed</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Event
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-slate-900">
              {events.length === 0 ? 'No events created yet' : 'No events match your filters'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {events.length === 0
                ? 'Publish your first campus event to make it visible to students.'
                : 'Try adjusting your search query or status filter.'}
            </p>
            {events.length === 0 && (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Create First Event
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-3 px-5">Event</th>
                  <th className="py-3 px-4">Schedule &amp; Venue</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registration</th>
                  <th className="py-3 px-4 text-right">Sign-ups</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredEvents.map((ev) => {
                  const tags = normalizeTags(ev.tags);
                  const regCount = regCounts[ev.id] || 0;
                  const isBusy = busyId === ev.id;
                  return (
                    <tr key={ev.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3 min-w-[240px]">
                          <SafeImage
                            src={ev.image}
                            alt={ev.title}
                            className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 truncate max-w-xs">
                              {ev.title}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">
                              {ev.tag}
                              {tags.length > 0 ? ` · ${tags.slice(0, 3).join(', ')}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-xs font-mono tabular-nums text-slate-900">
                          {ev.date || 'Date TBD'}
                          {ev.time ? ` · ${ev.time}` : ''}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[180px]">
                          {ev.place || 'Venue TBD'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={ev.status}
                          disabled={isBusy}
                          onChange={(e) =>
                            void handleStatusChange(ev, e.target.value as EventStatus)
                          }
                          aria-label={`Change status for ${ev.title}`}
                          className={`px-2.5 py-1.5 text-xs font-medium rounded-md border focus:outline-none cursor-pointer ${
                            ev.status === 'upcoming'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : ev.status === 'ongoing'
                              ? 'bg-amber-50 border-amber-200 text-amber-800'
                              : 'bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          <option value="upcoming">Upcoming</option>
                          <option value="ongoing">Ongoing</option>
                          <option value="past">Past</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleToggleRegistration(ev)}
                          className="inline-flex items-center gap-2.5 text-xs font-medium cursor-pointer disabled:opacity-50"
                          aria-pressed={ev.registration_open}
                        >
                          <span
                            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${
                              ev.registration_open ? 'bg-blue-700' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                                ev.registration_open ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </span>
                          <span
                            className={
                              ev.registration_open ? 'text-slate-900' : 'text-slate-500'
                            }
                          >
                            {ev.registration_open ? 'Open' : 'Closed'}
                          </span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onViewRegistrations(ev.id)}
                          className="inline-flex items-center gap-1.5 font-mono tabular-nums text-xs font-medium text-blue-700 hover:underline cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5" />
                          {regCount}
                        </button>
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingEvent(ev)}
                            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            aria-label={`Edit ${ev.title}`}
                            title="Edit Event"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(ev)}
                            className="p-2 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            aria-label={`Delete ${ev.title}`}
                            title="Delete Event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <EventEditorModal
          initialEvent={editingEvent}
          onClose={handleCloseModal}
          onSave={async (input) => {
            if (editingEvent) {
              await onUpdateEvent(editingEvent.id, input);
              onToast(`Saved changes to "${input.title}"`);
            } else {
              await onCreateEvent(input);
              onToast(`Created event "${input.title}"`);
            }
            handleCloseModal();
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Event"
        description={
          deleteTarget
            ? `Permanently delete "${deleteTarget.title}" from /events? Existing registration documents referencing its ID will remain unless removed separately.`
            : ''
        }
        confirmLabel="Delete Event"
        destructive
        busy={Boolean(busyId)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  );
}

interface EventEditorModalProps {
  initialEvent: SparkEvent | null;
  onClose: () => void;
  onSave: (input: EventFormInput) => Promise<void>;
}

function EventEditorModal({ initialEvent, onClose, onSave }: EventEditorModalProps) {
  const [title, setTitle] = useState(initialEvent?.title ?? EMPTY_FORM.title);
  const [tag, setTag] = useState(initialEvent?.tag ?? EMPTY_FORM.tag);
  const [status, setStatus] = useState<EventStatus>(initialEvent?.status ?? EMPTY_FORM.status);
  const [date, setDate] = useState(initialEvent?.date ?? EMPTY_FORM.date);
  const [time, setTime] = useState(initialEvent?.time ?? EMPTY_FORM.time);
  const [place, setPlace] = useState(initialEvent?.place ?? EMPTY_FORM.place);
  const [tagsRaw, setTagsRaw] = useState(
    initialEvent ? normalizeTags(initialEvent.tags).join(', ') : ''
  );
  const [image, setImage] = useState(initialEvent?.image ?? EMPTY_FORM.image);
  const [description, setDescription] = useState(
    initialEvent?.description ?? EMPTY_FORM.description
  );
  const [registrationOpen, setRegistrationOpen] = useState(
    initialEvent?.registration_open ?? EMPTY_FORM.registration_open
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Event title is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        title: title.trim(),
        tag: tag.trim() || 'Campus Event',
        status,
        date: date.trim(),
        time: time.trim(),
        place: place.trim(),
        tags: normalizeTags(tagsRaw),
        image: image.trim(),
        description: description.trim(),
        registration_open: registrationOpen,
      });
    } catch (err) {
      setError(formatFriendlyFirestoreError(err));
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-[1px]">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-2xl max-h-[90vh] bg-white border border-slate-200 rounded-xl shadow-xl flex flex-col overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {initialEvent ? 'Edit Event' : 'Create New Event'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Changes sync immediately to the shared student /events feed
            </p>
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

        <form onSubmit={(e) => void handleSubmit(e)} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Event Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Spark Hackathon 2026"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Primary Category Tag
              </label>
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="e.g., Technical, Cultural, Sports"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatus)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              >
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="past">Past</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Date</label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="e.g., 2026-12-10 or Dec 10, 2026"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Time</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g., 10:00 AM - 4:00 PM"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Venue / Place
              </label>
              <input
                type="text"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="e.g., Main Auditorium, Block B"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tagsRaw}
                onChange={(e) => setTagsRaw(e.target.value)}
                placeholder="e.g., AI, Coding, Team Event"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Cover Image URL
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                />
                <SafeImage
                  src={image}
                  alt="Cover preview"
                  className="w-12 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Description
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe event agenda, eligibility, and rules…"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 resize-y"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="inline-flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={registrationOpen}
                  onChange={(e) => setRegistrationOpen(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                />
                <span className="text-sm font-medium text-slate-800">
                  Accepting student registrations (registration_open)
                </span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving…' : initialEvent ? 'Save Changes' : 'Publish Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
