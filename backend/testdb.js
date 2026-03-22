const sql = require('mssql/msnodesqlv8');

const run = async () => {
    const config = {
        server: 'localhost',
        database: 'StatioPoint',
        driver: 'msnodesqlv8',
        options: {
            trustedConnection: true,
            trustServerCertificate: true,
            instanceName: 'SQLEXPRESS'
        }
    };
    
    try {
        console.log("Testing config object with trustedConnection...");
        const pool = await sql.connect(config);
        console.log("✅ SUCCESS!");
        await pool.close();
    } catch(e) {
        console.error("❌ FAILED:", e);
    }
};

run();
