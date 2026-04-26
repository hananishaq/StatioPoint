const express = require('express');
const router  = express.Router();
const { getPool } = require('../config/db');
const { verifyToken, adminOnly } = require('../middleware/auth');

router.use(verifyToken, adminOnly);

// GET /api/inventory/restock-report
router.get('/restock-report', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT 
        id,
        name as productName, 
        stock as currentStock, 
        minStock, 
        price,
        CASE WHEN stock = 0 THEN 'Critical' ELSE 'Low' END as status
      FROM Products 
      WHERE stock <= minStock
      ORDER BY stock ASC
    `);

    // Calculate units to order and cost
    const reportData = result.recordset.map(item => {
        const unitsToOrder = Math.max(0, (item.minStock * 3) - item.currentStock);
        const estimatedCost = unitsToOrder * item.price;
        return {
            ...item,
            unitsToOrder,
            estimatedCost
        };
    });

    res.json({ success: true, data: reportData });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error generating restock report' });
  }
});

// POST /api/inventory/restock
router.post('/restock', async (req, res) => {
  const { productId, quantity } = req.body;
  if (!productId || typeof quantity !== 'number' || quantity <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid restock parameters' });
  }
  
  try {
    const pool = getPool();
    await pool.request()
      .input('id', productId)
      .input('q', quantity)
      .query('UPDATE Products SET stock = stock + @q WHERE id = @id');
    
    res.json({ success: true, message: 'Product restocked successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error during restock' });
  }
});

module.exports = router;
