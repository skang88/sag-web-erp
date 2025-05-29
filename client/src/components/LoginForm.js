import { useState } from 'react';

const LoginForm = ({ onSubmit }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto p-5 bg-white rounded-lg shadow-lg mt-24"> {/* login-container */}
      <h2 className="text-3xl text-gray-800 mb-5 font-semibold">Login</h2> {/* login-title */}
      <form onSubmit={handleSubmit} className="w-full">
        <div className="mb-6">
          <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email:</label>
          <input
            type="text"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-base **font-sans**" // input
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
            className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-base **font-sans**" // input
          />
        </div>
        <div className="flex items-center justify-between"> {/* button-container */}
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline w-full text-lg transition duration-300 ease-in-out" // login-button
            type="submit"
          >
            Login
          </button>
        </div>
      </form>
      <div className="text-center mt-3"> {/* forgot-password */}
        <button
          className="inline-block align-baseline font-bold text-blue-600 hover:text-blue-800 text-base underline cursor-pointer focus:outline-none" // forgot-password-button
          onClick={() => console.log('Did you forget the password? Click')}
        >
          Did you forget the password?
        </button>
      </div>
    </div>
  );
};

export default LoginForm;