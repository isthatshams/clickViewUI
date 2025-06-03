import { getValidToken } from './auth';

export interface Resume {
  id: string;
  title: string;
  lastModified: string;
  template: string;
  isDefault: boolean;
  fileUrl?: string;
}

const handleResponse = async (response: Response) => {
  console.log('Response status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));
  
  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const errorData = await response.json();
      console.log('Error response:', errorData);
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (error) {
      console.log('Error parsing error response:', error);
      // If response is not JSON, try to get text
      try {
        const text = await response.text();
        console.log('Error response text:', text);
        // Try to extract meaningful error message from text
        if (text.includes("System.Inv")) {
          errorMessage = "An internal server error occurred. Please try again later.";
        } else {
          errorMessage = text || response.statusText || errorMessage;
        }
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
    }
    throw new Error(errorMessage);
  }

  // Check if response has content
  const contentType = response.headers.get('content-type');
  console.log('Content-Type:', contentType);
  
  if (contentType && contentType.includes('application/json')) {
    try {
      const data = await response.json();
      console.log('Response data:', data);
      return data;
    } catch (error) {
      console.log('Error parsing JSON response:', error);
      throw new Error('Invalid JSON response from server');
    }
  }
  
  return null;
};

export const getResumes = async (): Promise<Resume[]> => {
  try {
    const token = await getValidToken();
    if (!token) {
      throw new Error('No valid token available');
    }

    // Get user ID from token or local storage
    const userId = localStorage.getItem('userId');
    if (!userId) {
      throw new Error('User ID not found');
    }

    // Parse userId as number
    const numericUserId = parseInt(userId, 10);
    if (isNaN(numericUserId)) {
      throw new Error('Invalid user ID format');
    }

    console.log('Fetching resumes for user:', numericUserId);
    
    const response = await fetch(`https://localhost:7127/api/CV/${numericUserId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await handleResponse(response);
    return data.map((cv: any) => ({
      id: cv.cvId.toString(),
      title: cv.fileName,
      lastModified: cv.uploadedAt,
      template: 'Modern', // Default template
      isDefault: false, // Default status not supported in backend yet
      fileUrl: `/api/CV/${cv.cvId}/enhancement/pdf` // URL to download enhanced PDF
    }));
  } catch (error) {
    console.error('Error in getResumes:', error);
    throw error;
  }
};

export const uploadResume = async (file: File, title: string, template: string): Promise<Resume> => {
  try {
    const token = await getValidToken();
    if (!token) {
      throw new Error('No valid token available');
    }

    // Get user ID from token or local storage
    const userId = localStorage.getItem('userId');
    if (!userId) {
      throw new Error('User ID not found');
    }

    // Parse userId as number
    const numericUserId = parseInt(userId, 10);
    if (isNaN(numericUserId)) {
      throw new Error('Invalid user ID format');
    }

    console.log('Uploading resume for user:', numericUserId);

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`https://localhost:7127/api/CV/${numericUserId}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await handleResponse(response);
    return {
      id: data.cvId.toString(),
      title: file.name,
      lastModified: new Date().toISOString(),
      template: template,
      isDefault: false,
      fileUrl: `/api/CV/${data.cvId}/enhancement/pdf`
    };
  } catch (error) {
    console.error('Error in uploadResume:', error);
    throw error;
  }
};

export const deleteResume = async (id: string): Promise<void> => {
  try {
    const token = await getValidToken();
    if (!token) {
      throw new Error('No valid token available');
    }

    // Parse id as number
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new Error('Invalid CV ID format');
    }

    const response = await fetch(`https://localhost:7127/api/CV/${numericId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    await handleResponse(response);
  } catch (error) {
    console.error('Error in deleteResume:', error);
    throw error;
  }
};

export const updateResume = async (id: string, data: { title: string; template: string }): Promise<Resume> => {
  try {
    const token = await getValidToken();
    if (!token) {
      throw new Error('No valid token available');
    }

    // Note: Backend doesn't support updating CV metadata yet
    // This is a placeholder for future implementation
    throw new Error('Updating CV metadata is not supported yet');
  } catch (error) {
    console.error('Error in updateResume:', error);
    throw error;
  }
};

export const setDefaultResume = async (id: string): Promise<void> => {
  try {
    const token = await getValidToken();
    if (!token) {
      throw new Error('No valid token available');
    }

    // Note: Backend doesn't support setting default CV yet
    // This is a placeholder for future implementation
    throw new Error('Setting default CV is not supported yet');
  } catch (error) {
    console.error('Error in setDefaultResume:', error);
    throw error;
  }
};

export const duplicateResume = async (id: string): Promise<Resume> => {
  try {
    const token = await getValidToken();
    if (!token) {
      throw new Error('No valid token available');
    }

    // Note: Backend doesn't support duplicating CV yet
    // This is a placeholder for future implementation
    throw new Error('Duplicating CV is not supported yet');
  } catch (error) {
    console.error('Error in duplicateResume:', error);
    throw error;
  }
}; 