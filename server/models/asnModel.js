const getPool = require('../config/mssqlConfig.js');
const sql = require('mssql');

const getASN = async (date, ship_group) => {
  try {
    const pool = await getPool();
    const request = pool.request();
    request.input('date', sql.VarChar, `${date}%`);
    request.input('group', sql.Int, parseInt(ship_group, 10));

    const sqlQuery = `
      WITH UniqueShipYmds AS (
          SELECT DISTINCT
              SHIP_YMDS
          FROM
              dbo.MAT_BARCODE_HIS
          WHERE
              ship_ymds LIKE @date
      ),
      RankedShipYmds AS (
          SELECT
              SHIP_YMDS,
              ROW_NUMBER() OVER (ORDER BY SHIP_YMDS) as group_rn
          FROM
              UniqueShipYmds
      )
      SELECT
          LEFT(bhis.SHIP_YMDS, 8) AS Date,
          FORMAT(rsy.group_rn, '00') AS Ship_Group,
          bhis.SPEC_TX AS 'Pallet Serial',
          bhis.ITMNO as 'Part Number',
          mapping.SHORT_NAME as 'Description',     -- MAT_ITMMAPPING 테이블의 SHORT_NAME 컬럼 추가
          bhis.ITM_QTY as 'Delivery Qty',
          'EA' as Unit,
          '5500003006' as 'PO/SA Number',
          mapping.ORD as 'PO/SA Item',           -- MAT_ITMMAPPING 테이블의 ORD 컬럼 추가
          'RETURNABLE' as Packaging
          
      FROM
          dbo.MAT_BARCODE_HIS bhis
      INNER JOIN
          RankedShipYmds rsy ON bhis.SHIP_YMDS = rsy.SHIP_YMDS
      INNER JOIN
          dbo.MAT_ITMMAPPING mapping ON bhis.ITMNO = mapping.ITMNO -- MAT_ITMMAPPING 테이블과 ITMNO 기준으로 조인
      WHERE
          bhis.ship_ymds LIKE @date
          AND rsy.group_rn = @group
      ORDER BY
          rsy.group_rn, bhis.ITMNO, bhis.SPEC_TX;
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