import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Assuming API_BASE_URL is like 'http://localhost:3000'
// Ensure your .env file has REACT_APP_API_BASE_URL set correctly, e.g., REACT_APP_API_BASE_URL=http://localhost:3000
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000'; // Fallback for local development

const PlateLogPage = () => {
    const [plates, setPlates] = useState([]); // Array to store fetched plate recognition logs
    const [startDate, setStartDate] = useState(''); // State for start date filter
    const [endDate, setEndDate] = useState('');    // State for end date filter
    const [plateNumber, setPlateNumber] = useState(''); // State for specific plate number filter
    const [registrationStatus, setRegistrationStatus] = useState(''); // State for registration status filter

    const [message, setMessage] = useState(''); // Message for user feedback
    const [error, setError] = useState('');     // Error message
    const [isLoading, setIsLoading] = useState(false); // Loading indicator
    const navigate = useNavigate(); // For potential navigation (e.g., login redirect if auth fails)

    // useEffect hook to fetch data on component mount and set initial date filters
    useEffect(() => {
        // Set default date filter to today's date
        const today = new Date();
        const year = today.getFullYear();
        // Month is 0-indexed, so add 1 and pad with '0' if single digit
        const month = String(today.getMonth() + 1).padStart(2, '0');
        // Day of the month, pad with '0' if single digit
        const day = String(today.getDate()).padStart(2, '0');
        const formattedToday = `${year}-${month}-${day}`;

        setStartDate(formattedToday);
        setEndDate(formattedToday);

        fetchPlateLogs(); // Call the fetch function to load data initially
    }, []); // Empty dependency array ensures this runs only once after the initial render

    /**
     * Fetches plate recognition logs from the backend API based on current filter states.
     * @param {Event} e - The event object (optional, used to prevent default form submission)
     */
    const fetchPlateLogs = async (e) => {
        if (e) e.preventDefault(); // Prevent page reload on form submission

        setIsLoading(true); // Set loading state to true
        setError('');      // Clear any previous error messages
        setMessage('');    // Clear any previous success messages

        // Retrieve authentication token from local storage
        // If your API requires authentication for GET requests, ensure this token is valid.
        // Otherwise, you might remove the 'Authorization' header for development/testing.
        const token = localStorage.getItem('token'); 

        // Construct query parameters from state variables
        const queryParams = new URLSearchParams();
        if (startDate) queryParams.append('startDate', startDate);
        if (endDate) queryParams.append('endDate', endDate);
        if (plateNumber) queryParams.append('plateNumber', plateNumber);
        if (registrationStatus) queryParams.append('registrationStatus', registrationStatus);

        // Construct the full API URL using the base URL and the correct endpoint
        const url = `${API_BASE_URL}/api/plate-recognitions?${queryParams.toString()}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // Conditionally add Authorization header if token exists
                    ...(token && { 'Authorization': `Bearer ${token}` }), 
                },
            });

            const data = await response.json(); // Parse the JSON response
            setIsLoading(false); // Set loading state to false

            // Check if the HTTP response was successful (status code 2xx)
            if (!response.ok) {
                setError(data.message || 'Failed to fetch plate logs.'); // Display error message from API or a default one
                setPlates([]); // Clear displayed plates on error
                return; // Stop further execution
            }

            setPlates(data.data || []); // Update the plates state with fetched data
            setMessage(data.message || 'Successfully fetched plate logs.'); // Display success message

        } catch (err) {
            setIsLoading(false); // Set loading state to false
            setError('An unexpected error occurred while fetching plate logs. Please try again.'); // Generic error message
            console.error('Fetch Plate Logs Error:', err); // Log the actual error to console for debugging
            setPlates([]); // Clear displayed plates on unexpected error
        }
    };

    // Table headers definition, including the new image columns
    const tableHeaders = [
        'Time',
        'Plate Number',
        'Status',
        'Shelly',
        'User Email', // Added User Email column
        'Vehicle Color',
        'Vehicle Make',
        'Vehicle Model',
        'Body Type',
        'Plate Image', // New header for plate crop image
        'Vehicle Image' // New header for vehicle crop image
    ];

    /**
     * Helper function to format ISO date strings into a readable local date/time string.
     * @param {string} isoString - The ISO date string to format.
     * @returns {string} Formatted date/time string or 'N/A' if input is invalid.
     */
    const formatDateTime = (isoString) => {
        if (!isoString) return 'N/A';
        try {
            return new Date(isoString).toLocaleString();
        } catch {
            return 'Invalid Date'; // Handle potential invalid date strings
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4 font-inter">
            <div className="w-full max-w-7xl mx-auto mt-20 p-6 bg-white rounded-lg shadow-xl border border-gray-200">
                <h2 className="text-4xl font-extrabold text-gray-900 mb-8 text-center border-b-2 pb-4 border-gray-300">
                    License Plate Recognition Log
                </h2>

                {/* Filter Section - Styled with Tailwind for modern look */}
                <form onSubmit={fetchPlateLogs} className="bg-blue-50 p-6 rounded-lg shadow-inner mb-8 border border-blue-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        {/* Start Date Filter */}
                        <div>
                            <label htmlFor="startDate" className="block text-blue-800 text-sm font-bold mb-2">Start Date:</label>
                            <input
                                type="date"
                                id="startDate"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="shadow-sm border border-blue-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                            />
                        </div>
                        {/* End Date Filter */}
                        <div>
                            <label htmlFor="endDate" className="block text-blue-800 text-sm font-bold mb-2">End Date:</label>
                            <input
                                type="date"
                                id="endDate"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="shadow-sm border border-blue-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                            />
                        </div>
                        {/* Plate Number Filter */}
                        <div>
                            <label htmlFor="plateNumber" className="block text-blue-800 text-sm font-bold mb-2">Plate Number:</label>
                            <input
                                type="text"
                                id="plateNumber"
                                value={plateNumber}
                                onChange={(e) => setPlateNumber(e.target.value)}
                                placeholder="e.g., SIA5101"
                                className="shadow-sm border border-blue-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                            />
                        </div>
                        {/* Registration Status Filter (Dropdown) */}
                        <div>
                            <label htmlFor="registrationStatus" className="block text-blue-800 text-sm font-bold mb-2">Registration Status:</label>
                            <select
                                id="registrationStatus"
                                value={registrationStatus}
                                onChange={(e) => setRegistrationStatus(e.target.value)}
                                className="shadow-sm border border-blue-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition duration-150 ease-in-out"
                            >
                                <option value="">All</option>
                                <option value="REGISTERED">Registered</option>
                                <option value="UNREGISTERED">Unregistered</option>
                                <option value="NO_PLATE">No Plate Detected</option>
                            </select>
                        </div>
                    </div>
                    {/* Search Button */}
                    <button
                        type="submit"
                        className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-300 ease-in-out w-full transform hover:scale-105"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Searching...' : 'Search Logs'}
                    </button>
                </form>

                {/* Loading, Message, Error Display Area */}
                {isLoading && <p className="text-center text-blue-600 font-semibold text-lg mt-6">Loading data...</p>}
                {error && <p className="text-center text-red-600 font-semibold text-lg mt-6">{error}</p>}
                {message && !error && !isLoading && plates.length === 0 && (
                    <p className="text-center text-gray-600 font-medium text-lg mt-6">No records found for the selected criteria.</p>
                )}

                {/* Data Table Section */}
                {!isLoading && !error && plates.length > 0 && (
                    <div className="overflow-x-auto bg-white rounded-lg shadow-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    {tableHeaders.map((header, index) => (
                                        <th
                                            key={index}
                                            scope="col"
                                            className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-gray-200"
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {plates.map((plate) => (
                                    <tr key={plate.id} className="hover:bg-gray-50 transition duration-100 ease-in-out">
                                        {/* Time Column */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDateTime(plate.startTime)}
                                        </td>
                                        {/* Plate Number Column */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                                            {plate.bestPlateNumber || 'N/A'}
                                        </td>
                                        {/* Registration Status Column */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                plate.registrationStatus === 'REGISTERED' ? 'bg-green-100 text-green-800' :
                                                plate.registrationStatus === 'UNREGISTERED' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {plate.registrationStatus || 'N/A'}
                                            </span>
                                        </td>
                                        {/* Shelly Operated Column */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                plate.shellyOperated ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {plate.shellyOperated ? 'Yes' : 'No'}
                                            </span>
                                        </td>
                                        {/* User Email Column */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {plate.userEmail || 'N/A'}
                                        </td>
                                        {/* Plate Image Column */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {plate.plateCropJpeg && plate.plateCropJpeg !== 'No plate crop image' ? (
                                                <img 
                                                    src={`data:image/jpeg;base64,${plate.plateCropJpeg}`} 
                                                    alt="Plate Crop" 
                                                    className="w-24 h-auto rounded-md shadow-md object-contain border border-gray-200" 
                                                    onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/96x64/cccccc/333333?text=Img+Err"; }} // Fallback on error
                                                />
                                            ) : (
                                                <span className="text-gray-500 text-xs">No image</span>
                                            )}
                                        </td>
                                        {/* Vehicle Image Column */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {plate.vehicleCropJpeg && plate.vehicleCropJpeg !== 'No vehicle crop image' ? (
                                                <img 
                                                    src={`data:image/jpeg;base64,${plate.vehicleCropJpeg}`} 
                                                    alt="Vehicle Crop" 
                                                    className="w-32 h-auto rounded-md shadow-md object-contain border border-gray-200" 
                                                    onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/128x96/cccccc/333333?text=Img+Err"; }} // Fallback on error
                                                />
                                            ) : (
                                                <span className="text-gray-500 text-xs">No image</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlateLogPage;
