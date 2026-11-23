import { useMemo, useState } from 'react';
import { Download, Search, Eye, X, Check, Clock, UserX } from 'lucide-react';
import type {
  AttendanceStatus,
  EventRegistration,
  SparkEvent,
  StudentProfile,
} from '../types/spark';
import { downloadCsv, formatTimestamp } from '../lib/formatters';

interface RegistrationsViewProps {
  events: SparkEvent[];
  registrations: EventRegistration[];
  profiles: StudentProfile[];
  loading: boolean;
  selectedEventId: string;
  onSelectEventId: (eventId: string) => void;
  onUpdateAttendance: (regId: string, status: AttendanceStatus) => Promise<void>;
  onToast: (message: string, tone?: 'success' | 'error') => void;
}

export function RegistrationsView({
  events,
  registrations,
  profiles,
  loading,
  selectedEventId,
  onSelectEventId,
  onUpdateAttendance,
  onToast,
}: RegistrationsViewProps) {
  const [search, setSearch] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | AttendanceStatus>('all');
  const [detailReg, setDetailReg] = useState<EventRegistration | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const eventMap = useMemo(() => {
    const map: Record<string, SparkEvent> = {};
    for (const ev of events) map[ev.id] = ev;
    return map;
  }, [events]);

  const profileMap = useMemo(() => {
    const map: Record<string, StudentProfile> = {};
    for (const p of profiles) map[p.id] = p;
    return map;
  }, [profiles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return registrations.filter((reg) => {
      if (selectedEventId !== 'all' && reg.event_id !== selectedEventId) return false;
      if (attendanceFilter !== 'all' && reg.attendance_status !== attendanceFilter) return false;
      if (!q) return true;
      const profile = profileMap[reg.user_id];
      const d = reg.student_details || {};
      const ev = eventMap[reg.event_id];
      const haystack = [
        d.full_name,
        d.college,
        d.division,
        d.batch,
        d.year,
        d.phone,
        reg.user_id,
        profile?.username,
        ev?.title,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [registrations, selectedEventId, attendanceFilter, search, profileMap, eventMap]);

  const summary = useMemo(() => {
    let attended = 0;
    let registered = 0;
    let absent = 0;
    for (const r of filtered) {
      if (r.attendance_status === 'attended') attended++;
      else if (r.attendance_status === 'absent') absent++;
      else registered++;
    }
    return { total: filtered.length, attended, registered, absent };
  }, [filtered]);

  const handleMarkAttendance = async (reg: EventRegistration, next: AttendanceStatus) => {
    if (reg.attendance_status === next) return;
    setBusyId(reg.id);
    try {
      await onUpdateAttendance(reg.id, next);
      if (detailReg?.id === reg.id) {
        setDetailReg({ ...detailReg, attendance_status: next });
      }
      const name = reg.student_details?.full_name || 'Student';
      onToast(`Marked ${name} as ${next}`);
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Failed to update attendance', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'Registration ID',
      'Event ID',
      'Event Title',
      'User ID',
      'Full Name',
      'College',
      'Year',
      'Division',
      'Batch',
      'Phone',
      'Date of Birth',
      'Terms Accepted',
      'Attendance Status',
      'Registered At',
    ];
    const rows = filtered.map((reg) => {
      const d = reg.student_details || {};
      const profile = profileMap[reg.user_id];
      const ev = eventMap[reg.event_id];
      return [
        reg.id,
        reg.event_id,
        ev?.title || '',
        reg.user_id,
        d.full_name || profile?.full_name || '',
        d.college || profile?.college || '',
        d.year || profile?.year || '',
        d.division || profile?.division || '',
        d.batch || profile?.batch || '',
        d.phone || profile?.phone || '',
        d.date_of_birth || profile?.date_of_birth || '',
        d.terms ? 'Yes' : 'No',
        reg.attendance_status,
        formatTimestamp(reg.created_at, true),
      ];
    });
    const eventSlug =
      selectedEventId === 'all'
        ? 'all-events'
        : (eventMap[selectedEventId]?.title || selectedEventId)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-');
    downloadCsv(`spark-registrations-${eventSlug}.csv`, headers, rows);
    onToast(`Exported ${filtered.length} registration records`);
  };

  return (
    <div className="space-y-5">
      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <select
            value={selectedEventId}
            onChange={(e) => onSelectEventId(e.target.value)}
            aria-label="Filter by event"
            className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-blue-600 max-w-xs"
          >
            <option value="all">All Events ({registrations.length})</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>

          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student, college, phone…"
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-600"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['all', 'registered', 'attended', 'absent'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setAttendanceFilter(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  attendanceFilter === status
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
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={filtered.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Inline Summary Strip */}
      <div className="bg-white border border-slate-200 rounded-xl px-5 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600">
        <div>
          Showing{' '}
          <span className="font-mono font-semibold text-slate-900 tabular-nums">
            {summary.total}
          </span>{' '}
          registrations
        </div>
        <span className="text-slate-300" aria-hidden="true">
          ·
        </span>
        <div>
          Attended:{' '}
          <span className="font-mono font-semibold text-emerald-700 tabular-nums">
            {summary.attended}
          </span>
        </div>
        <div>
          Registered:{' '}
          <span className="font-mono font-semibold text-amber-700 tabular-nums">
            {summary.registered}
          </span>
        </div>
        <div>
          Absent:{' '}
          <span className="font-mono font-semibold text-red-700 tabular-nums">
            {summary.absent}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-slate-900">
              No registrations found
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {registrations.length === 0
                ? 'Student event sign-ups will appear here in real time.'
                : 'Try clearing the event or attendance filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-3 px-5">Student</th>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">Academic Info</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Attendance</th>
                  <th className="py-3 px-5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filtered.map((reg) => {
                  const d = reg.student_details || {};
                  const profile = profileMap[reg.user_id];
                  const ev = eventMap[reg.event_id];
                  const fullName = d.full_name || profile?.full_name || 'Unnamed Student';
                  const college = d.college || profile?.college || '—';
                  const year = d.year || profile?.year;
                  const div = d.division || profile?.division;
                  const batch = d.batch || profile?.batch;
                  const phone = d.phone || profile?.phone || '—';
                  const isBusy = busyId === reg.id;

                  return (
                    <tr key={reg.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-5">
                        <div className="font-medium text-slate-900">{fullName}</div>
                        <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">
                          {college}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs font-medium text-slate-900 max-w-[200px] truncate">
                          {ev?.title || reg.event_id}
                        </div>
                        <div className="text-xs font-mono tabular-nums text-slate-500 mt-0.5">
                          {formatTimestamp(reg.created_at)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {[year ? `Yr ${year}` : '', div ? `Div ${div}` : '', batch ? `Batch ${batch}` : '']
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono tabular-nums text-slate-700 whitespace-nowrap">
                        {phone}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleMarkAttendance(reg, 'registered')}
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                              reg.attendance_status === 'registered'
                                ? 'bg-white text-amber-800 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            Registered
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleMarkAttendance(reg, 'attended')}
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                              reg.attendance_status === 'attended'
                                ? 'bg-emerald-700 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            Attended
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleMarkAttendance(reg, 'absent')}
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                              reg.attendance_status === 'absent'
                                ? 'bg-red-700 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <UserX className="w-3 h-3" />
                            Absent
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setDetailReg(reg)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
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

      {/* Registration Details Drawer */}
      {detailReg && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-[1px]">
          <div className="w-full max-w-md bg-white h-full border-l border-slate-200 shadow-xl flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Registration Record</h2>
                <p className="text-xs font-mono text-slate-500 mt-0.5 truncate max-w-[260px]">
                  {detailReg.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailReg(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
              <div>
                <div className="text-xs font-medium text-slate-500">Event</div>
                <div className="mt-1 font-semibold text-slate-900">
                  {eventMap[detailReg.event_id]?.title || detailReg.event_id}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-slate-500 mb-2">Attendance Status</div>
                <div className="grid grid-cols-3 gap-2">
                  {(['registered', 'attended', 'absent'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={busyId === detailReg.id}
                      onClick={() => void handleMarkAttendance(detailReg, status)}
                      className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                        detailReg.attendance_status === status
                          ? status === 'attended'
                            ? 'bg-emerald-700 border-emerald-700 text-white'
                            : status === 'absent'
                            ? 'bg-red-700 border-red-700 text-white'
                            : 'bg-amber-600 border-amber-600 text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-5">
                <h3 className="text-xs font-semibold text-slate-900 mb-3">Student Details</h3>
                <dl className="divide-y divide-slate-100 text-xs">
                  {[
                    ['Full Name', detailReg.student_details?.full_name],
                    ['College', detailReg.student_details?.college],
                    ['Year', detailReg.student_details?.year],
                    ['Division', detailReg.student_details?.division],
                    ['Batch', detailReg.student_details?.batch],
                    ['Phone', detailReg.student_details?.phone],
                    ['Date of Birth', detailReg.student_details?.date_of_birth],
                    ['Terms Accepted', detailReg.student_details?.terms ? 'Yes' : 'No'],
                    ['User ID', detailReg.user_id],
                    ['Submitted At', formatTimestamp(detailReg.created_at, true)],
                  ].map(([label, val]) => (
                    <div key={label} className="py-2.5 flex items-center justify-between gap-4">
                      <dt className="text-slate-500">{label}</dt>
                      <dd className="font-medium text-slate-900 text-right font-mono tabular-nums break-all">
                        {val || '—'}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
