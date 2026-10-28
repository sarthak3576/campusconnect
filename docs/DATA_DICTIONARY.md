# CampusConnect — Relational Data Dictionary

This data dictionary details the tables, column specifications, primary/foreign keys, and constraints defined in PostgreSQL 16.

---

### 1. `users`
Stores all campus participants (Students, Maintenance Staff, and System Administrators).

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | **PK**, DEFAULT `gen_random_uuid()` | Unique user identifier |
| `email` | `VARCHAR(255)` | **NOT NULL**, **UNIQUE** | Campus email credential |
| `password_hash` | `VARCHAR(255)` | **NOT NULL** | BCrypt encrypted password string |
| `first_name` | `VARCHAR(100)` | **NOT NULL** | User given name |
| `last_name` | `VARCHAR(100)` | **NOT NULL** | User family name |
| `role` | `user_role` | **NOT NULL**, DEFAULT `'STUDENT'` | Enum: `STUDENT`, `STAFF`, `ADMIN` |
| `department` | `VARCHAR(150)` | Nullable | Academic or maintenance department |
| `phone` | `VARCHAR(20)` | Nullable | Contact number |
| `avatar_url` | `VARCHAR(500)` | Nullable | Profile avatar image link |
| `is_active` | `BOOLEAN` | **NOT NULL**, DEFAULT `TRUE` | Soft deletion / status toggle |
| `created_at` | `TIMESTAMPTZ` | **NOT NULL**, DEFAULT `NOW()` | Registration timestamp |
| `updated_at` | `TIMESTAMPTZ` | **NOT NULL**, DEFAULT `NOW()` | Last profile update timestamp |

---

### 2. `complaint_categories`
Classification schema for campus facility issues.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | **PK**, DEFAULT `gen_random_uuid()` | Unique category identifier |
| `name` | `VARCHAR(100)` | **NOT NULL**, **UNIQUE** | e.g., Plumbing, Electrical, IT & Network |
| `description`| `TEXT` | Nullable | Category scope details |
| `icon` | `VARCHAR(50)` | Nullable | Lucide UI icon identifier |
| `is_active` | `BOOLEAN` | **NOT NULL**, DEFAULT `TRUE` | Category availability toggle |
| `created_at` | `TIMESTAMPTZ` | **NOT NULL**, DEFAULT `NOW()` | Creation timestamp |

---

