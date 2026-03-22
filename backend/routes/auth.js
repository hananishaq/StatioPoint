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
// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { fullName, username, email, phone, password, role, branch } = req.body;
  if (!fullName || !username || !email || !password)
    return res.status(400).json({ success: false, message: 'Missing required fields.' });

  try {
    const pool = getPool();
    const check = await pool.request()
      .input('u', sql.NVarChar, username)
      .input('e', sql.NVarChar, email)
      .query('SELECT id FROM Users WHERE username=@u OR email=@e');
      
    if (check.recordset.length)
      return res.status(400).json({ success: false, message: 'Username or email already exists.' });

    const hash = await bcrypt.hash(password, 10);
    await pool.request()
      .input('fn', sql.NVarChar, fullName)
      .input('un', sql.NVarChar, username)
      .input('em', sql.NVarChar, email)
      .input('ph', sql.NVarChar, phone || '')
      .input('pw', sql.NVarChar, hash)
      .input('role', sql.NVarChar, role === 'admin' ? 'admin' : 'cashier')
      .input('branch', sql.NVarChar, branch || 'Main Branch')
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
