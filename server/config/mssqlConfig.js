require('dotenv').config(); // .env 파일 로드

const sql = require('mssql');

const config = {
  server: process.env.MSSQL_SERVER, // MSSQL 서버 주소
  user: process.env.MSSQL_USER, // DB 사용자
  password: process.env.MSSQL_PASSWORD, // DB 비밀번호
  database: process.env.MSSQL_DATABASE, // DB 이름
  port: parseInt(process.env.MSSQL_PORT, 10) || 1433, // MSSQL 기본 포트 (env에 없으면 1433 사용)
  options: {
    encrypt: true, // Azure SQL Database 등 사용 시 필요할 수 있음
    trustServerCertificate: true, // 개발 환경에서 self-signed 인증서 허용
  },
  pool: {
    max: 10, // 최대 연결 수
    min: 0, // 최소 연결 수
    idleTimeoutMillis: 30000, // 연결 유휴 시간 (ms)
  },
};

// 연결 풀 생성
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Connected to MSSQL');
    return pool;
  })
  .catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1); // 실패 시 종료
    return null; // 에러 발생 시 null 반환하여 Promise 체인 종료
  });

module.exports = async () => {
  const pool = await poolPromise;
  if (!pool) {
    throw new Error('MSSQL connection pool failed to initialize.');
  }
  return pool;
};