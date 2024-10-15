// server/config/dbConfig.js
require('dotenv').config(); // .env 파일 로드

const sql = require('mssql');

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT, 10), // 포트 번호를 환경 변수에서 가져옵니다
  options: {
    encrypt: true, // 암호화 설정 (Azure SQL Server에서는 true로 설정)
    trustServerCertificate: true, // 개발 환경에서는 true로 설정
  },
};

const poolPromise = sql.connect(config)
  .then(pool => {
    if (pool.connecting) {
      console.log('Connecting to MS SQL Server...');
    }
    return pool;
  })
  .catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });

module.exports = {
  sql,
  poolPromise
};
