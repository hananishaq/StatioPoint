const sql = require('mssql');

let pool;

const connectDB = async () => {
  console.log('--> Connecting to database...');
  try {
    const rawServerString = process.env.DB_SERVER || 'localhost';
    const serverParts = rawServerString.replace(/\\\\/g, '\\').split('\\');
    const server = serverParts[0];
    const instance = serverParts[1] || 'SQLEXPRESS'; // Not heavily used by IP/DNS but standard config allows server name direct or IP
    
    // Config based on environment variables
    const config = {
      server: process.env.DB_SERVER || 'localhost',
      user: process.env.DB_USER || 'sa',
      password: process.env.DB_PASSWORD || '123456',
      database: process.env.DB_NAME || 'StatioPoint',
      options: {
        encrypt: true,
        trustServerCertificate: true // necessary for local dev
      }
    };
    
    // If there is an instance name like `DESKTOP\\SQLEXPRESS`, mssql needs just server and optionally instanceName,
    // or just pass `DESKTOP\\SQLEXPRESS` to server in some cases. Actually, the best way for standard mssql module 
    // is keeping server and parse out instanceName if backslash exists.
    if (serverParts.length > 1) {
      config.server = serverParts[0];
      config.options.instanceName = serverParts[1];
    } else {
      config.server = serverParts[0];
    }

    console.log('Testing Config Connection for:', config.server);

    pool = await sql.connect(config);
    console.log('✅ MSSQL connected perfectly!');
    return pool;
  } catch (err) {
    console.error('\n=======================================');
    console.error('❌ DB CONNECTION FAILURE DETAILS 👇');
    console.dir(err, { depth: null });
    console.error('=======================================\n');
    process.exit(1);
  }
};

const getPool = () => {
  if (!pool) throw new Error('DB not connected!');
  return pool;
};

module.exports = { connectDB, getPool, sql };