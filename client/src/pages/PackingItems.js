import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // <--- 새로 추가할 import


// 실제 API의 기본 URL을 여기에 설정합니다.
// 예: const API_BASE_URL = 'https://your-backend-api.com';
const API_BASE_URL = 'http://172.16.220.32:8001'; // 개발 환경에서 사용할 백엔드 URL

function PackingItemsFetcher() {
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalWeight, setTotalWeight] = useState(0);

  const [loading, setLoading] = useState(false); // 초기 로딩 상태는 false로 시작
  const [error, setError] = useState(null);

  // useNavigate 훅 초기화
  const navigate = useNavigate(); // <--- 새로 추가할 코드

  // 파라미터를 위한 상태 추가: date와 group
  const [date, setDate] = useState(''); // 'date' 파라미터 상태
  const [group, setGroup] = useState(''); // 'group' 파라미터 상태

  // API 호출 함수를 useCallback으로 감싸서 불필요한 재생성을 방지합니다.
  const fetchItems = useCallback(async () => {
    // 필수 파라미터가 비어있으면 호출하지 않음
    if (!date || !group) {
      alert('날짜와 Shipping Group을 모두 입력해주세요.');
      return;
    }

    try {
      setLoading(true); // 로딩 시작
      setError(null); // 이전 에러 초기화

      // --- YYYYMMDD 형식 변환 로직 추가 시작 ---
      // date 상태는 YYYY-MM-DD (예: "2025-05-27") 이므로, 이를 YYYYMMDD (예: "20250527")로 변환
      const formattedDate = date.replace(/-/g, ''); // 모든 '-'를 빈 문자열로 대체
      // --- YYYYMMDD 형식 변환 로직 추가 끝 ---

      // 쿼리 파라미터 구성: date와 group 사용
      const queryParams = new URLSearchParams({
        date: formattedDate,
        group: group,
      }).toString();

      // 최종 API URL 구성: 엔드포인트가 '/api/packing'으로 변경됨
      const apiUrl = `${API_BASE_URL}/api/packing/items?${queryParams}`;
      console.log('API 호출 URL:', apiUrl); // 디버깅을 위해 URL 출력

      // 실제 API 호출
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': 'Bearer YOUR_AUTH_TOKEN', // 인증 토큰이 필요하다면 추가
        },
      });

      if (!response.ok) {
        // 서버에서 에러 응답이 왔을 때
        const errorData = await response.json(); // 에러 메시지가 JSON 형태로 올 수 있음
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json(); // 응답 데이터를 JSON으로 파싱

      setItems(data.data); // ← 실제 데이터 배열
      setTotalCount(data.count); // ← 전체 개수
      setTotalWeight(data.totalWeight); // ← 총 중량
    } catch (err) {
      console.error("아이템 조회 실패:", err);
      setError(err); // 에러 발생 시 에러 상태 업데이트
    } finally {
      setLoading(false); // 로딩 종료
    }
  }, [date, group]); // date 또는 group이 변경될 때 함수 재생성

  // 로딩 중일 때 표시할 UI
  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>트레일러 아이템 정보 로딩 중...</h2>
        <p>잠시만 기다려 주세요.</p>
      </div>
    );
  }

  // 에러 발생 시 표시할 UI
  if (error) {
    // 특정 페이지로 이동하는 버튼으로 변경
    const handleGoToPacking = () => {
      navigate('/home'); // <--- 이동할 경로 (예: 대시보드 페이지)
    };

    return (
      <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
        <h2>데이터를 불러오는 중 오류가 발생했습니다.</h2>
        <p>{error.message || '알 수 없는 오류'}</p>
        <button onClick={handleGoToPacking} style={{ marginTop: '10px', padding: '8px 15px', cursor: 'pointer' }}>
          뒤로 가기
        </button>
      </div>
    );
  }

  // 데이터 조회 성공 시 표시할 UI
  return (
    <div style={{ padding: '20px' }}>
      <h1>트레일러 적재 예정 아이템 조회</h1>

      {/* 파라미터 입력 UI */}
      <div style={{ marginBottom: '20px', border: '1px solid #eee', padding: '15px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="date" style={{ marginRight: '10px', fontWeight: 'bold' }}>날짜:</label>
          <input
            type="date" // 날짜 입력 타입
            id="date" // ID도 'date'로 수정
            value={date} // `date` 상태에 바인딩
            onChange={(e) => setDate(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="group" style={{ marginRight: '10px', fontWeight: 'bold' }}>Shipping Group:</label> {/* 레이블도 'Shipping Group'으로 변경 */}
          <input
            type="text"
            id="group" // ID도 'group'으로 수정
            value={group} // `group` 상태에 바인딩
            onChange={(e) => setGroup(e.target.value)}
            placeholder="예: 01, 02, 03, ..."
            style={inputStyle}
          />
        </div>
        <button onClick={fetchItems} style={buttonStyle}>
          아이템 조회
        </button>
      </div>

      {/* 아이템 목록 표시 */}
      {items.length === 0 && !loading && !error ? ( // 초기 상태이거나 조회 결과가 없을 때
        <p style={{ textAlign: 'center', color: '#555' }}>
          조회할 날짜와 Shipping Group을 입력하고 '아이템 조회' 버튼을 눌러주세요.
        </p>
      ) : (

        <div>
          <div style={{ marginBottom: '20px' }}>
          <strong>총 팔렛수:</strong> {totalCount}건 &nbsp;&nbsp;
          <strong>총 중량:</strong> {totalWeight.toLocaleString()}lb
          </div>

          <table border="1" cellPadding="6" style={tableStyle}>
            <thead>
              <tr style={tableHeaderRowStyle}>
                <th style={tableHeaderStyle}>#</th>
                <th style={tableHeaderStyle}>Part Number</th>
                <th style={tableHeaderStyle}>Item Name</th>
                <th style={tableHeaderStyle}>Type</th>
                <th style={tableHeaderStyle}>Pallet Serial</th>
                <th style={tableHeaderStyle}>Delivery Qty</th>
                <th style={tableHeaderStyle}>Unit Weight</th>
                <th style={tableHeaderStyle}>규격 (W x D x H)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} style={tableRowStyle}>
                  <td style={tableCellStyle}>{index + 1}</td>
                  <td style={tableCellStyle}>{item.partNumber}</td>
                  <td style={tableCellStyle}>{item.itemName}</td>
                  <td style={tableCellStyle}>{item.itemType}</td>
                  <td style={tableCellStyle}>{item.palletSerial}</td>
                  <td style={tableCellStyle}>{item.deliveryQty}</td>
                  <td style={tableCellStyle}>{item.itemWeightPerUnit.toLocaleString()}</td>
                  <td style={tableCellStyle}>
                  {`${item.dimensions.width} x ${item.dimensions.depth} x ${item.dimensions.height}`}
                </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// 스타일 정의 (이전과 동일)
const inputStyle = {
  padding: '8px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  width: '200px',
};

const buttonStyle = {
  padding: '10px 20px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '16px',
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  marginTop: '20px',
};

const tableHeaderRowStyle = {
  backgroundColor: '#e9ecef',
};

const tableRowStyle = {
  borderBottom: '1px solid #dee2e6',
};

const tableHeaderStyle = {
  padding: '12px 8px',
  border: '1px solid #dee2e6',
  textAlign: 'left',
  fontWeight: 'bold',
};

const tableCellStyle = {
  padding: '8px',
  border: '1px solid #dee2e6',
  textAlign: 'left',
};

export default PackingItemsFetcher;