import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom'; // useSearchParams to get query params

const EmailVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('Verifying your email...');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setMessage('Verification token not found.');
      setIsError(true);
      setIsLoading(false);
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`); // Your endpoint
        const data = await response.json();

        if (!response.ok) {
          setMessage(data.message || 'Email verification failed.');
          setIsError(true);
        } else {
          setMessage(data.message || 'Email verified successfully! You can now log in.');
          setIsError(false);
        }
      } catch (err) {
        setMessage('An error occurred during email verification.');
        setIsError(true);
        console.error('Email verification error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-5">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">Email Verification</h2>
        {isLoading ? (
          <p className="text-blue-600">Verifying...</p>
        ) : (
          <p className={`text-lg ${isError ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </p>
        )}
        {!isLoading && !isError && (
          <Link
            to="/login" // Link to your login page
            className="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 ease-in-out"
          >
            Go to Login
          </Link>
        )}
         {!isLoading && isError && (
          <Link
            to="/register" // Or back to home/register
            className="mt-6 inline-block bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 ease-in-out"
          >
            Try Registering Again
          </Link>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationPage;