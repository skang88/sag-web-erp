// server/controllers/accController.js
const userModel = require('../models/accModel.js');

// Get Access Records 
const getAccRecords = async (req, res) => {
    try {
        const accRecords = await userModel.getAccRecords();
        res.json(accRecords);
    } catch (err) {
        res.status(500).send('Failed to retrieve access records');
    }
};

// Get Access Records 
const getLastLoginRecords = async (req, res) => {
    try {
        const LastLoginRecords = await userModel.getLastLoginRecords();
        res.json(LastLoginRecords);
    } catch (err) {
        res.status(500).send('Failed to retrieve access records');
    }
};

module.exports = {
    getAccRecords, 
    getLastLoginRecords
};
