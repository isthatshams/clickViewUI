import React, { useState, useRef } from 'react';
import visualLogoImage from '../assets/Logo Visualed.png';
import logoImage from '../assets/Logo Written.png';
import { Link, useNavigate } from 'react-router-dom';

const CheckEmail: React.FC = () => {
  const [codes, setCodes] = useState<string[]>(Array(5).fill(''));
  const [isVerified, setIsVerified] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(5).fill(null));
  const navigate = useNavigate();

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newCodes = [...codes];
    newCodes[index] = e.target.value;
    setCodes(newCodes);

    // Move to the next input if a character is typed and it's not the last input
    if (e.target.value && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = codes.join('');
    console.log('Entered Code:', fullCode);
    // TODO: Implement actual code verification logic here.
    // For now, simulate success:
    setIsVerified(true);

    // Redirect to sign-in page after a short delay
    setTimeout(() => {
      navigate('/signin');
    }, 3000); // Redirect after 3 seconds

  };

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
        </div>

        {isVerified ? (
          
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">Password Reset Successful!</h2>
            <p className="text-gray-600 text-sm">You will be redirected to the sign-in page shortly.</p>
          </div>
        ) : (
          
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800">Verification Code</h2>
            <p className="text-gray-600 text-sm mt-2">Enter the verification code we sent to your email to reset your password</p>

            {/* Code Input Fields */}
            <div className="flex justify-center space-x-3 mb-6">
              {[...Array(5)].map((_, index) => (
                <input
                  key={index}
                  ref={(el: HTMLInputElement | null) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  maxLength={1}
                  value={codes[index]}
                  onChange={(e) => handleChange(index, e)}
                  className="w-12 h-12 text-3xl text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                />
              ))}
            </div>

            {/* Resend Link */}
            <p className="text-sm text-gray-600 mb-6">
              Didn't receive a code? <button className="text-purple-600 hover:underline focus:outline-none">resend</button>
            </p>

            {/* Verify Code Button */}
            <button
              className="w-full px-4 py-3 text-base font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
              onClick={handleSubmit}
            >
              Verify Code
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default CheckEmail; 