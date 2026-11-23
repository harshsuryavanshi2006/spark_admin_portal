/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState } from 'react';
import { Plus, UserPlus } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SparkAuthProvider, useSparkAuth } from './context/SparkAuthContext';
import { AdminSignInGate } from './components/AdminSignInGate';
import { SidebarLayout } from './components/SidebarLayout';
import { ToastContainer, type ToastItem } from './components/Toast';
import { useSparkData } from './hooks/useSparkData';
import type { AdminNavTab } from './types/spark';
import { OverviewView } from './views/OverviewView';
import { EventsView } from './views/EventsView';
import { RegistrationsView } from './views/RegistrationsView';
import { StudentsView } from './views/StudentsView';
import { ClubsView } from './views/ClubsView';
import { IdeasView } from './views/IdeasView';
import { AnnouncementsView } from './views/AnnouncementsView';
import { AdminsView } from './views/AdminsView';

function PortalWorkspace() {
  const { authReady, verifyingAdmin, isAuthorized } = useSparkAuth();
  const [activeTab, setActiveTab] = useState<AdminNavTab>('overview');
  const [regEventFilter, setRegEventFilter] = useState<string>('all');
  const [createEventTrigger, setCreateEventTrigger] = useState(false);
  const [addAdminTrigger, setAddAdminTrigger] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const data = useSparkData(isAuthorized);

  const pushToast = useCallback((message: string, tone: 'success' | 'error' = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleNavigate = useCallback((tab: AdminNavTab, eventIdFilter?: string) => {
    if (eventIdFilter) {
      setRegEventFilter(eventIdFilter);
    }
    setActiveTab(tab);
  }, []);

  if (!authReady || verifyingAdmin || !isAuthorized) {
    return <AdminSignInGate />;
  }

  const pendingClubRequests = data.clubSuggestions.filter((s) => s.status === 'pending');
  const pendingIdeas = data.ideas.filter((i) => i.status === 'pending');

  let headerAction: React.ReactNode = null;
  if (activeTab === 'events') {
    headerAction = (
      <button
        type="button"
        onClick={() => setCreateEventTrigger(true)}
        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#121A36] bg-[#FFE89E] hover:bg-[#FDE047] rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        New Event
      </button>
    );
  } else if (activeTab === 'admins') {
    headerAction = (
      <button
        type="button"
        onClick={() => setAddAdminTrigger(true)}
        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#121A36] bg-[#FFE89E] hover:bg-[#FDE047] rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <UserPlus className="w-4 h-4" />
        Add Admin
      </button>
    );
  }

  return (
    <>
      <SidebarLayout
        activeTab={activeTab}
        onSelectTab={handleNavigate}
        events={data.events}
        profiles={data.profiles}
        clubs={data.clubs}
        pendingClubRequests={pendingClubRequests}
        pendingIdeas={pendingIdeas}
        headerAction={headerAction}
      >
        {activeTab === 'overview' && (
          <OverviewView
            events={data.events}
            registrations={data.registrations}
            profiles={data.profiles}
            clubs={data.clubs}
            suggestions={data.clubSuggestions}
            ideas={data.ideas}
            loading={data.loading}
            onNavigate={handleNavigate}
            onOpenNewEvent={() => {
              setActiveTab('events');
              setCreateEventTrigger(true);
            }}
            onToast={pushToast}
          />
        )}

        {activeTab === 'events' && (
          <EventsView
            events={data.events}
            registrations={data.registrations}
            loading={data.loading}
            onCreateEvent={data.createEvent}
            onUpdateEvent={data.updateEvent}
            onDeleteEvent={data.deleteEvent}
            onViewRegistrations={(eventId) => handleNavigate('registrations', eventId)}
            onToast={pushToast}
            createOpenExternal={createEventTrigger}
            onCloseCreateExternal={() => setCreateEventTrigger(false)}
          />
        )}

        {activeTab === 'registrations' && (
          <RegistrationsView
            events={data.events}
            registrations={data.registrations}
            profiles={data.profiles}
            loading={data.loading}
            selectedEventId={regEventFilter}
            onSelectEventId={setRegEventFilter}
            onUpdateAttendance={data.updateAttendanceStatus}
            onToast={pushToast}
          />
        )}

        {activeTab === 'students' && (
          <StudentsView
            profiles={data.profiles}
            registrations={data.registrations}
            events={data.events}
            clubs={data.clubs}
            clubMemberships={data.clubMemberships}
            loading={data.loading}
          />
        )}

        {activeTab === 'clubs' && (
          <ClubsView
            clubs={data.clubs}
            clubMemberships={data.clubMemberships}
            suggestions={data.clubSuggestions}
            profiles={data.profiles}
            loading={data.loading}
            onReviewSuggestion={data.reviewClubSuggestion}
            onCreateClub={data.createClub}
            onToast={pushToast}
          />
        )}

        {activeTab === 'ideas' && (
          <IdeasView
            ideas={data.ideas}
            clubSuggestions={data.clubSuggestions}
            profiles={data.profiles}
            loading={data.loading}
            permissionLimited={data.ideasPermissionLimited}
            onReviewIdea={data.reviewIdea}
            onOpenClubSuggestions={() => setActiveTab('clubs')}
            onToast={pushToast}
          />
        )}

        {activeTab === 'announcements' && (
          <AnnouncementsView
            announcements={data.announcements}
            loading={data.loading}
            permissionLimited={data.announcementsPermissionLimited}
            onCreateAnnouncement={data.createAnnouncement}
            onDeleteAnnouncement={data.deleteAnnouncement}
            onToast={pushToast}
          />
        )}

        {activeTab === 'admins' && (
          <AdminsView
            admins={data.admins}
            loading={data.loading}
            onAddAdmin={data.addAdminUser}
            onUpdateRole={data.updateAdminRole}
            onRemoveAdmin={data.removeAdminUser}
            onToast={pushToast}
            addOpenExternal={addAdminTrigger}
            onCloseAddExternal={() => setAddAdminTrigger(false)}
          />
        )}
      </SidebarLayout>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SparkAuthProvider>
        <PortalWorkspace />
      </SparkAuthProvider>
    </ErrorBoundary>
  );
}
