import React, { useState, useRef, useEffect } from 'react';
import { 
  UserCircleIcon,
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon,
  SunIcon,
  MoonIcon,
  GlobeAltIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  TrashIcon,
  PhotoIcon,
} from '@heroicons/react/24/solid';
import { getUserDetails, updateProfile, uploadProfilePicture, changePassword, updatePrivacySettings, deleteAccount, getPrivacySettings } from '../utils/auth';
import { useTheme } from '../context/ThemeContext';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  profilePicture: string | null;
  professionalTitle: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PreferencesData {
  theme: 'light' | 'dark';
  language: 'English' | 'Arabic';
}

interface PrivacyData {
  showProfile: boolean;
  showActivity: boolean;
  showProgress: boolean;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  professionalTitle?: string;
}

const Settings: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme } = useTheme();
  
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    profilePicture: null,
    professionalTitle: '',
  });

  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [preferencesData, setPreferencesData] = useState<PreferencesData>(() => {
    // Get language from localStorage or default to 'English'
    const savedLanguage = localStorage.getItem('language') as 'English' | 'Arabic' || 'English';
    
    return {
      theme: theme, // Use theme from context
      language: savedLanguage,
    };
  });

  const [privacyData, setPrivacyData] = useState<PrivacyData>({
    showProfile: true,
    showActivity: true,
    showProgress: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Update preferencesData when theme changes
  useEffect(() => {
    setPreferencesData(prev => ({
      ...prev,
      theme: theme
    }));
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('language', preferencesData.language);
    // TODO: Implement actual language change logic if needed
  }, [preferencesData.language]);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setIsLoading(true);
        setError('');
        const details = await getUserDetails();
        setProfileData(prev => ({
          ...prev,
          firstName: details.firstName,
          lastName: details.lastName,
          professionalTitle: details.professionalTitle,
          email: details.email,
          profilePicture: details.profilePicture ? `https://localhost:7127${details.profilePicture}` : null
        }));

        // Fetch privacy settings
        const privacySettings = await getPrivacySettings();
        setPrivacyData(privacySettings);
      } catch (err) {
        console.error('Error in Sidebar:', err);
        setError(err instanceof Error ? err.message : 'Failed to load user details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDetails();
  }, []);

  const validateProfile = (): boolean => {
    const newErrors: FormErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!profileData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!profileData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!profileData.professionalTitle.trim()) {
      newErrors.professionalTitle = 'Professional title is required';
    }

    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = (): boolean => {
    const newErrors: FormErrors = {};
    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (!currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(newPassword)) {
      newErrors.newPassword = 'Password must contain at least one uppercase letter';
    } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      newErrors.newPassword = 'Password must contain at least one special character';
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Live validation
    const newErrors: FormErrors = {};
    if (name === 'firstName' && !value.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (name === 'lastName' && !value.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (name === 'professionalTitle' && !value.trim()) {
        newErrors.professionalTitle = 'Professional title is required';
    } else {
        // Clear error if valid
         setErrors(prev => ({ ...prev, [name]: undefined }));
    }

    if (Object.keys(newErrors).length > 0) {
         setErrors(prev => ({ ...prev, ...newErrors }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Live validation
    const newErrors: FormErrors = {};
    const currentPassword = name === 'currentPassword' ? value : passwordData.currentPassword;
    const newPassword = name === 'newPassword' ? value : passwordData.newPassword;
    const confirmPassword = name === 'confirmPassword' ? value : passwordData.confirmPassword;

    if (name === 'currentPassword' && !value) {
        newErrors.currentPassword = 'Current password is required';
    } else if (name === 'newPassword') {
        if (!value) {
             newErrors.newPassword = 'New password is required';
        } else if (value.length < 8) {
             newErrors.newPassword = 'Password must be at least 8 characters';
        } else if (!/[A-Z]/.test(value)) {
             newErrors.newPassword = 'Password must contain at least one uppercase letter';
        } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
             newErrors.newPassword = 'Password must contain at least one special character';
        } else if (value !== confirmPassword && confirmPassword !== '') {
             newErrors.confirmPassword = 'Passwords do not match';
        } else {
             setErrors(prev => ({ ...prev, newPassword: undefined }));
             if (value === confirmPassword) {
                 setErrors(prev => ({ ...prev, confirmPassword: undefined }));
             }
        }
    } else if (name === 'confirmPassword') {
         if (newPassword !== value) {
             newErrors.confirmPassword = 'Passwords do not match';
         } else {
             setErrors(prev => ({ ...prev, confirmPassword: undefined }));
         }
    } else {
        // Clear error if valid
        setErrors(prev => ({ ...prev, [name]: undefined }));
    }

     if (Object.keys(newErrors).length > 0) {
         setErrors(prev => ({ ...prev, ...newErrors }));
     }
  };

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      console.log('Starting profile picture upload...');
      // Show loading state
      const previewUrl = URL.createObjectURL(file);
      console.log('Preview URL:', previewUrl);
      
      setProfileData(prev => ({
        ...prev,
        profilePicture: previewUrl // Show preview immediately
      }));

      // Upload the file
      console.log('Uploading file to server...');
      const profilePictureUrl = await uploadProfilePicture(file);
      console.log('Received profile picture URL:', profilePictureUrl);
      
      // Update profile data with the new URL
      setProfileData(prev => {
        const fullUrl = `https://localhost:7127${profilePictureUrl}`;
        console.log('Updating profile data with new URL:', fullUrl);
        return {
          ...prev,
          profilePicture: fullUrl
        };
      });

      setSuccessMessage('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to upload profile picture');
      
      // Revert to previous picture on error
      setProfileData(prev => ({
        ...prev,
        profilePicture: prev.profilePicture
      }));
    }
  };

  const handlePreferencesChange = (name: keyof PreferencesData, value: PreferencesData[keyof PreferencesData]) => {
    setPreferencesData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePrivacyChange = (name: keyof PrivacyData) => {
    setPrivacyData(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!validateProfile()) {
      return;
    }

    try {
      await updateProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        professionalTitle: profileData.professionalTitle
      });
      setSuccessMessage('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update profile. Please try again.');
    }
  };

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(''); // Clear previous messages
    setErrorMessage(''); // Clear previous messages
    try {
      // TODO: Implement API call to update preferences
      // After successful API call (or for now, immediately):
      // The useEffect for theme will handle applying to <html> and saving because preferencesData.theme is updated by handlePreferencesChange.

      setSuccessMessage('Preferences updated successfully!');
    } catch (error) {
      setErrorMessage('Failed to update preferences. Please try again.');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!validatePassword()) {
      return;
    }

    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setSuccessMessage('Password updated successfully!');
      // Clear password fields after successful update
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update password. Please try again.');
    }
  };

  const handlePrivacySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await updatePrivacySettings(privacyData);
      setSuccessMessage('Privacy settings updated successfully!');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update privacy settings. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!isDeleting) {
      setIsDeleting(true);
      return;
    }

    try {
      await deleteAccount();
      // The deleteAccount function will handle the redirect
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 p-6 px-6 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-8 light:text-gray-800">Settings</h1>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center dark:bg-green-900 dark:border-green-700 dark:text-green-200 light:bg-green-50 light:border-green-200 light:text-green-700">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 dark:text-green-300 light:text-green-500" />
            <p className="text-green-700 dark:text-green-200 light:text-green-700">{successMessage}</p>
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center dark:bg-red-900 dark:border-red-700 dark:text-red-200 light:bg-red-50 light:border-red-200 light:text-red-700">
            <XCircleIcon className="h-5 w-5 text-red-500 mr-2 dark:text-red-300 light:text-red-500" />
            <p className="text-red-700 dark:text-red-200 light:text-red-700">{errorMessage}</p>
          </div>
        )}

        {/* Profile Information Form */}
        <form onSubmit={handleProfileSubmit} className="mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800 light:bg-white">
            <div className="flex items-center mb-6">
              <UserCircleIcon className="h-6 w-6 text-purple-600 mr-2 dark:text-purple-400 light:text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white light:text-gray-800">Profile Information</h2>
            </div>
            
            {/* Profile Picture Upload */}
            <div className="mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {profileData.profilePicture ? (
                    <img
                      src={profileData.profilePicture}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center dark:bg-gray-700">
                      <UserCircleIcon className="h-12 w-12 text-gray-300 dark:text-gray-500" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors dark:bg-purple-700 dark:hover:bg-purple-600 dark:focus:ring-purple-600 dark:focus:ring-offset-gray-800 light:bg-purple-600 light:hover:bg-purple-700 light:focus:ring-purple-500 light:focus:ring-offset-white"
                  >
                    <PhotoIcon className="h-4 w-4" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleProfilePictureChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 light:text-gray-700">Profile Picture</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 light:text-gray-500">Upload a new profile picture</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 light:text-gray-700">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={profileData.firstName}
                  onChange={handleProfileChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-purple-600 dark:focus:border-purple-600 light:bg-white light:border-gray-300 light:text-gray-900 light:focus:ring-purple-500 light:focus:border-purple-500 ${errors.firstName ? 'border-red-500 dark:border-red-400 light:border-red-500' : ''}`}
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 light:text-red-600">{errors.firstName}</p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 light:text-gray-700">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={profileData.lastName}
                  onChange={handleProfileChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-purple-600 dark:focus:border-purple-600 light:bg-white light:border-gray-300 light:text-gray-900 light:focus:ring-purple-500 light:focus:border-purple-500 ${errors.lastName ? 'border-red-500 dark:border-red-400 light:border-red-500' : ''}`}
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 light:text-red-600">{errors.lastName}</p>
                )}
              </div>
              <div>
                <label htmlFor="professionalTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 light:text-gray-700">
                  Professional Title
                </label>
                <input
                  type="text"
                  id="professionalTitle"
                  name="professionalTitle"
                  value={profileData.professionalTitle}
                  onChange={handleProfileChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-purple-600 dark:focus:border-purple-600 light:bg-white light:border-gray-300 light:text-gray-900 light:focus:ring-purple-500 light:focus:border-purple-500 ${errors.professionalTitle ? 'border-red-500 dark:border-red-400 light:border-red-500' : ''}`}
                />
                {errors.professionalTitle && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 light:text-red-600">{errors.professionalTitle}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 light:text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 ${errors.email ? 'border-red-500 dark:border-red-400' : ''} ${'bg-gray-50 cursor-not-allowed text-gray-400 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600'}`}
                  readOnly
                />
                {/* Email is read-only, no validation message needed unless we add a change email flow later */}
                {/* {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                )} */}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors dark:bg-purple-700 dark:hover:bg-purple-600 dark:focus:ring-purple-600 dark:focus:ring-offset-gray-800 light:bg-purple-600 light:hover:bg-purple-700 light:focus:ring-purple-500 light:focus:ring-offset-white"
              >
                Update Profile
              </button>
            </div>
          </div>
        </form>

        {/* Preferences Form */}
        <form onSubmit={handlePreferencesSubmit} className="mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800 light:bg-white">
            <div className="flex items-center mb-6">
              <GlobeAltIcon className="h-6 w-6 text-purple-600 mr-2 dark:text-purple-400 light:text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white light:text-gray-800">Preferences</h2>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 light:text-gray-700">
                  Theme
                </label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => theme !== 'light' && toggleTheme()}
                    className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${theme === 'light' ? 'bg-purple-50 border-purple-500 text-purple-700 dark:bg-purple-900 dark:border-purple-700 dark:text-purple-300' : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                  >
                    <SunIcon className="h-5 w-5 mr-2 text-gray-700 dark:text-purple-300 light:text-gray-700" />
                    Light
                  </button>
                  <button
                    type="button"
                    onClick={() => theme !== 'dark' && toggleTheme()}
                    className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${theme === 'dark' ? 'bg-purple-50 border-purple-500 text-purple-700 dark:bg-purple-900 dark:border-purple-700 dark:text-purple-300' : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                  >
                    <MoonIcon className="h-5 w-5 mr-2 text-gray-700 dark:text-purple-300 light:text-gray-700" />
                    Dark
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 light:text-gray-700">
                  Language
                </label>
                <select
                  id="language"
                  value={preferencesData.language}
                  onChange={(e) => handlePreferencesChange('language', e.target.value as 'English' | 'Arabic')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-purple-600 dark:focus:border-purple-600 light:bg-white light:border-gray-300 light:text-gray-900 light:focus:ring-purple-500 light:focus:border-purple-500"
                >
                  <option value="English">English</option>
                  <option value="Arabic">Arabic</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors dark:bg-purple-700 dark:hover:bg-purple-600 dark:focus:ring-purple-600 dark:focus:ring-offset-gray-800 light:bg-purple-600 light:hover:bg-purple-700 light:focus:ring-purple-500 light:focus:ring-offset-white"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </form>

        {/* Change Password Form */}
        <form onSubmit={handlePasswordSubmit} className="mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800 light:bg-white">
            <div className="flex items-center mb-6">
              <KeyIcon className="h-6 w-6 text-purple-600 mr-2 dark:text-purple-400 light:text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white light:text-gray-800">Change Password</h2>
            </div>
            <div className="space-y-6">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 light:text-gray-700">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-purple-600 dark:focus:border-purple-600 light:bg-white light:border-gray-300 light:text-gray-900 light:focus:ring-purple-500 light:focus:border-purple-500 ${errors.currentPassword ? 'border-red-500 dark:border-red-400 light:border-red-500' : ''}`}
                />
                {errors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 light:text-red-600">{errors.currentPassword}</p>
                )}
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 light:text-gray-700">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-purple-600 dark:focus:border-purple-600 light:bg-white light:border-gray-300 light:text-gray-900 light:focus:ring-purple-500 light:focus:border-purple-500 ${errors.newPassword ? 'border-red-500 dark:border-red-400 light:border-red-500' : ''}`}
                />
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 light:text-red-600">{errors.newPassword}</p>
                )}
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 light:text-gray-700">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-purple-600 dark:focus:border-purple-600 light:bg-white light:border-gray-300 light:text-gray-900 light:focus:ring-purple-500 light:focus:border-purple-500 ${errors.confirmPassword ? 'border-red-500 dark:border-red-400 light:border-red-500' : ''}`}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 light:text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors dark:bg-purple-700 dark:hover:bg-purple-600 dark:focus:ring-purple-600 dark:focus:ring-offset-gray-800 light:bg-purple-600 light:hover:bg-purple-700 light:focus:ring-purple-500 light:focus:ring-offset-white"
              >
                Update Password
              </button>
            </div>
          </div>
        </form>

        {/* Privacy Settings Form */}
        <form onSubmit={handlePrivacySubmit} className="mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800 light:bg-white">
            <div className="flex items-center mb-6">
              <ShieldCheckIcon className="h-6 w-6 text-purple-600 mr-2 dark:text-purple-400 light:text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white light:text-gray-800">Privacy Settings</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 light:text-gray-700">Show Profile</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 light:text-gray-500">Allow others to view your profile</p>
                </div>
                <button
                  type="button"
                  onClick={() => handlePrivacyChange('showProfile')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${privacyData.showProfile ? 'bg-purple-600 dark:bg-purple-700 focus:ring-purple-500 dark:focus:ring-purple-600 focus:ring-offset-white dark:focus:ring-offset-gray-800' : 'bg-gray-100 dark:bg-gray-700 focus:ring-gray-500 dark:focus:ring-gray-600 focus:ring-offset-white dark:focus:ring-offset-gray-800'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${privacyData.showProfile ? 'translate-x-6' : 'translate-x-1'} dark:bg-gray-300`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 light:text-gray-700">Show Activity</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 light:text-gray-500">Display your recent activity</p>
                </div>
                <button
                  type="button"
                  onClick={() => handlePrivacyChange('showActivity')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${privacyData.showActivity ? 'bg-purple-600 dark:bg-purple-700 focus:ring-purple-500 dark:focus:ring-purple-600 focus:ring-offset-white dark:focus:ring-offset-gray-800' : 'bg-gray-100 dark:bg-gray-700 focus:ring-gray-500 dark:focus:ring-gray-600 focus:ring-offset-white dark:focus:ring-offset-gray-800'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${privacyData.showActivity ? 'translate-x-6' : 'translate-x-1'} dark:bg-gray-300`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 light:text-gray-700">Show Progress</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 light:text-gray-500">Display your learning progress</p>
                </div>
                <button
                  type="button"
                  onClick={() => handlePrivacyChange('showProgress')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${privacyData.showProgress ? 'bg-purple-600 dark:bg-purple-700 focus:ring-purple-500 dark:focus:ring-purple-600 focus:ring-offset-white dark:focus:ring-offset-gray-800' : 'bg-gray-100 dark:bg-gray-700 focus:ring-gray-500 dark:focus:ring-gray-600 focus:ring-offset-white dark:focus:ring-offset-gray-800'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${privacyData.showProgress ? 'translate-x-6' : 'translate-x-1'} dark:bg-gray-300`}
                  />
                </button>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors dark:bg-purple-700 dark:hover:bg-purple-600 dark:focus:ring-purple-600 dark:focus:ring-offset-gray-800 light:bg-purple-600 light:hover:bg-purple-700 light:focus:ring-purple-500 light:focus:ring-offset-white"
              >
                Save Privacy Settings
              </button>
            </div>
          </div>
        </form>

        {/* Account Deletion */}
        <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800 light:bg-white">
          <div className="flex items-center mb-6">
            <TrashIcon className="h-6 w-6 text-red-600 mr-2 dark:text-red-400 light:text-red-600" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white light:text-gray-800">Delete Account</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 light:text-gray-600">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleDeleteAccount}
              className={`px-6 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${isDeleting ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-700 dark:hover:bg-red-600 dark:focus:ring-red-600 dark:focus:ring-offset-gray-800' : 'bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-500 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 dark:focus:ring-red-600 dark:focus:ring-offset-gray-800'}`}
            >
              {isDeleting ? 'Click again to confirm' : 'Delete Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 