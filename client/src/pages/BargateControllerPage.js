import React, { useState, useCallback, useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// --- 설정 영역 ---
// 각 게이트의 이름과 Open/Close에 사용할 Shelly ID를 설정합니다.
const GATES_CONFIG = [
  { id: 1, name: '방문객 입차', openShellyId: 3, closeShellyId: 1 },
  { id: 2, name: '방문객 출차', openShellyId: 4, closeShellyId: 2 },
  { id: 3, name: '직원 입차', openShellyId: 8, closeShellyId: 7 },
  { id: 4, name: '직원 출차', openShellyId: 5, closeShellyId: 6 },
];

// 배경 이미지 경로 (public 폴더 기준)
const BACKGROUND_IMAGE_PATH = '/BargateBackground.png';  

// 각 게이트별 버튼 위치 (top, left는 % 단위)
const GATE_POSITIONS = {
  1: { top: '50%', left: '25%' },
  2: { top: '50%', left: '70%' },
  3: { top: '50%', left: '10%' },
  4: { top: '50%', left: '85%' },
};
// --- 설정 영역 끝 ---


const BargateControllerPage = () => {
  const [holdOpenState, setHoldOpenState] = useState({});
  const [loadingState, setLoadingState] = useState({});
  const [message, setMessage] = useState('');

  // 쉘리 상태를 가져와 열림 고정 상태를 업데이트하는 함수
  const fetchShellyStatus = useCallback(async (shellyId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/shelly/status/${shellyId}`);
      if (!res.ok) throw new Error('Failed to fetch status');
      const data = await res.json();
      const output = data.status?.result?.output ?? data.status?.output;
      return output;
    } catch (error) {
      console.error(`Error fetching status for shelly ${shellyId}:`, error);
      return false; // 에러 발생 시 'off' 상태로 간주
    }
  }, []);

  // 페이지 로드 시 열림 담당 쉘리들의 상태를 가져와 초기화
  useEffect(() => {
    const initHoldOpenStates = async () => {
      const states = {};
      for (const gate of GATES_CONFIG) {
        const status = await fetchShellyStatus(gate.openShellyId);
        states[gate.id] = status;
      }
      setHoldOpenState(states);
    };
    initHoldOpenStates();
  }, [fetchShellyStatus]);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  // 1초간 On 후 Off 하는 Pulse 동작
  const handlePulse = async (shellyId, gateName, action) => {
    const loadingKey = `${shellyId}-${action}`;
    setLoadingState(prev => ({ ...prev, [loadingKey]: true }));
    showMessage(`${gateName} ${action} 동작 중...`);
    try {
      // ON
      await fetch(`${API_BASE_URL}/api/shelly/on/${shellyId}`, { method: 'POST' });
      
      // 1초 대기
      await new Promise(resolve => setTimeout(resolve, 1000));

      // OFF
      await fetch(`${API_BASE_URL}/api/shelly/off/${shellyId}`, { method: 'POST' });
      
      showMessage(`${gateName} ${action} 완료`);
    } catch (error) {
      console.error('Pulse action failed:', error);
      showMessage(`${gateName} ${action} 실패`);
    } finally {
      setLoadingState(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // 열림 고정 / 해제 토글
  const handleToggleHoldOpen = async (gate) => {
    const loadingKey = `${gate.id}-hold`;
    setLoadingState(prev => ({ ...prev, [loadingKey]: true }));
    
    const isCurrentlyHeld = holdOpenState[gate.id];
    const targetAction = isCurrentlyHeld ? 'off' : 'on';
    const actionText = isCurrentlyHeld ? '열림 고정 해제' : '열림 고정';

    showMessage(`${gate.name} ${actionText} 동작 중...`);
    try {
      await fetch(`${API_BASE_URL}/api/shelly/${targetAction}/${gate.openShellyId}`, { method: 'POST' });
      setHoldOpenState(prev => ({ ...prev, [gate.id]: !isCurrentlyHeld }));
      showMessage(`${gate.name} ${actionText} 완료`);
    } catch (error) {
      console.error('Toggle hold open failed:', error);
      showMessage(`${gate.name} ${actionText} 실패`);
    } finally {
      setLoadingState(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  return (
    <div className="relative w-screen h-screen bg-gray-200">
      {/* 배경 이미지 */}
      <div 
        className="absolute top-0 left-0 w-full h-full bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${BACKGROUND_IMAGE_PATH})`, opacity: 1 }}
      ></div>
      
      {/* 상단 메시지 */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white px-6 py-2 rounded-lg shadow-lg text-lg font-semibold">
        {message || 'Bargate Controller'}
      </div>

      {/* 게이트별 컨트롤러 */}
      {GATES_CONFIG.map(gate => {
        const position = GATE_POSITIONS[gate.id] || { top: '50%', left: '50%' };
        const isHeld = holdOpenState[gate.id];
        
        return (
          <div 
            key={gate.id}
            className="absolute p-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-xl"
            style={{ top: position.top, left: position.left, transform: 'translate(-50%, -50%)' }}
          >
            <h3 className="text-xl font-bold text-center mb-4">{gate.name}</h3>
            <div className="flex space-x-2">
              {/* 열림 버튼 */}
              <button
                onClick={() => handlePulse(gate.openShellyId, gate.name, '열림')}
                disabled={loadingState[`${gate.openShellyId}-열림`]}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                열림
              </button>
              {/* 닫힘 버튼 */}
              <button
                onClick={() => handlePulse(gate.closeShellyId, gate.name, '닫힘')}
                disabled={loadingState[`${gate.closeShellyId}-닫힘`]}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                닫힘
              </button>
              {/* 열림 고정/해제 버튼 */}
              <button
                onClick={() => handleToggleHoldOpen(gate)}
                disabled={loadingState[`${gate.id}-hold`]}
                className={`px-4 py-2 text-white rounded disabled:opacity-50 ${
                  isHeld ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {isHeld ? '열림 고정 해제' : '열림 고정'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BargateControllerPage;
