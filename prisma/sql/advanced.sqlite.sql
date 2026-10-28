-- ============================================================
-- CampusConnect: Advanced Database Objects for SQLite
-- Views and Triggers
-- ============================================================

-- VIEW 1: v_complaint_summary
DROP VIEW IF EXISTS v_complaint_summary;
CREATE VIEW v_complaint_summary AS
SELECT
  c.id,
  c.title,
  c.status,
  c.priority,
  c.createdAt,
  c.resolvedAt,
  u.name AS student_name,
  u.email AS student_email,
  cat.name AS category_name,
  d.name AS department_name
FROM Complaint c
JOIN User u ON u.id = c.userId
JOIN Category cat ON cat.id = c.categoryId
LEFT JOIN Department d ON d.id = c.departmentId;

-- VIEW 2: v_resource_utilization
DROP VIEW IF EXISTS v_resource_utilization;
CREATE VIEW v_resource_utilization AS
SELECT
  r.id AS resource_id,
  r.name AS resource_name,
  r.type AS resource_type,
  r.status AS resource_status,
  COUNT(b.id) AS total_bookings,
  SUM(CASE WHEN b.status = 'APPROVED' THEN 1 ELSE 0 END) AS approved_bookings,
  SUM(CASE WHEN b.status = 'PENDING' THEN 1 ELSE 0 END) AS pending_bookings
FROM Resource r
LEFT JOIN Booking b ON b.resourceId = r.id
GROUP BY r.id, r.name, r.type, r.status;

-- VIEW 3: v_complaint_stats
DROP VIEW IF EXISTS v_complaint_stats;
CREATE VIEW v_complaint_stats AS
SELECT
  status,
  COUNT(*) AS total,
  SUM(CASE WHEN priority = 'URGENT' THEN 1 ELSE 0 END) AS urgent_count
FROM Complaint
GROUP BY status;

-- TRIGGER 1: trg_booking_overlap_check
DROP TRIGGER IF EXISTS trg_booking_overlap_check;
CREATE TRIGGER trg_booking_overlap_check
BEFORE INSERT ON Booking
FOR EACH ROW
WHEN EXISTS (
  SELECT 1 FROM Booking b
  WHERE b.resourceId = NEW.resourceId
    AND b.status IN ('PENDING', 'APPROVED')
    AND b.startTime < NEW.endTime
    AND NEW.startTime < b.endTime
)
BEGIN
  SELECT RAISE(ABORT, 'Resource is already booked for the requested time slot');
END;

-- TRIGGER 2: trg_complaint_notify
DROP TRIGGER IF EXISTS trg_complaint_notify;
CREATE TRIGGER trg_complaint_notify
AFTER INSERT ON Complaint
FOR EACH ROW
BEGIN
  INSERT INTO Notification (userId, title, message, isRead, createdAt)
  VALUES (NEW.userId, 'Complaint Filed',
          'Your complaint "' || NEW.title || '" has been submitted.',
          0, datetime('now'));
END;

-- TRIGGER 3: trg_complaint_status_notify
DROP TRIGGER IF EXISTS trg_complaint_status_notify;
CREATE TRIGGER trg_complaint_status_notify
AFTER UPDATE OF status ON Complaint
FOR EACH ROW
WHEN OLD.status <> NEW.status
BEGIN
  INSERT INTO Notification (userId, title, message, isRead, createdAt)
  VALUES (NEW.userId, 'Complaint Status Updated',
          'Your complaint "' || NEW.title || '" is now ' || NEW.status || '.',
          0, datetime('now'));
END;

