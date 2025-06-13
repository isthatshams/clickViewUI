import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import logoImage from '../assets/Logo Written.png';
import visualLogoImage from '../assets/Logo Visualed.png';
import googleIcon from '../assets/google.svg';
import { signIn } from '../utils/auth';

const SignIn: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({
    email: '',
    password: '',
    submit: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateField = useCallback((name: string, value: string) => {
    let error = '';
    switch (name) {
      case 'email':
        if (!value.trim()) {
          error = 'Email is required';
        } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(value)) {
          error = 'Invalid email address';
        }
        break;
      case 'password':
        if (!value.trim()) {
          error = 'Password is required';
        }
        break;
      default:
        break;
    }
    return error;
  }, []);

  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};
    let isValid = true;

    Object.keys(formData).forEach(key => {
      const name = key as keyof typeof formData;
      const error = validateField(name, formData[name]);
      newErrors[name] = error;
      if (error) {
        isValid = false;
      }
    });

    setErrors(newErrors as typeof errors);
    return isValid;
  }, [formData, validateField]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(prev => ({ ...prev, submit: '' }));
    setIsLoading(true);
    
    try {
      const response = await fetch('https://localhost:7127/api/User/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage;
        
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          errorMessage = error.message;
        } else {
          errorMessage = await response.text();
        }

        if (response.status === 403) {
          // Store email for 2FA page
          localStorage.setItem('userEmail', formData.email);
          // Store password temporarily for auto sign-in after verification
          localStorage.setItem('tempPassword', formData.password);
          navigate('/two-factor-auth');
          return;
        }
        
        throw new Error(errorMessage || 'Failed to sign in');
      }

      const data = await response.json();
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('tokenExpiry', (Date.now() + (data.expiresIn * 1000)).toString());
      navigate('/dashboard');
    } catch (err: any) {
      setErrors(prev => ({
        ...prev,
        submit: err.message || 'Failed to sign in'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const response = await fetch('https://localhost:7127/api/user/google-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: credentialResponse.credential
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Google authentication failed');
      }

      // Store the tokens
      localStorage.setItem('accessToken', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('tokenExpiry', (Date.now() + (data.expiresIn * 1000)).toString());
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Google authentication error:', error);
      setErrors(prev => ({
        ...prev,
        submit: error instanceof Error ? error.message : 'Google authentication failed. Please try again.'
      }));
    }
  };

  const handleGoogleError = () => {
    setErrors(prev => ({
      ...prev,
      submit: 'Google authentication failed. Please try again.'
    }));
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

      <div className="max-w-md w-full space-y-6 bg-white p-10 rounded-lg shadow-md">
        <div>
          <div className="flex justify-center items-center mb-6">
            {/* Centered logo */}
            <img
              className="h-16 w-auto"
              src={logoImage}
              alt="ClickView Logo"
            />
          </div>
          <h3 className="mt-4 text-center text-2xl font-bold text-gray-900">
            Sign In
          </h3>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {errors.submit && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{errors.submit}</div>
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={`appearance-none relative block w-full px-3 py-2 border ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm`}
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isLoading}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className={`appearance-none relative block w-full px-3 py-2 border ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm`}
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isLoading}
            />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </div>

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm font-medium text-purple-600 hover:text-purple-500">
              Forgot your password?
            </Link>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="flex items-center justify-between">
          <div className="border-t border-gray-300 w-5/12"></div>
          <div className="text-gray-500 text-sm">or</div>
          <div className="border-t border-gray-300 w-5/12"></div>
        </div>

        <div className="w-full">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
            theme="outline"
            text="continue_with"
            shape="rectangular"
            type="standard"
            logo_alignment="left"
            locale="en"
          />
        </div>

        <div className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-purple-600 hover:text-purple-500">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignIn; 