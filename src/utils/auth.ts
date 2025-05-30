interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface UserDetails {
  firstName: string;
  lastName: string;
  professionalTitle: string;
  email: string;
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
    if (isTokenExpired()) {
      const refreshSuccess = await refreshAccessToken();
      if (!refreshSuccess) {
        // Redirect to login if refresh fails
        window.location.href = '/signin';
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

  if (response.status === 401) {
    throw { status: 401, message: 'Two-factor authentication required' };
  }

  if (!response.ok) {
    const error = await response.json();
    throw error;
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

    // Return the relative path, let the component handle the full URL
    return {
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      professionalTitle: data.professionalTitle || 'User',
      email: data.email || '',
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