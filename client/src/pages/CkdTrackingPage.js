import React, { useState, useEffect, useRef } from 'react';

// Helper to format dates
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
};

// Helper to calculate days remaining for arrival
const getDaysRemaining = (dateString) => {
    if (!dateString) return null;
    const arrivalDate = new Date(dateString);
    const today = new Date();

    // Reset time to midnight for accurate day difference
    arrivalDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const timeDiff = arrivalDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysDiff < 0) {
        return 'Arrived';
    } else if (daysDiff === 0) {
        return 'Arriving today';
    } else {
        return `Arriving in ${daysDiff} days`;
    }
};

const CkdTrackingPage = () => {
    const iframeRef = useRef(null);
    const [shipments, setShipments] = useState([]);
    const [selectedContainer, setSelectedContainer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchShipments = async () => {
            const API_BASE_URL = process.env.REACT_APP_API_URL || '';
            const apiUrl = `${API_BASE_URL}/shipsgo/shipments`; // Corrected URL construction

            try {
                setLoading(true);
                const response = await fetch(apiUrl);

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
                }

                const data = await response.json();
                // BUG FIX: The shipment array is in `data.shipments`, not `data.data`
                setShipments(data.shipments || []);
            } catch (e) {
                setError(e.message);
                console.error("Failed to fetch shipments:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchShipments();
    }, []); // Fetch only on component mount

    useEffect(() => {
        if (selectedContainer && iframeRef.current) {
            iframeRef.current.src = `https://shipsgo.com/iframe/where-is-my-container/${selectedContainer}`;
        }
    }, [selectedContainer]);

    const handleShipmentClick = (containerNumber) => {
        setSelectedContainer(containerNumber);
    };

    // Select the first container by default once shipments are loaded
    useEffect(() => {
        if (!selectedContainer && shipments.length > 0) {
            if (shipments[0].container_number) {
                setSelectedContainer(shipments[0].container_number);
            }
        }
    }, [shipments, selectedContainer]);


    return (
        <div className="p-4 flex flex-col md:flex-row gap-4 h-[calc(100vh-4rem)]">
            {/* Shipments List */}
            <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col">
                <h2 className="text-xl font-bold mb-2 flex-shrink-0">Upcoming Shipments ({shipments.length})</h2>
                {loading && <p>Loading shipments...</p>}
                {error && <p className="text-red-500">Error fetching shipments: {error}</p>}
                {!loading && !error && (
                    <div className="flex-grow overflow-y-auto border rounded p-2 bg-gray-50">
                        {shipments.length > 0 ? (
                            shipments.map((shipment) => (
                                <div
                                    key={shipment.id}
                                    onClick={() => handleShipmentClick(shipment.container_number)}
                                    className={`p-3 mb-2 rounded-lg cursor-pointer transition-all duration-200 ${selectedContainer === shipment.container_number ? 'bg-blue-600 text-white shadow-lg' : 'bg-white hover:bg-gray-100 shadow-sm border'}`}
                                >
                                    <p className="font-extrabold text-lg">{shipment.container_number || 'No Container #'}</p>
                                    <p className="text-sm font-semibold">Carrier: {shipment.carrier.name}</p>
                                    <p className={`text-sm font-bold ${shipment.status === 'SAILING' ? 'text-green-500' : ''}`}>{shipment.status}</p>
                                    <hr className="my-2" />
                                    <div className="text-xs grid grid-cols-2 gap-1">
                                        <p><b>POL:</b> {shipment.route.port_of_loading.location.name}</p>
                                        <p><b>POD:</b> {shipment.route.port_of_discharge.location.name}</p>
                                        <p><b>Load:</b> {formatDate(shipment.route.port_of_loading.date_of_loading)}</p>
                                        <p><b>Discharge:</b> {formatDate(shipment.route.port_of_discharge.date_of_discharge)}</p>
                                    </div>
                                    <div className="mt-2">
                                        <div className="flex justify-between text-xs font-semibold">
                                            <p>Transit: {shipment.route.transit_percentage}%</p>
                                            <p className={`font-bold ${selectedContainer === shipment.container_number ? 'text-white' : 'text-blue-600'}`}>{getDaysRemaining(shipment.route.port_of_discharge.date_of_discharge)}</p>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                            <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: `${shipment.route.transit_percentage}%` }}></div>
                                        </div>
                                    </div>
                                     <p className="text-xs mt-1">CO₂ Emission: {shipment.route.co2_emission} Tons</p>
                                </div>
                            ))
                        ) : (
                            <p>No upcoming shipments found.</p>
                        )}
                    </div>
                )}
            </div>

            {/* Live Tracking Iframe */}
            <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col">
                 <h2 className="text-xl font-bold mb-2">Live Tracking: {selectedContainer || 'N/A'}</h2>
                <div className="flex-grow border rounded-lg overflow-hidden shadow-md">
                    {selectedContainer ? (
                        <iframe
                            ref={iframeRef}
                            id="IframeShipsgoLiveMap"
                            className="w-full h-full"
                            title="ShipsGo Live Map"
                        ></iframe>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <p className="text-gray-500">Select a shipment to see live tracking.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CkdTrackingPage;