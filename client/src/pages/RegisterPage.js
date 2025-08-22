// src/pages/RegisterPage.js
import { useState } from 'react';
import RegisterForm from '../components/RegisterForm';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_URL; // Backend URL from environment variable

const RegisterPage = () => {
    const [message, setMessage] = useState(''); // For success or error messages
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegisterSubmit = async (email, password) => {
        setIsLoading(true);
        setMessage('');
        setIsError(false);

        // --- ⭐ Added Email Domain Validation ⭐ ---
        const allowedDomain = '@seohan.com';
        if (!email.endsWith(allowedDomain)) {
            setMessage(`You must use an email from the '${allowedDomain}' domain to register.`);
            setIsError(true);
            setIsLoading(false);
            return; // Exit function if validation fails
        }
        // --- ⭐ Validation Complete ⭐ ---

        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, { // Your endpoint
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            setIsLoading(false);

            if (!response.ok) {
                // Handle errors (e.g., "Email already in use")
                setMessage(data.message || 'Registration failed. Please try again.');
                setIsError(true);
                return;
            }

            // Registration successful
            console.log('Registration successful:', data);
            setMessage(data.message || 'User registered. Please verify your email.'); // Display backend message
            setIsError(false);
            
            // Redirect to login page after successful registration
            alert('Registration complete. Please verify your email.'); // User notification
            navigate('/login'); 

        } catch (err) {
            setIsLoading(false);
            setMessage('An unexpected error occurred. Please try again.');
            setIsError(true);
            console.error('Registration error:', err);
        }
    };

    return (
        <div>
            <RegisterForm onSubmit={handleRegisterSubmit} />
            {isLoading && <p className="text-center mt-3 text-blue-600">Registering...</p>}
            {message && (
                <p className={`text-center mt-3 ${isError ? 'text-red-600' : 'text-green-600'}`}>
                    {message}
                </p>
            )}
            <div className="text-center mt-4">
                <p className="text-gray-700">
                    Already have an account?{' '}
                    <button
                        onClick={() => navigate('/login')} // Assuming you have a route for login
                        className="font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer focus:outline-none"
                    >
                        Login
                    </button>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;