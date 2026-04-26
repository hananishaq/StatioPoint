// routes/products.js
const express = require('express');
const router  = express.Router();
const { getPool, sql } = require('../config/db');
const { verifyToken, adminOnly } = require('../middleware/auth');

router.use(verifyToken);

// GET /api/products — fetch all products
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query('SELECT * FROM Products WHERE isActive=1 ORDER BY name ASC');
    const products = result.recordset.map(p => ({
      ...p,
      stockStatus: p.stock === 0 ? 'out' : p.stock <= p.minStock ? 'low' : 'in'
    }));
    res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching products' });
  }
});

// POST /api/products — add a new product (admin only)
router.post('/', adminOnly, async (req, res) => {
  const { name, sku, category, price, stock, minStock } = req.body;
  if (!name || !category || price == null || stock == null || minStock == null) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  try {
    const pool = getPool();
    await pool.request()
      .input('name', sql.NVarChar, name)
      .input('sku', sql.NVarChar, sku || null)
      .input('category', sql.NVarChar, category)
      .input('price', sql.Decimal(10, 2), price)
      .input('stock', sql.Int, stock)
      .input('minStock', sql.Int, minStock)
      .query(`
        INSERT INTO Products (name, sku, category, price, stock, minStock)
        VALUES (@name, @sku, @category, @price, @stock, @minStock)
      `);
    res.status(201).json({ success: true, message: 'Product added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error adding product' });
  }
});

// PUT /api/products/:id — edit an existing product (admin only)
router.put('/:id', adminOnly, async (req, res) => {
  const { name, sku, category, price, stock, minStock } = req.body;
  const { id } = req.params;
  try {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar, name)
      .input('sku', sql.NVarChar, sku || null)
      .input('category', sql.NVarChar, category)
      .input('price', sql.Decimal(10, 2), price)
      .input('stock', sql.Int, stock)
      .input('minStock', sql.Int, minStock)
      .query(`
        UPDATE Products 
        SET name=@name, sku=@sku, category=@category, price=@price, stock=@stock, minStock=@minStock
        WHERE id=@id
      `);
    res.json({ success: true, message: 'Product updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error updating product' });
  }
});

// DELETE /api/products/:id — delete a product (admin only)
router.delete('/:id', adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    const pool = getPool();
    // Use delete where there's no FK constraint issues, or handle graciously.
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Products WHERE id=@id');
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    // If foreign key constraint triggered, soft delete it instead.
    try {
      const pool = getPool();
      await pool.request()
        .input('id', sql.Int, id)
        .query('UPDATE Products SET isActive=0 WHERE id=@id');
      res.json({ success: true, message: 'Product archived (it has past sales records)' });
    } catch (innerErr) {
      console.error(innerErr);
      res.status(500).json({ success: false, message: 'Failed to delete or archive product.' });
    }
  }
});

module.exports = router;
