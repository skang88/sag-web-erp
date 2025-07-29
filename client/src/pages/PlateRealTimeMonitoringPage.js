import { useState, useEffect, useRef, useMemo } from 'react';
import JSMpeg from '@cycjimmy/jsmpeg-player'; // 안정적인 최신 라이브러리로 교체

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3000';
// RTSP 비디오 스트림을 위한 WebSocket URL
const RTSP_WS_URL = process.env.REACT_APP_RTSP_WS_URL || 'ws://localhost:9999';

// Helper function to format ISO date strings
const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    try {
        return new Date(isoString).toLocaleString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    } catch {
        return 'Invalid Date';
    }
};

const PlateEventCard = ({ event, onExpire }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onExpire(event.bestUuid);
        }, 60000); // 1분

        return () => clearTimeout(timer);
    }, [event.bestUuid, onExpire]);

    const statusStyles = {
        REGISTERED: 'bg-green-100 text-green-800',
        UNREGISTERED: 'bg-red-100 text-red-800',
        NO_PLATE: 'bg-gray-100 text-gray-800',
    };

    const statusText = {
        REGISTERED: '등록 차량',
        UNREGISTERED: '미등록 차량',
        NO_PLATE: '번호판 미인식',
    };

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden transform animate-fade-in border-l-8 border-blue-500">
            <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-sm text-gray-500">{event.cameraName}</p>
                        <p className="text-2xl font-bold text-gray-800 font-mono">{event.bestPlateNumber || '---'}</p>
                    </div>
                    <div className={`px-3 py-1 text-sm font-semibold rounded-full ${statusStyles[event.registrationStatus] || statusStyles.NO_PLATE}`}>
                        {statusText[event.registrationStatus] || '알 수 없음'}
                    </div>
                </div>

                <div className="flex items-center space-x-4 mb-4">
                    {event.plateCropJpeg && (
                         <img 
                            src={`data:image/jpeg;base64,${event.plateCropJpeg}`} 
                            alt="번호판" 
                            className="w-40 h-auto rounded-md border" 
                        />
                    )}
                    {event.vehicleCropJpeg && (
                         <img 
                            src={`data:image/jpeg;base64,${event.vehicleCropJpeg}`} 
                            alt="차량" 
                            className="w-48 h-auto rounded-md border" 
                        />
                    )}
                </div>

                <div className="text-sm text-gray-600">
                    <p><strong>인식 시간:</strong> {formatDateTime(event.startTime)}</p>
                    {event.registrationStatus === 'REGISTERED' && (
                        <p><strong>등록자:</strong> {event.userEmail}</p>
                    )}
                </div>
            </div>
             <div className="w-full bg-gray-200 h-1">
                <div className="bg-blue-500 h-1 animate-progress"></div>
            </div>
        </div>
    );
};

// JSMpeg 플레이어를 위한 래퍼(Wrapper) 컴포넌트
const JsmpegPlayer = ({ videoUrl, wrapperClassName, options }) => {
    const videoWrapperRef = useRef(null);
    const playerInstance = useRef(null); // 플레이어 인스턴스를 저장할 ref

    useEffect(() => {
        // videoWrapperRef.current가 없거나, 플레이어가 이미 생성되었다면 아무것도 하지 않음
        if (!videoWrapperRef.current || playerInstance.current) {
            return;
        }

        // JSMpeg.VideoElement를 사용하여 플레이어 인스턴스 생성
        playerInstance.current = new JSMpeg.VideoElement(videoWrapperRef.current, videoUrl, options);

        // 컴포넌트 언마운트 시 플레이어 정리
        return () => {
            if (playerInstance.current) {
                try {
                    playerInstance.current.destroy();
                } catch (e) {
                    console.warn("JSMpeg player destroy error:", e);
                }
                playerInstance.current = null; // 인스턴스 참조 정리
            }
        };
    }, [videoUrl, options]);

    return <div ref={videoWrapperRef} className={wrapperClassName} />;
};

const PlateRealTimeMonitoringPage = () => {
    const [events, setEvents] = useState([]);
    const [wsStatus, setWsStatus] = useState('Connecting...');
    
    // JSMpegPlayer의 options 객체가 매번 새로 생성되어 useEffect를 불필요하게 실행하는 것을 방지합니다.
    const playerOptions = useMemo(() => ({ autoplay: true }), []);

    useEffect(() => {
        let ws;
        let reconnectTimer;

        const connect = () => {
            ws = new WebSocket(WS_URL);
            setWsStatus('Connecting...');

            ws.onopen = () => {
                console.log('WebSocket Connected');
                setWsStatus('Connected');
                if (reconnectTimer) clearTimeout(reconnectTimer);
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (message.type === 'NEW_PLATE_RECOGNITION') {
                        // Add new event to the top of the list
                        setEvents(prevEvents => [message.payload, ...prevEvents]);
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            ws.onclose = () => {
                console.log('WebSocket Disconnected');
                setWsStatus('Disconnected. Retrying in 5s...');
                // 5초 후 재연결 시도
                reconnectTimer = setTimeout(connect, 5000);
            };

            ws.onerror = (error) => {
                console.error('WebSocket Error:', error);
                setWsStatus('Connection Error');
                // 에러 발생 시 WebSocket이 자동으로 close 이벤트를 호출하므로, onclose에서 재연결 로직이 처리됩니다.
                ws.close();
            };
        };

        connect(); // 초기 연결 시도

        // Cleanup on component unmount
        return () => {
            clearTimeout(reconnectTimer); // 컴포넌트 언마운트 시 재연결 타이머 제거
            if (ws) {
                ws.onclose = null; // 재연결 로직이 실행되지 않도록 핸들러 제거
                ws.close();
            }
        };
    }, []); // Empty dependency array ensures this runs only once on mount

    const handleExpire = (uuid) => {
        setEvents(prevEvents => prevEvents.filter(event => event.bestUuid !== uuid));
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4 font-inter">
            <div className="w-full max-w-7xl mx-auto mt-20 p-6">
                <header className="flex justify-between items-center mb-8 border-b-2 pb-4 border-gray-300">
                    <h1 className="text-4xl font-extrabold text-gray-900">실시간 차량 인식 모니터링 (Entrance)</h1>
                    <div className="flex items-center space-x-2">
                         <div className={`w-3 h-3 rounded-full ${wsStatus === 'Connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className="text-gray-500">{wsStatus}</span>
                    </div>
                </header>

                <main>
                    <div className="bg-black border-2 border-gray-300 rounded-lg mb-8 h-96 overflow-hidden flex items-center justify-center">
                        <JsmpegPlayer
                            wrapperClassName="w-full h-full"
                            videoUrl={RTSP_WS_URL}
                            options={playerOptions}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {events.length > 0 ? (
                            events.map(event => (
                                <PlateEventCard key={event.bestUuid} event={event} onExpire={handleExpire} />
                            ))
                        ) : (
                            <div className="col-span-full text-center py-16 bg-white rounded-lg shadow-md">
                                <p className="text-gray-500 text-2xl">차량 진입 대기 중...</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default PlateRealTimeMonitoringPage;