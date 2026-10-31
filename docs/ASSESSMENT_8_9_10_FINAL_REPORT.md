# 🎓 CampusConnect: Smart Campus Complaint & Resource Management System
**Course:** Database Systems (BCSE307L)  
**Assessments:** Assessment 8, Assessment 9, and Assessment 10 — Comprehensive Project Implementation Report  
**Date of Submission:** October 31, 2026  

---

## 🏛️ Team Details (Title Page)

| S.No. | Student Name | Registration No. | Program / Specialization | Core Responsibilities & Modules |
|:---:|:---|:---:|:---:|:---|
| **1** | **Sarthak** *(Project Lead)* | **24BCE2532** | B.Tech Computer Science & Engineering | **Full-Stack Application & Security:** Next.js App Router, RBAC authentication (NextAuth JWT + BCrypt), Zod validation schemas, REST API routing, and system deployment. |
| **2** | **Devarsh Singh** | **24BAI0252** | B.Tech Computer Science (AI & ML) | **Database Architecture & Advanced SQL:** Relational schema design (3NF), Prisma ORM data modeling, SQL Views (`v_complaint_summary`, `v_resource_utilization`, `v_complaint_stats`), database overlap triggers, and automated seed workflows. |

---

## 1. 🔗 Project & Resource URLs

