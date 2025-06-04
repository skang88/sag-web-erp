import { useState } from 'react';
import RegisterForm from '../components/RegisterForm'; // Assuming RegisterForm.js is in the same directory
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://172.16.220.32:8001'; // 개발 환경에서 사용할 백엔드 URL

const RegisterPage = () => {
  const [message, setMessage] = useState(''); // For success or error messages
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegisterSubmit = async (email, password) => {
    setIsLoading(true);
    setMessage('');
    setIsError(false);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, { // Your endpoint
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
      // Optionally redirect to login or a page instructing to check email
      // setTimeout(() => navigate('/login'), 3000); // Example redirect after 3 seconds

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