const express = require('express');
const router  = express.Router();
const { getPool } = require('../config/db');
const { verifyToken, adminOnly } = require('../middleware/auth');

router.use(verifyToken, adminOnly);

// 1. GET /api/analytics/weekly-revenue
router.get('/weekly-revenue', async (req, res) => {
  try {
    const pool = getPool();
    // last 7 days revenue grouped by date
    const result = await pool.request().query(`
      SELECT CAST(saleDate AS DATE) AS date, ISNULL(SUM(totalAmount),0) AS revenue
      FROM Sales 
      WHERE saleDate >= DATEADD(day, -6, CAST(GETDATE() AS DATE)) AND status='paid'
      GROUP BY CAST(saleDate AS DATE) 
      ORDER BY date ASC
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 2. GET /api/analytics/category-revenue
router.get('/category-revenue', async (req, res) => {
    try {
      const pool = getPool();
      // revenue grouped by product category
      const result = await pool.request().query(`
        SELECT p.category, SUM(si.quantity * si.unitPrice) AS revenue
        FROM SaleItems si
        JOIN Products p ON si.productId = p.id
        JOIN Sales s ON si.saleId = s.id
        WHERE s.status='paid'
        GROUP BY p.category
        ORDER BY revenue DESC
      `);
      res.json({ success: true, data: result.recordset });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 3. GET /api/analytics/top-products
router.get('/top-products', async (req, res) => {
    try {
      const pool = getPool();
      const result = await pool.request().query(`
        SELECT TOP 5 p.name as productName, SUM(si.quantity) AS quantitySold
        FROM SaleItems si
        JOIN Products p ON si.productId = p.id
        JOIN Sales s ON si.saleId = s.id
        WHERE s.status='paid'
        GROUP BY p.name
        ORDER BY quantitySold DESC
      `);
      res.json({ success: true, data: result.recordset });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 4. GET /api/analytics/summary
router.get('/summary', async (req, res) => {
    try {
      const pool = getPool();
      const rev = await pool.request().query("SELECT ISNULL(SUM(totalAmount),0) AS total FROM Sales WHERE status='paid'");
      const count = await pool.request().query("SELECT COUNT(*) AS total FROM Sales WHERE status='paid'");
      const bestProd = await pool.request().query(`
        SELECT TOP 1 p.name 
        FROM SaleItems si 
        JOIN Products p ON si.productId = p.id
        GROUP BY p.name ORDER BY SUM(si.quantity) DESC
      `);
      const bestCashier = await pool.request().query(`
        SELECT TOP 1 u.fullName 
        FROM Sales s 
        JOIN Users u ON s.userId = u.id
        WHERE s.status='paid'
        GROUP BY u.fullName ORDER BY SUM(s.totalAmount) DESC
      `);

      res.json({ 
        success: true, 
        data: {
          totalRevenue: rev.recordset[0].total,
          totalSalesCount: count.recordset[0].total,
          bestProduct: bestProd.recordset[0]?.name || 'N/A',
          bestCashier: bestCashier.recordset[0]?.fullName || 'N/A'
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
