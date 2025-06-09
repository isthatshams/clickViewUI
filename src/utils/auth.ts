interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  professionalTitle: string;
  profilePicture: string | null;
}

export const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('https://localhost:7127/api/User/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: refreshToken
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data: TokenResponse = await response.json();
    
    // Update tokens in localStorage
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('tokenExpiry', (Date.now() + (data.expiresIn * 1000)).toString());

    return true;
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Clear tokens on refresh failure
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiry');
    return false;
  }
};

export const isTokenExpired = (): boolean => {
  const expiryTime = localStorage.getItem('tokenExpiry');
  if (!expiryTime) return true;
  
  // Add 30 seconds buffer to prevent edge cases
  return Date.now() > (parseInt(expiryTime) - 30000);
};

export const getValidToken = async (): Promise<string | null> => {
  const accessToken = localStorage.getItem('accessToken');
  
  if (!accessToken) {
    return null;
  }

  if (isTokenExpired()) {
    const refreshSuccess = await refreshAccessToken();
    if (!refreshSuccess) {
      return null;
    }
    return localStorage.getItem('accessToken');
  }

  return accessToken;
};

// Function to check token status periodically
export const startTokenRefreshCheck = () => {
  const checkInterval = 60000; // Check every minute
  
  setInterval(async () => {
    // Get current path
    const currentPath = window.location.pathname;
    // List of public routes that don't require authentication
    const publicRoutes = ['/', '/about', '/signin', '/signup', '/forgot-password', '/reset-password', '/check-email'];
    
    // Only check token and redirect if we're on a protected route
    if (!publicRoutes.includes(currentPath)) {
      if (isTokenExpired()) {
        const refreshSuccess = await refreshAccessToken();
        if (!refreshSuccess) {
          // Redirect to login if refresh fails
          window.location.href = '/signin';
        }
      }
    }
  }, checkInterval);
};

export const signIn = async (email: string, password: string) => {
  const response = await fetch('https://localhost:7127/api/User/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    let errorMessage;
    let requiresVerification = false;
    
    if (contentType && contentType.includes('application/json')) {
      const error = await response.json();
      errorMessage = error.message || 'Login failed';
      requiresVerification = error.requiresVerification || false;
    } else {
      errorMessage = await response.text();
    }
    
    if (requiresVerification) {
      // Store email for 2FA page
      localStorage.setItem('userEmail', email);
      // Redirect to 2FA page
      window.location.href = '/two-factor-auth';
      return;
    }
    
    throw { status: response.status, message: errorMessage };
  }

  const data = await response.json();
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('tokenExpiry', (Date.now() + (data.expiresIn * 1000)).toString());
};

export const resendVerificationCode = async (email: string) => {
  const response = await fetch('https://localhost:7127/api/User/resend-code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw error;
  }
};

export const getUserDetails = async (): Promise<UserDetails> => {
  try {
    const token = await getValidToken();
    console.log('Token available:', !!token);
    console.log('Token value:', token?.substring(0, 20) + '...'); // Log first 20 chars of token

    if (!token) {
      throw new Error('No valid token available');
    }

    const url = 'https://localhost:7127/api/User/profile';
    console.log('Fetching from URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch user details:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url: url
      });
      throw new Error(`Failed to fetch user details: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Received user data:', data);

    // Ensure we have an ID from the backend
    if (!data.id) {
      throw new Error('User ID not found in profile response');
    }

    return {
      id: data.id,
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      email: data.email || '',
      professionalTitle: data.professionalTitle || 'User',
      profilePicture: data.profilePicture
    };
  } catch (error) {
    console.error('Error in getUserDetails:', error);
    throw error;
  }
};

export const updateProfile = async (profileData: { firstName: string; lastName: string; professionalTitle: string }): Promise<void> => {
  const token = await getValidToken();
  if (!token) {
    throw new Error('No valid token available');
  }

  const response = await fetch('https://localhost:7127/api/User/update-profile', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update profile: ${response.status} ${response.statusText}`);
  }
};

export const uploadProfilePicture = async (file: File): Promise<string> => {
  const token = await getValidToken();
  if (!token) {
    throw new Error('No valid token available');
  }

  const formData = new FormData();
  formData.append('file', file);

  console.log('Uploading profile picture...');
  const response = await fetch('https://localhost:7127/api/User/upload-profile-picture', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Upload failed:', errorText);
    throw new Error(`Failed to upload profile picture: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log('Upload response:', data);
  // Return the relative path, let the component handle the full URL
  return data.profilePictureUrl;
};

export const changePassword = async (oldPassword: string, newPassword: string): Promise<void> => {
  const token = await getValidToken();
  if (!token) {
    throw new Error('No valid token available');
  }

  const response = await fetch('https://localhost:7127/api/User/change-password', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      oldPassword,
      newPassword
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to change password');
  }
};

export const updatePrivacySettings = async (settings: { showProfile: boolean; showActivity: boolean; showProgress: boolean }): Promise<void> => {
  const token = await getValidToken();
  if (!token) {
    throw new Error('No valid token available');
  }

  const response = await fetch('https://localhost:7127/api/User/update-privacy', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update privacy settings');
  }
};

export const deleteAccount = async (): Promise<void> => {
  const token = await getValidToken();
  if (!token) {
    throw new Error('No valid token available');
  }

  const response = await fetch('https://localhost:7127/api/User/delete-account', {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete account');
  }

  // Clear local storage and redirect to home page
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('tokenExpiry');
  window.location.href = '/';
};

export const getPrivacySettings = async (): Promise<{ showProfile: boolean; showActivity: boolean; showProgress: boolean }> => {
  const token = await getValidToken();
  if (!token) {
    throw new Error('No valid token available');
  }

  const response = await fetch('https://localhost:7127/api/User/privacy-settings', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get privacy settings');
  }

  return response.json();
};

export const logout = async () => {
  try {
    const token = await getValidToken();
    if (token) {
      // Call backend logout endpoint
      await fetch('https://localhost:7127/api/User/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear all tokens and user data regardless of backend response
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('tempPassword');
    
    // Redirect to sign in page
    window.location.href = '/signin';
  }
}; 