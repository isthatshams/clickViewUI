import React from 'react';
import visualLogoImage from '../assets/Logo Visualed.png'; // Assuming the visual logo is needed here as well
import logoImage from '../assets/Logo Written.png'; // Import the text logo
import { Link } from 'react-router-dom'; // Import Link for the top-left logo

const TwoFactorAuth: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Top-left logo */}
      <div className="absolute top-6 left-6">
        <Link to="/">
          <img
            className="h-10 w-auto"
            src={visualLogoImage}
            alt="ClickView Visual Logo"
          />
        </Link>
      </div>

      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-md text-center">

        {/* Centered Logo */}
        <div className="flex flex-col items-center mb-6">
           <div className="flex items-center justify-center mb-4">
             <img
                className="h-16 w-auto"
                src={logoImage}
                alt="ClickView Logo"
              />
           </div>

          <h2 className="text-2xl font-semibold text-gray-800">Authentication Code</h2>
          <p className="text-gray-600 text-sm mt-2">Enter the authentication code we sent to your email</p>
        </div>

        {/* Code Input Fields */}
        <div className="flex justify-center space-x-3 mb-6">
          {[...Array(5)].map((_, index) => (
            <input
              key={index}
              type="text"
              maxLength={1}
              className="w-12 h-12 text-3xl text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          ))}
        </div>

        {/* Resend Link */}
        <p className="text-sm text-gray-600 mb-6">
          Didn't receive a code? <button className="text-purple-600 hover:underline focus:outline-none">resend</button>
        </p>

        {/* Authenticate Button */}
        <button
          className="w-full px-4 py-3 text-base font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
        >
          Authenticate
        </button>

      </div>
    </div>
  );
};

export default TwoFactorAuth; 