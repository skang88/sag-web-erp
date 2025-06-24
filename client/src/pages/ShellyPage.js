import { useState, useEffect } from 'react';

// 개발 환경에서 사용할 백엔드 URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL; 

function ShellyPage() {
  // 1. 상태 분리: 장치 상태와 액션 메시지를 별도로 관리
  const [deviceStatus, setDeviceStatus] = useState(null); // Shelly 장치의 실제 상태 (출력, 온도 등)
  const [actionMessage, setActionMessage] = useState('상태를 확인해주세요.'); // 사용자에게 보여줄 메시지 (예: "ON → 성공")
  const [isLoading, setIsLoading] = useState(false); // API 요청 중인지 여부

  // 상태를 가져오는 함수
  const getStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/shelly/status`);
      const data = await res.json();
      const statusObj = data.status;

      const output = statusObj?.result?.output ?? statusObj?.output;
      const tempC = statusObj?.result?.temperature?.tC ?? statusObj?.temperature?.tC;
      const tempF = statusObj?.result?.temperature?.tF ?? statusObj?.temperature?.tF;

      // 장치 상태 객체를 업데이트
      setDeviceStatus({ output, tempC, tempF });
    } catch (err) {
      setActionMessage(`상태 로딩 오류: ${err.message}`);
      setDeviceStatus(null); // 오류 발생 시 상태를 초기화
    }
  };

  // 2. 최초 로딩 및 5초마다 주기적 상태 갱신
  useEffect(() => {
    getStatus(); // 컴포넌트 마운트 시 즉시 상태 호출

    const intervalId = setInterval(getStatus, 200); // 0.2초마다 getStatus 호출

    // 컴포넌트 언마운트 시 인터벌 정리 (메모리 누수 방지)
    return () => clearInterval(intervalId);
  }, []); // 빈 배열을 전달하여 최초 렌더링 시 한 번만 실행되도록 설정

  // 버튼 클릭 핸들러
  const handleClick = async (cmd) => {
    setIsLoading(true); // 로딩 시작
    setActionMessage(`${cmd.toUpperCase()} 명령 전송 중...`);
    try {
      await fetch(`${API_BASE_URL}/shelly/${cmd}`);
      setActionMessage(`${cmd.toUpperCase()} → 성공`);
      await getStatus(); // 3. 명령 실행 후 즉시 상태를 다시 가져와 화면에 반영
    } catch (err) {
      setActionMessage(`오류: ${err.message}`);
    } finally {
      setIsLoading(false); // 로딩 종료
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Shelly Relay Controller</h1>

      {/* 4. 항상 표시되는 상태 정보 카드 */}
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Shelly 상태</h2>
        {deviceStatus ? (
          <div className="space-y-2 text-lg">
            <p>
              <strong>출력: </strong>
              <span className={deviceStatus.output ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                {deviceStatus.output ? 'ON' : 'OFF'}
              </span>
            </p>
            <p>
              <strong>온도: </strong>{deviceStatus.tempC ?? 'N/A'} °C / {deviceStatus.tempF ?? 'N/A'} °F
            </p>
          </div>
        ) : (
          <p className="text-gray-500">상태 정보를 불러오는 중...</p>
        )}
      </div>

      {/* 컨트롤 버튼 */}
      <div className="space-x-4 mb-4">
        <button
          onClick={() => handleClick('on')}
          disabled={isLoading}
          className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Relay ON
        </button>
        <button
          onClick={() => handleClick('off')}
          disabled={isLoading}
          className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Relay OFF
        </button>
        <button
          onClick={() => handleClick('toggle')}
          disabled={isLoading}
          className="px-6 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          TOGGLE
        </button>
        <button
          onClick={getStatus}
          disabled={isLoading}
          className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          수동 갱신
        </button>
      </div>

      {/* 동작 결과 메시지 */}
      <div className="h-8 text-lg font-semibold text-gray-700 mt-2">
        {actionMessage}
      </div>
    </div>
  );
}

export default ShellyPage;