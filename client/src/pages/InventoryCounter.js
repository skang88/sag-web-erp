import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import jsQR from 'jsqr'; // QR 코드 인식 라이브러리
import { BrowserMultiFormatReader, BarcodeFormat } from '@zxing/library';
import './InventoryCounter.css'; // CSS 파일 import

function InventoryCounter() {
    const webcamRef = useRef(null);
    const [scannedCode, setScannedCode] = useState('');
    const zxingReader = useRef(null); // zxing reader 인스턴스를 ref로 관리
    const [unicodeValuesHex, setUnicodeValuesHex] = useState([]); // 유니코드 (16진수) 값 배열 상태
    const [productCode, setProductCode] = useState(null); // 파싱된 품번 상태
    const [quantity, setQuantity] = useState(null); // 파싱된 수량 상태
    const [inventory, setInventory] = useState({});
    const resetTimeout = useRef(null);

    const videoConstraints = {
        facingMode: { exact: "environment" }
    };

    const scanQRCode = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (imageSrc) {
                const img = new Image();
                img.onload = function () {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const context = canvas.getContext('2d');
                    context.drawImage(img, 0, 0);
                    const imageData = context.getImageData(0, 0, img.width, img.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height);
                    if (code) {
                        console.log('QR 코드 인식 성공:', code.data);
                        setScannedCode(code.data);
                    } else {
                        console.log('QR 코드 인식 실패');
                    }
                };
                img.src = imageSrc;
            }
        }
    }, []);

    const scanPDF417 = useCallback(async () => {
        if (webcamRef.current && webcamRef.current.video) {
            try {
                if (!zxingReader.current) {
                    zxingReader.current = new BrowserMultiFormatReader({
                        hints: {
                            formats: [BarcodeFormat.PDF_417]
                        }
                    });
                }
                const result = await zxingReader.current.decodeFromVideoStream(webcamRef.current.video);
                if (result) {
                    console.log('PDF417 코드 인식 성공:', result.getText());
                    setScannedCode(result.getText());
                    // PDF417 코드 인식에 성공했으면 QR 코드 스캔 간격은 멈추거나 줄일 수 있습니다.
                    // clearInterval(intervalId.current);
                } else {
                    console.log('PDF417 코드 인식 실패');
                }
            } catch (error) {
                console.error('PDF417 스캔 에러:', error);
            }
        }
    }, []);

    const handleResetInventory = useCallback(() => {
        setInventory({}); // inventory 상태를 빈 객체로 업데이트
        console.log('재고가 초기화되었습니다.');
    }, [setInventory]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            scanQRCode(); // 0.5초마다 QR 코드 스캔
        }, 500);
        return () => clearInterval(intervalId); // 컴포넌트 언마운트시 정리
    }, [scanQRCode]);

    useEffect(() => {
        const pdf417IntervalId = setInterval(() => {
            scanPDF417(); // 0.5초마다 PDF417 코드 스캔
        }, 500);
        return () => clearInterval(pdf417IntervalId);
    }, [scanPDF417]);

    // 스캔값 상태 업데이트
    useEffect(() => {
        const hexValues = Array.from(scannedCode).map(char =>
            char.charCodeAt(0).toString(16).padStart(4, '0')
        );
        setUnicodeValuesHex(hexValues);

        const parsedCode = parseProductCode(scannedCode);
        const parsedQuantity = parseQuantity(scannedCode);

        if (parsedCode && parsedQuantity !== null && !isNaN(parsedQuantity)) { // 품번 존재, 수량 유효성 검사
            console.log('파싱된 품번:', parsedCode, '수량:', parsedQuantity);
            setProductCode(parsedCode);
            setQuantity(parsedQuantity); // UI 업데이트

            setInventory(prevInventory => {
                const updatedInventory = { ...prevInventory };
                updatedInventory[parsedCode] = (updatedInventory[parsedCode] || 0) + parsedQuantity;
                return updatedInventory;
            });

            // 스캔 성공 후 3초 뒤에 스캔값 초기화
            if (resetTimeout.current) {
                clearTimeout(resetTimeout.current); // 이전 타임아웃 제거
            }
            resetTimeout.current = setTimeout(() => {
                setScannedCode('');
                setProductCode(null);
                setQuantity(null);
                setUnicodeValuesHex([]);
                console.log('스캔값이 자동으로 초기화되었습니다.');
            }, 3000); // 3000ms = 3초
        } else {
            setProductCode(parsedCode || ''); // 파싱 실패 시에도 품번 UI 업데이트 (선택 사항)
            setQuantity(parsedQuantity !== null ? parsedQuantity : null); // UI 업데이트
        }

        return () => {
            if (resetTimeout.current) {
                clearTimeout(resetTimeout.current); // 컴포넌트 언마운트 시 타임아웃 제거
            }
        };
    }, [scannedCode]);

    // 파싱 함수
    function parseProductCode(barcodeValue) {
        if (!barcodeValue) {
            return null;
        }
        if (!barcodeValue.startsWith("[)>")) {
            return null; // "[)>"로 시작하지 않으면 null 반환
        }
        const rs1Index = barcodeValue.indexOf("\x1E");
        if (rs1Index === -1) {
            return null;
        }
        const rs2Index = barcodeValue.indexOf("\x1D", rs1Index + 1);
        if (rs2Index === -1) {
            return null;
        }
        const rs3Index = barcodeValue.indexOf("\x1D", rs2Index + 1);
        if (rs3Index === -1) {
            return null;
        }
        const pIndex = barcodeValue.indexOf("P", rs3Index + 1);
        if (pIndex === -1) {
            return null;
        }

        // "P" 다음 10자리를 추출
        const potentialProductCode = barcodeValue.substring(pIndex + 1, pIndex + 11);

        // 추출된 문자열이 정확히 10자리인지 확인
        if (potentialProductCode.length === 10) {
            return potentialProductCode;
        } else {
            return null; // "P" 다음에 10자리가 아니면 null 반환
        }
    }

    function parseQuantity(barcodeValue) {
        if (!barcodeValue) {
            return null;
        }
        if (!barcodeValue.startsWith("[)>")) {
            return null; // "[)>"로 시작하지 않으면 null 반환
        }

        let extractedQuantity = '';
        const lastRSIndex = barcodeValue.lastIndexOf("\x1D");
        if (lastRSIndex !== -1) {
            const beforeLastRS = barcodeValue.substring(0, lastRSIndex);
            const lastCIndexBeforeRS = beforeLastRS.lastIndexOf("\x43");
            if (lastCIndexBeforeRS !== -1) {
                extractedQuantity = barcodeValue.substring(lastCIndexBeforeRS + 1);
                const suffixToRemove = "\x1D\x1E\x04"; // 제거할 패턴 (기록 분리자, 파일 분리자, EOT)
                const squareIndex = extractedQuantity.indexOf("\u25A0");
                if (squareIndex !== -1) {
                    extractedQuantity = extractedQuantity.substring(0, squareIndex);
                }
                if (extractedQuantity.endsWith(suffixToRemove)) {
                    extractedQuantity = extractedQuantity.substring(0, extractedQuantity.length - suffixToRemove.length);
                }
                const numericQuantity = extractedQuantity.replace(/[^\d]/g, ''); // 숫자만 추출
                if (numericQuantity) {
                    return parseInt(numericQuantity, 10);
                }
            }
        }
        return null;
    }


    return (
        <div>
            <h2>바코드(QR) 스캐너</h2>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="webcam-container" style={{ width: '300px', height: '200px', display: 'flex', justifyContent: 'center' }}>
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={videoConstraints}
                        style={{ width: '100%', height: 'auto' }}
                    />
                </div>
                <div>
                    <h3>스캔된 품번과 수량:</h3>
                    <p style={{ wordBreak: 'break-all' }}>
                        품번: {productCode || '파싱 대기 중...'} 수량: {quantity !== null ? quantity : '파싱 대기 중...'}
                    </p>
                </div>
                <div>
                    <h3>현재 재고:</h3>
                    <ul>
                        {Object.entries(inventory).map(([itemCode, itemCount]) => (
                            <li key={itemCode}>
                                {itemCode}: {itemCount}
                            </li>
                        ))}
                    </ul>
                </div>
                {/* 초기화 버튼 추가 */}
                <button
                    onClick={handleResetInventory}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200"
                >
                    재고 초기화
                    </button>

                <div>
                    <h3>디버깅 정보</h3>
                    <h3>스캔된 코드:</h3>
                    <p style={{ wordBreak: 'break-all', padding: '10px' }}>
                        {scannedCode || '스캔 대기 중...'}
                    </p>
                </div>
                <div>
                    <h3>유니코드 (16진수):</h3>
                    <p style={{ wordBreak: 'break-all' }}>
                        {unicodeValuesHex.join(' ')}
                    </p>
                </div>
            </div>
        </div>
    );
}


export default InventoryCounter;