### 3. `complaints`
Primary repository of student grievances regarding facilities.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | **PK**, DEFAULT `gen_random_uuid()` | Unique grievance identifier |
| `title` | `VARCHAR(200)` | **NOT NULL** | Summary of the issue |
| `description` | `TEXT` | **NOT NULL** | Detailed problem description |
| `category_id` | `UUID` | **FK** `complaint_categories(id)` | Classification reference |
| `submitted_by`| `UUID` | **FK** `users(id)` | Student who lodged grievance |
| `assigned_to` | `UUID` | **FK** `users(id)`, Nullable | Maintenance technician handling ticket |
| `priority` | `complaint_priority`| **NOT NULL**, DEFAULT `'MEDIUM'` | Enum: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `status` | `complaint_status` | **NOT NULL**, DEFAULT `'OPEN'` | Enum: `OPEN`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` |
| `location_block` | `VARCHAR(50)` | Nullable | Building name (e.g. Technology Tower) |
| `location_floor` | `VARCHAR(10)` | Nullable | Floor identifier (e.g. 3rd Floor) |
| `location_room` | `VARCHAR(20)` | Nullable | Room or desk number (e.g. TT-312) |
| `resolved_at` | `TIMESTAMPTZ` | Nullable | Timestamp when issue was resolved |
| `created_at` | `TIMESTAMPTZ` | **NOT NULL**, DEFAULT `NOW()` | Submission timestamp |
| `updated_at` | `TIMESTAMPTZ` | **NOT NULL**, DEFAULT `NOW()` | Last modification timestamp |

---

### 4. `complaint_status_history`
Audit trail of status transitions for each complaint.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | **PK**, DEFAULT `gen_random_uuid()` | Unique history event ID |
| `complaint_id` | `UUID` | **FK** `complaints(id)` ON DELETE CASCADE | Target complaint |
| `old_status` | `complaint_status` | Nullable | Previous lifecycle state |
| `new_status` | `complaint_status` | **NOT NULL** | New lifecycle state |
| `changed_by` | `UUID` | **FK** `users(id)` | User triggering transition |
| `remarks` | `TEXT` | Nullable | Explanation / work order notes |
| `created_at` | `TIMESTAMPTZ` | **NOT NULL**, DEFAULT `NOW()` | Transition event timestamp |

---

### 5. `complaint_comments`
Discussion and work log thread on complaints.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | **PK**, DEFAULT `gen_random_uuid()` | Unique comment ID |
| `complaint_id` | `UUID` | **FK** `complaints(id)` ON DELETE CASCADE | Associated ticket |
| `author_id` | `UUID` | **FK** `users(id)` | User who posted message |
| `content` | `TEXT` | **NOT NULL** | Comment body |
| `is_internal` | `BOOLEAN` | **NOT NULL**, DEFAULT `FALSE` | When true, visible only to staff/admin |
| `created_at` | `TIMESTAMPTZ` | **NOT NULL**, DEFAULT `NOW()` | Post timestamp |

---

### 6. `complaint_feedback`
Student post-resolution evaluation ratings.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | **PK**, DEFAULT `gen_random_uuid()` | Unique feedback record ID |
| `complaint_id` | `UUID` | **FK** `complaints(id)` **UNIQUE** | 1:1 relation with complaint |
| `user_id` | `UUID` | **FK** `users(id)` | Evaluating student |
| `rating` | `SMALLINT` | **NOT NULL**, CHECK (`rating BETWEEN 1 AND 5`) | 1 to 5 star rating |
| `comment` | `TEXT` | Nullable | Optional written critique |
| `created_at` | `TIMESTAMPTZ` | **NOT NULL**, DEFAULT `NOW()` | Submission timestamp |

---

### 7. `resource_types`
Classification of bookable facilities.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | **PK**, DEFAULT `gen_random_uuid()` | Unique type identifier |
| `name` | `VARCHAR(100)` | **NOT NULL**, **UNIQUE** | e.g. Laboratory, Seminar Hall, Study Room |
| `description` | `TEXT` | Nullable | General type description |
| `icon` | `VARCHAR(50)` | Nullable | UI icon symbol |

---

### 8. `resources`
Physical university facilities available for reservation.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | **PK**, DEFAULT `gen_random_uuid()` | Unique resource identifier |
| `name` | `VARCHAR(200)` | **NOT NULL** | Facility title |
| `type_id` | `UUID` | **FK** `resource_types(id)` | Type classification |
| `description` | `TEXT` | Nullable | Equipment & facility specifications |
| `location_block` | `VARCHAR(50)` | Nullable | Building name |
| `location_room` | `VARCHAR(20)` | Nullable | Specific room identifier |
| `capacity` | `INT` | Nullable | Seating capacity |
| `amenities` | `TEXT[]` | Nullable | Array of features (e.g. AC, Projector) |
| `is_available` | `BOOLEAN` | **NOT NULL**, DEFAULT `TRUE` | Availability flag |
| `open_time` | `TIME` | **NOT NULL**, DEFAULT `'08:00'` | Daily opening time |
| `close_time` | `TIME` | **NOT NULL**, DEFAULT `'20:00'` | Daily closing time |

---

### 9. `reservations`
Bookings of labs, halls, and study suites with overlap conflict constraints.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | **PK**, DEFAULT `gen_random_uuid()` | Unique reservation ID |
| `resource_id` | `UUID` | **FK** `resources(id)` | Booked facility |
| `user_id` | `UUID` | **FK** `users(id)` | Booking student or faculty |
| `title` | `VARCHAR(200)` | **NOT NULL** | Purpose of reservation |
| `start_time` | `TIMESTAMPTZ` | **NOT NULL** | Booking slot start |
| `end_time` | `TIMESTAMPTZ` | **NOT NULL**, CHECK (`end_time > start_time`) | Booking slot end |
| `status` | `reservation_status` | **NOT NULL**, DEFAULT `'PENDING'` | `PENDING`, `CONFIRMED`, `CANCELLED` |
| `notes` | `TEXT` | Nullable | Equipment requirements |
| `cancelled_at`| `TIMESTAMPTZ` | Nullable | Cancellation timestamp |

---

### 10. `notifications`
Real-time alerts delivered to student and staff inboxes.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | **PK**, DEFAULT `gen_random_uuid()` | Unique notification ID |
| `user_id` | `UUID` | **FK** `users(id)` ON DELETE CASCADE | Recipient user |
| `type` | `notification_type` | **NOT NULL** | Alert type |
| `title` | `VARCHAR(200)` | **NOT NULL** | Notification headline |
| `message` | `TEXT` | **NOT NULL** | Detailed alert body |
| `link` | `VARCHAR(500)` | Nullable | In-app navigation route |
| `is_read` | `BOOLEAN` | **NOT NULL**, DEFAULT `FALSE` | Read acknowledgement |

---

### 11. `resource_maintenance`
Scheduled downtime records for campus facilities.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | **PK**, DEFAULT `gen_random_uuid()` | Unique maintenance task ID |
| `resource_id` | `UUID` | **FK** `resources(id)` | Affected facility |
| `scheduled_by`| `UUID` | **FK** `users(id)` | Staff member who scheduled |
| `title` | `VARCHAR(200)` | **NOT NULL** | Maintenance description |
| `start_date` | `DATE` | **NOT NULL** | Scheduled start date |
| `end_date` | `DATE` | **NOT NULL**, CHECK (`end_date >= start_date`) | Scheduled completion date |
| `status` | `maintenance_status`| **NOT NULL**, DEFAULT `'SCHEDULED'` | Scheduled, in progress, done |

---

### 12. `audit_logs`
System-wide immutable security and activity log.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | **PK**, DEFAULT `gen_random_uuid()` | Unique audit event ID |
| `user_id` | `UUID` | **FK** `users(id)`, Nullable | Actor triggering action |
| `action` | `VARCHAR(100)` | **NOT NULL** | e.g. `LOGIN`, `CREATE`, `UPDATE_STATUS` |
| `entity_type` | `VARCHAR(50)` | Nullable | Target entity type (`COMPLAINT`, `USER`) |
| `entity_id` | `UUID` | Nullable | Target entity identifier |
| `details` | `JSONB` | Nullable | Structured payload context |
| `ip_address` | `INET` | Nullable | Client IP address |
| `created_at` | `TIMESTAMPTZ` | **NOT NULL**, DEFAULT `NOW()` | Event timestamp |
