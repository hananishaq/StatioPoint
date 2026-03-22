// middleware/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token. Please login.' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ success: false, message: 'Invalid token. Please login again.' });
  }
};

// Admin only
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
  next();
};

// Cashier only
const cashierOnly = (req, res, next) => {
  if (req.user.role !== 'cashier')
    return res.status(403).json({ success: false, message: 'Access denied. Cashiers only.' });
  next();
};

module.exports = { verifyToken, adminOnly, cashierOnly };
