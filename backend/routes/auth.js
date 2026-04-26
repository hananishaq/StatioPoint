// routes/auth.js
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { getPool, sql } = require('../config/db');
require('dotenv').config();
// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ success: false, message: 'Username and password required.' });

  try {
    const pool   = getPool();
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT * FROM Users WHERE username=@username AND isActive=1');

    if (!result.recordset.length)
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });

    const user    = result.recordset[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });

    const token = jwt.sign(
      { id: user.id, username: user.username, fullName: user.fullName, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: { id: user.id, fullName: user.fullName, username: user.username, email: user.email, role: user.role, branch: user.branch }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});
// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { fullName, username, email, phone, password, role, branch } = req.body;
  if (!fullName || !username || !email || !password || !phone || !branch)
    return res.status(400).json({ success: false, message: 'Missing required fields.' });

  // Server-side validation matching client rules
  if (fullName.length < 3 || fullName.length > 100) return res.status(400).json({ success: false, message: 'Full Name must be between 3 and 100 chars.' });
  if (username.length < 3 || username.length > 50 || /\s/.test(username)) return res.status(400).json({ success: false, message: 'Invalid username format.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, message: 'Invalid email format.' });
  if (!/^\+92\d{10}$/.test(phone)) return res.status(400).json({ success: false, message: 'Phone must be +92 followed by 10 digits.' });
  if (password.length < 6 || password.length > 255) return res.status(400).json({ success: false, message: 'Password must be between 6 and 255 characters.' });

  try {
    const pool = getPool();
    const check = await pool.request()
      .input('u', sql.NVarChar, username)
      .input('e', sql.NVarChar, email)
      .query('SELECT username, email FROM Users WHERE username=@u OR email=@e');
      
    if (check.recordset.length) {
      const match = check.recordset[0];
      if (match.username === username) return res.status(400).json({ success: false, message: 'Username already exists.' });
      if (match.email === email) return res.status(400).json({ success: false, message: 'Email already exists.' });
    }

    const hash = await bcrypt.hash(password, 10);
    await pool.request()
      .input('fn', sql.NVarChar, fullName)
      .input('un', sql.NVarChar, username)
      .input('em', sql.NVarChar, email)
      .input('ph', sql.NVarChar, phone)
      .input('pw', sql.NVarChar, hash)
      .input('role', sql.NVarChar, role === 'admin' ? 'admin' : 'cashier')
      .input('branch', sql.NVarChar, branch)
      .query(`
        INSERT INTO Users (fullName, username, email, phone, password, role, branch)
        VALUES (@fn, @un, @em, @ph, @pw, @role, @branch)
      `);

    res.json({ success: true, message: 'Registration successful! You can now log in.' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

module.exports = router;
