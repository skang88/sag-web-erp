import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import jsQR from 'jsqr'; // QR 코드 인식 라이브러리
import { BrowserMultiFormatReader, BarcodeFormat } from '@zxing/library';
import './InventoryCounter.css'; // CSS 파일 import

function CameraTest() {
    const webcamRef = useRef(null);
    const [scannedCode, setScannedCode] = useState('');
    const zxingReader = useRef(null); // zxing reader 인스턴스를 ref로 관리
    const [unicodeValuesHex, setUnicodeValuesHex] = useState([]); // 유니코드 (16진수) 값 배열 상태
    const [productCode, setProductCode] = useState(null); // 파싱된 품번 상태
    const [quantity, setQuantity] = useState(null); // 파싱된 수량 상태


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

    useEffect(() => {
        const hexValues = Array.from(scannedCode).map(char =>
            char.charCodeAt(0).toString(16).padStart(4, '0')
        );
        setUnicodeValuesHex(hexValues);

        // 파싱된 품번 추출 및 상태 업데이트
        const parsedCode = parseProductCode(scannedCode);
        if (parsedCode) {
            console.log('파싱된 품번:', parsedCode);
            setProductCode(parsedCode);
        } else {
            setProductCode(''); // 파싱 실패 시 품번 상태 초기화
        }

        // 파싱된 수량 추출 및 상태 업데이트
        const parsedQuantity = parseQuantity(scannedCode);
        if (parsedQuantity !== null) {
            console.log('파싱된 수량:', parsedQuantity);
            setQuantity(parsedQuantity);
        } else {
            setQuantity(null); // 파싱 실패 시 수량 상태 초기화
        }
    }, [scannedCode]);

    // 파싱 함수
    function parseProductCode(barcodeValue) {
        if (!barcodeValue) {
            return null;
        }
        if (!barcodeValue.startsWith("[)>")) {
            return "잘못된 형식"; // "[)>"로 시작하지 않으면 오류 메시지 반환
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
            return "잘못된 형식"; // "[)>"로 시작하지 않으면 오류 메시지 반환
        }
    
        let extractedQuantity = '';
        const lastRSIndex = barcodeValue.lastIndexOf("\x1D");
        if (lastRSIndex !== -1) {
            const beforeLastRS = barcodeValue.substring(0, lastRSIndex);
            const lastCIndexBeforeRS = beforeLastRS.lastIndexOf("\x43");
            if (lastCIndexBeforeRS !== -1) {
                extractedQuantity = barcodeValue.substring(lastCIndexBeforeRS + 1);
                const suffixToRemove = "\x1D\x1E\x04"; // 제거할 패턴 (기록 분리자, 파일 분리자, EOT)
                if (extractedQuantity.endsWith(suffixToRemove)) {
                    extractedQuantity = extractedQuantity.substring(0, extractedQuantity.length - suffixToRemove.length);
                }
                return extractedQuantity;
            }
        }
    
        return null; // 패턴을 찾지 못함
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
                    <h3>파싱된 품번과 수량:</h3>
                    <p style={{ wordBreak: 'break-all' }}>
                        {productCode || '파싱 대기 중...'} {quantity !== null ? quantity : '파싱 대기 중...'}
                    </p>
                </div>
                <div>
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

export default CameraTest;