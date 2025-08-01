import { useState, useEffect, useCallback } from 'react';

const WS_URL = process.env.REACT_APP_WS_URL

// Helper function to format ISO date strings
const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    try {
        return new Date(isoString).toLocaleString('en-US', {
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
    const [countdown, setCountdown] = useState(60);

    useEffect(() => {
        // 1초마다 카운트다운을 업데이트하는 인터벌
        const interval = setInterval(() => {
            setCountdown(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        // 60초 후 카드를 만료시키는 타이머
        const expireTimer = setTimeout(() => {
            onExpire(event.bestUuid);
        }, 60000);

        // 컴포넌트가 언마운트될 때 타이머와 인터벌을 정리합니다.
        return () => {
            clearInterval(interval);
            clearTimeout(expireTimer);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const statusStyles = {
        REGISTERED: 'bg-green-100 text-green-800',
        UNREGISTERED: 'bg-red-100 text-red-800',
        NO_PLATE: 'bg-gray-100 text-gray-800',
    };

    const statusText = {
        REGISTERED: 'Registered Vehicle',
        UNREGISTERED: 'Unregistered Vehicle',
        NO_PLATE: 'No Plate Recognized',
    };

    const isUnregistered = event.registrationStatus === 'UNREGISTERED';

    // Sample QR code URL for unregistered vehicles (replace with actual registration page link later)
    const registrationUrl = `https://your-erp-system.com/register-vehicle?plate=${event.bestPlateNumber || ''}`; // Include plate number in URL
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(registrationUrl)}`;

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden transform animate-fade-in border-l-8 border-blue-500">
            <div className={`p-8 ${isUnregistered ? 'flex gap-8 items-start' : ''}`}>
                {/* Left: Display QR code for unregistered vehicles */}
                {isUnregistered && (
                    <div className="flex-shrink-0 flex flex-col items-center justify-center text-center w-96 p-4 bg-gray-50 rounded-lg">
                        <img src={qrCodeUrl} alt="Vehicle Registration QR Code" className="w-80 h-80 mb-4" />
                        <p className="text-2xl font-bold text-gray-800">Register Vehicle</p>
                        <p className="text-lg text-gray-600 mt-2">Scan the QR code<br />to register the vehicle.</p>
                    </div>
                )}

                {/* Right: Vehicle recognition information */}
                <div className={`${isUnregistered ? 'flex-grow' : ''} flex flex-col`}>
                    {/* Top: Plate number, status, countdown */}
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-8xl font-bold text-gray-800 font-mono tracking-wider">{event.bestPlateNumber || '---'}</p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-8">
                            <div className={`px-4 py-2 text-lg font-semibold rounded-full ${statusStyles[event.registrationStatus] || statusStyles.NO_PLATE}`}>
                                {statusText[event.registrationStatus] || 'Unknown'}
                            </div>
                            <div className="mt-3">
                                <p className="text-lg font-semibold text-gray-500">Next scan in</p>
                                <p className="text-5xl font-bold text-gray-700">{countdown}s</p>
                            </div>
                        </div>
                    </div>

                    {/* Middle: License plate and vehicle images */}
                    <div className={`flex items-start justify-center space-x-6 mb-4`}>
                        {event.plateCropJpeg && (
                            <img 
                                src={`data:image/jpeg;base64,${event.plateCropJpeg}`} 
                                alt="License Plate" 
                                className="w-1/3 h-auto rounded-md border" 
                            />
                        )}
                        {event.vehicleCropJpeg && (
                            <img 
                                src={`data:image/jpeg;base64,${event.vehicleCropJpeg}`} 
                                alt="Vehicle" 
                                className="w-2/3 h-auto rounded-md border" 
                            />
                        )}
                    </div>

                    {/* Bottom: Additional information */}
                    <div className="text-lg text-gray-600 mt-auto pt-4">
                        <p><strong>Recognition Time:</strong> {formatDateTime(event.startTime)}</p>
                        {event.registrationStatus === 'REGISTERED' && (
                            <p><strong>Registered By:</strong> {event.userEmail}</p>
                        )}
                    </div>
                </div>
            </div>
             {/* Countdown progress bar */}
             <div className="w-full bg-gray-200 h-2.5">
                <div 
                    className="bg-blue-500 h-2.5"
                    style={{ width: `${(countdown / 60) * 100}%`, transition: 'width 1s linear' }}
                ></div>
            </div>
        </div>
    );
};

const PlateRealTimeMonitoringPage = () => {
    const [events, setEvents] = useState([]);
    const [wsStatus, setWsStatus] = useState('Connecting...');

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
                        const newEvent = message.payload;
                        setEvents(prevEvents => {
                            const existingEventIndex = prevEvents.findIndex(e => e.bestUuid === newEvent.bestUuid);

                            if (existingEventIndex !== -1) {
                                // Event with this UUID exists, update it in place.
                                const updatedEvents = [...prevEvents];
                                updatedEvents[existingEventIndex] = newEvent;
                                return updatedEvents;
                            } else {
                                // New event, add it to the front.
                                return [newEvent, ...prevEvents];
                            }
                        });
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

    const handleExpire = useCallback((uuid) => {
        setEvents(prevEvents => prevEvents.filter(event => event.bestUuid !== uuid));
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4 font-inter">
            <div className="w-full max-w-7xl mx-auto mt-20 p-6">
                <header className="flex justify-between items-center mb-8 border-b-2 pb-4 border-gray-300">
                    <h1 className="text-4xl font-extrabold text-gray-900">Real-Time Vehicle Recognition</h1>
                    <div className="flex items-center space-x-2">
                         <div className={`w-3 h-3 rounded-full ${wsStatus === 'Connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className="text-gray-500">{wsStatus}</span>
                    </div>
                </header>

                <main>
                    <div className="grid grid-cols-1 gap-8">
                        {events.length > 0 ? (
                            events.map(event => (
                                <PlateEventCard key={event.bestUuid} event={event} onExpire={handleExpire} />
                            ))
                        ) : (
                            <div className="col-span-full text-center py-16 bg-white rounded-lg shadow-md">
                                <p className="text-gray-500 text-2xl">Waiting for vehicle entry...</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default PlateRealTimeMonitoringPage;