import { useState, useEffect } from 'react';
import CiLogo from '../components/CiLogo';
import CustomKeyboard from '../components/CustomKeyboard';
import 'react-simple-keyboard/build/css/index.css';

const VISITOR_ENTRANCE_GATE = { id: 1, name: 'Visitor Entrance', openShellyId: 3, closeShellyId: 1 };

const WS_URL = process.env.REACT_APP_WS_URL;
const API_BASE_URL = process.env.REACT_APP_API_URL;

const purposeOptions = ['Delivery', 'Meeting', 'Parcel Delivery', 'Others'];

// --- New Modal Component for Visitor Flow ---
const VisitorFlowModal = ({ event, onClose, onSubmit, initialStep = 'confirm' }) => {
    const [step, setStep] = useState(initialStep); // 'confirm', 'purpose', 'manual', 'success', 'error'
    const [manualStep, setManualStep] = useState('input'); // 'input', 'purpose' for manual flow
    const [manualPlate, setManualPlate] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        let expireTimer = null;

        // Only set the auto-close timer if the user is not in the manual input step.
        // This prevents the modal from closing while they are typing.
        if (step !== 'manual') {
            expireTimer = setTimeout(() => {
                onClose();
            }, 60000); // Auto-close modal after 60 seconds of inactivity
        }

        return () => {
            if (expireTimer) {
                clearTimeout(expireTimer);
            }
        };
    }, [step, onClose]);

    const handlePurposeSelection = async (purpose) => {
        setIsLoading(true);
        const plateToRegister = step === 'manual' ? manualPlate : event.bestPlateNumber;
        const success = await onSubmit(plateToRegister, purpose);
        setIsLoading(false);
        if (success) {
            setStep('success');
            setTimeout(onClose, 3000); // Close success message after 3s
        } else {
            setMessage('Registration failed. Please try again.');
            setStep('error');
        }
    };

    const renderConfirmation = () => (
        <div className="flex flex-col h-full">
            <div className="grid grid-cols-2 gap-4 mb-4">
                <img src={`data:image/jpeg;base64,${event.vehicleCropJpeg}`} alt="Vehicle" className="rounded-lg w-full" />
                <img src={`data:image/jpeg;base64,${event.plateCropJpeg}`} alt="License Plate" className="rounded-lg w-full" />
            </div>
            <div className="text-center bg-gray-800 text-white py-4 rounded-lg mb-4">
                <p className="text-8xl font-mono font-bold tracking-widest">{event.bestPlateNumber}</p>
            </div>
            <p className="text-center text-3xl font-semibold text-gray-800 mb-auto">Is this your license plate?</p>
            <div className="grid grid-cols-2 gap-4 mt-4">
                <button onClick={() => setStep('purpose')} className="w-full py-8 text-4xl font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition">YES</button>
                <button onClick={() => setStep('manual')} className="w-full py-8 text-4xl font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition">NO</button>
            </div>
        </div>
    );

    const renderPurposeSelection = () => (
        <div className="flex flex-col h-full">
            <h2 className="text-4xl font-bold text-center text-gray-800 mb-6">Select Purpose of Visit</h2>
            <div className="grid grid-cols-2 gap-4 flex-grow">
                {purposeOptions.map(purpose => (
                    <button 
                        key={purpose} 
                        onClick={() => handlePurposeSelection(purpose)}
                        className="py-8 text-3xl font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-lg"
                    >
                        {purpose}
                    </button>
                ))}
            </div>
        </div>
    );

    const renderManualInput = () => {
        if (manualStep === 'input') {
            return (
                <div className="flex flex-col h-full">
                    <h2 className="text-4xl font-bold text-center text-gray-800 mb-4">Enter License Plate Manually</h2>
                    <div className="w-full text-center text-5xl font-mono font-bold p-4 border-4 border-gray-300 rounded-lg mb-4 bg-gray-100">
                        {manualPlate || ' '} 
                    </div>
                    <CustomKeyboard
                        value={manualPlate}
                        onChange={setManualPlate}
                    />
                    <button
                        onClick={() => setManualStep('purpose')}
                        disabled={!manualPlate || manualPlate.length < 4}
                        className="w-full mt-4 py-6 text-3xl font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition shadow-lg disabled:bg-gray-400"
                    >
                        Next
                    </button>
                </div>
            );
        }

        if (manualStep === 'purpose') {
            return (
                <div className="flex flex-col h-full">
                    <h2 className="text-4xl font-bold text-center text-gray-800 mb-4">Select Purpose of Visit</h2>
                    <p className="text-center text-3xl font-mono mb-4">Registering for: <strong>{manualPlate}</strong></p>
                    <div className="grid grid-cols-2 gap-4 flex-grow">
                        {purposeOptions.map(purpose => (
                            <button 
                                key={purpose} 
                                onClick={() => handlePurposeSelection(purpose)}
                                className="py-8 text-3xl font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-lg"
                            >
                                {purpose}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setManualStep('input')} className="mt-4 text-lg text-gray-600 hover:underline">Back to plate input</button>
                </div>
            );
        }
    };

    const renderStatus = (status) => (
        <div className="flex flex-col items-center justify-center h-full">
            {status === 'success' ? (
                <p className="text-5xl font-bold text-green-600">Registration Complete! Gate is opening.</p>
            ) : (
                <p className="text-5xl font-bold text-red-600">{message || 'An error occurred.'}</p>
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-auto p-8 m-4 flex flex-col relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-3xl font-bold"
                >
                    &times;
                </button>
                {isLoading && <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center"><p className="text-3xl font-bold">Processing...</p></div>}
                {step === 'confirm' && renderConfirmation()}
                {step === 'purpose' && renderPurposeSelection()}
                {step === 'manual' && renderManualInput()}
                {(step === 'success' || step === 'error') && renderStatus(step)}
            </div>
        </div>
    );
};


const PlateRealTimeMonitoringPage = () => {
    const [activeEvent, setActiveEvent] = useState(null);
    const [wsStatus, setWsStatus] = useState('Connecting...');
    const [globalMessage, setGlobalMessage] = useState('');
    const [loadingState, setLoadingState] = useState({});

    const handleVisitorEntranceOpen = async () => {
        setLoadingState(prev => ({ ...prev, [VISITOR_ENTRANCE_GATE.openShellyId]: true }));
        setGlobalMessage(`${VISITOR_ENTRANCE_GATE.name} - Initiating manual registration...`);
        
        // Create a dummy event object to trigger the modal in manual mode
        const dummyEvent = {
            bestPlateNumber: '', // No plate recognized yet
            vehicleCropJpeg: '', // No image
            plateCropJpeg: '',   // No image
            registrationStatus: 'UNREGISTERED' // Treat as unregistered to show the modal
        };
        setActiveEvent(dummyEvent);
        setLoadingState(prev => ({ ...prev, [VISITOR_ENTRANCE_GATE.openShellyId]: false }));
        setTimeout(() => setGlobalMessage(''), 3000); // Clear message after a short delay
    };

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
                        
                        // Using a callback with setActiveEvent ensures we have the latest state
                        // and avoids race conditions without needing 'activeEvent' in the dependency array.
                        setActiveEvent(currentActiveEvent => {
                            if (newEvent.registrationStatus === 'UNREGISTERED') {
                                // If no modal is active, show the new one for the unregistered visitor.
                                if (!currentActiveEvent) {
                                    return newEvent;
                                }
                                // If a modal is already active, ignore the new event to prevent pop-ups over pop-ups.
                                return currentActiveEvent;
                            } else {
                                // For registered staff or visitors, don't show a modal.
                                // Just show a temporary global message for feedback.
                                const statusText = newEvent.registrationStatus === 'REGISTERED' ? 'Staff' : 'Visitor';
                                setGlobalMessage(`Welcome, ${statusText} ${newEvent.bestPlateNumber}!`);
                                setTimeout(() => setGlobalMessage(''), 4000);
                                
                                // Do not change the active event, keeping the current modal if it exists.
                                return currentActiveEvent;
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
    }, []); // Dependency array is intentionally empty to prevent WebSocket reconnects on state changes.

    const handleRegistration = async (licensePlate, purpose) => {
        if (!licensePlate || !purpose) {
            setGlobalMessage('Missing information for registration.');
            return false;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/visitor/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    licensePlate,
                    purpose,
                    durationInDays: 1, // Duration is now fixed to 1 day
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Registration failed.');
            
            setGlobalMessage(`Successfully registered ${licensePlate}.`);
            setTimeout(() => setGlobalMessage(''), 5000);

            // --- Open the gate after successful registration ---
            const gate = VISITOR_ENTRANCE_GATE;
            try {
                await fetch(`${API_BASE_URL}/shelly/on/${gate.openShellyId}`, { method: 'POST' });
                await new Promise(resolve => setTimeout(resolve, 1000));
                await fetch(`${API_BASE_URL}/shelly/off/${gate.openShellyId}`, { method: 'POST' });
                setGlobalMessage(`${gate.name} - Opened for ${licensePlate}`);
                setTimeout(() => setGlobalMessage(''), 3000);
            } catch (error) {
                console.error('Failed to open gate after registration:', error);
                setGlobalMessage(`${gate.name} - Failed to open gate for ${licensePlate}`);
                setTimeout(() => setGlobalMessage(''), 3000);
            }
            // --- End of gate opening logic ---

            return true;

        } catch (err) {
            setGlobalMessage(err.message || 'An error occurred during registration.');
            setTimeout(() => setGlobalMessage(''), 5000);
            return false;
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

                {globalMessage && (
                    <div className={`mb-4 p-4 text-center font-semibold text-white ${globalMessage.includes('Welcome') ? 'bg-blue-500' : 'bg-green-500'} rounded-lg`}>
                        {globalMessage}
                    </div>
                )}

                <main>
                    {!activeEvent && (
                        <div className="text-center py-16 bg-white rounded-lg shadow-md px-8">
                            <p className="text-gray-600 text-3xl">
                                Waiting for vehicle entry...
                            </p>
                            <p className="text-gray-500 text-xl mt-4">
                                When a vehicle is recognized, a check-in screen will appear automatically.
                            </p>
                        </div>
                    )}
                </main>
                
                <div className="mt-8 text-center">
                    <button
                            onClick={handleVisitorEntranceOpen}
                            disabled={loadingState[`${VISITOR_ENTRANCE_GATE.openShellyId}-Open`]}
                            className="px-16 py-10 bg-green-500 text-white text-4xl rounded hover:bg-green-600 disabled:opacity-50"                        >
                            Check In
                    </button>
                </div>

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

            {activeEvent && (
                <VisitorFlowModal 
                    event={activeEvent}
                    onClose={() => setActiveEvent(null)}
                    onSubmit={handleRegistration}
                    initialStep={activeEvent.bestPlateNumber === '' ? 'manual' : 'confirm'}
                />
            )}
        </div>
    );
};

export default PlateRealTimeMonitoringPage;