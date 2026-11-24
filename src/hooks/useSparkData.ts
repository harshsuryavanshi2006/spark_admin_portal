import { useCallback, useEffect, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';
import { buildWriteTimestamp, toEpochMs } from '../lib/formatters';
import type {
  AdminRole,
  AdminUser,
  Announcement,
  AttendanceStatus,
  Club,
  ClubMembership,
  ClubSuggestion,
  EventRegistration,
  EventStatus,
  IdeaStatus,
  SparkEvent,
  StudentIdea,
  StudentProfile,
  SuggestionStatus,
} from '../types/spark';

export interface EventFormInput {
  title: string;
  tag: string;
  status: EventStatus;
  date: string;
  time: string;
  place: string;
  tags: string[];
  image: string;
  description: string;
  registration_open: boolean;
}

export function useSparkData(enabled: boolean) {
  const [events, setEvents] = useState<SparkEvent[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [clubMemberships, setClubMemberships] = useState<ClubMembership[]>([]);
  const [clubSuggestions, setClubSuggestions] = useState<ClubSuggestion[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [studentIdeasDocs, setStudentIdeasDocs] = useState<StudentIdea[]>([]);
  const [ideasDocs, setIdeasDocs] = useState<StudentIdea[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [ideasPermissionLimited, setIdeasPermissionLimited] = useState(false);
  const [announcementsPermissionLimited, setAnnouncementsPermissionLimited] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setEvents([]);
      setRegistrations([]);
      setProfiles([]);
      setClubs([]);
      setClubMemberships([]);
      setClubSuggestions([]);
      setAdmins([]);
      setStudentIdeasDocs([]);
      setIdeasDocs([]);
      setAnnouncements([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const loaded = new Set<string>();
    const markLoaded = (key: string) => {
      loaded.add(key);
      if (loaded.size >= 7) {
        setLoading(false);
      }
    };

    const unsubEvents = onSnapshot(
      collection(db, 'events'),
      (snap) => {
        const list: SparkEvent[] = snap.docs.map((d) => {
          const data = d.data() as Partial<SparkEvent>;
          return {
            id: d.id,
            title: data.title || 'Untitled Event',
            tag: data.tag || 'General',
            status: data.status || 'upcoming',
            date: data.date || '',
            time: data.time || '',
            place: data.place || '',
            tags: data.tags || [],
            image: data.image || '',
            description: data.description || '',
            registration_open: Boolean(data.registration_open),
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
        });
        list.sort((a, b) => toEpochMs(b.created_at) - toEpochMs(a.created_at));
        setEvents(list);
        markLoaded('events');
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'events')
    );

    const unsubRegistrations = onSnapshot(
      collection(db, 'event_registrations'),
      (snap) => {
        const list: EventRegistration[] = snap.docs.map((d) => {
          const data = d.data() as Partial<EventRegistration>;
          return {
            id: d.id,
            user_id: data.user_id || '',
            event_id: data.event_id || '',
            student_details: data.student_details || {},
            attendance_status: data.attendance_status || 'registered',
            created_at: data.created_at,
          };
        });
        list.sort((a, b) => toEpochMs(b.created_at) - toEpochMs(a.created_at));
        setRegistrations(list);
        markLoaded('event_registrations');
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'event_registrations')
    );

    const unsubProfiles = onSnapshot(
      collection(db, 'profiles'),
      (snap) => {
        const list: StudentProfile[] = snap.docs.map((d) => {
          const data = d.data() as Partial<StudentProfile>;
          return {
            id: d.id,
            username: data.username || '',
            full_name: data.full_name || '',
            department: data.department || '',
            division: data.division || '',
            batch: data.batch || '',
            year: data.year || '',
            date_of_birth: data.date_of_birth || '',
            college: data.college || '',
            phone: data.phone || '',
            avatar_url: data.avatar_url || '',
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
        });
        list.sort((a, b) =>
          (a.full_name || a.username || '').localeCompare(b.full_name || b.username || '')
        );
        setProfiles(list);
        markLoaded('profiles');
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'profiles')
    );

    const unsubClubs = onSnapshot(
      collection(db, 'clubs'),
      (snap) => {
        const list: Club[] = snap.docs.map((d) => {
          const data = d.data() as Partial<Club>;
          return {
            id: d.id,
            name: data.name || 'Unnamed Club',
            member_count: typeof data.member_count === 'number' ? data.member_count : 0,
          };
        });
        list.sort((a, b) => a.name.localeCompare(b.name));
        setClubs(list);
        markLoaded('clubs');
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'clubs')
    );

    const unsubMemberships = onSnapshot(
      collection(db, 'club_memberships'),
      (snap) => {
        const list: ClubMembership[] = snap.docs.map((d) => {
          const data = d.data() as Partial<ClubMembership>;
          return {
            id: d.id,
            user_id: data.user_id || '',
            club_id: data.club_id || '',
            created_at: data.created_at,
          };
        });
        setClubMemberships(list);
        markLoaded('club_memberships');
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'club_memberships')
    );

    const unsubSuggestions = onSnapshot(
      collection(db, 'club_suggestions'),
      (snap) => {
        const list: ClubSuggestion[] = snap.docs.map((d) => {
          const data = d.data() as Partial<ClubSuggestion>;
          return {
            id: d.id,
            user_id: data.user_id || '',
            club_name: data.club_name || 'Untitled Club',
            category: data.category || 'General',
            reason: data.reason || '',
            status: data.status || 'pending',
            admin_note: data.admin_note || '',
            created_at: data.created_at,
          };
        });
        list.sort((a, b) => toEpochMs(b.created_at) - toEpochMs(a.created_at));
        setClubSuggestions(list);
        markLoaded('club_suggestions');
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'club_suggestions')
    );

    const unsubAdmins = onSnapshot(
      collection(db, 'admins'),
      (snap) => {
        const list: AdminUser[] = snap.docs.map((d) => {
          const data = d.data() as Partial<AdminUser>;
          return {
            id: d.id,
            email: data.email || '',
            name: data.name || '',
            role: data.role || 'admin',
            added_by: data.added_by || '',
            created_at: data.created_at,
          };
        });
        list.sort((a, b) => toEpochMs(b.created_at) - toEpochMs(a.created_at));
        setAdmins(list);
        markLoaded('admins');
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'admins')
    );

    // Optional extended collections (graceful fallback if shared firestore.rules don't expose them)
    const mapIdeaSnap = (
      source: 'student_ideas' | 'ideas',
      docs: Array<{ id: string; data: () => Record<string, unknown> }>
    ): StudentIdea[] =>
      docs.map((d) => {
        const raw = d.data();
        const statusRaw = String(raw.status || 'pending').toLowerCase();
        const status: IdeaStatus =
          statusRaw === 'approved' || statusRaw === 'declined' ? statusRaw : 'pending';
        return {
          id: d.id,
          source_collection: source,
          user_id: raw.user_id ? String(raw.user_id) : undefined,
          author_name: raw.author_name ? String(raw.author_name) : undefined,
          title: String(raw.title || raw.idea_title || raw.name || 'Untitled Idea'),
          category: String(raw.category || 'Campus Idea'),
          description: String(raw.description || raw.details || raw.reason || ''),
          status,
          admin_note: raw.admin_note ? String(raw.admin_note) : '',
          created_at: raw.created_at as StudentIdea['created_at'],
        };
      });

    const unsubStudentIdeas = onSnapshot(
      collection(db, 'student_ideas'),
      (snap) => {
        setIdeasPermissionLimited(false);
        setStudentIdeasDocs(mapIdeaSnap('student_ideas', snap.docs));
      },
      () => {
        setIdeasPermissionLimited(true);
        setStudentIdeasDocs([]);
      }
    );

    const unsubIdeas = onSnapshot(
      collection(db, 'ideas'),
      (snap) => {
        setIdeasPermissionLimited(false);
        setIdeasDocs(mapIdeaSnap('ideas', snap.docs));
      },
      () => {
        setIdeasDocs([]);
      }
    );

    const unsubAnnouncements = onSnapshot(
      collection(db, 'announcements'),
      (snap) => {
        setAnnouncementsPermissionLimited(false);
        const list: Announcement[] = snap.docs.map((d) => {
          const raw = d.data() as Partial<Announcement>;
          return {
            id: d.id,
            title: raw.title || 'Announcement',
            message: raw.message || '',
            audience: raw.audience || 'All Students',
            created_by: raw.created_by || '',
            created_at: raw.created_at,
          };
        });
        list.sort((a, b) => toEpochMs(b.created_at) - toEpochMs(a.created_at));
        setAnnouncements(list);
      },
      () => {
        setAnnouncementsPermissionLimited(true);
        setAnnouncements([]);
      }
    );

    return () => {
      unsubEvents();
      unsubRegistrations();
      unsubProfiles();
      unsubClubs();
      unsubMemberships();
      unsubSuggestions();
      unsubAdmins();
      unsubStudentIdeas();
      unsubIdeas();
      unsubAnnouncements();
    };
  }, [enabled]);

  // Combine student_ideas + ideas cleanly
  const ideas: StudentIdea[] = [...studentIdeasDocs, ...ideasDocs].sort(
    (a, b) => toEpochMs(b.created_at) - toEpochMs(a.created_at)
  );

  // --- Event CRUD ---
  const createEvent = useCallback(
    async (input: EventFormInput) => {
      const ref = doc(collection(db, 'events'));
      const ts = buildWriteTimestamp(events.map((e) => e.created_at));
      const payload = {
        id: ref.id,
        title: input.title.trim(),
        tag: input.tag.trim(),
        status: input.status,
        date: input.date.trim(),
        time: input.time.trim(),
        place: input.place.trim(),
        tags: input.tags,
        image: input.image.trim(),
        description: input.description.trim(),
        registration_open: input.registration_open,
        created_at: ts,
        updated_at: ts,
      };
      try {
        await setDoc(ref, payload);
        return ref.id;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `events/${ref.id}`);
      }
    },
    [events]
  );

  const updateEvent = useCallback(
    async (eventId: string, input: Partial<EventFormInput>) => {
      const ts = buildWriteTimestamp(events.map((e) => e.updated_at || e.created_at));
      try {
        await updateDoc(doc(db, 'events', eventId), {
          ...input,
          updated_at: ts,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `events/${eventId}`);
      }
    },
    [events]
  );

  const deleteEvent = useCallback(async (eventId: string) => {
    try {
      await deleteDoc(doc(db, 'events', eventId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `events/${eventId}`);
    }
  }, []);

  // --- Registration Attendance ---
  const updateAttendanceStatus = useCallback(
    async (registrationId: string, status: AttendanceStatus) => {
      try {
        await updateDoc(doc(db, 'event_registrations', registrationId), {
          attendance_status: status,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `event_registrations/${registrationId}`);
      }
    },
    []
  );

  // --- Club Suggestions & Clubs ---
  const reviewClubSuggestion = useCallback(
    async (
      suggestion: ClubSuggestion,
      status: Exclude<SuggestionStatus, 'pending'>,
      adminNote: string,
      createClubIfApproved: boolean
    ) => {
      try {
        await updateDoc(doc(db, 'club_suggestions', suggestion.id), {
          status,
          admin_note: adminNote.trim(),
        });

        if (status === 'approved' && createClubIfApproved) {
          const alreadyExists = clubs.some(
            (c) => c.name.trim().toLowerCase() === suggestion.club_name.trim().toLowerCase()
          );
          if (!alreadyExists) {
            const clubRef = doc(collection(db, 'clubs'));
            await setDoc(clubRef, {
              id: clubRef.id,
              name: suggestion.club_name.trim(),
              member_count: 0,
            });
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `club_suggestions/${suggestion.id}`);
      }
    },
    [clubs]
  );

  const createClub = useCallback(async (name: string) => {
    const clubRef = doc(collection(db, 'clubs'));
    try {
      await setDoc(clubRef, {
        id: clubRef.id,
        name: name.trim(),
        member_count: 0,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `clubs/${clubRef.id}`);
    }
  }, []);

  // --- Student Ideas Review ---
  const reviewIdea = useCallback(
    async (
      idea: StudentIdea,
      status: Exclude<IdeaStatus, 'pending'>,
      adminNote: string
    ) => {
      try {
        await updateDoc(doc(db, idea.source_collection, idea.id), {
          status,
          admin_note: adminNote.trim(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `${idea.source_collection}/${idea.id}`);
      }
    },
    []
  );

  // --- Announcements ---
  const createAnnouncement = useCallback(
    async (title: string, message: string, audience: string, createdBy: string) => {
      const ref = doc(collection(db, 'announcements'));
      await setDoc(ref, {
        id: ref.id,
        title: title.trim(),
        message: message.trim(),
        audience,
        created_by: createdBy,
        created_at: new Date().toISOString(),
      });
    },
    []
  );

  const deleteAnnouncement = useCallback(async (announcementId: string) => {
    await deleteDoc(doc(db, 'announcements', announcementId));
  }, []);

  // --- Admins CRUD ---
  const addAdminUser = useCallback(
    async (email: string, name: string, role: AdminRole, addedBy: string) => {
      const normalizedEmail = email.trim().toLowerCase();
      const trimmedName = name.trim();
      const ts = buildWriteTimestamp(admins.map((a) => a.created_at));

      const autoRef = doc(collection(db, 'admins'));
      const buildPayload = (id: string, createdAt: ReturnType<typeof buildWriteTimestamp>) => ({
        id,
        email: normalizedEmail,
        name: trimmedName,
        role,
        added_by: addedBy,
        created_at: createdAt,
      });

      try {
        await setDoc(autoRef, buildPayload(autoRef.id, ts));
        return;
      } catch (primaryErr) {
        const msg = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
        const isPermissionDenied =
          msg.includes('Missing or insufficient permissions') || msg.includes('permission-denied');

        if (isPermissionDenied) {
          // Retry with serverTimestamp() if collection was empty and rules require a Firestore timestamp
          if (admins.length === 0 && typeof ts === 'string') {
            try {
              const serverTs = buildWriteTimestamp([{ seconds: 1 }]);
              await setDoc(autoRef, buildPayload(autoRef.id, serverTs));
              return;
            } catch {
              // Continue to email-keyed fallback
            }
          }

          // Fallback in case shared rules key /admins documents by email
          try {
            const emailRef = doc(db, 'admins', normalizedEmail);
            await setDoc(emailRef, buildPayload(emailRef.id, ts));
            return;
          } catch {
            // Fall through and report original error
          }
        }

        handleFirestoreError(primaryErr, OperationType.CREATE, `admins/${autoRef.id}`);
      }
    },
    [admins]
  );

  const updateAdminRole = useCallback(async (adminId: string, role: AdminRole) => {
    try {
      await updateDoc(doc(db, 'admins', adminId), { role });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `admins/${adminId}`);
    }
  }, []);

  const removeAdminUser = useCallback(async (adminId: string) => {
    try {
      await deleteDoc(doc(db, 'admins', adminId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `admins/${adminId}`);
    }
  }, []);

  return {
    events,
    registrations,
    profiles,
    clubs,
    clubMemberships,
    clubSuggestions,
    admins,
    ideas,
    announcements,
    ideasPermissionLimited,
    announcementsPermissionLimited,
    loading,
    createEvent,
    updateEvent,
    deleteEvent,
    updateAttendanceStatus,
    reviewClubSuggestion,
    createClub,
    reviewIdea,
    createAnnouncement,
    deleteAnnouncement,
    addAdminUser,
    updateAdminRole,
    removeAdminUser,
  };
}
