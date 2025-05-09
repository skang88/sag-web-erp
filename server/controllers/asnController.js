// server/controllers/accController.js
const asnModel = require('../models/asnModel.js');

// Get Access Records
const getASN = async (req, res) => {
  try {
    const { date, group } = req.query; // 쿼리 파라미터에서 date와 group 추출

    if (!date || !group) {
      return res.status(400).send('Date and group parameters are required.');
    }

    const accRecords = await asnModel.getASN(date, group);
    res.json(accRecords); // 조회된 access records를 JSON 형태로 응답
  } catch (err) {
    console.error('Failed to get ASN data:', err);
    res.status(500).send('Failed to retrieve ASN data');
  }
};

module.exports = {
  getASN
};