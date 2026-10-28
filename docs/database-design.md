# CampusConnect — Database Design

## Relational Schema

Primary keys are **underlined**, foreign keys are marked with **(FK)**.

```
Department(id, code, name, description, createdAt)

User(id, email, passwordHash, name, role, phone, departmentId(FK), createdAt, updatedAt)

Category(id, name, description, createdAt)

Complaint(id, title, description, status, priority, userId(FK), categoryId(FK),
          departmentId(FK), createdAt, updatedAt, resolvedAt)

ComplaintUpdate(id, complaintId(FK), userId(FK), comment, statusFrom, statusTo, createdAt)

Resource(id, name, type, location, capacity, status, description, createdAt)

Booking(id, resourceId(FK), userId(FK), startTime, endTime, purpose, status, createdAt)

Notification(id, userId(FK), title, message, isRead, createdAt)

AuditLog(id, userId(FK), action, entity, entityId, ipAddress, createdAt)
```

## Normalization (3NF)

### First Normal Form (1NF)
Every column holds a single atomic value; no repeating groups. Enum columns store one value
per row. Multi-valued data (e.g., a complaint's many status updates) is moved into the
separate `ComplaintUpdate` table rather than stored as a list.

### Second Normal Form (2NF)
All non-key attributes depend on the **whole** primary key. Every table has a single-column
surrogate primary key, so partial dependency cannot occur. Attributes like `categoryId` and
`priority` on `Complaint` depend on the whole `Complaint` row, not on part of a composite key.

### Third Normal Form (3NF)
No transitive dependencies. For example:
- `Complaint` stores `categoryId` (a foreign key to `Category`) instead of duplicating the
  category *name* — so the category name is not transitively dependent through `Complaint.id`.
- `Booking` stores `resourceId` and `userId` instead of copying the resource name or user name.
- `ComplaintUpdate` stores only the previous/next status (`statusFrom`/`statusTo`), not the
  whole complaint snapshot.

## Referential Integrity (Foreign Keys)

| Table | FK | References | On Delete |
|---|---|---|---|
| User | departmentId | Department.id | SET NULL |
| Complaint | userId | User.id | CASCADE |
| Complaint | categoryId | Category.id | RESTRICT |
| Complaint | departmentId | Department.id | SET NULL |
| ComplaintUpdate | complaintId | Complaint.id | CASCADE |
| ComplaintUpdate | userId | User.id | CASCADE |
| Booking | resourceId | Resource.id | CASCADE |
| Booking | userId | User.id | CASCADE |
| Notification | userId | User.id | CASCADE |
| AuditLog | userId | User.id | SET NULL |

## Views, Stored Procedures & Triggers

Defined in `prisma/sql/advanced.sql`:

- **Views**: `v_complaint_summary`, `v_resource_utilization`, `v_complaint_stats`
- **Stored Procedures**: `sp_complaints_by_category`, `sp_resolve_complaint`
- **Triggers**: `trg_booking_overlap_check`, `trg_complaint_notify`, `trg_complaint_status_notify`

## Indexes

Indexes are created on foreign keys and frequently filtered columns:
- `User(role)`, `User(departmentId)`
- `Complaint(status)`, `Complaint(priority)`, `Complaint(userId)`, `Complaint(categoryId)`, `Complaint(departmentId)`
- `ComplaintUpdate(complaintId)`
- `Resource(type)`, `Resource(status)`
- `Booking(resourceId)`, `Booking(userId)`, `Booking(status)`, `Booking(startTime, endTime)`
- `Notification(userId, isRead)`
- `AuditLog(entity, entityId)`, `AuditLog(createdAt)`
