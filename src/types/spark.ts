export type EventStatus = 'upcoming' | 'ongoing' | 'past';
export type AttendanceStatus = 'registered' | 'attended' | 'absent';
export type SuggestionStatus = 'pending' | 'approved' | 'declined';
export type AdminRole = 'super_admin' | 'admin';

export type FirestoreTimestampLike =
  | string
  | number
  | { seconds: number; nanoseconds?: number; toDate?: () => Date }
  | null
  | undefined;

export interface SparkEvent {
  id: string;
  title: string;
  tag: string;
  status: EventStatus;
  date: string;
  time: string;
  place: string;
  tags: string[] | string;
  image: string;
  description: string;
  registration_open: boolean;
  created_at?: FirestoreTimestampLike;
  updated_at?: FirestoreTimestampLike;
}

export interface StudentDetails {
  full_name?: string;
  division?: string;
  batch?: string;
  year?: string;
  date_of_birth?: string;
  college?: string;
  phone?: string;
  terms?: boolean;
}

export interface EventRegistration {
  id: string;
  user_id: string;
  event_id: string;
  student_details?: StudentDetails;
  attendance_status: AttendanceStatus;
  created_at?: FirestoreTimestampLike;
}

export interface StudentProfile {
  id: string;
  username?: string;
  full_name?: string;
  department?: string;
  division?: string;
  batch?: string;
  year?: string;
  date_of_birth?: string;
  college?: string;
  phone?: string;
  avatar_url?: string;
  created_at?: FirestoreTimestampLike;
  updated_at?: FirestoreTimestampLike;
}

export interface Club {
  id: string;
  name: string;
  member_count?: number;
}

export interface ClubMembership {
  id: string;
  user_id: string;
  club_id: string;
  created_at?: FirestoreTimestampLike;
}

export interface ClubSuggestion {
  id: string;
  user_id: string;
  club_name: string;
  category?: string;
  reason?: string;
  status: SuggestionStatus;
  admin_note?: string;
  created_at?: FirestoreTimestampLike;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  added_by?: string;
  created_at?: FirestoreTimestampLike;
}

export type IdeaStatus = 'pending' | 'approved' | 'declined';

export interface StudentIdea {
  id: string;
  source_collection: 'student_ideas' | 'ideas';
  user_id?: string;
  author_name?: string;
  title: string;
  category?: string;
  description?: string;
  status: IdeaStatus;
  admin_note?: string;
  created_at?: FirestoreTimestampLike;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  audience?: string;
  created_by?: string;
  created_at?: FirestoreTimestampLike;
}

export type AdminNavTab =
  | 'overview'
  | 'events'
  | 'registrations'
  | 'students'
  | 'clubs'
  | 'ideas'
  | 'announcements'
  | 'admins';
