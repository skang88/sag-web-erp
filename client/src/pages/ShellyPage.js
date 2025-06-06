import { useState } from 'react';

const API_BASE_URL = 'http://172.16.220.32:8001/api'; // 개발 환경에서 사용할 백엔드 URL

function ShellyPage() {
  const [status, setStatus] = useState('unknown');

  const handleClick = async (cmd) => {
    try {
      const res = await fetch(`${API_BASE_URL}/shelly/${cmd}`);
      const data = await res.json();
      setStatus(`${cmd.toUpperCase()} → 성공`);
    } catch (err) {
      setStatus(`오류: ${err.message}`);
    }
  };

  const getStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/shelly/status`);
      const data = await res.json();

    // Shelly에서 받은 상태 객체
    const statusObj = data.status;

    // output, 온도 추출 (null 체크 포함)
    const output = statusObj?.result?.output ?? statusObj?.output;
    const tempC = statusObj?.result?.temperature?.tC ?? statusObj?.temperature?.tC;
    const tempF = statusObj?.result?.temperature?.tF ?? statusObj?.temperature?.tF;

    setStatus(`출력: ${output ? 'ON' : 'OFF'}, 온도: ${tempC ?? 'N/A'} °C, 온도: ${tempF ?? 'N/A'} °F`);
  } catch (err) {
    setStatus(`오류: ${err.message}`);
  }
};

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Shelly Relay Controller</h1>

      <div className="space-x-4 mb-6">
        <button
          onClick={() => handleClick('on')}
          className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
        >
          Relay ON
        </button>
        <button
          onClick={() => handleClick('off')}
          className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Relay OFF
        </button>
        <button
          onClick={() => handleClick('toggle')}
          className="px-6 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
        >
          TOGGLE
        </button>
        <button
          onClick={getStatus}
          className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          STATUS
        </button>
      </div>

      <div className="text-lg font-semibold text-gray-700">
        {status}
      </div>
    </div>
  );
}

export default ShellyPage;
