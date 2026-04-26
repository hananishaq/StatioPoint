// server.js — StatioPoint Main Server
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { connectDB } = require('./config/db');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const cashierRoutes = require('./routes/cashier');
const profileRoutes = require('./routes/profile');
const productsRoutes = require('./routes/products');
const salesRoutes = require('./routes/sales');
const analyticsRoutes = require('./routes/analytics');
const inventoryRoutes = require('./routes/inventory');

const app = express();
const PORT = process.env.PORT || 5000;

// app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cashier', cashierRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/inventory', inventoryRoutes);

// Serve correct HTML based on role
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '../frontend/admin.html')));
app.get('/cashier', (req, res) => res.sendFile(path.join(__dirname, '../frontend/cashier.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, '../frontend/signup.html')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/login.html')));

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log("App is Started")
  });
};

start();
