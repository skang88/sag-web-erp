// shellyController.js

const axios = require('axios');
require('dotenv').config();

const RPC_URL = `http://${process.env.SHELLY_IP}/rpc`;

// [수정] 릴레이를 켜는 핵심 로직 (내부 호출용)
const _turnOn = async () => {
  console.log('Shelly 릴레이를 켭니다...');
  // axios 요청 자체를 반환합니다.
  return axios.post(RPC_URL, {
    id: 1,
    method: "Switch.Set",
    params: { id: 0, on: true }
  }, {
    headers: { "Content-Type": "application/json" }
  });
};

// [수정] 릴레이를 끄는 핵심 로직 (내부 호출용)
const _turnOff = async () => {
  console.log('Shelly 릴레이를 끕니다...');
  return axios.post(RPC_URL, {
    id: 1,
    method: "Switch.Set",
    params: { id: 0, on: false }
  }, {
    headers: { "Content-Type": "application/json" }
  });
};


// --- 기존의 Express 라우트 핸들러들 ---

// API 요청으로 릴레이를 켤 때 사용
const turnOnRelay = async (req, res) => {
  try {
    const result = await _turnOn(); // 내부 함수 호출
    res.json({ status: 'on', result: result.data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// API 요청으로 릴레이를 끌 때 사용
const turnOffRelay = async (req, res) => {
  try {
    const result = await _turnOff(); // 내부 함수 호출
    res.json({ status: 'off', result: result.data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const toggleRelay = async (req, res) => {
  try {
    const result = await axios.post(RPC_URL, {
      id: 3,
      method: "Switch.Toggle",
      params: { id: 0 }
    }, {
      headers: { "Content-Type": "application/json" }
    });
    res.json({ status: 'toggled', result: result.data });
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

// [수정] 내부 호출용 함수들을 export에 추가합니다.
module.exports = {
  turnOnRelay,
  turnOffRelay,
  toggleRelay,
  getStatus,
  _turnOn,
  _turnOff
};