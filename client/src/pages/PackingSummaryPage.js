import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// 실제 API의 기본 URL을 여기에 설정합니다.
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function PackingItemsFetcher() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // --- CHANGES START HERE ---
  // Set default date to today and default group to '01'
  const [date, setDate] = useState(getTodayDate());
  const [group, setGroup] = useState('01');
  // --- CHANGES END HERE ---

  const fetchItems = useCallback(async () => {
    if (!date || !group) {
      alert('날짜와 Shipping Group을 모두 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formattedDate = date.replace(/-/g, '');

      const queryParams = new URLSearchParams({
        date: formattedDate,
        group: group,
      }).toString();

      const apiUrl = `${API_BASE_URL}/api/packing?${queryParams}`; // 엔드포인트 변경 확인

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setItems(data); // 가져온 데이터를 상태에 저장
    } catch (err) {
      console.error("아이템 조회 실패:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [date, group]);

  if (loading) {
    return (
      <div className="p-5 text-center">
        <h2 className="text-2xl font-bold text-gray-800">트레일러 아이템 정보 로딩 중...</h2>
        <p className="mt-2 text-gray-600">잠시만 기다려 주세요.</p>
      </div>
    );
  }

  if (error) {
    const handleGoToPacking = () => {
      navigate('/home');
    };

    return (
      <div className="p-5 text-red-600 text-center">
        <h2 className="text-2xl font-bold mb-3">데이터를 불러오는 중 오류가 발생했습니다.</h2>
        <p className="mb-4">{error.message || '알 수 없는 오류'}</p>
        <button
          onClick={handleGoToPacking}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200"
        >
          뒤로 가기
        </button>
      </div>
    );
  }

  return (
    <div className="p-5">
      <h1 className="text-3xl font-bold mb-6 text-center">트레일러 적재 예정 아이템 Summary 조회</h1> {/* h1도 중앙 정렬 추가 */}

      {/* 파라미터 입력 UI - 이 div 자체를 가운데 정렬 */}
      <div className="mb-5 border border-gray-200 p-4 rounded-lg bg-gray-50 mx-auto max-w-xl">
        {/* 날짜 입력과 Shipping Group 입력이 한 줄에 오도록 flex 컨테이너로 감쌈 */}
        <div className="flex items-center gap-4 mb-4 justify-center">
          {/* 날짜 입력 부분 */}
          <div className="flex items-center">
            <label htmlFor="date" className="mr-2 font-bold text-gray-700 whitespace-nowrap">날짜:</label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="p-2 rounded border border-gray-300 w-40 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0"
            />
          </div>

          {/* Shipping Group 입력 부분 */}
          <div className="flex items-center">
            <label htmlFor="group" className="mr-2 font-bold text-gray-700 whitespace-nowrap">Shipping Group:</label>
            <input
              type="text"
              id="group"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              placeholder="예: 01, 02, 03, ..."
              className="p-2 rounded border border-gray-300 w-[40px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 아이템 조회 버튼 */}
        <div className="flex justify-center">
          <button
            onClick={fetchItems}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-md cursor-pointer text-base hover:bg-blue-700 transition duration-200"
          >
            아이템 조회
          </button>
        </div>
      </div>

      {/* 아이템 목록 표시 */}
      {items.length === 0 && !loading && !error ? (
        <p className="text-center text-gray-600 mt-10">
          조회할 날짜와 Shipping Group을 입력하고 '아이템 조회' 버튼을 눌러주세요.
        </p>
      ) : (
        <div>
          {/* Summary information centered */}
          {/* 이 부분은 현재 데이터에 totalCount와 totalWeight가 없으므로 잠시 주석 처리하거나, API 응답 형식에 맞춰 업데이트해야 합니다. */}
          {/* <div className="mb-5 text-lg text-center">
            <strong className="font-bold text-gray-800">총 팔렛수:</strong> <span className="font-semibold">{totalCount}건</span> &nbsp;&nbsp;
            <strong className="font-bold text-gray-800">총 중량:</strong> <span className="font-semibold">{totalWeight.toLocaleString()}lb</span>
          </div> */}

          {/* Table container for scrolling */}
          <div className="max-h-[500px] overflow-y-auto relative border border-gray-300 rounded-lg shadow-sm"> {/* Added max-height, overflow-y-auto, relative, border, and shadow */}
            <table className="w-full border-collapse mt-0"> {/* Adjusted mt-5 to mt-0 as margin is now on container */}
              <thead>
                <tr className="bg-gray-200 sticky top-0 z-10"> {/* Added sticky top-0 z-10 for fixed header */}
                  <th className="p-3 border border-gray-300 text-left font-bold">부품 번호</th>
                  <th className="p-3 border border-gray-300 text-left font-bold">아이템 이름</th>
                  <th className="p-3 border border-gray-300 text-left font-bold">팔레트 수</th>
                  <th className="p-3 border border-gray-300 text-left font-bold">총 중량 (lbs)</th>
                  <th className="p-3 border border-gray-300 text-left font-bold">규격 (W x D x H)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => ( // Using index as key if partNumber isn't guaranteed unique
                  <tr key={item.partNumber || index} className="border-b border-gray-200 bg-white hover:bg-gray-50"> {/* Added bg-white and hover effect */}
                    <td className="p-2 border border-gray-300 text-left">{item.partNumber}</td>
                    <td className="p-2 border border-gray-300 text-left">{item.itemName}</td>
                    <td className="p-2 border border-gray-300 text-left">{item.palletCount}</td>
                    <td className="p-2 border border-gray-300 text-left">{item.totalWeight}</td>
                    <td className="p-2 border border-gray-300 text-left">
                      {`${item.dimensions.width} x ${item.dimensions.depth} x ${item.dimensions.height}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div> {/* End of scrollable table container */}
        </div>
      )}
    </div>
  );
}

export default PackingItemsFetcher;