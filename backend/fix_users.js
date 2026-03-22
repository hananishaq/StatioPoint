require('dotenv').config();
const bcrypt = require('bcryptjs');
const { getPool, connectDB, sql } = require('./config/db');

async function fixPasswords() {
  await connectDB();
  const pool = getPool();
  
  const adminHash = await bcrypt.hash('admin123', 10);
  const cashierHash = await bcrypt.hash('cashier123', 10);

  // Since tables might be missing if they didn't run database.sql properly, let's also ensure they are created.
  // Actually, we'll just update the passwords. If it throws, we know tables are missing.
  try {
    const resAdmin = await pool.request()
      .input('u', sql.NVarChar, 'ahmed.khan')
      .input('p', sql.NVarChar, adminHash)
      .query('UPDATE Users SET password = @p WHERE username = @u');

    const resCashier = await pool.request()
      .input('u', sql.NVarChar, 'sara.ahmed')
      .input('p', sql.NVarChar, cashierHash)
      .query('UPDATE Users SET password = @p WHERE username = @u');
      
    console.log('Fixed admin and cashier passwords.', resAdmin.rowsAffected, resCashier.rowsAffected);
    process.exit(0);
  } catch (err) {
    console.error('Error updating DB. Did you run database.sql?', err.message);
    process.exit(1);
  }
}

fixPasswords();
