import React, { useEffect, useRef } from 'react';

const CkdTrackingPage = () => {
    const iframeRef = useRef(null);

    useEffect(() => {
        const shipsgoMessagesListener = (event) => {
            // Ensure the event and data are what we expect
            if (event.data && event.data.Action === "LoadNewContainerCode" && iframeRef.current) {
                iframeRef.current.src = "https://shipsgo.com/iframe/where-is-my-container/" + event.data.Parameters.ContainerCode;
            }
        };

        window.addEventListener("message", shipsgoMessagesListener);

        // This part of the original script seems to be for setting an initial container
        // based on a URL query parameter. We can adapt this as well.
        const urlParams = new URLSearchParams(window.location.search);
        let defaultQuery = urlParams.get('query');

        if (!defaultQuery) {
            // You might want to set a default container ID or leave it blank
            defaultQuery = "TEST1234567"; // Defaulting to the one from the example
        }

        if (iframeRef.current) {
            iframeRef.current.src = "https://shipsgo.com/iframe/where-is-my-container/" + defaultQuery;
        }

        // Cleanup the event listener when the component unmounts
        return () => {
            window.removeEventListener("message", shipsgoMessagesListener);
        };
    }, []); // The empty dependency array ensures this effect runs only once on mount

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">CKD Live Tracking</h1>
            <iframe
                ref={iframeRef}
                id="IframeShipsgoLiveMap"
                style={{ height: '550px', width: '100%', border: 'none' }}
                title="ShipsGo Live Map"
            ></iframe>
        </div>
    );
};

export default CkdTrackingPage;
