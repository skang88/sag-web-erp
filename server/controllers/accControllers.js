// server/controllers/accController.js
const axios = require('axios');

const API_BASE_URL = 'http://172.16.224.111:3000';

// Get Attendance Records
const getAccRecords = async (req, res) => {
    const { from, to } = req.query;
    if (!from || !to) {
        return res.status(400).send('Please provide from and to date parameters.');
    }
    try {
        const response = await axios.get(`${API_BASE_URL}/attendance`, { params: { from, to } });
        res.json(response.data);
    } catch (error) {
        console.error('Failed to retrieve attendance records:', error);
        res.status(500).send('Failed to retrieve attendance records');
    }
};

// Get Inactive Users
const getLastLoginRecords = async (req, res) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/users/inactive`);
        res.json(response.data);
    } catch (error) {
        console.error('Failed to retrieve inactive users:', error);
        res.status(500).send('Failed to retrieve inactive users');
    }
};

// Get Attendance Logs for a specific user
const getAccLogForUser = async (req, res) => {
    const { date, l_id } = req.query;
    if (!date || !l_id) {
        return res.status(400).send('Please provide date and l_id parameters.');
    }
    try {
        const response = await axios.get(`${API_BASE_URL}/attendance/logs`, { params: { date, l_id } });
        res.json(response.data);
    } catch (error) {
        console.error('Failed to retrieve attendance logs:', error);
        res.status(500).send('Failed to retrieve attendance logs');
    }
};

module.exports = {
    getAccRecords,
    getLastLoginRecords,
    getAccLogForUser
};
