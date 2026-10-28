-- ============================================================
-- CampusConnect: Advanced Database Objects
-- Views, Stored Procedures, Triggers (MySQL)
-- Run with: npx prisma db execute --file prisma/sql/advanced.sql
-- ============================================================

-- ------------------------------------------------------------
-- VIEW 1: v_complaint_summary
-- Joins complaints with user, category, department for reporting
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_complaint_summary AS
SELECT
  c.id,
  c.title,
  c.status,
  c.priority,
  c.createdAt,
  c.resolvedAt,
  u.name  AS student_name,
  u.email AS student_email,
  cat.name AS category_name,
  d.name  AS department_name
FROM Complaint c
JOIN User u        ON u.id = c.userId
JOIN Category cat  ON cat.id = c.categoryId
LEFT JOIN Department d ON d.id = c.departmentId;

-- ------------------------------------------------------------
-- VIEW 2: v_resource_utilization
-- Aggregate view: bookings per resource and status
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_resource_utilization AS
SELECT
  r.id AS resource_id,
  r.name AS resource_name,
  r.type AS resource_type,
  r.status AS resource_status,
  COUNT(b.id) AS total_bookings,
  SUM(CASE WHEN b.status = 'APPROVED' THEN 1 ELSE 0 END) AS approved_bookings,
  SUM(CASE WHEN b.status = 'PENDING' THEN 1 ELSE 0 END)  AS pending_bookings
FROM Resource r
LEFT JOIN Booking b ON b.resourceId = r.id
GROUP BY r.id, r.name, r.type, r.status;

-- ------------------------------------------------------------
-- VIEW 3: v_complaint_stats
-- Aggregate view: complaint counts grouped by status
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_complaint_stats AS
SELECT
  status,
  COUNT(*) AS total,
  SUM(CASE WHEN priority = 'URGENT' THEN 1 ELSE 0 END) AS urgent_count
FROM Complaint
GROUP BY status;

-- ------------------------------------------------------------
-- STORED PROCEDURE: sp_complaints_by_category
-- Returns number of complaints per category (aggregate report)
-- ------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_complaints_by_category;
DELIMITER //
CREATE PROCEDURE sp_complaints_by_category()
BEGIN
  SELECT
    cat.name AS category,
    COUNT(c.id) AS total_complaints,
    SUM(CASE WHEN c.status = 'RESOLVED' THEN 1 ELSE 0 END) AS resolved,
    SUM(CASE WHEN c.status IN ('OPEN', 'IN_PROGRESS') THEN 1 ELSE 0 END) AS pending
  FROM Category cat
  LEFT JOIN Complaint c ON c.categoryId = cat.id
  GROUP BY cat.id, cat.name
  ORDER BY total_complaints DESC;
END//
DELIMITER ;

-- ------------------------------------------------------------
-- STORED PROCEDURE: sp_resolve_complaint
-- Resolves a complaint within a transaction-like safe update
-- ------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_resolve_complaint;
DELIMITER //
CREATE PROCEDURE sp_resolve_complaint(IN p_complaint_id INT, IN p_user_id INT, IN p_comment VARCHAR(500))
BEGIN
  DECLARE current_status VARCHAR(20);

  SELECT status INTO current_status FROM Complaint WHERE id = p_complaint_id;

  IF current_status IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Complaint not found';
  END IF;

  UPDATE Complaint
     SET status = 'RESOLVED', resolvedAt = NOW(), updatedAt = NOW()
   WHERE id = p_complaint_id;

  INSERT INTO ComplaintUpdate (complaintId, userId, comment, statusFrom, statusTo, createdAt)
  VALUES (p_complaint_id, p_user_id, p_comment, current_status, 'RESOLVED', NOW());
END//
DELIMITER ;

-- ------------------------------------------------------------
-- TRIGGER 1: trg_booking_overlap_check
-- Prevents double-booking the same resource for overlapping time
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_booking_overlap_check;
DELIMITER //
CREATE TRIGGER trg_booking_overlap_check
BEFORE INSERT ON Booking
FOR EACH ROW
BEGIN
  DECLARE overlapping INT;

  SELECT COUNT(*) INTO overlapping
  FROM Booking b
  WHERE b.resourceId = NEW.resourceId
    AND b.status IN ('PENDING', 'APPROVED')
    AND b.startTime < NEW.endTime
    AND NEW.startTime < b.endTime;

  IF overlapping > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Resource is already booked for the requested time slot';
  END IF;
END//
DELIMITER ;

-- ------------------------------------------------------------
-- TRIGGER 2: trg_complaint_notify
-- Creates a notification when a new complaint is filed
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_complaint_notify;
DELIMITER //
CREATE TRIGGER trg_complaint_notify
AFTER INSERT ON Complaint
FOR EACH ROW
BEGIN
  INSERT INTO Notification (userId, title, message, isRead, createdAt)
  VALUES (NEW.userId, 'Complaint Filed',
          CONCAT('Your complaint "', NEW.title, '" has been submitted.'),
          FALSE, NOW());
END//
DELIMITER ;

-- ------------------------------------------------------------
-- TRIGGER 3: trg_complaint_status_notify
-- Notifies the student when their complaint status changes
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_complaint_status_notify;
DELIMITER //
CREATE TRIGGER trg_complaint_status_notify
AFTER UPDATE ON Complaint
FOR EACH ROW
BEGIN
  IF OLD.status <> NEW.status THEN
    INSERT INTO Notification (userId, title, message, isRead, createdAt)
    VALUES (NEW.userId, 'Complaint Status Updated',
            CONCAT('Your complaint "', NEW.title, '" is now ', NEW.status, '.'),
            FALSE, NOW());
  END IF;
END//
DELIMITER ;
