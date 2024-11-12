require('dotenv').config(); // .env 파일 로드

const mysql = require('mysql2');

const config = {
  host: process.env.DB_SERVER, // MySQL 서버 주소
  user: process.env.DB_USER, // DB 사용자
  password: process.env.DB_PASSWORD, // DB 비밀번호
  database: process.env.DB_DATABASE, // DB 이름
  port: parseInt(process.env.DB_PORT, 10), // 포트 번호
  waitForConnections: true, // 연결 대기
  connectionLimit: 10, // 최대 연결 수
  queueLimit: 0, // 대기열 제한 (0이면 무제한)
};

const pool = mysql.createPool(config); // 풀 생성

// 연결 테스트
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed:', err);
    process.exit(1); // 실패 시 종료
  } else {
    console.log('Connected to MySQL');
    connection.release(); // 연결 해제
  }
});

module.exports = pool.promise(); // promise 기반의 API를 반환
