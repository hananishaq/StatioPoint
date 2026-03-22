// routes/profile.js
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const { getPool, sql } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// GET /api/profile
router.get('/', async (req, res) => {
  try {
    const pool   = getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.user.id)
      .query('SELECT id,fullName,username,email,phone,role,branch,createdAt FROM Users WHERE id=@id');
    if (!result.recordset.length)
      return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/profile/update
router.put('/update', async (req, res) => {
  const { fullName, email, phone, branch } = req.body;
  if (!fullName || !email)
    return res.status(400).json({ success: false, message: 'Name and email required.' });
  try {
    const pool = getPool();
    await pool.request()
      .input('id',       sql.Int,      req.user.id)
      .input('fullName', sql.NVarChar, fullName)
      .input('email',    sql.NVarChar, email)
      .input('phone',    sql.NVarChar, phone || null)
      .input('branch',   sql.NVarChar, branch || 'Main Branch')
      .query('UPDATE Users SET fullName=@fullName,email=@email,phone=@phone,branch=@branch WHERE id=@id');
    res.json({ success: true, message: 'Profile updated!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/profile/change-password
router.put('/change-password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ success: false, message: 'Both passwords required.' });
  if (newPassword.length < 6)
    return res.status(400).json({ success: false, message: 'Min 6 characters for new password.' });
  try {
    const pool   = getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.user.id)
      .query('SELECT password FROM Users WHERE id=@id');
    const isMatch = await bcrypt.compare(currentPassword, result.recordset[0].password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Current password is wrong.' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.request()
      .input('id',       sql.Int,      req.user.id)
      .input('password', sql.NVarChar, hashed)
      .query('UPDATE Users SET password=@password WHERE id=@id');
    res.json({ success: true, message: 'Password changed successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
