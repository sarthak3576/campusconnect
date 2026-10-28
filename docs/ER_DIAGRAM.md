# CampusConnect — Entity Relationship (ER) Diagram & Normalization

## Course Project: Database Systems (BCSE307L)

### 1. Architectural ER Diagram (Mermaid)

```mermaid
erDiagram
    USERS ||--o{ COMPLAINTS : "submits (1:N)"
    USERS ||--o{ COMPLAINTS : "is assigned to (0:N)"
    USERS ||--o{ COMPLAINT_COMMENTS : "authors (1:N)"
    USERS ||--o{ COMPLAINT_STATUS_HISTORY : "records (1:N)"
    USERS ||--o{ COMPLAINT_FEEDBACK : "submits (1:1)"
    USERS ||--o{ RESERVATIONS : "books (1:N)"
    USERS ||--o{ NOTIFICATIONS : "receives (1:N)"
    USERS ||--o{ RESOURCE_MAINTENANCE : "schedules (1:N)"
    USERS ||--o{ AUDIT_LOGS : "triggers (0:N)"

    COMPLAINT_CATEGORIES ||--o{ COMPLAINTS : "classifies (1:N)"

    COMPLAINTS ||--o{ COMPLAINT_STATUS_HISTORY : "tracks timeline (1:N)"
    COMPLAINTS ||--o{ COMPLAINT_COMMENTS : "has discussion (1:N)"
    COMPLAINTS ||--o| COMPLAINT_FEEDBACK : "receives rating (1:1)"

    RESOURCE_TYPES ||--o{ RESOURCES : "categorizes (1:N)"

    RESOURCES ||--o{ RESERVATIONS : "is booked for (1:N)"
    RESOURCES ||--o{ RESOURCE_MAINTENANCE : "undergoes (0:N)"

    USERS {
        UUID id PK
        VARCHAR email UK
        VARCHAR password_hash
        VARCHAR first_name
        VARCHAR last_name
        ENUM role
        VARCHAR department
        VARCHAR phone
        BOOLEAN is_active
        TIMESTAMPTZ created_at
    }

    COMPLAINT_CATEGORIES {
        UUID id PK
        VARCHAR name UK
        TEXT description
        VARCHAR icon
        BOOLEAN is_active
    }

    COMPLAINTS {
        UUID id PK
        VARCHAR title
        TEXT description
        UUID category_id FK
        UUID submitted_by FK
        UUID assigned_to FK
        ENUM priority
        ENUM status
        VARCHAR location_block
        VARCHAR location_room
        TIMESTAMPTZ resolved_at
        TIMESTAMPTZ created_at
    }

    COMPLAINT_STATUS_HISTORY {
        UUID id PK
        UUID complaint_id FK
        ENUM old_status
        ENUM new_status
        UUID changed_by FK
        TEXT remarks
        TIMESTAMPTZ created_at
    }

    COMPLAINT_COMMENTS {
        UUID id PK
        UUID complaint_id FK
        UUID author_id FK
        TEXT content
        BOOLEAN is_internal
        TIMESTAMPTZ created_at
    }

    COMPLAINT_FEEDBACK {
        UUID id PK
        UUID complaint_id FK,UK
        UUID user_id FK
        SMALLINT rating
        TEXT comment
        TIMESTAMPTZ created_at
    }

    RESOURCE_TYPES {
        UUID id PK
        VARCHAR name UK
        TEXT description
        VARCHAR icon
    }

    RESOURCES {
        UUID id PK
        VARCHAR name
        UUID type_id FK
        VARCHAR location_block
        VARCHAR location_room
        INT capacity
        BOOLEAN is_available
        TIME open_time
        TIME close_time
    }

    RESERVATIONS {
        UUID id PK
        UUID resource_id FK
        UUID user_id FK
        VARCHAR title
        TIMESTAMPTZ start_time
        TIMESTAMPTZ end_time
        ENUM status
        TEXT notes
    }

    NOTIFICATIONS {
        UUID id PK
        UUID user_id FK
        ENUM type
        VARCHAR title
        TEXT message
        BOOLEAN is_read
        TIMESTAMPTZ created_at
    }

    RESOURCE_MAINTENANCE {
        UUID id PK
        UUID resource_id FK
        UUID scheduled_by FK
        DATE start_date
        DATE end_date
        ENUM status
    }

    AUDIT_LOGS {
        UUID id PK
        UUID user_id FK
        VARCHAR action
        VARCHAR entity_type
        UUID entity_id
        JSONB details
        TIMESTAMPTZ created_at
    }
```

---

### 2. Normalization Analysis (Third Normal Form - 3NF)

#### First Normal Form (1NF) Compliance:
- Every table has a distinct Primary Key (UUID).
- All columns contain atomic, indivisible values. Repeating groups have been separated into child relational tables (`complaint_comments`, `complaint_status_history`).

#### Second Normal Form (2NF) Compliance:
- The database is in 1NF.
- All non-key attributes are fully functionally dependent on the entire primary key (no partial dependencies on composite keys).

#### Third Normal Form (3NF) Compliance:
- The database is in 2NF.
- There are **no transitive dependencies** ($X \to Y$ and $Y \to Z$ where $X$ is primary key):
  - Category details (`name`, `icon`) are stored in `complaint_categories`, referenced via `category_id` in `complaints`.
  - Resource type specifications are isolated in `resource_types`, referenced via `type_id` in `resources`.
  - Submitter & staff details are referenced through foreign keys pointing to `users`.
