const getPool = require('../config/mssqlConfig.js');
const sql = require('mssql');

const getASN = async (date, ship_group) => {
  try {
    const pool = await getPool();
    const request = pool.request();
    request.input('date', sql.VarChar, date);       // 예: '20250609'
    request.input('group', sql.VarChar, ship_group); // 예: '01'

    const sqlQuery = `
      SELECT 
        LEFT(A.LOCAT, 8) AS date, 
        RIGHT(A.LOCAT, 2) AS shippingGroup,
        B.SPEC_TX AS palletSerial,
        CASE 
          WHEN RIGHT(A.ITMNO, 1) = 'K' THEN LEFT(A.ITMNO, LEN(A.ITMNO) - 1)
          ELSE A.ITMNO
        END AS partNumber, -- <- K 제거
        mapping.SHORT_NAME AS description,
        A.QTY AS deliveryQty, 
        'EA' AS unit, 
        '5500003006' AS poNumber,
        mapping.ORD AS poItem,
        'RETURNABLE' AS packaging
      FROM MAT_LOCA_ALM A
      INNER JOIN MAT_BARCODE_HIS B ON A.BIGO01 = B.QR_NO
      INNER JOIN dbo.MAT_ITMMAPPING mapping ON A.ITMNO = mapping.ITMNO
      WHERE A.GUBN = 'B' 
        AND LEFT(A.LOCAT, 8) = @date
        AND RIGHT(A.LOCAT, 2) = @group
        AND A.STS <> 'D'
      ORDER BY A.ITMNO, A.BIGO02;
    `;

    const result = await request.query(sqlQuery);

    return {
      count: result.recordset.length,
      data: result.recordset
    };

  } catch (err) {
    console.error('Database query failed in getASN with mapping and SPEC_TX:', err);
    throw new Error('Database query failed');
  }
};

module.exports = {
  getASN
};
