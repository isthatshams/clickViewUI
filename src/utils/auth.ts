const API_URL = 'https://localhost:7127';

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
}

export const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('https://localhost:7127/api/user/refresh-token', {
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
  const response = await fetch('https://localhost:7127/api/user/login', {
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
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`${API_URL}/api/user/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user details');
  }

  const data = await response.json();
  return {
    firstName: data.firstName,
    lastName: data.lastName,
    professionalTitle: data.professionalTitle || 'User',
    email: data.email
  };
};

export const updateProfile = async (data: { firstName: string; lastName: string; professionalTitle?: string }) => {
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
    body: JSON.stringify(data),
  });

  const responseText = await response.text();
  
  if (!response.ok) {
    throw new Error(responseText || 'Failed to update profile');
  }

  try {
    return JSON.parse(responseText);
  } catch {
    // If response is not JSON, return the text as a message
    return { message: responseText };
  }
};

export const changePassword = async (data: { oldPassword: string; newPassword: string }) => {
  const token = await getValidToken();
  if (!token) {
    throw new Error('No valid token available');
  }

  const response = await fetch('https://localhost:7127/api/user/change-password', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw error;
  }

  return response.json();
}; 