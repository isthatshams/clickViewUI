import React, { useState, useCallback } from 'react';
import logoImage from '../assets/Logo Written.png';
import { Link } from 'react-router-dom';

const SettingsContent: React.FC = () => {
  // State for Update Profile form
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
  });
  const [profileErrors, setProfileErrors] = useState({
    firstName: '',
    lastName: '',
  });

  // State for Change Password form
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  // Validation for Profile form fields
  const validateProfileField = useCallback((name: string, value: string) => {
    let error = '';
    if (!value.trim()) {
      error = `${name === 'firstName' ? 'First Name' : 'Last Name'} is required`;
    }
    return error;
  }, []);

  // Validation for Password form fields
  const validatePasswordField = useCallback((name: string, value: string, allValues: typeof passwordData) => {
    let error = '';
    switch (name) {
      case 'oldPassword':
        if (!value.trim()) {
          error = 'Old Password is required';
        }
        break;
      case 'newPassword':
        if (!value.trim()) {
          error = 'New Password is required';
        } else if (value.length < 8) {
          error = 'New Password must be at least 8 characters';
        } else if (!/[A-Z]/.test(value)) {
          error = 'New Password must contain at least one uppercase letter';
        } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
          error = 'New Password must contain at least one special character';
        }
        // Also check if new password matches confirm password if confirmNewPassword is already typed
        if (allValues.confirmNewPassword && value !== allValues.confirmNewPassword) {
          setPasswordErrors(prev => ({ ...prev, confirmNewPassword: 'New passwords do not match' }));
        } else if (allValues.confirmNewPassword && value === allValues.confirmNewPassword) {
          setPasswordErrors(prev => ({ ...prev, confirmNewPassword: '' }));
        }
        break;
      case 'confirmNewPassword':
        if (!value.trim()) {
          error = 'Confirm New Password is required';
        } else if (value !== allValues.newPassword) {
          error = 'New passwords do not match';
        }
        break;
      default:
        break;
    }
    return error;
  }, []);

  // Handle input changes for Profile form
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
    const error = validateProfileField(name, value);
    setProfileErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

   // Handle blur for Profile form
   const handleProfileBlur = (e: React.FocusEvent<HTMLInputElement>) => {
     const { name, value } = e.target;
     const error = validateProfileField(name, value);
     setProfileErrors(prev => ({
       ...prev,
       [name]: error
     }));
   };

  // Handle input changes for Password form
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    const error = validatePasswordField(name, value, { ...passwordData, [name]: value });
     setPasswordErrors(prev => ({ ...prev, [name]: error }));
  };

  // Handle blur for Password form
   const handlePasswordBlur = (e: React.FocusEvent<HTMLInputElement>) => {
     const { name, value } = e.target;
      const error = validatePasswordField(name, value, passwordData);
      setPasswordErrors(prev => ({ ...prev, [name]: error }));
   };

  // Handle Profile form submission
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const firstNameError = validateProfileField('firstName', profileData.firstName);
    const lastNameError = validateProfileField('lastName', profileData.lastName);

    setProfileErrors({
      firstName: firstNameError,
      lastName: lastNameError,
    });

    if (!firstNameError && !lastNameError) {
      console.log('Profile updated:', profileData);
      // TODO: Call API to update profile
    } else {
      console.log('Profile form has errors');
    }
  };

  // Handle Password form submission
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const oldPasswordError = validatePasswordField('oldPassword', passwordData.oldPassword, passwordData);
    const newPasswordError = validatePasswordField('newPassword', passwordData.newPassword, passwordData);
    const confirmNewPasswordError = validatePasswordField('confirmNewPassword', passwordData.confirmNewPassword, passwordData);

     setPasswordErrors({
      oldPassword: oldPasswordError,
      newPassword: newPasswordError,
      confirmNewPassword: confirmNewPasswordError,
    });

     if (!oldPasswordError && !newPasswordError && !confirmNewPasswordError) {
       console.log('Password changed:');
       // TODO: Call API to change password
       setPasswordData({
         oldPassword: '',
         newPassword: '',
         confirmNewPassword: '',
       }); // Clear form on success
     } else {
       console.log('Change password form has errors');
     }
  };

  return (
    <div className="max-w-2xl w-full space-y-8 bg-white p-10 rounded-lg shadow-md mx-auto"> {/* Added mx-auto for centering */}
      <div>
        <div className="flex justify-center items-center mb-6">
          {/* Centered logo */}
          <img
            className="h-16 w-auto"
            src={logoImage}
            alt="ClickView Logo"
          />
        </div>
        <h2 className="mt-4 text-center text-3xl font-bold text-gray-900">Settings</h2>
      </div>

      {/* Update Profile Section */}
      <div className="border-b border-gray-200 pb-8">{/* Removed mb-8 from here to consolidate spacing below */}
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Update Profile</h3>
        <form className="space-y-4" onSubmit={handleProfileSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                value={profileData.firstName}
                onChange={handleProfileChange}
                onBlur={handleProfileBlur}
                className={`appearance-none block w-full px-3 py-2 border ${
                  profileErrors.firstName ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm`}
              />
               {profileErrors.firstName && <p className="mt-1 text-sm text-red-600">{profileErrors.firstName}</p>}
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                 value={profileData.lastName}
                onChange={handleProfileChange}
                onBlur={handleProfileBlur}
                className={`appearance-none block w-full px-3 py-2 border ${
                  profileErrors.lastName ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm`}
              />
               {profileErrors.lastName && <p className="mt-1 text-sm text-red-600">{profileErrors.lastName}</p>}
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Update Profile
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Section */}
      <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Change Password</h3>
           <form className="space-y-4" onSubmit={handlePasswordSubmit}>
              <div>
                <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700 mb-1">Old Password</label>
                <input
                  id="oldPassword"
                  name="oldPassword"
                  type="password"
                  autoComplete="current-password"
                  value={passwordData.oldPassword}
                  onChange={handlePasswordChange}
                  onBlur={handlePasswordBlur}
                   className={`appearance-none block w-full px-3 py-2 border ${
                    passwordErrors.oldPassword ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm`}
                />
                 {passwordErrors.oldPassword && <p className="mt-1 text-sm text-red-600">{passwordErrors.oldPassword}</p>}
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                   value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  onBlur={handlePasswordBlur}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm`}
                />
                 {passwordErrors.newPassword && <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>}
              </div>
              <div>
                <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  id="confirmNewPassword"
                  name="confirmNewPassword"
                  type="password"
                  autoComplete="new-password"
                   value={passwordData.confirmNewPassword}
                  onChange={handlePasswordChange}
                  onBlur={handlePasswordBlur}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    passwordErrors.confirmNewPassword ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm`}
                />
                 {passwordErrors.confirmNewPassword && <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmNewPassword}</p>}
              </div>
              <div>
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Change Password
                </button>
              </div>
           </form>
       </div>
    </div>
  );
};

export default SettingsContent; 