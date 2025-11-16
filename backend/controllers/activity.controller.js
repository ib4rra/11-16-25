const db = require('../config/db');

// ✅ CREATE Activity
exports.createActivity = (req, res) => {
  try {
    const { subject_id, activity_name, title, instructions, open_date_time, due_date_time, time_limit } = req.body;
    const instructor_id = req.userId;

    if (!subject_id || !activity_name || !title) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Store activity types and scheduling info in config_json
    const config_json = {
      activity_name,
      instructions: instructions || null,
      open_date_time,
      due_date_time,
      time_limit
    };

    const sql = `INSERT INTO activities (subject_id, instructor_id, title, description, config_json, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, NOW(), NOW())`;
    
    db.query(sql, [subject_id, instructor_id, title, activity_name, JSON.stringify(config_json)], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: "Failed to create activity", error: err.message });
      }

      res.status(201).json({ 
        message: "Activity created successfully", 
        activity_id: result.insertId,
        activity: {
          activity_id: result.insertId,
          subject_id,
          instructor_id,
          title,
          description: activity_name,
          config_json
        }
      });
    });
  } catch (error) {
    console.error('Error in createActivity:', error);
    res.status(500).json({ message: "Failed to create activity", error: error.message });
  }
};

// ✅ READ All Activities
exports.getActivities = (req, res) => {
  const sql = `SELECT * FROM activities`;
  db.query(sql, (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: "Failed to fetch activities", error: err.message });
    }
    res.json(rows);
  });
};

// ✅ READ Activity by ID
exports.getActivityById = (req, res) => {
  const { id } = req.params;
  const sql = `SELECT * FROM activities WHERE activity_id = ?`;
  db.query(sql, [id], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: "Failed to fetch activity", error: err.message });
    }
    if (rows.length === 0) {
      return res.status(404).json({ message: "Activity not found" });
    }
    res.json(rows[0]);
  });
};

// ✅ UPDATE Activity
exports.updateActivity = (req, res) => {
  const { id } = req.params;
  const { title, description, config_json } = req.body;
  
  const sql = `UPDATE activities SET title=?, description=?, config_json=?, updated_at=NOW() WHERE activity_id=?`;
  db.query(sql, [title, description, JSON.stringify(config_json), id], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: "Failed to update activity", error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Activity not found" });
    }
    res.json({ message: "Activity updated successfully" });
  });
};

// ✅ DELETE Activity
exports.deleteActivity = (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM activities WHERE activity_id=?`;
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: "Failed to delete activity", error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Activity not found" });
    }
    res.json({ message: "Activity deleted successfully" });
  });
};
