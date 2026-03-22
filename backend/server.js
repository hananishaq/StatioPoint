// server.js — StatioPoint Main Server
const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const { connectDB } = require('./config/db');
const authRoutes    = require('./routes/auth');
const adminRoutes   = require('./routes/admin');
const cashierRoutes = require('./routes/cashier');
const profileRoutes = require('./routes/profile');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth',    authRoutes);
app.use('/api/admin',   adminRoutes);
app.use('/api/cashier', cashierRoutes);
app.use('/api/profile', profileRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ success: true, message: 'StatioPoint API running!' }));

// Serve correct HTML based on role
app.get('/admin',   (req, res) => res.sendFile(path.join(__dirname, '../frontend/admin.html')));
app.get('/cashier', (req, res) => res.sendFile(path.join(__dirname, '../frontend/cashier.html')));
app.get('/signup',  (req, res) => res.sendFile(path.join(__dirname, '../frontend/signup.html')));
app.get('*',        (req, res) => res.sendFile(path.join(__dirname, '../frontend/login.html')));

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`\n🚀 StatioPoint running → http://localhost:${PORT}`);
    console.log(`📋 Login page         → http://localhost:${PORT}/`);
    console.log(`🛡️  Admin panel        → http://localhost:${PORT}/admin`);
    console.log(`🧾 Cashier panel      → http://localhost:${PORT}/cashier\n`);
  });
};

start();
