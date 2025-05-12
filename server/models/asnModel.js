const getPool = require('../config/mssqlConfig.js');
const sql = require('mssql');

const getASN = async (date, ship_group) => {
  try {
    const pool = await getPool();
    const request = pool.request();
    request.input('date', sql.VarChar, date); // '20250512' 형식 기대
    request.input('group', sql.VarChar, ship_group); // '03' 형식 기대

    const sqlQuery = `
      SELECT 
        LEFT(LOCAT, 8) AS date, 
        RIGHT(LOCAT, 2) AS shippingGroup, 
        SUBSTRING(BIGO01, 10, 16) AS palletSerial,
        matl.ITMNO AS partNumber, 
        mapping.SHORT_NAME AS description,
        matl.QTY AS deliveryQty,
        'EA' AS unit,
        '5500003006' AS poNumber,
        mapping.ORD AS poItem,
        'RETURNABLE' AS packaging
      FROM MAT_LOCA_ALM matl
      INNER JOIN dbo.MAT_ITMMAPPING mapping 
        ON matl.ITMNO = mapping.ITMNO
      WHERE LEFT(LOCAT, 8) = @date 
        AND RIGHT(LOCAT, 2) = @group
      ORDER BY partNumber, palletSerial;
    `;

    const result = await request.query(sqlQuery);
    return result.recordset;
  } catch (err) {
    console.error('Database query failed in getASN with mapping:', err);
    throw new Error('Database query failed');
  }
};

module.exports = {
  getASN
};
