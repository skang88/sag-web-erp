import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://172.16.220.32:8001';

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
  const [totalCount, setTotalCount] = useState(0);
  const [totalWeight, setTotalWeight] = useState(0);

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

      // Updated API endpoint
      const apiUrl = `${API_BASE_URL}/api/packing/items?${queryParams}`;
      console.log('API 호출 URL:', apiUrl);

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

      // Set items, total count, and total weight from the API response
      setItems(data.data);
      setTotalCount(data.count);
      setTotalWeight(data.totalWeight);
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
      <h1 className="text-3xl font-bold mb-6 text-center">트레일러 적재 예정 아이템 조회</h1>

      {/* Parameter input UI - centered */}
      <div className="mb-5 border border-gray-200 p-4 rounded-lg bg-gray-50 mx-auto max-w-xl">
        {/* Date and Shipping Group inputs on one line */}
        <div className="flex items-center gap-4 mb-4 justify-center">
          {/* Date input */}
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

          {/* Shipping Group input */}
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

        {/* Item search button */}
        <div className="flex justify-center">
          <button
            onClick={fetchItems}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-md cursor-pointer text-base hover:bg-blue-700 transition duration-200"
          >
            아이템 조회
          </button>
        </div>
      </div>

      {/* Item list display */}
      {items.length === 0 && !loading && !error ? (
        <p className="text-center text-gray-600 mt-10">
          조회할 날짜와 Shipping Group을 입력하고 '아이템 조회' 버튼을 눌러주세요.
        </p>
      ) : (
        <div>
          {/* Summary information centered */}
          <div className="mb-5 text-lg text-center">
            <strong className="font-bold text-gray-800">총 팔렛수:</strong> <span className="font-semibold">{totalCount}건</span> &nbsp;&nbsp;
            <strong className="font-bold text-gray-800">총 중량:</strong> <span className="font-semibold">{totalWeight.toLocaleString()}lb</span>
          </div>

          {/* Add a div here to make the table scrollable */}
          <div className="max-h-[500px] overflow-y-auto relative border border-gray-300 rounded-lg">
            <table className="w-full border-collapse">
              <thead>
                {/* Make table header sticky */}
                <tr className="bg-gray-200 sticky top-0 z-10">
                  <th className="p-3 border border-gray-300 text-left font-bold">#</th>
                  <th className="p-3 border border-gray-300 text-left font-bold">Part Number</th>
                  <th className="p-3 border border-gray-300 text-left font-bold">Item Name</th>
                  <th className="p-3 border border-gray-300 text-left font-bold">Type</th>
                  <th className="p-3 border border-gray-300 text-left font-bold">Pallet Serial</th>
                  <th className="p-3 border border-gray-300 text-left font-bold">Delivery Qty</th>
                  <th className="p-3 border border-gray-300 text-left font-bold">Unit Weight</th>
                  <th className="p-3 border border-gray-300 text-left font-bold">규격 (W x D x H)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="p-2 border border-gray-300 text-left">{index + 1}</td>
                    <td className="p-2 border border-gray-300 text-left">{item.partNumber}</td>
                    <td className="p-2 border border-gray-300 text-left">{item.itemName}</td>
                    <td className="p-2 border border-gray-300 text-left">{item.itemType}</td>
                    <td className="p-2 border border-gray-300 text-left">{item.palletSerial}</td>
                    <td className="p-2 border border-gray-300 text-left">{item.deliveryQty}</td>
                    <td className="p-2 border border-gray-300 text-left">{item.itemWeightPerUnit.toLocaleString()}</td>
                    <td className="p-2 border border-gray-300 text-left">
                      {`${item.dimensions.width} x ${item.dimensions.depth} x ${item.dimensions.height}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default PackingItemsFetcher;