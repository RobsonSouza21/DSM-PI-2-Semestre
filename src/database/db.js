const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '2111',
    database: 'erp_simplificado'
});

module.exports = pool;