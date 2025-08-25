import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const VisitorRegistrationPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [plateNumber, setPlateNumber] = useState('');
    const [purpose, setPurpose] = useState('Delivery');
    const [duration, setDuration] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const plate = searchParams.get('plate');
        if (plate) {
            setPlateNumber(plate);
        } else {
            setError('License plate number not found in URL.');
        }
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch(`${API_BASE_URL}/visitor/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    licensePlate: plateNumber,
                    purpose,
                    durationInDays: duration,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to submit registration.');
            }

            setMessage('Registration successful! The gate will open shortly.');
            setTimeout(() => navigate('/'), 5000);

        } catch (err) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const purposeOptions = ['Delivery', 'Meeting', 'Interview', 'Maintenance', 'Other'];
    const durationOptions = [
        { label: '1 Day', value: 1 },
        { label: '1 Week', value: 7 },
        { label: '1 Month', value: 30 },
    ];

    if (error && !plateNumber) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
                    <h1 className="text-2xl font-bold text-red-600">Error</h1>
                    <p className="mt-4 text-gray-700">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Visitor Registration</h1>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="plateNumber" className="block text-gray-700 font-bold mb-2">License Plate</label>
                        <input
                            type="text"
                            id="plateNumber"
                            value={plateNumber}
                            readOnly
                            className="w-full px-3 py-2 border rounded-lg bg-gray-200 text-gray-500"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="purpose" className="block text-gray-700 font-bold mb-2">Purpose of Visit</label>
                        <select
                            id="purpose"
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            {purposeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}                        </select>
                    </div>
                    <div className="mb-6">
                        <label htmlFor="duration" className="block text-gray-700 font-bold mb-2">Duration of Stay</label>
                        <select
                            id="duration"
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            {durationOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading || !plateNumber}
                        className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                    >
                        {isLoading ? 'Submitting...' : 'Submit and Open Gate'}
                    </button>
                </form>
                {message && <p className="mt-4 text-center text-green-600 font-semibold">{message}</p>}
                {error && <p className="mt-4 text-center text-red-600 font-semibold">{error}</p>}
            </div>
        </div>
    );
};

export default VisitorRegistrationPage;
