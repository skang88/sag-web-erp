const axios = require('axios');
require('dotenv').config();

const RPC_URL = `http://${process.env.SHELLY_IP}/rpc`;

const turnOnRelay = async (req, res) => {
  try {
    const result = await axios.post(RPC_URL, {
      id: 1,
      method: "Switch.Set",
      params: { id: 0, on: true }
    }, {
      headers: { "Content-Type": "application/json" }
    });

    res.json({ status: 'on', result: result.data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const turnOffRelay = async (req, res) => {
  try {
    const result = await axios.post(RPC_URL, {
      id: 1,
      method: "Switch.Set",
      params: { id: 0, on: false }
    }, {
      headers: { "Content-Type": "application/json" }
    });

    res.json({ status: 'off', result: result.data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getStatus = async (req, res) => {
  try {
    const result = await axios.post(RPC_URL, {
      id: 2,
      method: "Switch.GetStatus",
      params: { id: 0 }
    }, {
      headers: { "Content-Type": "application/json" }
    });

    res.json({ status: result.data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  turnOnRelay,
  turnOffRelay,
  getStatus
};
