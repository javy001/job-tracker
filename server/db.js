const pg = require('pg');
const { Pool } = pg;

// Initialize the connection configuration pool
const pool = new Pool({
  user: 'javierq',       // Default is usually 'postgres'
  host: 'localhost',
  database: 'postgres',   // Change to your target database name
  port: 5432,                       // Default PostgreSQL port
});

pg.types.setTypeParser(1700, function (val) {
  return parseFloat(val);
});
module.exports = pool;
