const pool = require('../config/db');

const Notification = {
  create: async ({ type, message, userID = null }) => {
    const [result] = await pool.query(
      'INSERT INTO Notification (type, message, userID) VALUES (?, ?, ?)',
      [type, message, userID]
    );
    return result.insertId;
  },

  getUnread: async () => {
    const [rows] = await pool.query(
      `
      SELECT 
        n.notificationID,
        n.type,
        n.message,
        n.isRead,
        n.createdAt,
        u.userID,
        u.email
      FROM Notification n
      LEFT JOIN User u ON n.userID = u.userID
      WHERE n.isRead = false
      ORDER BY n.createdAt DESC
      `
    );
    return rows;
  },

  markAsRead: async (notificationID) => {
    await pool.query(
      'UPDATE Notification SET isRead = true WHERE notificationID = ?',
      [notificationID]
    );
  }
};

module.exports = Notification;
