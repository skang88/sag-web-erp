import React, { useState, useRef, useEffect } from 'react';

const boxStyle = {
  width: '300px',
  minHeight: '100px',
  border: '1px solid black',
  margin: '10px',
  padding: '10px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
};

const inputButtonStyle = {
  backgroundColor: 'lightblue',
  color: 'black',
  padding: '8px 15px',
  marginRight: '10px',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
};

const resetButtonStyle = {
  backgroundColor: 'lightyellow',
  color: 'black',
  padding: '8px 15px',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
};

function BarcodeScanner() {
  const [currentBarcode, setCurrentBarcode] = useState('');
  const [accumulatedPrefixes, setAccumulatedPrefixes] = useState([]);
  const inputRef = useRef(null);

  const handleInputChange = (event) => {
    setCurrentBarcode(event.target.value);
  };

  const handleAddPrefix = () => {
    if (currentBarcode) {
      const prefix = currentBarcode.substring(0, 10);
      setAccumulatedPrefixes((prevPrefixes) => [...prevPrefixes, prefix]);
      setCurrentBarcode(''); // 입력 후 입력 필드 초기화
      if (inputRef.current) {
        inputRef.current.focus(); // 다시 입력 필드로 포커스 이동
      }
    }
  };

  const handleResetPrefixes = () => {
    setAccumulatedPrefixes([]);
    setCurrentBarcode(''); // 초기화 시 입력 필드도 비움
    if (inputRef.current) {
        inputRef.current.focus(); // 포커스 이동
    }
  };

  const handleKeyDown = (event) => {
    // 바코드 스캐너가 엔터 키를 입력의 끝으로 보낼 가능성이 높음
    if (event.key === 'Enter' && currentBarcode) {
      handleAddPrefix();
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus(); // 컴포넌트 마운트 시 입력 필드에 포커스
    }
  }, []);

  return (
    <div>
      <h1>바코드 스캐너</h1>
      <div>
        <input
          ref={inputRef}
          type="text"
          value={currentBarcode}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="바코드를 스캔하세요"
        />
        {/* 자동 입력 시에는 입력 버튼이 필수가 아닐 수 있습니다. */}
        <button style={inputButtonStyle} onClick={handleAddPrefix}>입력</button>
        <button style={resetButtonStyle} onClick={handleResetPrefixes}>초기화</button>
      </div>

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