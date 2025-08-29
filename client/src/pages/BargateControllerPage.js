import React, { useState, useCallback, useEffect } from 'react';
import JsmpegPlayer from '../components/JsmpegPlayer';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL;

// --- Settings Area ---
const GATES_CONFIG = [
  { id: 1, name: 'Visitor Entrance', openShellyId: 3, closeShellyId: 1 },
  { id: 2, name: 'Visitor Exit', openShellyId: 4, closeShellyId: 2 },
  { id: 3, name: 'Staff Entrance', openShellyId: 8, closeShellyId: 7 },
  { id: 4, name: 'Staff Exit', openShellyId: 5, closeShellyId: 6 },
];

const BACKGROUND_IMAGE_PATH = '/BargateBackground.png';

const GATE_POSITIONS = {
  1: { top: '50%', left: '35%' },
  2: { top: '50%', left: '65%' },
  3: { top: '50%', left: '18%' },
  4: { top: '50%', left: '82%' },
};

const WEBSOCKET_URL = process.env.REACT_APP_RTSP_WS_URL;
// --- End of Settings Area ---

const BargateControllerPage = () => {
  const { user } = useAuth();
  const [holdOpenState, setHoldOpenState] = useState({});
  const [loadingState, setLoadingState] = useState({});
  const [message, setMessage] = useState('');

  const sendSlackNotification = useCallback(async (gateName, action) => {
    if (!user || !user.email) return;
    const text = `${gateName} - ${action} by ${user.email}`;
    try {
      await fetch(`${API_BASE_URL}/shelly/sendSlackMessage?shelly=${encodeURIComponent(user.email)}&TEXT=${encodeURIComponent(text)}`);
    } catch (error) {
      console.error('Failed to send Slack message:', error);
    }
  }, [user]);

  const fetchShellyStatus = useCallback(async (shellyId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/shelly/status/${shellyId}`);
      if (!res.ok) throw new Error('Failed to fetch status');
      const data = await res.json();
      return data.status?.result?.output ?? data.status?.output;
    } catch (error) {
      console.error(`Error fetching status for shelly ${shellyId}:`, error);
      return false;
    }
  }, []);

  useEffect(() => {
    const initHoldOpenStates = async () => {
      const states = {};
      for (const gate of GATES_CONFIG) {
        const status = await fetchShellyStatus(gate.openShellyId);
        states[gate.id] = status;
      }
      setHoldOpenState(states);
    };
    initHoldOpenStates();
  }, [fetchShellyStatus]);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handlePulse = async (shellyId, gateName, action) => {
    const loadingKey = `${shellyId}-${action}`;
    setLoadingState(prev => ({ ...prev, [loadingKey]: true }));
    showMessage(`${gateName} - ${action} in progress...`);
    try {
      await fetch(`${API_BASE_URL}/shelly/on/${shellyId}`, { method: 'POST' });
      await new Promise(resolve => setTimeout(resolve, 1000));
      await fetch(`${API_BASE_URL}/shelly/off/${shellyId}`, { method: 'POST' });
      showMessage(`${gateName} - ${action} complete`);
      sendSlackNotification(gateName, action);
    } catch (error) {
      console.error('Pulse action failed:', error);
      showMessage(`${gateName} - ${action} failed`);
    } finally {
      setLoadingState(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const handleToggleHoldOpen = async (gate) => {
    const loadingKey = `${gate.id}-hold`;
    setLoadingState(prev => ({ ...prev, [loadingKey]: true }));
    const isCurrentlyHeld = holdOpenState[gate.id];
    const targetAction = isCurrentlyHeld ? 'off' : 'on';
    const actionText = isCurrentlyHeld ? 'Releasing Hold' : 'Holding Open';

    showMessage(`${gate.name}: ${actionText}...`);
    try {
      await fetch(`${API_BASE_URL}/shelly/${targetAction}/${gate.openShellyId}`, { method: 'POST' });
      setHoldOpenState(prev => ({ ...prev, [gate.id]: !isCurrentlyHeld }));
      showMessage(`${gate.name}: ${actionText} complete`);
      sendSlackNotification(gate.name, actionText);
    } catch (error) {
      console.error('Toggle hold open failed:', error);
      showMessage(`${gate.name}: ${actionText} failed`);
    } finally {
      setLoadingState(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const handleAllOpen = async () => {
    showMessage('All gates opening...');
    await Promise.all(GATES_CONFIG.map(gate => handlePulse(gate.openShellyId, gate.name, 'Open')));
    showMessage('All Open action complete.');
    sendSlackNotification('All Gates', 'Open');
  };

  const handleAllClose = async () => {
    showMessage('All gates closing...');
    await Promise.all(GATES_CONFIG.map(gate => handlePulse(gate.closeShellyId, gate.name, 'Close')));
    showMessage('All Close action complete.');
    sendSlackNotification('All Gates', 'Close');
  };

  const handleToggleAllHoldOpen = async () => {
    const areAllHeld = GATES_CONFIG.every(gate => !!holdOpenState[gate.id]);
    const targetState = !areAllHeld;
    const action = targetState ? 'on' : 'off';
    const actionText = targetState ? 'Holding all gates open' : 'Releasing hold on all gates';

    showMessage(`${actionText}...`);
    try {
        const promises = GATES_CONFIG.map(gate =>
            fetch(`${API_BASE_URL}/shelly/${action}/${gate.openShellyId}`, { method: 'POST' })
        );
        await Promise.all(promises);
        const newHoldState = {};
        GATES_CONFIG.forEach(gate => { newHoldState[gate.id] = targetState; });
        setHoldOpenState(newHoldState);
        showMessage(`${actionText} complete.`);
        sendSlackNotification('All Gates', actionText);
    } catch (error) {
        console.error('All Hold/Release action failed:', error);
        showMessage('Global action failed.');
    }
  };

  const areAllHeld = GATES_CONFIG.every(gate => !!holdOpenState[gate.id]);

  // Reusable Gate Controller Component
  const GateController = ({ gate }) => {
    const isHeld = holdOpenState[gate.id];
    return (
        <div className="p-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-xl z-10">
            <h3 className="text-xl font-bold text-center mb-4">{gate.name}</h3>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-2">
                <button
                    onClick={() => handlePulse(gate.openShellyId, gate.name, 'Open')}
                    disabled={loadingState[`${gate.openShellyId}-Open`]}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                    Open
                </button>
                <button
                    onClick={() => handlePulse(gate.closeShellyId, gate.name, 'Close')}
                    disabled={loadingState[`${gate.closeShellyId}-Close`]}
                    className="w-full sm:w-auto px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                >
                    Close
                </button>
                <button
                    onClick={() => handleToggleHoldOpen(gate)}
                    disabled={loadingState[`${gate.id}-hold`]}
                    className={`w-full sm:w-auto px-4 py-2 text-white rounded disabled:opacity-50 ${
                    isHeld ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'
                    }`}
                >
                    {isHeld ? 'Release Hold' : 'Hold Open'}
                </button>
            </div>
        </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-gray-800">
      {/* --- Desktop Layout (Original Code) --- */}
      <div className="hidden lg:block relative w-screen h-screen bg-gray-200">
        <div 
          className="absolute top-0 left-0 w-full h-full bg-contain bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${BACKGROUND_IMAGE_PATH})` }}
        ></div>
        <div className="absolute top-4 right-4 z-30">
          <div className="w-96 h-72 bg-black rounded-lg shadow-lg overflow-hidden">
            <JsmpegPlayer websocketUrl={WEBSOCKET_URL} />
          </div>
        </div>
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white px-6 py-2 rounded-lg shadow-lg text-lg font-semibold z-20">
          {message || 'Bargate Controller'}
        </div>
        <div className="absolute top-20 left-1/2 -translate-x-1/2 flex space-x-4 z-20">
            <button onClick={handleAllOpen} className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-transform transform hover:scale-105">All Open</button>
            <button onClick={handleAllClose} className="px-5 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-transform transform hover:scale-105">All Close</button>
            <button onClick={handleToggleAllHoldOpen} className={`px-5 py-2 text-white font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105 ${areAllHeld ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}>{areAllHeld ? 'All Release Hold' : 'All Hold Open'}</button>
        </div>
        {GATES_CONFIG.map(gate => {
          const position = GATE_POSITIONS[gate.id] || { top: '50%', left: '50%' };
          return (
            <div 
              key={gate.id}
              className="absolute p-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-xl z-10"
              style={{ top: position.top, left: position.left, transform: 'translate(-50%, -50%)' }}
            >
              <GateController gate={gate} />
            </div>
          );
        })}
      </div>

      {/* --- Mobile & Tablet Layout --- */}
      <div className="lg:hidden w-full min-h-screen flex flex-col items-center p-4 bg-cover bg-center"
           style={{ backgroundImage: `url(${BACKGROUND_IMAGE_PATH})` }}>
        <div className="w-full">
            <div className="w-full bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-4">
                {/* Video Player with padding-top hack for aspect ratio */}
                <div className="relative w-full bg-black rounded-lg shadow-lg overflow-hidden mb-4" style={{ paddingTop: '56.25%' }}>
                    <div className="absolute top-0 left-0 w-full h-full">
                        <JsmpegPlayer websocketUrl={WEBSOCKET_URL} />
                    </div>
                </div>
                {/* Global Controls */}
                <div className="w-full flex flex-wrap justify-center gap-2 mb-6">
                    <button onClick={handleAllOpen} className="flex-grow px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 min-w-[120px]">All Open</button>
                    <button onClick={handleAllClose} className="flex-grow px-5 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 min-w-[120px]">All Close</button>
                    <button onClick={handleToggleAllHoldOpen} className={`flex-grow px-5 py-2 text-white font-semibold rounded-lg shadow-md min-w-[120px] ${areAllHeld ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}>{areAllHeld ? 'All Release Hold' : 'All Hold Open'}</button>
                </div>
                {/* Individual Gate Controllers */}
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {GATES_CONFIG.map(gate => <GateController key={gate.id} gate={gate} />)}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BargateControllerPage;