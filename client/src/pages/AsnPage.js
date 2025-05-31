import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx'; // xlsx 라이브러리 import

const API_BASE_URL = 'http://172.16.220.32:8001';

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function AsnPage() {
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const [date, setDate] = useState(getTodayDate());
  const [group, setGroup] = useState('01');

  const fetchItems = useCallback(async () => {
    if (!date || !group) {
      alert('날짜와 Shipping Group을 모두 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setItems([]); // 조회 시작 시 기존 아이템 초기화
      setTotalCount(0); // 조회 시작 시 기존 카운트 초기화

      const formattedDate = date.replace(/-/g, '');
      const queryParams = new URLSearchParams({
        date: formattedDate,
        group: group,
      }).toString();

      const apiUrl = `${API_BASE_URL}/api/asn?${queryParams}`;
      console.log('API 호출 URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setItems(data.data || []);
      setTotalCount(data.count || 0);
    } catch (err) {
      console.error("ASN 데이터 조회 실패:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [date, group]);

  // Excel 다운로드 핸들러 함수 (XLS 형식으로 수정)
  const handleExcelDownload = () => {
    if (items.length === 0) {
      alert('다운로드할 데이터가 없습니다.');
      return;
    }

    const excelData = items.map((item, index) => ({
      'Pallet/Rack Serial': item.palletSerial,
      'Part Number': item.partNumber,
      'Description (Optional)': item.description,
      'Delivery Qty.': item.deliveryQty,
      'Base Unit': item.unit,
      'PO/SA Number (Max. 10)': item.poNumber,
      'PO/SA Item (Max. 5)': item.poItem,
      'Packaging': item.packaging,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    const columnWidths = [
      { wch: 20 }, // Pallet Serial
      { wch: 20 }, // Part Number
      { wch: 35 }, // Description
      { wch: 12 }, // Delivery Qty
      { wch: 8 },  // Unit
      { wch: 15 }, // PO Number
      { wch: 10 }, // PO Item
      { wch: 15 }, // Packaging
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Upload Format');

    // 파일명 생성 (조회한 날짜와 그룹 기준, .xls 확장자)
    const excelFileName = `SAG${date.replace(/-/g, '')}${group}_HU.xls`; // --- CHANGED: .xlsx to .xls

    // Excel 파일 다운로드 (bookType: 'biff8' 추가하여 XLS 형식으로 지정)
    XLSX.writeFile(workbook, excelFileName, { bookType: 'biff8' }); // --- CHANGED: Added { bookType: 'biff8' }
  };


  if (loading) {
    return (
      <div className="p-5 text-center">
        <h2 className="text-2xl font-bold text-gray-800">ASN 정보 로딩 중...</h2>
        <p className="mt-2 text-gray-600">잠시만 기다려 주세요.</p>
      </div>
    );
  }

  if (error) {
    const handleGoBack = () => {
      navigate('/home');
    };

    return (
      <div className="p-5 text-red-600 text-center">
        <h2 className="text-2xl font-bold mb-3">데이터를 불러오는 중 오류가 발생했습니다.</h2>
        <p className="mb-4">{error.message || '알 수 없는 오류'}</p>
        <button
          onClick={handleGoBack}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200"
        >
          뒤로 가기
        </button>
      </div>
    );
  }

  return (
    <div className="p-5">
      <h1 className="text-3xl font-bold mb-6 text-center">ASN 조회</h1>

      <div className="mb-5 border border-gray-200 p-4 rounded-lg bg-gray-50 mx-auto max-w-xl">
        <div className="flex items-center gap-4 mb-4 justify-center">
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
          <div className="flex items-center">
            <label htmlFor="group" className="mr-2 font-bold text-gray-700 whitespace-nowrap">Shipping Group:</label>
            <input
              type="text"
              id="group"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              placeholder="예: 01"
              className="p-2 rounded border border-gray-300 w-[60px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex justify-center gap-3">
          <button
            onClick={fetchItems}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-md cursor-pointer text-base hover:bg-blue-700 transition duration-200"
          >
            ASN 조회
          </button>
          <button
            onClick={handleExcelDownload}
            disabled={items.length === 0 || loading}
            className="px-5 py-2.5 bg-green-600 text-white rounded-md cursor-pointer text-base hover:bg-green-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Excel 다운로드
          </button>
        </div>
      </div>

      {!loading && !error && items.length === 0 && (
        <p className="text-center text-gray-600 mt-10">
          조회할 날짜와 Shipping Group을 입력하고 'ASN 조회' 버튼을 눌러주세요.
        </p>
      )}

      {items.length > 0 && !loading && !error && (
        <div>
          <div className="mb-5 text-lg text-center">
            <strong className="font-bold text-gray-800">총 항목 수:</strong> <span className="font-semibold">{totalCount}건</span>
          </div>

          <div className="max-h-[500px] overflow-y-auto relative border border-gray-300 rounded-lg">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr className="sticky top-0 z-10 bg-gray-200">
                  <th className="p-3 border border-gray-300 text-left font-semibold text-sm">#</th>
                  <th className="p-3 border border-gray-300 text-left font-semibold text-sm">Pallet Serial</th>
                  <th className="p-3 border border-gray-300 text-left font-semibold text-sm">Part Number</th>
                  <th className="p-3 border border-gray-300 text-left font-semibold text-sm">Description</th>
                  <th className="p-3 border border-gray-300 text-left font-semibold text-sm">Delivery Qty</th>
                  <th className="p-3 border border-gray-300 text-left font-semibold text-sm">Unit</th>
                  <th className="p-3 border border-gray-300 text-left font-semibold text-sm">PO Number</th>
                  <th className="p-3 border border-gray-300 text-left font-semibold text-sm">PO Item</th>
                  <th className="p-3 border border-gray-300 text-left font-semibold text-sm">Packaging</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.palletSerial || index} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-2 border border-gray-300 text-left text-sm">{index + 1}</td>
                    <td className="p-2 border border-gray-300 text-left text-sm">{item.palletSerial}</td>
                    <td className="p-2 border border-gray-300 text-left text-sm">{item.partNumber}</td>
                    <td className="p-2 border border-gray-300 text-left text-sm">{item.description}</td>
                    <td className="p-2 border border-gray-300 text-left text-sm">{item.deliveryQty}</td>
                    <td className="p-2 border border-gray-300 text-left text-sm">{item.unit}</td>
                    <td className="p-2 border border-gray-300 text-left text-sm">{item.poNumber}</td>
                    <td className="p-2 border border-gray-300 text-left text-sm">{item.poItem}</td>
                    <td className="p-2 border border-gray-300 text-left text-sm">{item.packaging}</td>
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

export default AsnPage;