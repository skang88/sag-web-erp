import React, { useState } from 'react';

const boxStyle = {
  width: '300px', // 좀 더 넓게 조정
  minHeight: '100px',
  border: '1px solid black',
  margin: '10px',
  padding: '10px',
  display: 'flex',
  flexDirection: 'column', // 세로로 쌓이도록 변경
  alignItems: 'flex-start', // 왼쪽 정렬
};

function BarcodeScanner() {
  const [currentBarcode, setCurrentBarcode] = useState('');
  const [accumulatedPrefixes, setAccumulatedPrefixes] = useState([]);

  const handleInputChange = (event) => {
    setCurrentBarcode(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (currentBarcode) {
      console.log('스캔된 바코드:', currentBarcode);
      const prefix = currentBarcode.substring(0, 10);
      setAccumulatedPrefixes((prevPrefixes) => [...prevPrefixes, prefix]);
      setCurrentBarcode(''); // 입력 필드 초기화
    }
  };

  return (
    <div>
      <h1>바코드 스캐너</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={currentBarcode}
          onChange={handleInputChange}
          placeholder="바코드를 스캔하세요"
          autoFocus
        />
        <button type="submit">추가</button> {/* 버튼 텍스트 변경 */}
      </form>

      <div style={boxStyle}>
        <h3>누적된 앞글자 10개:</h3>
        {accumulatedPrefixes.map((prefix, index) => (
          <p key={index}>{prefix}</p>
        ))}
        {accumulatedPrefixes.length === 0 && <p>스캔된 바코드가 없습니다.</p>}
      </div>
    </div>
  );
}

export default BarcodeScanner;