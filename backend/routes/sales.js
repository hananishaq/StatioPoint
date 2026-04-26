// routes/sales.js
const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../config/db');
const { verifyToken, adminOnly } = require('../middleware/auth');

router.use(verifyToken);

// POST /api/sales — create a new sale (saves to Sales table and SaleItems table, and reduces stock in Products table)
router.post('/', async (req, res) => {
  const { items, paymentType = 'cash' } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ success: false, message: 'No items in sale.' });
  }

  try {
    const pool = getPool();
    const totalAmount = items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);

    // Insert sale
    const saleResult = await pool.request()
      .input('userId', sql.Int, req.user.id)
      .input('totalAmount', sql.Decimal(10, 2), totalAmount)
      .input('paymentType', sql.NVarChar, paymentType)
      .query(`INSERT INTO Sales (userId,totalAmount,paymentType,status,saleDate)
              OUTPUT INSERTED.id
              VALUES (@userId,@totalAmount,@paymentType,'paid',GETDATE())`);

    const saleId = saleResult.recordset[0].id;

    // Insert each sale item and update stock
    for (const item of items) {
      const subtotal = item.quantity * item.unitPrice;
      await pool.request()
        .input('saleId', sql.Int, saleId)
        .input('productId', sql.Int, item.productId)
        .input('quantity', sql.Int, item.quantity)
        .input('unitPrice', sql.Decimal(10, 2), item.unitPrice)
        .input('subtotal', sql.Decimal(10, 2), subtotal)
        .query(`INSERT INTO SaleItems (saleId,productId,quantity,unitPrice,subtotal)
                VALUES (@saleId,@productId,@quantity,@unitPrice,@subtotal)`);

      // Reduce stock
      await pool.request()
        .input('productId', sql.Int, item.productId)
        .input('quantity', sql.Int, item.quantity)
        .query('UPDATE Products SET stock=stock-@quantity WHERE id=@productId');
    }

    res.status(201).json({ success: true, message: 'Sale processed successfully!', saleId, totalAmount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error processing sale' });
  }
});

// GET /api/sales — fetch all sales with cashier name and items (Admin Only)
router.get('/', adminOnly, async (req, res) => {
  try {
    const pool = getPool();
    const salesResult = await pool.request().query(`
      SELECT 
        s.id AS saleId, 
        s.totalAmount, 
        s.paymentType, 
        s.status, 
        s.saleDate,
        u.fullName AS cashierName
      FROM Sales s
      JOIN Users u ON s.userId = u.id
      ORDER BY s.saleDate DESC
    `);
    res.json({ success: true, data: salesResult.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching sales' });
  }
});
// GET /api/sales/:id — fetch specific sale details and its items
router.get('/:id', async (req, res) => {
  try {
    const saleId = req.params.id;
    const pool = getPool();
    // Fetch Sale Details
    const saleRes = await pool.request()
      .input('id', sql.Int, saleId)
      .query(`
        SELECT s.id, s.totalAmount, s.paymentType, s.status, s.saleDate, u.fullName AS cashierName
        FROM Sales s JOIN Users u ON s.userId = u.id WHERE s.id = @id
      `);
    if (!saleRes.recordset.length) return res.status(404).json({ success: false, message: 'Sale not found' });
    const sale = saleRes.recordset[0];

    // Fetch Sale Items
    const itemsRes = await pool.request()
      .input('id', sql.Int, saleId)
      .query(`
        SELECT p.name AS productName, si.quantity, si.unitPrice, si.subtotal
        FROM SaleItems si JOIN Products p ON si.productId = p.id WHERE si.saleId = @id
      `);
    
    res.json({ success: true, data: { ...sale, items: itemsRes.recordset } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching receipt' });
  }
});

module.exports = router;