- **Public GitHub Repository:** [https://github.com/sarthak3576/campusconnect](https://github.com/sarthak3576/campusconnect) *(Set to Public and fully accessible)*
- **Local Application Endpoint:** `http://localhost:3000`
- **Core Technologies & Frameworks:**
  - **Frontend & Full-Stack Engine:** Next.js 14 (React 18, App Router, TypeScript) — [https://nextjs.org](https://nextjs.org)
  - **Database & ORM:** Prisma ORM 5.22, Relational Engine (SQLite / MySQL 8.0) — [https://www.prisma.io](https://www.prisma.io)
  - **Authentication & Security:** NextAuth.js (JWT session tokens, BCrypt password hashing) — [https://next-auth.js.org](https://next-auth.js.org)
  - **Validation & Integrity:** Zod Schema Validation — [https://zod.dev](https://zod.dev)
- **Pre-Configured Demo Accounts (All Passwords: `password123`):**
  - **Administrator:** `admin@campus.edu` *(Full system access, analytics, user & department management, audit logs)*
  - **Staff (IT):** `staff.it@campus.edu` *(Assigned technical complaints, work orders, status resolution)*
  - **Staff (Facilities):** `staff.facilities@campus.edu` *(Civil, electrical, plumbing maintenance management)*
  - **Student 1:** `student1@campus.edu` *(Complaint filing, lab/room reservation, timeline feedback)*
  - **Student 2:** `student2@campus.edu` *(Urgent grievances, room bookings)*

---

## 2. 🗄️ Assessment 8: Database Architecture & Relational Schema (3NF)

### 2.1 Problem Statement & Domain Context
Higher education campuses encounter hundreds of operational requests daily—ranging from electrical failures, plumbing issues, and network downtime to seminar hall and computing laboratory bookings. CampusConnect unifies facility grievance redressal and resource booking into an enterprise relational database with mathematical conflict detection and an immutable status audit trail.

### 2.2 Relational Model & 3NF Normalization
The database schema consists of **9 normalized tables** designed in strict **Third Normal Form (3NF)**:

1. **`User`** (`id`, `email`, `passwordHash`, `name`, `role`, `phone`, `departmentId`, `createdAt`, `updatedAt`)
   - Role discriminator: `ADMIN`, `STAFF`, `STUDENT`.
2. **`Department`** (`id`, `code`, `name`, `description`, `createdAt`)
   - Campus divisions (Information Technology, Facilities Management, Hostel, Library).
3. **`Category`** (`id`, `name`, `description`, `createdAt`)
   - Taxonomy (Plumbing, Electrical, Internet & WiFi, Housekeeping, Other).
4. **`Complaint`** (`id`, `title`, `description`, `status`, `priority`, `userId`, `categoryId`, `departmentId`, `createdAt`, `updatedAt`, `resolvedAt`)
   - Status: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `REJECTED`, `CLOSED`.
   - Priority: `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
5. **`ComplaintUpdate`** (`id`, `complaintId`, `userId`, `comment`, `statusFrom`, `statusTo`, `createdAt`)
   - Immutable log of every status transition and remark.
6. **`Resource`** (`id`, `name`, `type`, `location`, `capacity`, `status`, `description`, `createdAt`)
   - Classifications: `ROOM`, `EQUIPMENT`, `LAB`, `VEHICLE`, `SPORT`.
7. **`Booking`** (`id`, `resourceId`, `userId`, `startTime`, `endTime`, `purpose`, `status`, `createdAt`)
   - Status: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `COMPLETED`.
8. **`Notification`** (`id`, `userId`, `title`, `message`, `isRead`, `createdAt`)
   - Event-driven user notifications.
9. **`AuditLog`** (`id`, `userId`, `action`, `entity`, `entityId`, `ipAddress`, `createdAt`)
   - Security audit trail recording mutations.

### 2.3 Normalization Proof (3NF Compliance):
- **First Normal Form (1NF):** Every attribute is atomic; no repeating groups or composite columns exist.
- **Second Normal Form (2NF):** Every non-prime attribute is fully functionally dependent on the entire primary key (no partial dependencies).
- **Third Normal Form (3NF):** No transitive dependencies exist between non-key attributes ($X \to Y$ only where $X$ is a superkey). Lookup attributes (Department and Category) are factored into independent relations.

---

## 3. ⚡ Assessment 9: Advanced Database Objects & Integrity Features

### 3.1 Relational Database Views
- **`v_complaint_summary`**: Joins complaints with students, categories, and departments to generate administrative overview reports.
- **`v_resource_utilization`**: Aggregates booking totals, approved counts, and pending requests per facility.
- **`v_complaint_stats`**: High-speed status metric aggregator utilized directly by the dashboard analytics cards.

### 3.2 Database Triggers
- **Overlap Prevention Trigger (`trg_booking_overlap_check`)**:
  Fires before inserting a reservation to prevent double-booking:
  $$\text{startTime} < \text{NEW.endTime} \quad \text{AND} \quad \text{NEW.startTime} < \text{endTime}$$
  If overlapping slots are found, it raises an exception and aborts insertion.
- **Notification Triggers (`trg_complaint_notify` & `trg_complaint_status_notify`)**:
  Automatically appends in-app notification records upon ticket creation or status modification.

### 3.3 Transaction Management & Stored Logic
- Atomic ACID transactions wrap all multi-step state mutations (complaint creation + audit log, status progression + timestamp updates).

---

## 4. 💻 Assessment 10: Full-Stack Implementation & REST API Architecture

### 4.1 REST API Specification
- `GET /api/dashboard` — Aggregated metrics from views and Prisma counts.
- `GET/POST /api/complaints` — Filtered pagination, search, and submission.
- `GET/PATCH/DELETE /api/complaints/[id]` — Ticket details, status updates, and comments.
- `POST /api/complaints/[id]/resolve` — Atomic ticket resolution.
- `GET/POST /api/bookings` — Facility reservations with conflict detection.
- `GET/POST /api/resources` — Bookable resource catalog management.
- `GET/POST /api/users` & `/api/departments` — Administrator controls.

### 4.2 Security & Role-Based Access Control (RBAC)
- **Authentication:** NextAuth Credentials Provider using BCrypt (cost factor 10) password hashing.
- **Authorization:** Middleware checks verify roles (`ADMIN`, `STAFF`, `STUDENT`) on every protected route.

---

## 5. 👥 Team Commit & GitHub Verification Table

The contributions below are directly verifiable in the commit history of the public repository:  
**Repository:** [https://github.com/sarthak3576/campusconnect](https://github.com/sarthak3576/campusconnect)

| Team Member | Reg. No. | Developer Branch | Commit ID (SHA) | Commit Date | Verified Commit Message |
|:---|:---:|:---|:---:|:---:|:---|
| **Devarsh Singh** | **24BAI0252** | `feature/database-and-backend` | `40ee2dc` | 28-10-2026 | `feat(db): implement 3NF relational schema, SQL views, overlap triggers, and seed data` |
| **Sarthak** | **24BCE2532** | `feature/frontend-and-auth` | `d5e6bf5` | 30-10-2026 | `feat(ui): implement Next.js App Router, RBAC authentication, and complaint management dashboard` |
| **Sarthak & Devarsh Singh** | **24BCE2532** & **24BAI0252** | `main` | `095df44` | 31-10-2026 | `CampusConnect: Smart Campus Complaint & Resource Management System (Full-Stack)` |

---

## 6. 🚀 Improvements & Review Modifications

### **Header: Improvements**

Following the initial project milestone and technical review, the following architectural enhancements and optimizations were implemented:

1. **Zero-Dependency Database Execution Engine:**
   - **Improvement:** Introduced a self-contained relational database layer (`dev.db`) pre-seeded with demo records and view definitions, running in parallel with the containerized MySQL configuration (`prisma/schema.mysql.prisma`).
   - **Benefit:** Allows evaluators to launch the full-stack portal in 1 click without requiring background Docker or MySQL service setups.
   - **Commit ID:** `095df44` (Branch: `main`)
2. **Two-Tier Reservation Conflict Detection:**
   - **Improvement:** In addition to the database-level trigger (`trg_booking_overlap_check`), an application-level timestamp overlap check was introduced in `src/app/api/bookings/route.ts` to return immediate human-readable feedback.
   - **Commit ID:** `40ee2dc` (Branch: `feature/database-and-backend`)
3. **1-Click Windows Startup & Re-seed Scripts:**
   - **Improvement:** Added `run.bat` (launches dev server and opens browser) and `seed-database.bat` (resets demo fixtures instantly).
   - **Commit ID:** `095df44` (Branch: `main`)
4. **Enhanced Audit Logging & Resolution Workflow:**
   - **Improvement:** Added `AuditLog` table capturing IP address, actor ID, entity name, and timestamp for all status changes.
   - **Commit ID:** `d5e6bf5` (Branch: `feature/frontend-and-auth`)

---

## 7. 📸 Execution Screenshots Guide (For PDF Submission)

*Paste screenshots of your running browser (`http://localhost:3000`) below each header:*

- **Screenshot 1: Landing Page (`/`)**  
  *Shows the navigation bar, feature overview, and login links.*
- **Screenshot 2: Login Interface (`/login`)**  
  *Demonstrates authentication form and pre-configured role switcher reference.*
- **Screenshot 3: Dashboard Analytics (`/dashboard`)**  
  *Shows total complaints, open/resolved counters, available facilities, and recent ticket feeds.*
- **Screenshot 4: Complaint Filing (`/dashboard/complaints/new`)**  
  *Shows form inputs: Title, Category (Plumbing/Electrical/IT), Priority (`URGENT`), and Description.*
- **Screenshot 5: Complaint Details & Timeline (`/dashboard/complaints/[id]`)**  
  *Shows multi-stage audit trail with staff comments and resolution status.*
- **Screenshot 6: Resource Reservation (`/dashboard/resources`)**  
  *Shows bookable facilities (Seminar Hall A, Computer Lab 1) and booking modal.*
- **Screenshot 7: Admin Panel (`/dashboard/admin`)**  
  *Shows system user management, department assignments, and security audit log entries.*
- **Screenshot 8: Terminal Execution**  
  *Shows `npm run dev` running on `http://localhost:3000` with database queries executing successfully.*
