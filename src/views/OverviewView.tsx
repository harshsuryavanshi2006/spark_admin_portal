import { motion } from 'motion/react';
import {
  Users,
  CalendarDays,
  Ticket,
  Sparkles,
  Inbox,
  Lightbulb,
  ArrowRight,
  Plus,
  Download,
  Megaphone,
  ShieldCheck,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import type {
  AdminNavTab,
  Club,
  ClubSuggestion,
  EventRegistration,
  SparkEvent,
  StudentIdea,
  StudentProfile,
} from '../types/spark';
import { useSparkAuth } from '../context/SparkAuthContext';
import { downloadCsv, formatTimestamp } from '../lib/formatters';
import { SafeImage } from '../components/SafeImage';
import {
  AdminHeroIllustration,
  MegaphoneIllustration,
} from '../components/AdminHeroIllustration';

interface OverviewViewProps {
  events: SparkEvent[];
  registrations: EventRegistration[];
  profiles: StudentProfile[];
  clubs: Club[];
  suggestions: ClubSuggestion[];
  ideas: StudentIdea[];
  loading: boolean;
  onNavigate: (tab: AdminNavTab, eventIdFilter?: string) => void;
  onOpenNewEvent: () => void;
  onToast: (message: string, tone?: 'success' | 'error') => void;
}

export function OverviewView({
  events,
  registrations,
  profiles,
  clubs,
  suggestions,
  ideas,
  loading,
  onNavigate,
  onOpenNewEvent,
  onToast,
}: OverviewViewProps) {
  const { adminRecord, user } = useSparkAuth();
  const firstName =
    (adminRecord?.name || user?.displayName || 'Admin').split(/\s+/)[0] || 'Admin';

  const upcomingEvents = events.filter((e) => e.status === 'upcoming' || e.status === 'ongoing');
  const attendedCount = registrations.filter((r) => r.attendance_status === 'attended').length;
  const pendingClubRequests = suggestions.filter((s) => s.status === 'pending');
  const pendingIdeas = ideas.filter((i) => i.status === 'pending');

  const eventMap = events.reduce<Record<string, SparkEvent>>((acc, ev) => {
    acc[ev.id] = ev;
    return acc;
  }, {});

  const profileMap = profiles.reduce<Record<string, StudentProfile>>((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {});

  const overviewCards = [
    {
      label: 'Total Registered Students',
      value: profiles.length,
      sub: 'Directory accounts',
      bg: 'bg-[#EAE4FF]',
      wave: '#DCD3FF',
      icon: Users,
      tab: 'students' as AdminNavTab,
    },
    {
      label: 'Total Events',
      value: events.length,
      sub: `${upcomingEvents.length} active or upcoming`,
      bg: 'bg-[#FFF0C2]',
      wave: '#FDE39A',
      icon: CalendarDays,
      tab: 'events' as AdminNavTab,
    },
    {
      label: 'Total Event Registrations',
      value: registrations.length,
      sub: `${attendedCount} marked attended`,
      bg: 'bg-[#D8F5EB]',
      wave: '#BBEAD9',
      icon: Ticket,
      tab: 'registrations' as AdminNavTab,
    },
    {
      label: 'Active Communities',
      value: clubs.length,
      sub: 'Registered campus clubs',
      bg: 'bg-[#FDE2EC]',
      wave: '#FAC9DB',
      icon: Sparkles,
      tab: 'clubs' as AdminNavTab,
    },
    {
      label: 'Pending Club Requests',
      value: pendingClubRequests.length,
      sub: pendingClubRequests.length > 0 ? 'Awaiting review' : 'Queue clear',
      bg: 'bg-[#E0F2FE]',
      wave: '#BAE6FD',
      icon: Inbox,
      tab: 'clubs' as AdminNavTab,
    },
    {
      label: 'Pending Idea Submissions',
      value: pendingIdeas.length,
      sub: pendingIdeas.length > 0 ? 'Awaiting review' : `${ideas.length} total ideas`,
      bg: 'bg-[#FFEDD5]',
      wave: '#FED7AA',
      icon: Lightbulb,
      tab: 'ideas' as AdminNavTab,
    },
  ];

  const handleQuickExportCsv = () => {
    const headers = [
      'Registration ID',
      'Event Title',
      'Student Name',
      'College',
      'Year',
      'Division',
      'Phone',
      'Attendance Status',
      'Created At',
    ];
    const rows = registrations.map((reg) => {
      const d = reg.student_details || {};
      const prof = profileMap[reg.user_id];
      return [
        reg.id,
        eventMap[reg.event_id]?.title || reg.event_id,
        d.full_name || prof?.full_name || '',
        d.college || prof?.college || '',
        d.year || prof?.year || '',
        d.division || prof?.division || '',
        d.phone || prof?.phone || '',
        reg.attendance_status,
        formatTimestamp(reg.created_at, true),
      ];
    });
    downloadCsv('spark-all-registrations.csv', headers, rows);
    onToast(`Exported ${registrations.length} registrations to CSV`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-36 bg-white/70 border border-[#EFE6CE] rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-32 bg-white/70 border border-[#EFE6CE] rounded-3xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="h-72 bg-white/70 border border-[#EFE6CE] rounded-3xl animate-pulse" />
          <div className="h-72 bg-white/70 border border-[#EFE6CE] rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Greeting Hero matching mockup */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="font-hand text-3xl sm:text-4xl font-bold text-[#121A36] leading-tight">
            Welcome back,{' '}
            <span className="relative inline-block">
              {firstName}!
              <svg
                viewBox="0 0 140 14"
                fill="none"
                className="w-full h-3 -mt-1 text-[#FACC15]"
                aria-hidden="true"
              >
                <path
                  d="M3 10C42 3 98 3 137 8"
                  stroke="currentColor"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            Here&apos;s what&apos;s happening across Spark today.
          </p>
        </div>

        <AdminHeroIllustration />
      </section>

      {/* 6 Pastel Overview Cards */}
      <section
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        aria-label="Spark Overview Metrics"
      >
        {overviewCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.button
              key={card.label}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -2 }}
              onClick={() => onNavigate(card.tab)}
              className={`relative overflow-hidden text-left ${card.bg} rounded-3xl p-5 sm:p-6 transition-shadow hover:shadow-md cursor-pointer`}
            >
              {/* Decorative corner wave matching mockup */}
              <svg
                viewBox="0 0 120 60"
                fill="none"
                className="pointer-events-none absolute -bottom-1 right-0 w-28 h-14"
                aria-hidden="true"
              >
                <path
                  d="M15 60C45 25 85 35 120 10V60H15Z"
                  fill={card.wave}
                />
              </svg>

              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-white/75 flex items-center justify-center text-[#121A36] shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-[#121A36] tabular-nums leading-none">
                      {card.value}
                    </div>
                    <div className="mt-1.5 text-xs sm:text-sm font-semibold text-[#121A36]/85">
                      {card.label}
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 mt-3 text-xs font-medium text-[#121A36]/65">
                {card.sub}
              </div>
            </motion.button>
          );
        })}
      </section>

      {/* Dashboard Sections Row 1: Upcoming Events + Pending Approvals */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Upcoming Events */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.12 }}
          className="xl:col-span-6 bg-white border border-[#EFE6CE] rounded-3xl p-5 sm:p-6"
        >
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FFF0C2] flex items-center justify-center text-[#121A36]">
                <CalendarDays className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-[#121A36]">Upcoming Events</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('events')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline whitespace-nowrap cursor-pointer"
            >
              View All
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="py-10 text-center bg-[#FDF9EE] rounded-2xl border border-[#EFE6CE]">
              <p className="text-sm font-semibold text-[#121A36]">No upcoming events scheduled</p>
              <button
                type="button"
                onClick={onOpenNewEvent}
                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#121A36] bg-[#FFE89E] hover:bg-[#FDE047] rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Event
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {upcomingEvents.slice(0, 4).map((ev) => (
                <li
                  key={ev.id}
                  onClick={() => onNavigate('registrations', ev.id)}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#FDF9EE] hover:bg-[#F7F0DC] border border-[#EFE6CE]/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <SafeImage
                      src={ev.image}
                      alt={ev.title}
                      className="w-12 h-12 rounded-xl object-cover border border-[#E7DFCA] shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#121A36] truncate">
                        {ev.title}
                      </div>
                      <div className="text-xs text-slate-600 truncate mt-0.5 font-mono tabular-nums">
                        {ev.date || 'Date TBD'}
                        {ev.time ? ` · ${ev.time}` : ''}
                        {ev.place ? ` · ${ev.place}` : ''}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap shrink-0 ${
                      ev.status === 'ongoing'
                        ? 'bg-[#FFF0C2] text-[#92400E]'
                        : 'bg-[#EAE4FF] text-[#4C1D95]'
                    }`}
                  >
                    {ev.status === 'ongoing' ? 'Ongoing' : 'Upcoming'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </motion.section>

        {/* Pending Approvals */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.16 }}
          className="xl:col-span-6 bg-white border border-[#EFE6CE] rounded-3xl p-5 sm:p-6"
        >
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FFEDD5] flex items-center justify-center text-[#121A36]">
                <Clock className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-[#121A36]">Pending Approvals</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('clubs')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline whitespace-nowrap cursor-pointer"
            >
              View All
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingClubRequests.length === 0 && pendingIdeas.length === 0 ? (
            <div className="py-10 text-center bg-[#FDF9EE] rounded-2xl border border-[#EFE6CE]">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
              <p className="mt-2 text-sm font-semibold text-[#121A36]">All caught up</p>
              <p className="mt-0.5 text-xs text-slate-500">
                No pending club requests or idea submissions waiting for approval.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {pendingClubRequests.slice(0, 3).map((req) => {
                const proposer = req.user_id ? profileMap[req.user_id] : undefined;
                return (
                  <li
                    key={`club-${req.id}`}
                    className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#FDF9EE] border border-[#EFE6CE]/70"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-[#E0F2FE] text-[#0369A1] flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#121A36] truncate">
                          New Club Request ({req.club_name})
                        </div>
                        <div className="text-xs text-slate-600 truncate mt-0.5">
                          {req.category || 'General'} ·{' '}
                          {proposer?.full_name || req.user_id || 'Student'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate('clubs')}
                      className="px-3.5 py-1.5 text-xs font-semibold text-[#121A36] bg-[#FFE89E] hover:bg-[#FDE047] rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Review
                    </button>
                  </li>
                );
              })}

              {pendingIdeas.slice(0, 2).map((idea) => (
                <li
                  key={`idea-${idea.id}`}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#FDF9EE] border border-[#EFE6CE]/70"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-[#D8F5EB] text-[#047857] flex items-center justify-center shrink-0">
                      <Lightbulb className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#121A36] truncate">
                        Idea Submission ({idea.title})
                      </div>
                      <div className="text-xs text-slate-600 truncate mt-0.5">
                        {idea.category || 'Campus Idea'} ·{' '}
                        {idea.author_name || 'Student submission'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('ideas')}
                    className="px-3.5 py-1.5 text-xs font-semibold text-[#121A36] bg-[#FFE89E] hover:bg-[#FDE047] rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Review
                  </button>
                </li>
              ))}
            </ul>
          )}
        </motion.section>
      </div>

      {/* Dashboard Sections Row 2: Recent Registrations + Recently Submitted Ideas */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Recent Registrations */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.2 }}
          className="xl:col-span-7 bg-white border border-[#EFE6CE] rounded-3xl p-5 sm:p-6"
        >
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#D8F5EB] flex items-center justify-center text-[#121A36]">
                <Ticket className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-[#121A36]">Recent Registrations</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('registrations')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline whitespace-nowrap cursor-pointer"
            >
              View All
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {registrations.length === 0 ? (
            <div className="py-10 text-center bg-[#FDF9EE] rounded-2xl border border-[#EFE6CE] text-xs text-slate-500">
              No student event registrations recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#EFE6CE] text-xs font-semibold text-slate-500">
                    <th className="py-2.5 pr-4">Student</th>
                    <th className="py-2.5 px-3">Event</th>
                    <th className="py-2.5 px-3">Attendance</th>
                    <th className="py-2.5 pl-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE6CE]/70 text-sm">
                  {registrations.slice(0, 5).map((reg) => {
                    const d = reg.student_details || {};
                    const prof = profileMap[reg.user_id];
                    const name = d.full_name || prof?.full_name || reg.user_id || 'Student';
                    const evTitle = eventMap[reg.event_id]?.title || reg.event_id;
                    return (
                      <tr
                        key={reg.id}
                        onClick={() => onNavigate('registrations', reg.event_id)}
                        className="hover:bg-[#FDF9EE] transition-colors cursor-pointer"
                      >
                        <td className="py-3 pr-4">
                          <div className="font-semibold text-[#121A36]">{name}</div>
                          <div className="text-xs text-slate-500">
                            {[
                              d.division ? `Div ${d.division}` : '',
                              d.year ? `Yr ${d.year}` : '',
                              d.college,
                            ]
                              .filter(Boolean)
                              .join(' · ') || 'Registered student'}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-xs font-medium text-slate-700 max-w-[180px] truncate">
                          {evTitle}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`text-xs font-semibold ${
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
                        </td>
                        <td className="py-3 pl-3 text-right text-xs font-mono tabular-nums text-slate-500 whitespace-nowrap">
                          {formatTimestamp(reg.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.section>

        {/* Recently Submitted Ideas */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.24 }}
          className="xl:col-span-5 bg-white border border-[#EFE6CE] rounded-3xl p-5 sm:p-6"
        >
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#EAE4FF] flex items-center justify-center text-[#121A36]">
                <Lightbulb className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-[#121A36]">Recently Submitted Ideas</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('ideas')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline whitespace-nowrap cursor-pointer"
            >
              View All
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {ideas.length === 0 ? (
            <div className="py-8 px-4 text-center bg-[#FDF9EE] rounded-2xl border border-[#EFE6CE]">
              <p className="text-sm font-semibold text-[#121A36]">No student ideas yet</p>
              <p className="mt-1 text-xs text-slate-500">
                Ideas submitted by students will appear here for review alongside club proposals.
              </p>
              {pendingClubRequests.length > 0 && (
                <button
                  type="button"
                  onClick={() => onNavigate('clubs')}
                  className="mt-3 text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
                >
                  Inspect {pendingClubRequests.length} pending club requests →
                </button>
              )}
            </div>
          ) : (
            <ul className="space-y-3">
              {ideas.slice(0, 4).map((idea) => {
                const author =
                  idea.author_name ||
                  (idea.user_id ? profileMap[idea.user_id]?.full_name : undefined) ||
                  'Student';
                return (
                  <li
                    key={`${idea.source_collection}-${idea.id}`}
                    onClick={() => onNavigate('ideas')}
                    className="p-3.5 rounded-2xl bg-[#FDF9EE] hover:bg-[#F7F0DC] border border-[#EFE6CE]/70 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#121A36] truncate">
                          {idea.title}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {idea.category || 'Campus Idea'} · {author} ·{' '}
                          <span className="font-mono tabular-nums">
                            {formatTimestamp(idea.created_at)}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-semibold shrink-0 ${
                          idea.status === 'approved'
                            ? 'text-emerald-700'
                            : idea.status === 'declined'
                            ? 'text-red-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {idea.status.charAt(0).toUpperCase() + idea.status.slice(1)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </motion.section>
      </div>

      {/* Quick Actions Banner matching mockup ("Keep the Spark alive!") */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.28 }}
        className="bg-[#EAE4FF] border border-[#DCD3FF] rounded-3xl p-5 sm:p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-5"
      >
        <div className="flex items-center gap-4">
          <MegaphoneIllustration />
          <div>
            <h2 className="font-hand text-2xl font-bold text-[#121A36]">
              Keep the Spark alive!
            </h2>
            <p className="text-sm text-[#121A36]/75 mt-0.5">
              Quick actions to publish events, export rosters, and engage your campus community.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenNewEvent}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#121A36] bg-[#FFE89E] hover:bg-[#FDE047] rounded-full transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Event
          </button>

          <button
            type="button"
            onClick={handleQuickExportCsv}
            disabled={registrations.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#121A36] bg-white hover:bg-slate-50 rounded-full transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          <button
            type="button"
            onClick={() => onNavigate('admins')}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#121A36] bg-white hover:bg-slate-50 rounded-full transition-colors whitespace-nowrap cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin Team
          </button>

          <button
            type="button"
            onClick={() => onNavigate('announcements')}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#121A36] hover:bg-[#1E2A54] rounded-full transition-colors whitespace-nowrap cursor-pointer"
          >
            <Megaphone className="w-3.5 h-3.5" />
            Send Announcement
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.section>
    </div>
  );
}
