# CampusConnect — Entity Relationship (ER) Diagram

The diagram below is written in Mermaid (renders on GitHub) and reflects the exact schema
implemented in `prisma/schema.prisma`.

```mermaid
erDiagram
    DEPARTMENT ||--o{ USER : "employs"
    DEPARTMENT ||--o{ COMPLAINT : "handles"
    USER ||--o{ COMPLAINT : "files"
    USER ||--o{ COMPLAINT_UPDATE : "writes"
    USER ||--o{ BOOKING : "makes"
    USER ||--o{ NOTIFICATION : "receives"
    USER ||--o{ AUDIT_LOG : "performs"
    CATEGORY ||--o{ COMPLAINT : "classifies"
    COMPLAINT ||--o{ COMPLAINT_UPDATE : "has"
    RESOURCE ||--o{ BOOKING : "is reserved via"

    DEPARTMENT {
      int id PK
      string code UK
      string name UK
      string description
      datetime createdAt
    }

    USER {
      int id PK
      string email UK
      string passwordHash
      string name
      enum role
      string phone
      int departmentId FK
      datetime createdAt
      datetime updatedAt
    }

    CATEGORY {
      int id PK
      string name UK
      string description
      datetime createdAt
    }

    COMPLAINT {
      int id PK
      string title
      text description
      enum status
      enum priority
      int userId FK
      int categoryId FK
      int departmentId FK
      datetime createdAt
      datetime updatedAt
      datetime resolvedAt
    }

    COMPLAINT_UPDATE {
      int id PK
      int complaintId FK
      int userId FK
      text comment
      enum statusFrom
      enum statusTo
      datetime createdAt
    }

    RESOURCE {
      int id PK
      string name
      enum type
      string location
      int capacity
      enum status
      string description
      datetime createdAt
    }

    BOOKING {
      int id PK
      int resourceId FK
      int userId FK
      datetime startTime
      datetime endTime
      string purpose
      enum status
      datetime createdAt
    }

    NOTIFICATION {
      int id PK
      int userId FK
      string title
      text message
      bool isRead
      datetime createdAt
    }

    AUDIT_LOG {
      int id PK
      int userId FK
      string action
      string entity
      int entityId
      string ipAddress
      datetime createdAt
    }
```

## Relationship Summary

| # | Relationship | Cardinality | Type |
|---|---|---|---|
| 1 | Department — User | 1 : N | One department employs many staff users |
| 2 | Department — Complaint | 1 : N | One department handles many complaints |
| 3 | User — Complaint | 1 : N | One user files many complaints |
| 4 | Category — Complaint | 1 : N | One category classifies many complaints |
| 5 | Complaint — ComplaintUpdate | 1 : N | One complaint has many updates |
| 6 | User — ComplaintUpdate | 1 : N | One user writes many updates |
| 7 | Resource — Booking | 1 : N | One resource has many bookings |
| 8 | User — Booking | 1 : N | One user makes many bookings |
| 9 | User — Notification | 1 : N | One user receives many notifications |
| 10 | User — AuditLog | 1 : N | One user performs many actions |

## Primary Entities

1. **User** — all campus members (single table, `role` column distinguishes Admin/Staff/Student)
2. **Department** — organisational units that resolve complaints
3. **Category** — complaint classification
4. **Complaint** — reported campus issues
5. **Resource** — bookable rooms/labs/equipment/vehicles
6. **Booking** — resource reservations
7. **ComplaintUpdate** — complaint status history
8. **Notification** — user alerts
9. **AuditLog** — security/audit trail
