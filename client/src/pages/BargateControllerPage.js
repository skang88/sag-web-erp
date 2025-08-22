import React, { useState, useCallback, useEffect } from 'react';
import JsmpegPlayer from '../components/JsmpegPlayer';

const API_BASE_URL = process.env.REACT_APP_API_URL;

// --- Settings Area ---
// Configure the name and Shelly IDs for each gate.
const GATES_CONFIG = [
  { id: 1, name: 'Visitor Entrance', openShellyId: 3, closeShellyId: 1 },
  { id: 2, name: 'Visitor Exit', openShellyId: 4, closeShellyId: 2 },
  { id: 3, name: 'Staff Entrance', openShellyId: 8, closeShellyId: 7 },
  { id: 4, name: 'Staff Exit', openShellyId: 5, closeShellyId: 6 },
];

// Background image path (relative to the public folder)
const BACKGROUND_IMAGE_PATH = '/BargateBackground.png';  

// Button positions for each gate (top, left in %)
const GATE_POSITIONS = {
  1: { top: '50%', left: '35%' },
  2: { top: '50%', left: '65%' },
  3: { top: '50%', left: '18%' },
  4: { top: '50%', left: '82%' },
};

const WEBSOCKET_URL = 'wss://seohanga.com/api/stream';
// --- End of Settings Area ---

const BargateControllerPage = () => {
  const [holdOpenState, setHoldOpenState] = useState({});
  const [loadingState, setLoadingState] = useState({});
  const [message, setMessage] = useState('');

  const fetchShellyStatus = useCallback(async (shellyId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/shelly/status/${shellyId}`);
      if (!res.ok) throw new Error('Failed to fetch status');
      const data = await res.json();
      const output = data.status?.result?.output ?? data.status?.output;
      return output;
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

  // Pulse action: Turn On for 1 second, then Off
  const handlePulse = async (shellyId, gateName, action) => {
    const loadingKey = `${shellyId}-${action}`;
    setLoadingState(prev => ({ ...prev, [loadingKey]: true }));
    showMessage(`${gateName} - ${action} in progress...`);
    try {
      await fetch(`${API_BASE_URL}/shelly/on/${shellyId}`, { method: 'POST' });
      await new Promise(resolve => setTimeout(resolve, 1000));
      await fetch(`${API_BASE_URL}/shelly/off/${shellyId}`, { method: 'POST' });
      showMessage(`${gateName} - ${action} complete`);
    } catch (error) {
      console.error('Pulse action failed:', error);
      showMessage(`${gateName} - ${action} failed`);
    } finally {
      setLoadingState(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Toggle Hold Open / Release Hold
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
    } catch (error) {
      console.error('Toggle hold open failed:', error);
      showMessage(`${gate.name}: ${actionText} failed`);
    } finally {
      setLoadingState(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // --- Global Control Handlers ---
  const handleAllOpen = async () => {
    showMessage('All gates opening...');
    await Promise.all(
        GATES_CONFIG.map(gate => handlePulse(gate.openShellyId, gate.name, 'Open'))
    );
    showMessage('All Open action complete.');
  };

  const handleAllClose = async () => {
    showMessage('All gates closing...');
    await Promise.all(
        GATES_CONFIG.map(gate => handlePulse(gate.closeShellyId, gate.name, 'Close'))
    );
    showMessage('All Close action complete.');
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
    } catch (error) {
        console.error('All Hold/Release action failed:', error);
        showMessage('Global action failed.');
    }
  };

  const areAllHeld = GATES_CONFIG.every(gate => !!holdOpenState[gate.id]);

  return (
    <div className="relative w-screen h-screen bg-gray-200">
      {/* Live View */}
      <div className="absolute top-4 right-4 z-30">
        <div className="w-96 h-72 bg-black rounded-lg shadow-lg overflow-hidden">
          <JsmpegPlayer websocketUrl={WEBSOCKET_URL} />
        </div>
      </div>

      {/* Background Image */}
      <div 
        className="absolute top-0 left-0 w-full h-full bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${BACKGROUND_IMAGE_PATH})`, opacity: 1 }}
      ></div>
      
      {/* Top Message Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white px-6 py-2 rounded-lg shadow-lg text-lg font-semibold z-20">
        {message || 'Bargate Controller'}
      </div>

      {/* Global Controls */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 flex space-x-4 z-20">
        <button onClick={handleAllOpen} className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-transform transform hover:scale-105">
            All Open
        </button>
        <button onClick={handleAllClose} className="px-5 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-transform transform hover:scale-105">
            All Close
        </button>
        <button onClick={handleToggleAllHoldOpen} className={`px-5 py-2 text-white font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105 ${areAllHeld ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}>
            {areAllHeld ? 'All Release Hold' : 'All Hold Open'}
        </button>
      </div>

      {/* Gate Controllers */}
      {GATES_CONFIG.map(gate => {
        const position = GATE_POSITIONS[gate.id] || { top: '50%', left: '50%' };
        const isHeld = holdOpenState[gate.id];
        
        return (
          <div 
            key={gate.id}
            className="absolute p-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-xl z-10"
            style={{ top: position.top, left: position.left, transform: 'translate(-50%, -50%)' }}
          >
            <h3 className="text-xl font-bold text-center mb-4">{gate.name}</h3>
            <div className="flex space-x-2">
              {/* Open Button */}
              <button
                onClick={() => handlePulse(gate.openShellyId, gate.name, 'Open')}
                disabled={loadingState[`${gate.openShellyId}-Open`]}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Open
              </button>
              {/* Close Button */}
              <button
                onClick={() => handlePulse(gate.closeShellyId, gate.name, 'Close')}
                disabled={loadingState[`${gate.closeShellyId}-Close`]}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                Close
              </button>
              {/* Hold/Release Button */}
              <button
                onClick={() => handleToggleHoldOpen(gate)}
                disabled={loadingState[`${gate.id}-hold`]}
                className={`px-4 py-2 text-white rounded disabled:opacity-50 ${
                  isHeld ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {isHeld ? 'Release Hold' : 'Hold Open'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BargateControllerPage;