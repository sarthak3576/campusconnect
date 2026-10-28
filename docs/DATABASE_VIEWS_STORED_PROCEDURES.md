# Database Views, Stored Procedures & Triggers

This document highlights the advanced SQL objects implemented in `database/init/01_schema.sql` fulfilling the database systems project requirements.

---

### 1. Database Views

#### `v_complaint_summary`
Aggregates complaint metrics across categories, priorities, and resolution times.
```sql
CREATE OR REPLACE VIEW v_complaint_summary AS
SELECT
    c.status,
    c.priority,
    cc.name AS category_name,
    COUNT(*)          AS total_complaints,
    COUNT(*) FILTER (WHERE c.resolved_at IS NOT NULL) AS resolved_count,
    AVG(EXTRACT(EPOCH FROM (c.resolved_at - c.created_at)) / 3600)
        FILTER (WHERE c.resolved_at IS NOT NULL) AS avg_resolution_hours
FROM complaints c
JOIN complaint_categories cc ON c.category_id = cc.id
GROUP BY c.status, c.priority, cc.name;
```

#### `v_resource_utilisation`
Computes utilization rates, confirmed bookings, and total booked hours per facility.
```sql
CREATE OR REPLACE VIEW v_resource_utilisation AS
SELECT
    r.id          AS resource_id,
    r.name        AS resource_name,
    rt.name       AS resource_type,
    COUNT(res.id) AS total_bookings,
    COUNT(res.id) FILTER (WHERE res.status = 'CONFIRMED')  AS confirmed_bookings,
    COUNT(res.id) FILTER (WHERE res.status = 'CANCELLED')  AS cancelled_bookings,
    SUM(EXTRACT(EPOCH FROM (res.end_time - res.start_time)) / 3600)
        FILTER (WHERE res.status = 'CONFIRMED') AS total_booked_hours
FROM resources r
JOIN resource_types rt ON r.type_id = rt.id
LEFT JOIN reservations res ON res.resource_id = r.id
GROUP BY r.id, r.name, rt.name;
```

---

### 2. Stored Procedure: `sp_assign_complaint`

Encapsulates row-level locking (`FOR UPDATE`), validation, status mutation, audit log creation, and staff notification in a single atomic database transaction.
```sql
CREATE OR REPLACE PROCEDURE sp_assign_complaint(
    p_complaint_id  UUID,
    p_staff_id      UUID,
    p_assigned_by   UUID
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_old_status complaint_status;
    v_title      VARCHAR(200);
BEGIN
    SELECT status, title INTO v_old_status, v_title
    FROM complaints
    WHERE id = p_complaint_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Complaint % does not exist', p_complaint_id;
    END IF;

    IF v_old_status NOT IN ('OPEN') THEN
        RAISE EXCEPTION 'Only OPEN complaints can be assigned (current status: %)', v_old_status;
    END IF;

    UPDATE complaints
    SET assigned_to = p_staff_id,
        status      = 'ASSIGNED',
        updated_at  = NOW()
    WHERE id = p_complaint_id;

    INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by, remarks)
    VALUES (p_complaint_id, v_old_status, 'ASSIGNED', p_assigned_by, 'Complaint assigned to staff member');

    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (p_staff_id, 'ASSIGNMENT', 'New complaint assigned', 'You have been assigned complaint: ' || v_title, '/complaints/' || p_complaint_id);
END;
$$;
```

---

### 3. Database Triggers

#### Trigger 1: `trg_complaint_status_change`
Automatically writes an entry to `audit_logs` whenever a complaint status changes and populates `resolved_at` when status becomes `RESOLVED`.
```sql
CREATE OR REPLACE FUNCTION fn_log_complaint_status_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
        VALUES (
            NEW.assigned_to,
            'STATUS_CHANGE',
            'COMPLAINT',
            NEW.id,
            jsonb_build_object('old_status', OLD.status::text, 'new_status', NEW.status::text)
        );

        IF NEW.status = 'RESOLVED' AND OLD.status <> 'RESOLVED' THEN
            NEW.resolved_at := NOW();
        END IF;
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_complaint_status_change
    BEFORE UPDATE ON complaints
    FOR EACH ROW
    EXECUTE FUNCTION fn_log_complaint_status_change();
```

#### Trigger 2: `trg_check_reservation_overlap`
Enforces time-range non-overlapping constraints at the database engine level to mathematically prevent double booking of labs or rooms.
```sql
CREATE OR REPLACE FUNCTION fn_check_reservation_overlap()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.status IN ('PENDING', 'CONFIRMED') THEN
        IF EXISTS (
            SELECT 1 FROM reservations
            WHERE resource_id = NEW.resource_id
              AND id <> NEW.id
              AND status IN ('PENDING', 'CONFIRMED')
              AND start_time < NEW.end_time
              AND end_time   > NEW.start_time
        ) THEN
            RAISE EXCEPTION 'This time slot overlaps with an existing reservation for this resource';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_reservation_overlap
    BEFORE INSERT OR UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION fn_check_reservation_overlap();
```
