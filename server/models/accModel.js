const pool = require('../config/dbConfig.js'); // pool 객체를 가져옵니다

const getAccRecords = async () => {
  try {
    // MySQL 커넥션 풀에서 쿼리를 실행
    const [rows] = await pool.query('SELECT * FROM INS_ACC_STAFFING_RECORD');
    return rows; // 결과 반환
  } catch (err) {
    console.error('Database query failed:', err);
    throw new Error('Database query failed');
  }
};

module.exports = {
  getAccRecords
};
