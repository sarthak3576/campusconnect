# CampusConnect — Data Dictionary

## User

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Login email address |
| passwordHash | VARCHAR(255) | NOT NULL | BCrypt-hashed password |
| name | VARCHAR(100) | NOT NULL | Full name |
| role | ENUM | NOT NULL, DEFAULT 'STUDENT' | ADMIN / STAFF / STUDENT (RBAC) |
| phone | VARCHAR(20) | NULL | Contact number |
| departmentId | INT | FK → Department.id, ON DELETE SET NULL | Department for staff users |
| createdAt | DATETIME | NOT NULL, DEFAULT NOW | Creation timestamp |
| updatedAt | DATETIME | NOT NULL | Last update timestamp |

Indexes: `role`, `departmentId`.

## Department

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| code | VARCHAR(20) | UNIQUE, NOT NULL | Short department code |
| name | VARCHAR(100) | UNIQUE, NOT NULL | Department name |
| description | TEXT | NULL | Description |
| createdAt | DATETIME | NOT NULL, DEFAULT NOW | Creation timestamp |

## Category

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| name | VARCHAR(100) | UNIQUE, NOT NULL | Category name |
| description | TEXT | NULL | Description |
| createdAt | DATETIME | NOT NULL, DEFAULT NOW | Creation timestamp |

## Complaint

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| title | VARCHAR(200) | NOT NULL | Complaint title |
| description | TEXT | NOT NULL | Detailed description |
| status | ENUM | NOT NULL, DEFAULT 'OPEN' | OPEN / IN_PROGRESS / RESOLVED / REJECTED / CLOSED |
| priority | ENUM | NOT NULL, DEFAULT 'MEDIUM' | LOW / MEDIUM / HIGH / URGENT |
| userId | INT | FK → User.id, ON DELETE CASCADE | Who filed the complaint |
| categoryId | INT | FK → Category.id, ON DELETE RESTRICT | Complaint category |
| departmentId | INT | FK → Department.id, ON DELETE SET NULL | Assigned department |
| createdAt | DATETIME | NOT NULL, DEFAULT NOW | Filing timestamp |
| updatedAt | DATETIME | NOT NULL | Last update timestamp |
| resolvedAt | DATETIME | NULL | When resolved |

Indexes: `status`, `priority`, `userId`, `categoryId`, `departmentId`.

## ComplaintUpdate

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| complaintId | INT | FK → Complaint.id, ON DELETE CASCADE | Parent complaint |
| userId | INT | FK → User.id, ON DELETE CASCADE | Who wrote the update |
| comment | TEXT | NOT NULL | Update text |
| statusFrom | ENUM | NULL | Previous status |
| statusTo | ENUM | NULL | New status |
| createdAt | DATETIME | NOT NULL, DEFAULT NOW | Timestamp |

Index: `complaintId`.

## Resource

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| name | VARCHAR(150) | NOT NULL | Resource name |
| type | ENUM | NOT NULL | ROOM / EQUIPMENT / LAB / VEHICLE / SPORT |
| location | VARCHAR(150) | NULL | Physical location |
| capacity | INT | NULL | Max capacity |
| status | ENUM | NOT NULL, DEFAULT 'AVAILABLE' | AVAILABLE / MAINTENANCE / UNAVAILABLE |
| description | TEXT | NULL | Description |
| createdAt | DATETIME | NOT NULL, DEFAULT NOW | Creation timestamp |

Indexes: `type`, `status`.

## Booking

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| resourceId | INT | FK → Resource.id, ON DELETE CASCADE | Booked resource |
| userId | INT | FK → User.id, ON DELETE CASCADE | Who booked |
| startTime | DATETIME | NOT NULL | Booking start |
| endTime | DATETIME | NOT NULL | Booking end |
| purpose | VARCHAR(255) | NULL | Purpose of booking |
| status | ENUM | NOT NULL, DEFAULT 'PENDING' | PENDING / APPROVED / REJECTED / CANCELLED / COMPLETED |
| createdAt | DATETIME | NOT NULL, DEFAULT NOW | Creation timestamp |

Indexes: `resourceId`, `userId`, `status`, `(startTime, endTime)`.

## Notification

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| userId | INT | FK → User.id, ON DELETE CASCADE | Recipient |
| title | VARCHAR(150) | NOT NULL | Notification title |
| message | TEXT | NOT NULL | Notification body |
| isRead | BOOLEAN | NOT NULL, DEFAULT FALSE | Read flag |
| createdAt | DATETIME | NOT NULL, DEFAULT NOW | Timestamp |

Index: `(userId, isRead)`.

## AuditLog

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| userId | INT | FK → User.id, ON DELETE SET NULL | Acting user |
| action | VARCHAR(100) | NOT NULL | CREATE / UPDATE / DELETE / RESOLVE |
| entity | VARCHAR(100) | NOT NULL | Affected entity/table |
| entityId | INT | NULL | Affected record id |
| ipAddress | VARCHAR(45) | NULL | Client IP address |
| createdAt | DATETIME | NOT NULL, DEFAULT NOW | Timestamp |

Indexes: `(entity, entityId)`, `createdAt`.

## Enumerations

| Enum | Values |
|---|---|
| Role | ADMIN, STAFF, STUDENT |
| ComplaintStatus | OPEN, IN_PROGRESS, RESOLVED, REJECTED, CLOSED |
| Priority | LOW, MEDIUM, HIGH, URGENT |
| ResourceType | ROOM, EQUIPMENT, LAB, VEHICLE, SPORT |
| ResourceStatus | AVAILABLE, MAINTENANCE, UNAVAILABLE |
| BookingStatus | PENDING, APPROVED, REJECTED, CANCELLED, COMPLETED |
