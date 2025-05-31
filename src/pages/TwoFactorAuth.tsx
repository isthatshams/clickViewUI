import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { resendVerificationCode, signIn } from '../utils/auth';
import visualLogoImage from '../assets/Logo Visualed.png';
import logoImage from '../assets/Logo Written.png';

const TwoFactorAuth: React.FC = () => {
  const [code, setCode] = useState<string[]>(Array(5).fill(''));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    if (!storedEmail) {
      navigate('/signin');
    } else {
      setEmail(storedEmail);
    }
  }, [navigate]);

  useEffect(() => {
    let timer: number;
    if (countdown > 0) {
      timer = window.setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else {
      setResendDisabled(false);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Move to next input if value is entered
    if (value && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Move to previous input on backspace if current input is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 5);
    const newCode = [...code];
    
    pastedData.split('').forEach((char, index) => {
      if (index < 5) {
        newCode[index] = char;
      }
    });
    
    setCode(newCode);
    // Focus the next empty input or the last input
    const nextEmptyIndex = newCode.findIndex(char => !char);
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else {
      inputRefs.current[4]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const verificationCode = code.join('');
    if (verificationCode.length !== 5) {
      setError('Please enter the complete verification code');
      return;
    }

    try {
      const response = await fetch('https://localhost:7127/api/user/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code: verificationCode
        }),
      });

      if (response.ok) {
        // After successful verification, sign in the user
        try {
          const password = localStorage.getItem('tempPassword');
          if (!password) {
            navigate('/signin');
            return;
          }
          await signIn(email, password);
          localStorage.removeItem('tempPassword');
          localStorage.removeItem('userEmail');
          navigate('/dashboard');
        } catch (signInError: any) {
          setError(signInError.message || 'Failed to sign in after verification');
        }
      } else {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message;
        } catch {
          errorMessage = errorText || 'Invalid verification code';
        }
        setError(errorMessage);
      }
    } catch (err) {
      setError('Failed to verify code. Please try again.');
    }
  };

  const handleResendCode = async () => {
    if (resendDisabled) return;
    
    setIsResending(true);
    setError('');
    setSuccess('');
    
    try {
      await resendVerificationCode(email);
      setResendDisabled(true);
      setCountdown(60);
      setSuccess('Verification code has been resent to your email');
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
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

          <h2 className="text-2xl font-semibold text-gray-800">Two-Factor Authentication</h2>
          <p className="text-gray-600 text-sm mt-2">Enter the 5-digit code sent to your email</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          {success && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="text-sm text-green-700">{success}</div>
            </div>
          )}

          <div 
            className="flex justify-center space-x-3 mb-6"
            onPaste={handlePaste}
          >
            {[...Array(5)].map((_, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                maxLength={1}
                value={code[index]}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-3xl text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            ))}
          </div>

          <div>
            <button
              type="submit"
              className="w-full px-4 py-3 text-base font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
            >
              Verify
            </button>
          </div>

          <div className="text-center">
            <span className="text-sm text-gray-600">
              Didn't receive a code?{' '}
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendDisabled || isResending}
                className="text-sm font-medium text-purple-600 hover:text-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? 'Sending...' : 
                 resendDisabled ? `Resend code in ${countdown}s` : 
                 'Resend'}
              </button>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TwoFactorAuth; 