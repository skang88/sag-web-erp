import { useState, useEffect, useCallback } from 'react';
import CiLogo from '../components/CiLogo';
import ManualVisitorRegistrationModal from '../components/ManualVisitorRegistrationModal';

const WS_URL = process.env.REACT_APP_WS_URL;
const API_BASE_URL = process.env.REACT_APP_API_URL;

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
    const [isUnregistered, setIsUnregistered] = useState(event.registrationStatus === 'UNREGISTERED');
    
    // Kiosk state
    const [purpose, setPurpose] = useState(null);
    const [duration, setDuration] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const purposeOptions = ['Delivery', 'Meeting', 'Parcel Delivery', 'Others'];
    const durationOptions = [1, 7, 30];

    // QR Code URLs
    const registrationUrl = `https://seohanga.com/register-visitor?plate=${event.bestPlateNumber || ''}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(registrationUrl)}`;

    useEffect(() => {
        const interval = setInterval(() => {
            setCountdown(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        const expireTimer = setTimeout(() => {
            onExpire(event.bestUuid);
        }, 60000);

        return () => {
            clearInterval(interval);
            clearTimeout(expireTimer);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleRegisterAndOpen = async () => {
        if (!purpose) {
            setMessage('Please select a purpose for your visit.');
            return;
        }
        setIsLoading(true);
        setMessage('');

        try {
            const response = await fetch(`${API_BASE_URL}/visitor/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    licensePlate: event.bestPlateNumber,
                    purpose,
                    durationInDays: duration,
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Registration failed.');

            setMessage('Registration successful! Gate is opening.');
            setIsUnregistered(false); // Visually update the card to 'registered' state

        } catch (err) {
            setMessage(err.message || 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

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

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden transform animate-fade-in border-l-8 border-blue-500 flex flex-col">
            {/* Top Row: Plate Info & Status */}
            <div className="p-6 pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-7xl font-bold text-gray-800 font-mono tracking-wider">{event.bestPlateNumber || '---'}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-6">
                        <div className={`px-4 py-2 text-lg font-semibold rounded-full ${statusStyles[event.registrationStatus] || statusStyles.NO_PLATE}`}>
                            {statusText[event.registrationStatus] || statusText.NO_PLATE}
                        </div>
                        <div className="mt-2">
                            <p className="text-md font-semibold text-gray-500">Next scan in</p>
                            <p className="text-4xl font-bold text-gray-700">{countdown}s</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content: Images and Kiosk Form */}
            <div className="p-6 pt-4 flex-grow">
                <div className="flex gap-6 items-start h-full">
                    {/* Left Side: Kiosk Form & QR Code (if unregistered) */}
                    {isUnregistered && (
                        <div className="w-1/2 flex-shrink-0 flex flex-col justify-between bg-gray-50 rounded-lg p-6 h-full">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-4">New Visitor Check-in</h3>
                                
                                <div className="mb-6">
                                    <p className="text-lg font-semibold text-gray-700 mb-3">1. Purpose of Visit</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {purposeOptions.map(opt => (
                                            <button key={opt} onClick={() => setPurpose(opt)} className={`p-4 text-lg font-bold rounded-lg transition ${purpose === opt ? 'bg-blue-600 text-white' : 'bg-white hover:bg-blue-100'}`}>
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <p className="text-lg font-semibold text-gray-700 mb-3">2. Duration of Stay</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        {durationOptions.map(days => (
                                            <button key={days} onClick={() => setDuration(days)} className={`p-4 text-lg font-bold rounded-lg transition ${duration === days ? 'bg-blue-600 text-white' : 'bg-white hover:bg-blue-100'}`}>
                                                {days} Day{days > 1 && 's'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto">
                                {message && <p className="text-center text-lg font-semibold mb-3 p-3 rounded-lg bg-yellow-100 text-yellow-800">{message}</p>}
                                <button 
                                    onClick={handleRegisterAndOpen}
                                    disabled={!purpose || isLoading}
                                    className="w-full py-5 text-2xl font-bold text-white rounded-lg transition shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed bg-green-600 hover:bg-green-700"
                                >
                                    {isLoading ? 'Processing...' : 'Check-in and Open Gate'}
                                </button>

                                <div className="mt-6 border-t pt-4 text-center">
                                    <p className="text-md font-semibold text-gray-600 mb-2">Or Check-in on Your Phone</p>
                                    <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32 mx-auto" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Right Side / Main: Vehicle & Plate Images */}
                    <div className={`${isUnregistered ? 'w-1/2' : 'w-full'} flex items-center justify-center`}>
                        <div className={`flex ${isUnregistered ? 'flex-col w-full gap-4' : 'w-full gap-6 items-start'}`}>
                            {event.vehicleCropJpeg && (
                                <img 
                                    src={`data:image/jpeg;base64,${event.vehicleCropJpeg}`} 
                                    alt="Vehicle" 
                                    className={`${isUnregistered ? 'w-full' : 'w-2/3'} h-auto rounded-md border`} 
                                />
                            )}
                            {event.plateCropJpeg && (
                                <img 
                                    src={`data:image/jpeg;base64,${event.plateCropJpeg}`} 
                                    alt="License Plate" 
                                    className={`${isUnregistered ? 'w-full' : 'w-1/3'} h-auto rounded-md border`} 
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom: Additional Info & Progress Bar */}
            <div className="px-6 pb-4 text-base text-gray-600">
                <p><strong>Recognition Time:</strong> {formatDateTime(event.startTime)}</p>
                {event.registrationStatus === 'REGISTERED' && (
                    <p><strong>Registered By:</strong> {event.userEmail}</p>
                )}
            </div>
            <div className="w-full bg-gray-200 h-2">
                <div 
                    className="bg-blue-500 h-2"
                    style={{ width: `${(countdown / 60) * 100}%`, transition: 'width 1s linear' }}
                ></div>
            </div>
        </div>
    );
};

const PlateRealTimeMonitoringPage = () => {
    const [events, setEvents] = useState([]);
    const [wsStatus, setWsStatus] = useState('Connecting...');
    const [isManualModalOpen, setManualModalOpen] = useState(false);
    const [message, setMessage] = useState('');

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
                                const updatedEvents = [...prevEvents];
                                updatedEvents[existingEventIndex] = newEvent;
                                return updatedEvents;
                            } else {
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
                reconnectTimer = setTimeout(connect, 5000);
            };

            ws.onerror = (error) => {
                console.error('WebSocket Error:', error);
                setWsStatus('Connection Error');
                ws.close();
            };
        };

        connect();

        return () => {
            clearTimeout(reconnectTimer);
            if (ws) {
                ws.onclose = null;
                ws.close();
            }
        };
    }, []);

    const handleExpire = useCallback((uuid) => {
        setEvents(prevEvents => prevEvents.filter(event => event.bestUuid !== uuid));
    }, []);

    const handleManualSubmit = async ({ licensePlate, purpose, duration }) => {
        if (!licensePlate || !purpose || !duration) {
            setMessage('Missing information for manual registration.');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/visitor/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    licensePlate,
                    purpose,
                    durationInDays: duration,
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Manual registration failed.');

            setMessage(`Successfully registered ${licensePlate}. Gate is opening.`);
            setManualModalOpen(false);

        } catch (err) {
            setMessage(err.message || 'An error occurred during manual registration.');
        } finally {
            setTimeout(() => setMessage(''), 5000); // Clear message after 5 seconds
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4 font-inter">
            <div className="absolute top-4 left-4">
                <CiLogo />
            </div>
            <div className="w-full max-w-7xl mx-auto mt-4 p-6">
                <header className="flex justify-between items-center mb-6 border-b-2 pb-4 border-gray-300">
                    <h1 className="text-4xl font-extrabold text-gray-900">Check in</h1>
                    <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${wsStatus === 'Connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className="text-gray-500">{wsStatus}</span>
                    </div>
                </header>

                <div className="my-4 text-center">
                    <button 
                        onClick={() => setManualModalOpen(true)}
                        className="px-8 py-4 bg-blue-600 text-white font-bold text-xl rounded-lg shadow-md hover:bg-blue-700 transition-transform transform hover:scale-105"
                    >
                        Manual Check-in
                    </button>
                </div>

                {message && (
                    <div className="mb-4 p-4 text-center font-semibold text-white bg-green-500 rounded-lg">
                        {message}
                    </div>
                )}

                <main>
                    <div className="grid grid-cols-1 gap-8">
                        {events.length > 0 ? (
                            events.map(event => (
                                <PlateEventCard key={event.bestUuid} event={event} onExpire={handleExpire} />
                            ))
                        ) : (
                            <div className="col-span-full text-center py-16 bg-white rounded-lg shadow-md px-8">
                                <p className="text-gray-600 text-2xl">
                                    Waiting for vehicle entry. When a vehicle is recognized, a visitor registration menu will appear automatically. <br />
                                    Select the purpose and duration of the visit, then press the 'Register' button to open the gate. <br />
                                    If the vehicle recognition card does not appear, please use the 'Manual Check-in' button above.
                                </p>
                            </div>
                        )}
                    </div>
                </main>

                <div className="mt-8 text-center text-gray-500">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Privacy Notice</h3>
                        <div className="text-left">
                            <div className="mb-4">
                                <p className="font-bold">Korean</p>
                                <p className="text-sm">방문자 출입은 CCTV에 의해 촬영되며, 영상은 보안 목적으로 최대 1개월간 보관됩니다.</p>
                                <p className="text-sm">보관된 영상은 법적 요구 또는 보안 사고 조사 목적 외에는 사용되지 않습니다.</p>
                            </div>
                            <div>
                                <p className="font-bold">English</p>
                                <p className="text-sm">Visitor access will be recorded by CCTV, and footage will be stored for up to one month for security purposes.</p>
                                <p className="text-sm">The recorded data will not be used for any other purpose except in response to legal requirements or security investigations.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <ManualVisitorRegistrationModal 
                isOpen={isManualModalOpen}
                onClose={() => setManualModalOpen(false)}
                onSubmit={handleManualSubmit}
            />
        </div>
    );
};

export default PlateRealTimeMonitoringPage;