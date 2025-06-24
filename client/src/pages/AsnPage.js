import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx'; // xlsx 라이브러리 import
import jsPDF from 'jspdf'; // 📄 jsPDF import
import autoTable from 'jspdf-autotable'; // Changed import for jspdf-autotable

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

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
  const [overallTotalWeight, setOverallTotalWeight] = useState(null); // For total weight from packing API

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [date, setDate] = useState(getTodayDate());
  const [group, setGroup] = useState('01');

  const fetchItems = useCallback(async () => {
    if (!date || !group) {
      alert('날짜와 Shipping Group을 모두 입력해주세요.');
      return;
    }

    // 중요: 조회 시작 시 이전 에러 상태 초기화하여, 재조회 시 에러 화면이 남아있지 않도록 함
    setError(null);
    setLoading(true);
    setItems([]);
    setTotalCount(0);
    setOverallTotalWeight(null);

    try {
      const formattedDate = date.replace(/-/g, '');
      const queryParams = new URLSearchParams({
        date: formattedDate,
        group: group,
      }).toString();

      // 1. Fetch ASN Data
      const asnApiUrl = `${API_BASE_URL}/api/asn?${queryParams}`;

      const response = await fetch(asnApiUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const asnData = await response.json();
      setItems(asnData.data || []);
      setTotalCount(asnData.count || 0);

      // 2. Packing API에서 전체 중량 조회
      // ASN 데이터 조회가 성공했을 때만 실행

      if (asnData.data && asnData.data.length > 0) { // ASN 데이터가 있을 때만 중량 조회 시도
        try {
          const packingApiUrl = `${API_BASE_URL}/api/packing/items?${queryParams}`;
          const packingResponse = await fetch(packingApiUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });

          if (packingResponse.ok) {
            const packingApiResponse = await packingResponse.json();
            if (packingApiResponse.totalWeight !== undefined) {
              setOverallTotalWeight(packingApiResponse.totalWeight); // 전체 중량 상태 업데이트
            } else {
              console.warn("Packing API 응답에 totalWeight 필드가 없습니다.");
            }
          } else {
            const packingErrorData = await packingResponse.json().catch(() => ({ message: "Packing 에러 응답 파싱 실패" }));
            console.warn("Packing 데이터 조회 실패:", packingErrorData.message || `Packing API HTTP 에러! 상태: ${packingResponse.status}`);
            // Packing API 실패 시 overallTotalWeight는 null로 유지됨
          }
        } catch (packErr) {
          console.warn("Packing 데이터 처리 중 예외 발생:", packErr);
          // 예외 발생 시 overallTotalWeight는 null로 유지됨
        }
      }

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
    const excelData = items.map((item) => {

      let partNumber = item.partNumber;
      if (partNumber.endsWith('K')) {
        partNumber = partNumber.slice(0, -1); // 마지막 문자 'K' 제거
      }

      return {
        'Pallet/Rack Serial': item.palletSerial,
        'Part Number': partNumber,
        'Description (Optional)': item.description,
        'Delivery Qty.': item.deliveryQty,
        'Base Unit': item.unit,
        'PO/SA Number (Max. 10)': item.poNumber,
        'PO/SA Item (Max. 5)': item.poItem,
        'Packaging': item.packaging,
      };
    });

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

    // 파일명 생성
    const excelFileName = `SAG${date.replace(/-/g, '')}${group}_HU.xls`; // --- CHANGED: .xlsx to .xls
    XLSX.writeFile(workbook, excelFileName, { bookType: 'biff8' }); // --- CHANGED: Added { bookType: 'biff8' }
  };

  // 📄 PDF 다운로드 핸들러 함수
  const handlePdfDownload = () => {
    if (items.length === 0) {
      alert('다운로드할 PDF 데이터가 없습니다.');
      return;
    }

    const doc = new jsPDF();
    doc.text("ASN List", 14, 15);
    doc.text(`Date: ${date}, Group: ${group}, Total Weight: ${overallTotalWeight.toLocaleString()}lb`, 14, 22);

    const head = [[
      '#', 'Pallet Serial', 'Part Number', 'Description',
      'Delivery Qty', 'PO Item'
    ]];
    const body = items.map((item, index) => [
      index + 1,
      item.palletSerial || '', item.partNumber || '', item.description || '',
      item.deliveryQty || '', item.poItem
    ]);

    // Use the imported autoTable function directly
    autoTable(doc, { // Changed this line
      startY: 30,
      head: head,
      body: body,
      styles: { font: "helvetica", fontSize: 10, cellPadding: 2, textColor: 0 },
      headStyles: {
        fillColor: [22, 160, 133], // 헤더 배경색
        textColor: 255,            // 헤더 텍스트 색상 (흰색)
        fontSize: 11,              // 📄 헤더 폰트 크기 (예: 11)
        fontStyle: 'bold',         // 헤더 폰트 스타일
      },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      // 📄 컬럼별 스타일 지정 (가운데 정렬 추가)
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 }, // '#' 컬럼 (첫 번째 컬럼)
        // 1: { halign: 'left' }, // Pallet Serial (기본값인 왼쪽 정렬 유지)
        // 2: { halign: 'left' }, // Part Number
        // 3: { halign: 'left' }, // Description
        4: { halign: 'center' }, // Delivery Qty 컬럼 (다섯 번째 컬럼)
        5: { halign: 'center' }, // PO Item 컬럼 (여섯 번째 컬럼)
      }
    });

    const pdfFileName = `ASN_List_${date.replace(/-/g, '')}_${group}.pdf`;
    doc.save(pdfFileName);
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
    return (
      <div className="p-5 text-red-600 text-center min-h-screen flex flex-col justify-center items-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-xl">
          <h2 className="text-2xl font-bold mb-3 text-red-700">데이터를 불러오는 중 오류가 발생했습니다.</h2>
          <p className="mb-4 text-gray-700">{error.message || '알 수 없는 오류'}</p>
          <p className="text-sm text-gray-500">입력 값을 확인하시거나 잠시 후 다시 시도해 주세요.</p>
          {/* 만약 사용자가 현재 페이지에서 바로 재시도할 수 있게 하려면,
              setError(null)을 호출하는 버튼을 추가하고, 이 if(error) 블록을
              메인 return문 안으로 옮겨 조건부 렌더링해야 합니다.
              현재 구조에서는 재조회 버튼을 두기가 어색합니다.
            */}
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 bg-gray-50 min-h-screen">
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
            className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all duration-200 ease-in-out transform hover:scale-105 disabled:opacity-60 disabled:transform-none w-full sm:w-auto" /* 스타일 일관성 */
          >
            ASN 조회
          </button>
          <button
            onClick={handleExcelDownload}
            disabled={items.length === 0 || loading}
            className="px-5 py-2.5 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700 transition-all duration-200 ease-in-out transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none w-full sm:w-auto" /* 스타일 일관성 */
          >
            Excel 다운로드
          </button>
          {/* 📄 PDF 다운로드 버튼 추가 */}
          <button
            onClick={handlePdfDownload}
            disabled={items.length === 0 || loading}
            className="px-5 py-2.5 bg-orange-500 text-white font-semibold rounded-lg shadow-md hover:bg-orange-600 transition-all duration-200 ease-in-out transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none w-full sm:w-auto" /* 스타일 일관성 */
          >
            PDF 다운로드
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
            {/* 전체 중량 표시 */}
            {overallTotalWeight !== null && (
              <p>
                <strong className="font-bold text-gray-800">팔렛 수: </strong>
                <span className="font-semibold text-blue-600">{totalCount.toLocaleString()}개, </span>
                <strong className="font-bold text-gray-800">전체 중량: </strong>
                <span className="font-semibold text-blue-600">{overallTotalWeight.toLocaleString()}lb</span>
              </p>
            )}
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