import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type {
  Club,
  ClubMembership,
  EventRegistration,
  SparkEvent,
  StudentProfile,
} from '../types/spark';
import { formatTimestamp, getInitials } from '../lib/formatters';

interface StudentsViewProps {
  profiles: StudentProfile[];
  registrations: EventRegistration[];
  events: SparkEvent[];
  clubs: Club[];
  clubMemberships: ClubMembership[];
  loading: boolean;
}

export function StudentsView({
  profiles,
  registrations,
  events,
  clubs,
  clubMemberships,
  loading,
}: StudentsViewProps) {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);

  const departments = useMemo(() => {
    const set = new Set<string>();
    for (const p of profiles) {
      if (p.department?.trim()) set.add(p.department.trim());
    }
    return Array.from(set).sort();
  }, [profiles]);

  const years = useMemo(() => {
    const set = new Set<string>();
    for (const p of profiles) {
      if (p.year?.trim()) set.add(p.year.trim());
    }
    return Array.from(set).sort();
  }, [profiles]);

  const regCountByUser = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of registrations) {
      map[r.user_id] = (map[r.user_id] || 0) + 1;
    }
    return map;
  }, [registrations]);

  const clubMap = useMemo(() => {
    const map: Record<string, Club> = {};
    for (const c of clubs) map[c.id] = c;
    return map;
  }, [clubs]);

  const eventMap = useMemo(() => {
    const map: Record<string, SparkEvent> = {};
    for (const e of events) map[e.id] = e;
    return map;
  }, [events]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return profiles.filter((p) => {
      if (deptFilter !== 'all' && (p.department || '').trim() !== deptFilter) return false;
      if (yearFilter !== 'all' && (p.year || '').trim() !== yearFilter) return false;
      if (!q) return true;
      const haystack = [
        p.full_name,
        p.username,
        p.department,
        p.college,
        p.division,
        p.batch,
        p.phone,
        p.id,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [profiles, deptFilter, yearFilter, search]);

  const selectedStudentRegs = useMemo(() => {
    if (!selectedStudent) return [];
    return registrations.filter((r) => r.user_id === selectedStudent.id);
  }, [selectedStudent, registrations]);

  const selectedStudentClubs = useMemo(() => {
    if (!selectedStudent) return [];
    return clubMemberships
      .filter((m) => m.user_id === selectedStudent.id)
      .map((m) => clubMap[m.club_id]?.name || m.club_id);
  }, [selectedStudent, clubMemberships, clubMap]);

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, @username, college, phone…"
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-600"
            />
          </div>

          {departments.length > 0 && (
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              aria-label="Filter by department"
              className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-600"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}

          {years.length > 0 && (
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              aria-label="Filter by academic year"
              className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-600"
            >
              <option value="all">All Years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="text-xs font-mono tabular-nums text-slate-500">
          {filtered.length} of {profiles.length} students
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
            <p className="text-sm font-semibold text-slate-900">No student profiles found</p>
            <p className="mt-1 text-xs text-slate-500">
              {profiles.length === 0
                ? 'Student profiles created in the Spark app will appear here.'
                : 'Adjust your search term or academic filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-3 px-5">Student</th>
                  <th className="py-3 px-4">Department &amp; Class</th>
                  <th className="py-3 px-4">College</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4 text-right">Events</th>
                  <th className="py-3 px-5 text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filtered.map((student) => {
                  const name = student.full_name || student.username || 'Unnamed Student';
                  const academicMeta = [
                    student.department,
                    student.year ? `Yr ${student.year}` : '',
                    student.division ? `Div ${student.division}` : '',
                    student.batch ? `Batch ${student.batch}` : '',
                  ]
                    .filter(Boolean)
                    .join(' · ');

                  return (
                    <tr
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          {student.avatar_url ? (
                            <img
                              src={student.avatar_url}
                              alt={name}
                              referrerPolicy="no-referrer"
                              className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center shrink-0">
                              {getInitials(name)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-medium text-slate-900 truncate">{name}</div>
                            <div className="text-xs font-mono text-slate-500 truncate">
                              {student.username ? `@${student.username}` : student.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {academicMeta || '—'}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 max-w-[200px] truncate">
                        {student.college || '—'}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono tabular-nums text-slate-700 whitespace-nowrap">
                        {student.phone || '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-slate-700 whitespace-nowrap">
                        {regCountByUser[student.id] || 0}
                      </td>
                      <td className="py-3 px-5 text-right font-mono tabular-nums text-xs text-slate-500 whitespace-nowrap">
                        {formatTimestamp(student.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Profile Drawer */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-[1px]">
          <div className="w-full max-w-md bg-white h-full border-l border-slate-200 shadow-xl flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                {selectedStudent.avatar_url ? (
                  <img
                    src={selectedStudent.avatar_url}
                    alt={selectedStudent.full_name || 'Student'}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-slate-900 text-white text-sm font-semibold flex items-center justify-center shrink-0">
                    {getInitials(selectedStudent.full_name || selectedStudent.username)}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-slate-900 truncate">
                    {selectedStudent.full_name || selectedStudent.username || 'Student Profile'}
                  </h2>
                  <p className="text-xs font-mono text-slate-500 truncate">
                    {selectedStudent.username
                      ? `@${selectedStudent.username}`
                      : selectedStudent.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-slate-900 mb-2">Profile Details</h3>
                <dl className="divide-y divide-slate-100 text-xs">
                  {[
                    ['User ID', selectedStudent.id],
                    ['Department', selectedStudent.department],
                    ['College', selectedStudent.college],
                    ['Year', selectedStudent.year],
                    ['Division', selectedStudent.division],
                    ['Batch', selectedStudent.batch],
                    ['Phone', selectedStudent.phone],
                    ['Date of Birth', selectedStudent.date_of_birth],
                    ['Created At', formatTimestamp(selectedStudent.created_at, true)],
                    ['Updated At', formatTimestamp(selectedStudent.updated_at, true)],
                  ].map(([label, val]) => (
                    <div key={label} className="py-2 flex items-center justify-between gap-4">
                      <dt className="text-slate-500">{label}</dt>
                      <dd className="font-medium text-slate-900 text-right font-mono tabular-nums break-all">
                        {val || '—'}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="border-t border-slate-200 pt-5">
                <h3 className="text-xs font-semibold text-slate-900 mb-2">
                  Club Memberships ({selectedStudentClubs.length})
                </h3>
                {selectedStudentClubs.length === 0 ? (
                  <p className="text-xs text-slate-500">Not a member of any clubs.</p>
                ) : (
                  <ul className="space-y-1.5 text-xs text-slate-800">
                    {selectedStudentClubs.map((clubName, idx) => (
                      <li
                        key={idx}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                      >
                        {clubName}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-t border-slate-200 pt-5">
                <h3 className="text-xs font-semibold text-slate-900 mb-2">
                  Event Registrations ({selectedStudentRegs.length})
                </h3>
                {selectedStudentRegs.length === 0 ? (
                  <p className="text-xs text-slate-500">No event registrations found.</p>
                ) : (
                  <ul className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden">
                    {selectedStudentRegs.map((reg) => (
                      <li
                        key={reg.id}
                        className="px-3 py-2.5 flex items-center justify-between gap-3 text-xs"
                      >
                        <span className="font-medium text-slate-900 truncate">
                          {eventMap[reg.event_id]?.title || reg.event_id}
                        </span>
                        <span
                          className={`font-medium shrink-0 ${
                            reg.attendance_status === 'attended'
                              ? 'text-emerald-700'
                              : reg.attendance_status === 'absent'
                              ? 'text-red-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {reg.attendance_status.charAt(0).toUpperCase() +
                            reg.attendance_status.slice(1)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
