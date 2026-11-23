# ✨ Spark — Admin Portal

> **Ignite. Engage. Grow.** 🚀  
> Administrative operations portal for managing Spark campus events, student registrations, attendance check-ins, communities, student ideas, announcements, and coordinator access.

Companion Admin Frontend for [**Spark Student Portal**](https://github.com/harshsuryavanshi2006/spark) 🎓

---

## 🌟 Overview

**Spark — Admin Portal** gives campus organizers and faculty coordinators instant visibility into everything happening across Spark without opening every section individually. It connects directly to Spark's shared Firebase project and named Cloud Firestore database so student sign-ups, club requests, and event updates stay synchronized in real time.

> ⚠️ **Shared Database Safety:** This portal intentionally does **not** overwrite or deploy `firestore.rules`. The combined Student + Admin security rules already deployed on the shared Firestore instance remain untouched.

---

## 🚀 Key Features

| Module | What You Can Do |
| :--- | :--- |
| 🔐 **Admin Google Sign-In Gate** | Restricts portal access strictly to `hrssuryavanshi135@gmail.com` or verified coordinator emails listed in `/admins`. |
| 📊 **Executive Dashboard** | View 6 live overview cards (*Registered Students, Total Events, Event Registrations, Active Communities, Pending Club Requests, Pending Idea Submissions*) plus 5 real-time sections (*Upcoming Events, Pending Approvals, Recent Registrations, Recently Submitted Ideas, Quick Actions*). |
| 🔎 **Global Search & Alerts** | Instant `Search anything...` bar across events, students, and communities, plus a pending approvals notification bell. |
| 📅 **Events Management** | Create, edit, and delete events in `/events`, switch lifecycle states (`upcoming` / `ongoing` / `past`), and toggle `registration_open` in one click. |
| 🎟️ **Registrations & Attendance** | Filter `/event_registrations` by event or attendance status, mark `registered` / `attended` / `absent` inline, inspect full `student_details`, and export CSV rosters. |
| 🎓 **Student Management** | Search and filter `/profiles` by department and academic year, and view linked club memberships & event history. |
| 🏛️ **Communities & Club Requests** | Browse `/clubs` with synced member rosters from `/club_memberships` and approve or decline `/club_suggestions` with admin feedback notes. |
| 💡 **Student Ideas & 📢 Announcements** | Review student idea submissions and broadcast campus announcements (gracefully adapts to active Firestore rules). |
| 🛡️ **Admin Team Manager** | Add or remove coordinator admins in `/admins` and manage `super_admin` / `admin` roles while protecting the primary owner account. |

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| React 19 & TypeScript | Component-based UI and type-safe application logic |
| Tailwind CSS v4 | Responsive styling and custom Spark campus theme |
| Firebase Authentication | Admin sign-in (Google OAuth popup) and `/admins` verification gate |
| Cloud Firestore | Shared real-time NoSQL database (`onSnapshot`) across all Spark collections |
| Motion | Subtle entrance and micro-interaction animations across dashboard cards |
| Lucide React | Crisp, consistent administrative iconography |
| Vite 8 | Fast development server and production bundling |
| Git & GitHub | Version control and collaboration |

---

## 🗄️ Shared Firebase Configuration

This application connects to a **named Cloud Firestore database** (not `(default)`):

- **Project ID:** `collective-flare-s91ww`
- **Firestore Database ID:** `ai-studio-sparkcollegeeven-05bc75fe-6c80-4978-9097-fc873030fc5d`
- **Primary Admin:** `hrssuryavanshi135@gmail.com`

| Collection | Key Fields |
| :--- | :--- |
| `events` | `id`, `title`, `tag`, `status` (`upcoming` \| `ongoing` \| `past`), `date`, `time`, `place`, `tags`, `image`, `description`, `registration_open`, `created_at`, `updated_at` |
| `event_registrations` | `id`, `user_id`, `event_id`, `student_details`, `attendance_status` (`registered` \| `attended` \| `absent`), `created_at` |
| `profiles` | `id`, `username`, `full_name`, `department`, `division`, `batch`, `year`, `date_of_birth`, `college`, `phone`, `avatar_url`, `created_at`, `updated_at` |
| `clubs` | `id`, `name`, `member_count` |
| `club_memberships` | `id`, `user_id`, `club_id`, `created_at` |
| `club_suggestions` | `id`, `user_id`, `club_name`, `category`, `reason`, `status` (`pending` \| `approved` \| `declined`), `admin_note`, `created_at` |
| `admins` | `id`, `email`, `name`, `role` (`super_admin` \| `admin`), `added_by`, `created_at` |
| `student_ideas` / `ideas` | `id`, `user_id`, `title`, `category`, `description`, `status`, `admin_note`, `created_at` *(optional)* |
| `announcements` | `id`, `title`, `message`, `audience`, `created_by`, `created_at` *(optional)* |

---

## 📁 Project Structure

```text
├── firebase-applet-config.json   # Public Firebase Web SDK & named Firestore config
├── index.html                    # Entry HTML & Google Fonts
├── package.json
├── vite.config.ts
└── src/
    ├── App.tsx                   # Workspace router, header CTAs & toast notifications
    ├── firebase.ts               # Firebase Auth & named Firestore initialization
    ├── index.css                 # Tailwind v4 theme & typography tokens
    ├── context/
    │   └── SparkAuthContext.tsx  # Google Sign-In & /admins verification gate
    ├── hooks/
    │   └── useSparkData.ts       # Real-time Firestore listeners & CRUD mutations
    ├── lib/
    │   ├── firestoreError.ts     # Structured Firestore error reporting
    │   └── formatters.ts         # Timestamp, tag, initials & CSV export helpers
    ├── types/
    │   └── spark.ts              # Shared TypeScript collection interfaces
    ├── components/               # SidebarLayout, AdminSignInGate, SVG illustrations, Modals
    └── views/                    # Overview, Events, Registrations, Students, Clubs, Ideas, Announcements, Admins
```

---

## ⚙️ Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Locally

```bash
npm run dev
```

Open `http://localhost:3000` and sign in with `hrssuryavanshi135@gmail.com` or an authorized coordinator Google account listed in `/admins`.

### 3. Type-Check & Build

```bash
npm run lint
npm run build
```

---

## 🌐 Deployment Checklist

- When deploying to an external host (Vercel, Netlify, Firebase Hosting, etc.), add your production domain under **Firebase Console → Authentication → Settings → Authorized domains** for project `collective-flare-s91ww`.
- Keep `firebase-applet-config.json` targeting `ai-studio-sparkcollegeeven-05bc75fe-6c80-4978-9097-fc873030fc5d` so the Admin Portal stays synced with the Student Portal.

---

## 📌 Project Status

🟢 **Active Development**  
The Spark Admin Portal (Google Sign-In Admin Gate, Overview Dashboard, Events Management, Registrations & Attendance with CSV Export, Student Directory, Communities & Club Requests, Student Ideas, Announcements, Admin Team Manager, and Shared Firestore Backend) is complete and operational.

---

## 🧑‍💻 Developer

**Harsh Suryavanshi ([@harshsuryavanshi2006](https://github.com/harshsuryavanshi2006))**

---

*This project is developed for campus collaboration, educational, and learning purposes.*
