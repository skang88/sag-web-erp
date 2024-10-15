// server/models/accModel.js
const { poolPromise } = require('../config/dbConfig.js');

const getAccRecords = async () => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM INS_ACC_RECORD');
    return result.recordset;
  } catch (err) {
    throw new Error('Database query failed');
  }
};

module.exports = {
    getAccRecords
};
