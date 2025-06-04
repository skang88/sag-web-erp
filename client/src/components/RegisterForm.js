import { useState } from 'react';

const RegisterForm = ({ onSubmit }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Optional: Add a password confirmation field for better UX
  // const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Optional: Add password confirmation check
    // if (password !== confirmPassword) {
    //   alert("Passwords don't match!");
    //   return;
    // }
    onSubmit(email, password);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto p-5 bg-white rounded-lg shadow-lg mt-24">
      <h2 className="text-3xl text-gray-800 mb-5 font-semibold">Register</h2>
      <form onSubmit={handleSubmit} className="w-full">
        <div className="mb-6">
          <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email:</label>
          <input
            type="email" // Use type="email" for better browser validation
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-base font-sans"
          />
        </div>
        <div className="mb-6">
          <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-base font-sans"
          />
        </div>
        {/* Optional: Confirm Password Field
        <div className="mb-6">
          <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-bold mb-2">Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-base font-sans"
          />
        </div>
        */}
        <div className="flex items-center justify-between">
          <button
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline w-full text-lg transition duration-300 ease-in-out"
            type="submit"
          >
            Register
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;