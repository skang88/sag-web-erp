// shellyController.js

const axios = require('axios');
require('dotenv').config();

// Shelly IP 주소를 객체로 관리하여 확장성을 높입니다.
const SHELLY_IPS = {
  1: process.env.SHELLY_IP,    // .env 파일의 SHELLY_IP
  2: process.env.SHELLY2_IP,   // .env 파일의 SHELLY2_IP
  // Shelly가 추가되면 여기에 3: process.env.SHELLY3_IP 와 같이 추가하면 됩니다.
};

// shellyId를 기반으로 RPC URL을 반환하는 헬퍼 함수
const getRpcUrl = (shellyId) => {
  const ip = SHELLY_IPS[shellyId];
  if (!ip) {
    // 유효하지 않은 ID에 대한 오류를 명확하게 처리합니다.
    throw new Error(`Shelly ID '${shellyId}'에 해당하는 IP를 찾을 수 없습니다.`);
  }
  return `http://${ip}/rpc`;
};

// [수정] 릴레이를 켜는 핵심 로직 (내부 호출용)
const _turnOn = async (shellyId) => {
  console.log(`Shelly ${shellyId} 릴레이를 켭니다...`);
  const rpcUrl = getRpcUrl(shellyId);
  // axios 요청 자체를 반환합니다.
  return axios.post(rpcUrl, {
    id: 1,
    method: "Switch.Set",
    params: { id: 0, on: true }
  }, {
    headers: { "Content-Type": "application/json" }
  });
};

// [수정] 릴레이를 끄는 핵심 로직 (내부 호출용)
const _turnOff = async (shellyId) => {
  console.log(`Shelly ${shellyId} 릴레이를 끕니다...`);
  const rpcUrl = getRpcUrl(shellyId);
  return axios.post(rpcUrl, {
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
    const { id } = req.params;
    const result = await _turnOn(id); // 내부 함수 호출 시 ID 전달
    res.json({ status: 'on', result: result.data });
  } catch (err) {
    const statusCode = err.message.includes('IP를 찾을 수 없습니다') ? 404 : 500;
    res.status(statusCode).json({ error: err.message });
  }
};

// API 요청으로 릴레이를 끌 때 사용
const turnOffRelay = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await _turnOff(id); // 내부 함수 호출 시 ID 전달
    res.json({ status: 'off', result: result.data });
  } catch (err) {
    const statusCode = err.message.includes('IP를 찾을 수 없습니다') ? 404 : 500;
    res.status(statusCode).json({ error: err.message });
  }
};

const toggleRelay = async (req, res) => {
  try {
    const { id } = req.params;
    const rpcUrl = getRpcUrl(id);
    const result = await axios.post(rpcUrl, {
      id: 3,
      method: "Switch.Toggle",
      params: { id: 0 }
    }, {
      headers: { "Content-Type": "application/json" }
    });
    res.json({ status: 'toggled', result: result.data });
  } catch (err) {
    const statusCode = err.message.includes('IP를 찾을 수 없습니다') ? 404 : 500;
    res.status(statusCode).json({ error: err.message });
  }
};

const getStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const rpcUrl = getRpcUrl(id);
    const result = await axios.post(rpcUrl, {
      id: 2,
      method: "Switch.GetStatus",
      params: { id: 0 }
    }, {
      headers: { "Content-Type": "application/json" }
    });
    res.json({ status: result.data });
  } catch (err) {
    const statusCode = err.message.includes('IP를 찾을 수 없습니다') ? 404 : 500;
    res.status(statusCode).json({ error: err.message });
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