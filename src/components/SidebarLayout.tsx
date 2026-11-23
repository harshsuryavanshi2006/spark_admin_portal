import React, { useMemo, useState } from 'react';
import {
  LayoutGrid,
  CalendarDays,
  Users,
  Sparkles,
  ClipboardList,
  Lightbulb,
  Megaphone,
  ShieldCheck,
  LogOut,
  Search,
  Bell,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import type {
  AdminNavTab,
  Club,
  ClubSuggestion,
  SparkEvent,
  StudentIdea,
  StudentProfile,
} from '../types/spark';
import { useSparkAuth } from '../context/SparkAuthContext';
import { getInitials } from '../lib/formatters';

interface NavItem {
  id: AdminNavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface SidebarLayoutProps {
  activeTab: AdminNavTab;
  onSelectTab: (tab: AdminNavTab, eventIdFilter?: string) => void;
  events: SparkEvent[];
  profiles: StudentProfile[];
  clubs: Club[];
  pendingClubRequests: ClubSuggestion[];
  pendingIdeas: StudentIdea[];
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

export function SidebarLayout({
  activeTab,
  onSelectTab,
  events,
  profiles,
  clubs,
  pendingClubRequests,
  pendingIdeas,
  headerAction,
  children,
}: SidebarLayoutProps) {
  const { user, adminRecord, adminRole, signOut } = useSparkAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const totalPendingNotifications = pendingClubRequests.length + pendingIdeas.length;

  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Dashboard',
      icon: LayoutGrid,
      badge: activeTab === 'overview' ? 'Home' : undefined,
    },
    { id: 'events', label: 'Events Management', icon: CalendarDays },
    { id: 'students', label: 'Student Management', icon: Users },
    {
      id: 'clubs',
      label: 'Communities',
      icon: Sparkles,
      badge: pendingClubRequests.length > 0 ? String(pendingClubRequests.length) : undefined,
    },
    { id: 'registrations', label: 'Registrations', icon: ClipboardList },
    {
      id: 'ideas',
      label: 'Student Ideas',
      icon: Lightbulb,
      badge: pendingIdeas.length > 0 ? 'Review' : undefined,
    },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'admins', label: 'Admin Team', icon: ShieldCheck },
  ];

  const searchResults = useMemo(() => {
    const q = globalQuery.trim().toLowerCase();
    if (!q) return [];
    const items: Array<{
      id: string;
      type: string;
      title: string;
      subtitle: string;
      tab: AdminNavTab;
      eventId?: string;
    }> = [];

    for (const ev of events) {
      if (
        ev.title.toLowerCase().includes(q) ||
        ev.tag.toLowerCase().includes(q) ||
        ev.place.toLowerCase().includes(q)
      ) {
        items.push({
          id: `ev-${ev.id}`,
          type: 'Event',
          title: ev.title,
          subtitle: `${ev.date || 'Date TBD'} · ${ev.status}`,
          tab: 'events',
        });
      }
      if (items.length >= 8) break;
    }

    for (const p of profiles) {
      const name = p.full_name || p.username || '';
      if (
        name.toLowerCase().includes(q) ||
        (p.department || '').toLowerCase().includes(q) ||
        (p.college || '').toLowerCase().includes(q)
      ) {
        items.push({
          id: `st-${p.id}`,
          type: 'Student',
          title: p.full_name || `@${p.username}` || p.id,
          subtitle: [p.department, p.college].filter(Boolean).join(' · ') || 'Student Profile',
          tab: 'students',
        });
      }
      if (items.length >= 8) break;
    }

    for (const c of clubs) {
      if (c.name.toLowerCase().includes(q)) {
        items.push({
          id: `cl-${c.id}`,
          type: 'Community',
          title: c.name,
          subtitle: `${c.member_count ?? 0} members`,
          tab: 'clubs',
        });
      }
      if (items.length >= 8) break;
    }

    return items.slice(0, 8);
  }, [globalQuery, events, profiles, clubs]);

  const handleNavClick = (tab: AdminNavTab) => {
    onSelectTab(tab);
    setMobileOpen(false);
  };

  const displayName = adminRecord?.name || user?.displayName || 'Admin';
  const email = user?.email || adminRecord?.email || '';
  const roleLabel = adminRole === 'super_admin' ? 'Super Admin' : 'Coordinator Admin';

  const sidebarContent = (
    <div className="relative flex flex-col h-full bg-[#121A36] text-white w-64 overflow-hidden select-none">
      {/* Top Brand Lockup matching mockup */}
      <div className="px-6 pt-6 pb-5 border-b border-white/10 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path
                d="M16 3L19.6 12.4L29 16L19.6 19.6L16 29L12.4 19.6L3 16L12.4 12.4L16 3Z"
                fill="#FACC15"
              />
            </svg>
            <span className="font-hand text-3xl font-bold tracking-tight text-white leading-none">
              Spark
            </span>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M4 10L9 5" stroke="#FACC15" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M7 14L14 11" stroke="#FACC15" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M5 5L6 1" stroke="#FACC15" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 text-slate-300 hover:text-white rounded-lg cursor-pointer"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="mt-2 font-hand text-sm text-slate-300 tracking-wide">
          Ignite. Engage. Grow.
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="relative z-10 flex-1 px-3.5 py-4 space-y-1 overflow-y-auto" aria-label="Sidebar Navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium rounded-xl transition-all duration-150 whitespace-nowrap cursor-pointer ${
                active
                  ? 'bg-[#FFE89E] text-[#121A36] font-semibold shadow-sm'
                  : 'text-slate-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-[18px] h-[18px] shrink-0 ${
                    active ? 'text-[#121A36]' : 'text-slate-300'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </span>
              {item.badge && (
                <span
                  className={`ml-2 px-2 py-0.5 text-[11px] font-semibold rounded-full tabular-nums shrink-0 ${
                    item.badge === 'Home'
                      ? 'bg-[#A7F3D0] text-[#065F46]'
                      : item.badge === 'Review'
                      ? 'bg-[#FDE047] text-[#121A36]'
                      : active
                      ? 'bg-[#121A36]/15 text-[#121A36]'
                      : 'bg-white/15 text-[#FFE89E]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Logout & Decorative Wave */}
      <div className="relative z-10 px-4 pb-6 pt-3 shrink-0">
        <button
          type="button"
          onClick={() => void signOut()}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold text-[#FB7185] hover:bg-white/10 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          Logout
        </button>
      </div>

      {/* Bottom Navy Wave + Golden Spark Star matching mockup */}
      <svg
        viewBox="0 0 256 110"
        fill="none"
        className="pointer-events-none absolute bottom-0 left-0 w-full h-24 opacity-80"
        aria-hidden="true"
      >
        <path
          d="M0 45C55 20 110 75 170 40C215 15 240 28 256 38V110H0V45Z"
          fill="#1D2A57"
        />
        <path
          d="M114 48L117 55.5L124.5 58.5L117 61.5L114 69L111 61.5L103.5 58.5L111 55.5L114 48Z"
          fill="#FACC15"
        />
      </svg>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDF9EE] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block shrink-0 sticky top-0 h-screen">{sidebarContent}</aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div className="fixed inset-0 bg-[#121A36]/50" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Utility Header matching mockup */}
        <header className="sticky top-0 z-20 h-16 bg-[#FDF9EE]/95 backdrop-blur-sm border-b border-[#EFE6CE] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 text-[#121A36] hover:bg-[#F3ECD8] rounded-xl cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search anything... bar */}
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={globalQuery}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                onChange={(e) => setGlobalQuery(e.target.value)}
                placeholder="Search anything..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-[#F3EFE3] border border-[#E7DFCA] rounded-full text-[#121A36] placeholder:text-slate-500 focus:outline-none focus:bg-white focus:border-[#121A36]/40 transition-colors"
              />

              {searchFocused && globalQuery.trim() && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden z-30">
                  {searchResults.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-slate-500">
                      No matching events, students, or clubs.
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                      {searchResults.map((res) => (
                        <li key={res.id}>
                          <button
                            type="button"
                            onMouseDown={() => {
                              onSelectTab(res.tab, res.eventId);
                              setGlobalQuery('');
                            }}
                            className="w-full px-4 py-2.5 text-left hover:bg-[#FDF9EE] flex items-center justify-between gap-3 cursor-pointer"
                          >
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-[#121A36] truncate">
                                {res.title}
                              </div>
                              <div className="text-xs text-slate-500 truncate">{res.subtitle}</div>
                            </div>
                            <span className="text-[11px] font-medium text-slate-500 shrink-0">
                              {res.type}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Controls: Optional CTA + Bell + Avatar */}
          <div className="flex items-center gap-3 shrink-0">
            {headerAction}

            {/* Notification Bell Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((prev) => !prev);
                  setProfileMenuOpen(false);
                }}
                className="relative p-2.5 bg-white border border-[#E7DFCA] hover:bg-[#F7F1E1] rounded-full text-[#121A36] transition-colors cursor-pointer"
                aria-label="Pending approvals notifications"
              >
                <Bell className="w-4 h-4" />
                {totalPendingNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F43F5E]" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-lg p-4 z-30">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-semibold text-[#121A36]">
                      Pending Approvals ({totalPendingNotifications})
                    </span>
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {totalPendingNotifications === 0 ? (
                    <p className="py-4 text-xs text-slate-500 text-center">
                      All club requests and idea submissions are reviewed.
                    </p>
                  ) : (
                    <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                      {pendingClubRequests.slice(0, 3).map((req) => (
                        <button
                          key={req.id}
                          type="button"
                          onClick={() => {
                            onSelectTab('clubs');
                            setNotifOpen(false);
                          }}
                          className="w-full text-left p-2.5 rounded-xl bg-[#FDF9EE] hover:bg-[#FFF0C2]/60 transition-colors cursor-pointer"
                        >
                          <div className="text-xs font-semibold text-[#121A36] truncate">
                            Club Request: {req.club_name}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {req.category || 'General'} · Tap to review
                          </div>
                        </button>
                      ))}
                      {pendingIdeas.slice(0, 3).map((idea) => (
                        <button
                          key={idea.id}
                          type="button"
                          onClick={() => {
                            onSelectTab('ideas');
                            setNotifOpen(false);
                          }}
                          className="w-full text-left p-2.5 rounded-xl bg-[#FDF9EE] hover:bg-[#EAE4FF]/70 transition-colors cursor-pointer"
                        >
                          <div className="text-xs font-semibold text-[#121A36] truncate">
                            Idea: {idea.title}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {idea.category || 'Campus Idea'} · Tap to review
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Admin Profile Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen((prev) => !prev);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2 p-1 pr-2.5 bg-white border border-[#E7DFCA] hover:bg-[#F7F1E1] rounded-full transition-colors cursor-pointer"
              >
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={displayName}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#FFE89E] text-[#121A36] text-xs font-bold flex items-center justify-center">
                    {getInitials(displayName)}
                  </div>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-2xl shadow-lg p-3 z-30">
                  <div className="px-2 py-1.5 border-b border-slate-100">
                    <div className="text-xs font-semibold text-[#121A36] truncate">
                      {displayName}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{roleLabel}</div>
                    <div className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                      {email}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab('admins');
                      setProfileMenuOpen(false);
                    }}
                    className="mt-1.5 w-full text-left px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Manage Admin Team
                  </button>
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="w-full text-left px-2.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1360px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
