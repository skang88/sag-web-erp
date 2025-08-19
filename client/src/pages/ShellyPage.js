import { useState, useEffect, useCallback } from 'react';

// 개발 환경에서 사용할 백엔드 URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL; 

// 관리할 Shelly 장치 목록
const SHELLIES = [
  { id: 1, name: 'Shelly 1 (Entrance - Close)' },
  { id: 2, name: 'Shelly 2 (Exit)' },
  { id: 3, name: 'Shelly 3 (Entrance - Open)' },
];

// 각 장치의 상태와 제어 UI를 담는 카드 컴포넌트
const DeviceCard = ({ shelly, status, onAction, onRefresh, isLoading }) => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md transition-shadow hover:shadow-xl">
      <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">{shelly.name}</h2>
      
      {/* 상태 표시 영역 */}
      <div className="h-24">
        {status && !status.error ? (
          <div className="space-y-2 text-lg">
            <p>
              <strong>Output: </strong>
              <span className={status.output ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                {status.output ? 'ON' : 'OFF'}
              </span>
            </p>
            <p>
              <strong>Temperature: </strong>{status.tempC ?? 'N/A'} °C / {status.tempF ?? 'N/A'} °F
            </p>
          </div>
        ) : status && status.error ? (
          <p className="text-red-500">Error: {status.error}</p>
        ) : (
          <p className="text-gray-500">Loading status...</p>
        )}
      </div>

      {/* 컨트롤 버튼 영역 */}
      <div className="mt-6 flex justify-end items-center space-x-2">
        <button
          onClick={() => onAction('on', shelly.id)}
          disabled={isLoading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ON
        </button>
        <button
          onClick={() => onAction('off', shelly.id)}
          disabled={isLoading}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          OFF
        </button>
        <button
          onClick={() => onAction('toggle', shelly.id)}
          disabled={isLoading}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Toggle
        </button>
        <button
          onClick={() => onRefresh(shelly.id)}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

function ShellyPage() {
  const [deviceStatuses, setDeviceStatuses] = useState({}); // 모든 장치의 상태를 객체로 저장
  const [actionMessage, setActionMessage] = useState(''); // 사용자에게 보여줄 메시지 (예: "ON → 성공")
  const [loadingStates, setLoadingStates] = useState({}); // 장치별 로딩 상태 관리

  // 상태를 가져오는 함수
  const getStatus = useCallback(async (shellyId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/shelly/status/${shellyId}`);
      if (!res.ok) {
        throw new Error(`Device not responding (HTTP ${res.status})`);
      }
      const data = await res.json();
      const statusObj = data.status;

      const output = statusObj?.result?.output ?? statusObj?.output;
      const tempC = statusObj?.result?.temperature?.tC ?? statusObj?.temperature?.tC;
      const tempF = statusObj?.result?.temperature?.tF ?? statusObj?.temperature?.tF;

      setDeviceStatuses(prev => ({
        ...prev,
        [shellyId]: { output, tempC, tempF, error: null }
      }));
    } catch (err) {
      console.error(`Shelly ${shellyId} status loading error:`, err);
      setDeviceStatuses(prev => ({
        ...prev,
        [shellyId]: { error: err.message }
      }));
    }
  }, []);

  // 주기적으로 모든 장치의 상태를 갱신
  useEffect(() => {
    SHELLIES.forEach(shelly => getStatus(shelly.id));

    const intervalId = setInterval(() => {
      SHELLIES.forEach(shelly => getStatus(shelly.id));
    }, 2000);

    return () => clearInterval(intervalId);
  }, [getStatus]);

  // 버튼 클릭 핸들러
  const handleAction = async (cmd, shellyId) => {
    setLoadingStates(prev => ({ ...prev, [shellyId]: true }));
    const shellyName = SHELLIES.find(s => s.id === shellyId)?.name || `Device ${shellyId}`;
    setActionMessage(`Sending ${cmd.toUpperCase()} command to ${shellyName}...`);
    try {
      const response = await fetch(`${API_BASE_URL}/api/shelly/${cmd}/${shellyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Command failed (HTTP ${response.status})`);
      }

      setActionMessage(`${shellyName} ${cmd.toUpperCase()} → Success`);
      await getStatus(shellyId);
    } catch (err) {
      setActionMessage(`${shellyName} Error: ${err.message}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, [shellyId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <h1 className="text-3xl font-bold my-6 text-gray-800">Shelly Relay Controller</h1>
      
      {/* 동작 결과 메시지 */}
      <div className="w-full max-w-4xl mb-4 h-8 text-center text-lg font-semibold text-gray-700">
        {actionMessage}
      </div>

      {/* 장치 카드 그리드 */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {SHELLIES.map(shelly => (
          <DeviceCard
            key={shelly.id}
            shelly={shelly}
            status={deviceStatuses[shelly.id]}
            onAction={handleAction}
            onRefresh={getStatus}
            isLoading={loadingStates[shelly.id]}
          />
        ))}
      </div>
    </div>
  );
}

export default ShellyPage;