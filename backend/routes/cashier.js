// routes/cashier.js — Cashier only routes
const express = require('express');
const router  = express.Router();
const { getPool, sql } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// ── GET /api/cashier/products ────────────────────
// Search & filter products for cashier
router.get('/products', async (req, res) => {
  const { search = '', category = '', sort = 'name' } = req.query;
  const sortMap = { name:'name ASC', 'price-asc':'price ASC', 'price-desc':'price DESC', stock:'stock ASC' };
  const orderBy = sortMap[sort] || 'name ASC';

  try {
    const pool    = getPool();
    const request = pool.request();
    let query = `SELECT id,name,sku,category,price,stock,minStock FROM Products WHERE 1=1`;

    if (search) {
      query += ` AND (name LIKE @search OR sku LIKE @search)`;
      request.input('search', sql.NVarChar, `%${search}%`);
    }
    if (category) {
      query += ` AND category=@category`;
      request.input('category', sql.NVarChar, category);
    }
    query += ` ORDER BY ${orderBy}`;

    const result   = await request.query(query);
    const products = result.recordset.map(p => ({
      ...p,
      stockStatus: p.stock === 0 ? 'out' : p.stock <= p.minStock ? 'low' : 'in'
    }));

    res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── GET /api/cashier/categories ─────────────────
router.get('/categories', async (req, res) => {
  try {
    const pool   = getPool();
    const result = await pool.request().query('SELECT DISTINCT category FROM Products ORDER BY category');
    res.json({ success: true, data: result.recordset.map(r => r.category) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── POST /api/cashier/sale ───────────────────────
// Process a new sale
// Body: { items: [{productId, quantity, unitPrice}], paymentType }
router.post('/sale', async (req, res) => {
  const { items, paymentType = 'cash' } = req.body;

  if (!items || !items.length)
    return res.status(400).json({ success: false, message: 'No items in sale.' });

  try {
    const pool        = getPool();
    const totalAmount = items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);

    // Insert sale
    const saleResult = await pool.request()
      .input('userId',      sql.Int,          req.user.id)
      .input('totalAmount', sql.Decimal(10,2), totalAmount)
      .input('paymentType', sql.NVarChar,      paymentType)
      .query(`INSERT INTO Sales (userId,totalAmount,paymentType)
              OUTPUT INSERTED.id
              VALUES (@userId,@totalAmount,@paymentType)`);

    const saleId = saleResult.recordset[0].id;

    // Insert each sale item and update stock
    for (const item of items) {
      const subtotal = item.quantity * item.unitPrice;
      await pool.request()
        .input('saleId',    sql.Int,          saleId)
        .input('productId', sql.Int,          item.productId)
        .input('quantity',  sql.Int,          item.quantity)
        .input('unitPrice', sql.Decimal(10,2), item.unitPrice)
        .input('subtotal',  sql.Decimal(10,2), subtotal)
        .query(`INSERT INTO SaleItems (saleId,productId,quantity,unitPrice,subtotal)
                VALUES (@saleId,@productId,@quantity,@unitPrice,@subtotal)`);

      // Reduce stock
      await pool.request()
        .input('productId', sql.Int, item.productId)
        .input('quantity',  sql.Int, item.quantity)
        .query('UPDATE Products SET stock=stock-@quantity WHERE id=@productId');
    }

    res.json({ success: true, message: 'Sale processed successfully!', saleId, totalAmount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── GET /api/cashier/my-sales ────────────────────
// Today's sales by this cashier
router.get('/my-sales', async (req, res) => {
  try {
    const pool   = getPool();
    const result = await pool.request()
      .input('userId', sql.Int, req.user.id)
      .query(`
        SELECT TOP 10 s.id, s.totalAmount, s.paymentType, s.status, s.saleDate,
          p.name AS productName, si.quantity
        FROM Sales s
        JOIN SaleItems si ON s.id=si.saleId
        JOIN Products p   ON si.productId=p.id
        WHERE s.userId=@userId AND CAST(s.saleDate AS DATE)=CAST(GETDATE() AS DATE)
        ORDER BY s.saleDate DESC`);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
