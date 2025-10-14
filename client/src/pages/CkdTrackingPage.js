import React, { useState, useEffect, useRef } from 'react';

const CkdTrackingPage = () => {
    const iframeRef = useRef(null);
    const [shipments, setShipments] = useState([]);
    const [selectedContainer, setSelectedContainer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchShipments = async () => {
            const apiUrl = '/api/shipsgo/shipments'; // Use the backend proxy

            try {
                setLoading(true);
                // No headers needed anymore, the backend handles the token
                const response = await fetch(apiUrl);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                // The backend now returns the data structure we need.
                // Assuming the API returns { data: [...] }
                setShipments(data.data || []);
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
    }, [selectedContainer]); // Update iframe when selectedContainer changes

    const handleShipmentClick = (containerNumber) => {
        setSelectedContainer(containerNumber);
    };

    // Initial container to show before any selection
    useEffect(() => {
        if (!selectedContainer && shipments.length > 0) {
            // Select the first container in the list by default
            if(shipments[0].container_number) {
                setSelectedContainer(shipments[0].container_number);
            }
        }
    }, [shipments, selectedContainer]);


    return (
        <div className="p-4 flex flex-col md:flex-row gap-4">
            {/* Shipments List */}
            <div className="w-full md:w-1/3 lg:w-1/4">
                <h2 className="text-xl font-bold mb-2">Upcoming Shipments</h2>
                {loading && <p>Loading shipments...</p>}
                {error && <p className="text-red-500">Error fetching shipments: {error}</p>}
                {!loading && !error && (
                    <ul className="space-y-2 h-[550px] overflow-y-auto border rounded p-2">
                        {shipments.length > 0 ? (
                            shipments.map((shipment) => (
                                <li
                                    key={shipment.id}
                                    onClick={() => handleShipmentClick(shipment.container_number)}
                                    className={`p-2 rounded cursor-pointer ${selectedContainer === shipment.container_number ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                                >
                                    <p className="font-bold">{shipment.container_number || 'No Container #'}</p>
                                    <p className="text-sm">Carrier: {shipment.carrier}</p>
                                    <p className="text-sm">Status: {shipment.status}</p>
                                    <p className="text-sm">From: {shipment.port_of_loading}</p>
                                    <p className="text-sm">To: {shipment.port_of_discharge}</p>
                                </li>
                            ))
                        ) : (
                            <p>No upcoming shipments found.</p>
                        )}
                    </ul>
                )}
            </div>

            {/* Live Tracking Iframe */}
            <div className="w-full md:w-2/3 lg:w-3/4">
                 <h2 className="text-xl font-bold mb-2">Live Tracking</h2>
                {selectedContainer ? (
                    <iframe
                        ref={iframeRef}
                        id="IframeShipsgoLiveMap"
                        style={{ height: '550px', width: '100%', border: 'none' }}
                        title="ShipsGo Live Map"
                        // The src is now set via useEffect
                    ></iframe>
                ) : (
                    <div className="h-[550px] flex items-center justify-center bg-gray-100 rounded">
                        <p>Select a shipment to see live tracking.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CkdTrackingPage;