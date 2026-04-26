// routes/admin.js  — Admin only routes
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const { getPool, sql } = require('../config/db');
const { verifyToken, adminOnly } = require('../middleware/auth');

router.use(verifyToken, adminOnly);

// ── GET /api/admin/dashboard ─────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const pool = getPool();

    const revenue = await pool.request().query(`
      SELECT ISNULL(SUM(totalAmount),0) AS todayRevenue
      FROM Sales WHERE CAST(saleDate AS DATE)=CAST(GETDATE() AS DATE) AND status='paid'`);

    const items = await pool.request().query(`
      SELECT ISNULL(SUM(si.quantity),0) AS itemsSold
      FROM SaleItems si JOIN Sales s ON si.saleId=s.id
      WHERE CAST(s.saleDate AS DATE)=CAST(GETDATE() AS DATE)`);

    const txn = await pool.request().query(`
      SELECT COUNT(*) AS txnCount FROM Sales
      WHERE CAST(saleDate AS DATE)=CAST(GETDATE() AS DATE)`);

    const lowStock = await pool.request().query(`
      SELECT COUNT(*) AS lowCount FROM Products WHERE stock<=minStock`);

    const chart = await pool.request().query(`
      SELECT CAST(saleDate AS DATE) AS day, ISNULL(SUM(totalAmount),0) AS revenue
      FROM Sales WHERE saleDate>=DATEADD(day,-6,CAST(GETDATE() AS DATE)) AND status='paid'
      GROUP BY CAST(saleDate AS DATE) ORDER BY day ASC`);

    const recentTxn = await pool.request().query(`
      SELECT TOP 5 s.id as saleId, s.totalAmount, s.status, s.paymentType, s.saleDate, u.fullName AS cashierName
      FROM Sales s
      JOIN Users u ON s.userId=u.id
      ORDER BY s.saleDate DESC`);

    res.json({
      success: true,
      data: {
        todayRevenue:    revenue.recordset[0].todayRevenue,
        itemsSold:       items.recordset[0].itemsSold,
        txnCount:        txn.recordset[0].txnCount,
        lowStockCount:   lowStock.recordset[0].lowCount,
        chartData:       chart.recordset,
        recentTxn:       recentTxn.recordset
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── GET /api/admin/users ─────────────────────────
router.get('/users', async (req, res) => {
  try {
    const pool   = getPool();
    const result = await pool.request().query(`
      SELECT id,fullName,username,email,phone,role,branch,isActive,createdAt
      FROM Users WHERE isActive=1 ORDER BY createdAt DESC`);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── POST /api/admin/users/add ────────────────────
router.post('/users/add', async (req, res) => {
  const { fullName, username, email, phone, password, role, branch } = req.body;
  if (!fullName || !username || !email || !password)
    return res.status(400).json({ success: false, message: 'All fields required.' });

  try {
    const pool    = getPool();
    const exists  = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT id FROM Users WHERE username=@username');
    if (exists.recordset.length)
      return res.status(409).json({ success: false, message: 'Username already taken.' });

    const hashed = await bcrypt.hash(password, 10);
    await pool.request()
      .input('fullName', sql.NVarChar, fullName)
      .input('username', sql.NVarChar, username)
      .input('email',    sql.NVarChar, email)
      .input('phone',    sql.NVarChar, phone || null)
      .input('password', sql.NVarChar, hashed)
      .input('role',     sql.NVarChar, role || 'cashier')
      .input('branch',   sql.NVarChar, branch || 'Main Branch')
      .query(`INSERT INTO Users (fullName,username,email,phone,password,role,branch)
              VALUES (@fullName,@username,@email,@phone,@password,@role,@branch)`);

    res.status(201).json({ success: true, message: 'User added successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── DELETE /api/admin/users/:id ──────────────────
router.delete('/users/:id', async (req, res) => {
  try {
    const pool = getPool();
    // Soft delete — just deactivate
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('UPDATE Users SET isActive=0 WHERE id=@id');
    res.json({ success: true, message: 'User deactivated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── GET /api/admin/reports ───────────────────────
router.get('/reports', async (req, res) => {
  const { period = 'monthly' } = req.query;
  const fromDate = period === 'daily'  ? 'CAST(GETDATE() AS DATE)'        :
                   period === 'weekly' ? 'DATEADD(day,-7,GETDATE())'      :
                                         'DATEADD(month,-1,GETDATE())';
  try {
    const pool = getPool();

    const summary = await pool.request().query(`
      SELECT ISNULL(SUM(totalAmount),0) AS totalRevenue, COUNT(*) AS totalTxn
      FROM Sales WHERE saleDate>=${fromDate} AND status='paid'`);

    const topProducts = await pool.request().query(`
      SELECT TOP 5 p.name, SUM(si.quantity) AS unitsSold,
        SUM(si.quantity*si.unitPrice) AS revenue
      FROM SaleItems si JOIN Products p ON si.productId=p.id
      JOIN Sales s ON si.saleId=s.id WHERE s.status='paid'
      GROUP BY p.name ORDER BY unitsSold DESC`);

    const barChart = await pool.request().query(`
      SELECT CAST(saleDate AS DATE) AS day, ISNULL(SUM(totalAmount),0) AS revenue
      FROM Sales WHERE saleDate>=DATEADD(day,-9,CAST(GETDATE() AS DATE)) AND status='paid'
      GROUP BY CAST(saleDate AS DATE) ORDER BY day ASC`);

    const lowStock = await pool.request().query(`
      SELECT name, stock, minStock,
        CASE WHEN stock=0 THEN 'out' WHEN stock<=minStock THEN 'low' ELSE 'ok' END AS stockStatus
      FROM Products WHERE stock<=minStock ORDER BY stock ASC`);

    res.json({
      success: true,
      data: {
        totalRevenue: summary.recordset[0].totalRevenue,
        totalTxn:     summary.recordset[0].totalTxn,
        topProducts:  topProducts.recordset,
        barChart:     barChart.recordset,
        lowStock:     lowStock.recordset
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
