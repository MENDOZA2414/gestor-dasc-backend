const pool = require('../config/db');

const Notification = {
  create: async ({ type, message }) => {
    const [result] = await pool.query(
      'INSERT INTO Notification (type, message) VALUES (?, ?)',
      [type, message]
    );
    return result.insertId;
  },

  getUnread: async () => {
    const [rows] = await pool.query(
      'SELECT * FROM Notification WHERE isRead = false ORDER BY createdAt DESC'
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
