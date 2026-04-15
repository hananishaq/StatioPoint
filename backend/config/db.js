const sql = require('mssql/msnodesqlv8');

let pool;

const connectDB = async () => {
  console.log('--> Connecting to database...');
  try {
    const rawServerString = (process.env.DB_SERVER).replace(/\\\\/g, '\\');
    const dbName = process.env.DB_NAME;

    // Using raw connection string bypassed the msnodesqlv8 parsing bug!
    const config = {
      connectionString: `Driver={SQL Server};Server=${rawServerString};Database=${dbName};Trusted_Connection=Yes;`
    };

    console.log('Testing Config Connection for:', rawServerString, 'with Windows Authentication');

    pool = await sql.connect(config);
    console.log('✅ MSSQL connected perfectly!');
    return pool;
  } catch (err) {
    console.error('\n=======================================');
    console.error(' DB Connection Failed');
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