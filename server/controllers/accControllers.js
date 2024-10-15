// server/controllers/accController.js
const userModel = require('../models/accModel.js');

const getAccRecords = async (req, res) => {
    try {
        const accRecords = await userModel.getAccRecords();
        res.json(accRecords);
    } catch (err) {
        res.status(500).send('Failed to retrieve access records');
    }
};

module.exports = {
    getAccRecords
};
