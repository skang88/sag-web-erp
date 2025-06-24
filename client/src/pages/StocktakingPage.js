import React, { useState, useRef, useEffect } from 'react';

function App() {
  const [scannedData, setScannedData] = useState([]); // 스캔된 데이터 저장
  const inputRef = useRef(null); // 바코드 입력 필드에 포커스를 주기 위함
  const tableContainerRef = useRef(null); // 테이블 컨테이너 스크롤 관리를 위함
  const [currentBarcode, setCurrentBarcode] = useState(''); // 현재 입력 중인 바코드 값

  // 바코드 파싱 함수
  const parseBarcode = (barcodeValue) => {
    let 품번 = '';
    let 로트번호 = '';
    let 수량 = '';
    let type = ''; // 바코드 유형

    // 유형 1 (특수문자 없음) - 정규식 기반으로 개선
    if (barcodeValue.startsWith('[)>06') && !barcodeValue.includes(':D')) {
      type = 'Type 1';
      const productNumberMatch = barcodeValue.match(/P([A-Z0-9]{10})/);
      if (productNumberMatch && productNumberMatch[1]) {
        품번 = productNumberMatch[1];
      }

      const lotNumberMatch = barcodeValue.match(/T(\d{6})/);
      if (lotNumberMatch && lotNumberMatch[1]) {
        로트번호 = lotNumberMatch[1];
      }

      const quantityMatch = barcodeValue.match(/C(\d+)/);
      if (quantityMatch && quantityMatch[1]) {
        수량 = quantityMatch[1];
      }
    }
    // 유형 2 (특수문자 포함)
    else if (barcodeValue.startsWith('[)>*06:D')) {
      type = 'Type 2';
      const parts = barcodeValue.split(':');

      // 로트번호: :D 뒤의 6자리 (MMDDYY 형식)
      const dPart = parts.find(part => part.startsWith('D'));
      if (dPart && dPart.length >= 7) {
        const mmddyy = dPart.substring(1, 7); // MMDDYY 추출
        const mm = mmddyy.substring(0, 2);
        const dd = mmddyy.substring(2, 4);
        const yy = mmddyy.substring(4, 6);
        로트번호 = yy + mm + dd; // YYMMDD로 재구성
      }

      // 품번: :P 뒤의 값 - 정규식 최종 개선
      const pPart = parts.find(part => part.startsWith('P'));
      if (pPart) {
        // 품번은 이제 숫자, 영문자 (대소문자), 하이픈이 모두 포함될 수 있도록 허용
        // P[선택적 영문자](숫자/영문자/하이픈 조합)[선택적 (D)] 패턴에서 실제 품번 추출
        const productNumberMatch = pPart.match(/P[A-Z]?([A-Z0-9-]+)(?:\(D\))?(?::7Q|$)/i); // i 플래그 추가
        if (productNumberMatch && productNumberMatch[1]) {
          품번 = productNumberMatch[1];
        }
      }

      // 수량: :Q 뒤의 값
      const qPart = parts.find(part => part.includes('Q'));
      if (qPart) {
        수량 = qPart.match(/Q(\d+)/)?.[1] || '';
      }
    } else {
      console.warn("알 수 없는 바코드 유형입니다:", barcodeValue);
    }

    return { 품번, 로트번호, 수량, type };
  };

  // 엔터 키 입력 시 바코드 처리
  const handleBarcodeScan = (e) => {
    if (e.key === 'Enter' && currentBarcode.trim() !== '') {
      const { 품번, 로트번호, 수량, type } = parseBarcode(currentBarcode.trim());
      setScannedData(prevData => [
        ...prevData,
        {
          id: prevData.length + 1,
          barcode: currentBarcode.trim(),
          품번: 품번,
          로트번호: 로트번호,
          수량: 수량,
          type: type
        }
      ]);
      setCurrentBarcode('');
      e.preventDefault();
    }
  };

  // 항목 삭제
  const handleDelete = (id) => {
    setScannedData(prevData => prevData.filter(item => item.id !== id));
  };

  // 컴포넌트 마운트 시 입력 필드에 포커스
  useEffect(() => {
    inputRef.current.focus();
  }, []);

  // scannedData가 변경될 때마다 스크롤을 최하단으로 이동
  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = tableContainerRef.current.scrollHeight;
    }
  }, [scannedData]);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>바코드 스캔 앱</h1>
      <input
        ref={inputRef}
        type="text"
        value={currentBarcode}
        onChange={(e) => setCurrentBarcode(e.target.value)}
        onKeyPress={handleBarcodeScan}
        placeholder="바코드를 스캔해주세요..."
        style={{ width: '100%', padding: '10px', marginBottom: '20px', fontSize: '16px' }}
      />

      <div
        ref={tableContainerRef}
        style={{
          maxHeight: '600px',
          overflowY: 'auto',
          border: '1px solid #eee',
          padding: '10px'
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>연번</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>바코드 값</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>품번</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>로트번호</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>수량</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>삭제</th>
            </tr>
          </thead>
          <tbody>
            {scannedData.map((item) => (
              <tr key={item.id}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.id}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px', wordBreak: 'break-all' }}>{item.barcode}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.품번}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.로트번호}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.수량}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <button
                    onClick={() => handleDelete(item.id)}
                    style={{
                      padding: '5px 10px',
                      cursor: 'pointer',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px'
                    }}
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;