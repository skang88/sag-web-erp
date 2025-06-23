import { useState, useEffect } from 'react';

// --- Helper Components ---

// 로딩 스피너를 위한 간단한 컴포넌트
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center h-64 text-gray-700">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-sky-500"></div>
    <p className="mt-4 text-lg">번호판 데이터를 불러오는 중...</p>
  </div>
);

// 에러 메시지를 표시하기 위한 컴포넌트
const ErrorDisplay = ({ message }) => (
  <div className="p-4 mx-auto my-8 max-w-2xl text-center text-red-800 bg-red-100 rounded-lg border border-red-200">
    <h3 className="text-xl font-bold">에러가 발생했습니다</h3>
    <p className="mt-2">{message}</p>
    <p className="mt-2 text-sm">API 엔드포인트와 네트워크 연결을 확인해주세요.</p>
  </div>
);

// --- Main Application Component ---
const App = () => {
  // 불러온 번호판 데이터를 저장하기 위한 상태
  const [plates, setPlates] = useState([]);
  // 로딩 상태를 관리하기 위한 상태
  const [loading, setLoading] = useState(true);
  // 발생할 수 있는 에러를 처리하기 위한 상태
  const [error, setError] = useState(null);

  // 사용자가 제공한 API 엔드포인트 URL
  const API_ENDPOINT = 'http://66.118.96.42:28001/api/plate';

  // 컴포넌트가 마운트될 때 데이터를 불러오기 위한 useEffect 훅
  useEffect(() => {
    const fetchPlateData = async () => {
      try {
        // API에서 데이터 불러오기
        const response = await fetch(API_ENDPOINT);

        // 네트워크 응답이 성공적인지 확인
        if (!response.ok) {
          throw new Error(`네트워크 응답이 올바르지 않습니다 (상태: ${response.status})`);
        }

        // 응답에서 JSON 데이터 파싱
        const result = await response.json();

        // 응답에 예상되는 'data' 배열이 포함되어 있는지 확인
        if (result.data && Array.isArray(result.data)) {
          setPlates(result.data);
        } else {
          throw new Error("API에서 잘못된 데이터 형식을 받았습니다.");
        }

      } catch (err) {
        // 에러 발생 시 에러 상태 업데이트
        setError(err.message);
      } finally {
        // 데이터 로딩이 완료되면(성공 또는 실패) 로딩 상태를 false로 설정
        setLoading(false);
      }
    };

    fetchPlateData();
  }, []); // 빈 의존성 배열은 이 효과가 한 번만 실행되도록 보장합니다

  // ISO 날짜 문자열을 더 읽기 쉬운 형식으로 변환하는 헬퍼 함수
  const formatDate = (isoString) => {
    if (!isoString) return "날짜 정보 없음";
    try {
      const date = new Date(isoString);
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch (e) {
      return "잘못된 날짜 형식";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* --- Header --- */}
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">차량 번호판 인식 기록</h1>
          <p className="mt-2 text-lg text-sky-600">ALPR 시스템 실시간 피드</p>
        </header>

        {/* --- Main Content --- */}
        <main>
          {loading && <LoadingSpinner />}
          {error && <ErrorDisplay message={error} />}
          
          {/* --- Plate Data Grid --- */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {plates.map((plate, index) => (
                <div key={plate.startTime + index} className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 border border-gray-200">
                  {/* Card Header with Plate Number */}
                  <div className="bg-gray-50 p-4 text-center border-b border-gray-200">
                    <p className="text-sm text-sky-600 font-semibold">인식된 번호판</p>
                    <h2 className="text-3xl font-mono font-bold tracking-widest text-gray-900">
                      {plate.bestPlateNumber || 'N/A'}
                    </h2>
                  </div>

                  {/* Card Body with Details */}
                  <div className="p-5 space-y-4">
                    <div>
                      <h4 className="text-xs text-gray-500 font-bold uppercase">인식 시간</h4>
                      <p className="text-gray-700">{formatDate(plate.startTime)}</p>
                    </div>
                    <div>
                       <h4 className="text-xs text-gray-500 font-bold uppercase mb-2">차량 정보</h4>
                       <div className="flex flex-wrap gap-2">
                           <span className="bg-sky-100 text-sky-800 text-sm font-medium px-3 py-1 rounded-full">{plate.vehicle?.make || 'N/A'}</span>
                           <span className="bg-teal-100 text-teal-800 text-sm font-medium px-3 py-1 rounded-full">{plate.vehicle?.makeModel || 'N/A'}</span>
                           <span className="bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full">{plate.vehicle?.bodyType || 'N/A'}</span>
                           <span className="bg-rose-100 text-rose-800 text-sm font-medium px-3 py-1 rounded-full">{plate.vehicle?.color || 'N/A'}</span>
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
