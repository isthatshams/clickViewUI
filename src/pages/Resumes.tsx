import React, { useState, useRef, useEffect } from 'react';
import {
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  DocumentDuplicateIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { getValidToken, getUserDetails } from '../utils/auth';

interface EnhancedCv {
  id: string;
  title: string;
  lastModified: string;
  template: string;
  isDefault: boolean;
  suggestions?: string[];
}

interface Resume {
  id: string;
  title: string;
  lastModified: string;
  template: string;
  isDefault: boolean;
  file?: File;
  previewUrl?: string;
}

const Resumes: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Add a function to show status messages
  const showStatus = (type: 'success' | 'error', message: string) => {
    setStatusMessage({ type, message });
    setTimeout(() => setStatusMessage(null), 3000); // Clear after 3 seconds
  };

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const token = await getValidToken();
        const userDetails = await getUserDetails();
        
        if (!userDetails.id) {
          throw new Error('User ID not available');
        }

        console.log('Fetching CVs for user ID:', userDetails.id);

        const response = await fetch(`https://localhost:7127/api/CV/${userDetails.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to fetch resumes:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
            userId: userDetails.id
          });
          throw new Error(`Failed to fetch resumes: ${response.status} ${response.statusText}`);
        }

        const data: EnhancedCv[] = await response.json();
        setResumes(data.map((resume) => {
          const lastModifiedDate = resume.lastModified ? new Date(resume.lastModified) : new Date();
          return {
            id: resume.id,
            title: resume.title,
            lastModified: lastModifiedDate.toISOString().split('T')[0],
            template: resume.template || 'Modern',
            isDefault: resume.isDefault || false,
          };
        }));
      } catch (error) {
        console.error('Error fetching resumes:', error);
        showStatus('error', 'Failed to load resumes');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResumes();
  }, []);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [filterTemplate, setFilterTemplate] = useState('All');
  const [sortBy, setSortBy] = useState('lastModifiedDesc'); // 'lastModifiedDesc', 'lastModifiedAsc', 'titleAsc'
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [resumeToPreview, setResumeToPreview] = useState<Resume | null>(null);
  const [isEnhanceModalOpen, setIsEnhanceModalOpen] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [enhancement, setEnhancement] = useState<{
    suggestions: string;
    enhancedCvText: string;
  } | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setStatusMessage(null);

    try {
      const token = await getValidToken();
      const userDetails = await getUserDetails();
      
      if (!userDetails.id) {
        throw new Error('User ID not available');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`https://localhost:7127/api/CV/${userDetails.id}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to upload resume:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Failed to upload resume: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Upload successful:', result);

      // Refresh the resumes list
      const resumesResponse = await fetch(`https://localhost:7127/api/CV/${userDetails.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!resumesResponse.ok) {
        throw new Error('Failed to refresh resumes list');
      }

      const data: EnhancedCv[] = await resumesResponse.json();
      
      // If this is the first resume, ensure it's set as default
      if (data.length === 1) {
        const setDefaultResponse = await fetch(`https://localhost:7127/api/CV/${data[0].id}/set-default`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!setDefaultResponse.ok) {
          console.error('Failed to set first resume as default');
        } else {
          data[0].isDefault = true;
        }
      }

      setResumes(data.map((resume) => {
        const lastModifiedDate = resume.lastModified ? new Date(resume.lastModified) : new Date();
        return {
          id: resume.id,
          title: resume.title,
          lastModified: lastModifiedDate.toISOString().split('T')[0],
          template: resume.template || 'Modern',
          isDefault: resume.isDefault || false,
        };
      }));

      showStatus('success', 'Resume uploaded successfully');
    } catch (error) {
      console.error('Error uploading resume:', error);
      showStatus('error', 'Failed to upload resume');
    } finally {
      setIsUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = (resume: Resume) => {
    setSelectedResume(resume);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedResume) {
      setIsDeleting(true);
      setStatusMessage(null);

      try {
        const token = await getValidToken();
        const response = await fetch(`https://localhost:7127/api/CV/${selectedResume.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to delete resume:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          });
          throw new Error(`Failed to delete resume: ${response.status} ${response.statusText}`);
        }

        // Remove the deleted resume from the list
        const updatedResumes = resumes.filter(r => r.id !== selectedResume.id);
        
        // If the deleted resume was the default and there are other resumes,
        // set the most recently modified resume as default
        if (selectedResume.isDefault && updatedResumes.length > 0) {
          // Sort resumes by lastModified date in descending order
          const sortedResumes = [...updatedResumes].sort((a, b) => 
            new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
          );
          
          // Get the most recent resume
          const mostRecentResume = sortedResumes[0];
          
          // Set it as default
          const setDefaultResponse = await fetch(`https://localhost:7127/api/CV/${mostRecentResume.id}/set-default`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!setDefaultResponse.ok) {
            console.error('Failed to set new default resume');
          } else {
            // Update the resumes list with the new default
            updatedResumes.forEach(r => {
              r.isDefault = r.id === mostRecentResume.id;
            });
          }
        }

        setResumes(updatedResumes);
        showStatus('success', 'Resume deleted successfully');
      } catch (error) {
        console.error('Error deleting resume:', error);
        showStatus('error', 'Failed to delete resume');
      } finally {
        setIsDeleting(false);
        setIsDeleteModalOpen(false);
        setSelectedResume(null);
      }
    }
  };

  const handleEdit = (resume: Resume) => {
    setSelectedResume(resume);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedResume) return;

    try {
      const token = await getValidToken();
      
      // Convert string ID to number for the API
      const resumeId = parseInt(selectedResume.id);
      if (isNaN(resumeId)) {
        throw new Error('Invalid resume ID');
      }

      const response = await fetch(`https://localhost:7127/api/CV/${resumeId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: selectedResume.title,
          template: selectedResume.template
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to update resume:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Failed to update resume: ${response.status} ${response.statusText}`);
      }

      const updatedResume = await response.json();
      
      // Update the resumes list with the updated resume
      setResumes(prevResumes => prevResumes.map(r => 
        r.id === selectedResume.id ? {
          ...r,
          title: updatedResume.title,
          template: updatedResume.template,
          lastModified: updatedResume.lastModified
        } : r
      ));

      setIsEditModalOpen(false);
      showStatus('success', 'Resume updated successfully');
    } catch (error) {
      console.error('Error updating resume:', error);
      showStatus('error', 'Failed to update resume');
    }
  };

  const handleDuplicate = async (resume: Resume) => {
    try {
      const token = await getValidToken();
      const response = await fetch(`https://localhost:7127/api/CV/${resume.id}/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to duplicate resume:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Failed to duplicate resume: ${response.status} ${response.statusText}`);
      }

      const duplicatedResume = await response.json();
      
      // Add the duplicated resume to the list
      setResumes(prevResumes => [...prevResumes, {
        id: duplicatedResume.id,
        title: duplicatedResume.title,
        lastModified: new Date(duplicatedResume.lastModified).toISOString().split('T')[0],
        template: duplicatedResume.template || 'Modern',
        isDefault: duplicatedResume.isDefault || false,
      }]);

      showStatus('success', 'Resume duplicated successfully');
    } catch (error) {
      console.error('Error duplicating resume:', error);
      showStatus('error', 'Failed to duplicate resume');
    }
  };

  const handleSetDefault = async (resume: Resume) => {
    try {
      const token = await getValidToken();
      
      // Convert string ID to number for the API
      const resumeId = parseInt(resume.id);
      if (isNaN(resumeId)) {
        throw new Error('Invalid resume ID');
      }

      const response = await fetch(`https://localhost:7127/api/CV/${resumeId}/set-default`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to set default resume:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Failed to set default resume: ${response.status} ${response.statusText}`);
      }

      // Update the resumes list to reflect the new default
      setResumes(prevResumes => prevResumes.map(r => ({
        ...r,
        isDefault: r.id === resume.id
      })));

      showStatus('success', 'Default resume updated successfully');
    } catch (error) {
      console.error('Error setting default resume:', error);
      showStatus('error', 'Failed to set default resume');
    }
  };

  const handleDownload = async (resume: Resume) => {
    try {
      const token = await getValidToken();
      
      // Convert string ID to number for the API
      const resumeId = parseInt(resume.id);
      if (isNaN(resumeId)) {
        throw new Error('Invalid resume ID');
      }

      // Create a temporary link element
      const link = document.createElement('a');
      link.href = `https://localhost:7127/api/CV/${resumeId}/download`;
      link.setAttribute('download', ''); // Let the server set the filename
      
      // Add authorization header
      const response = await fetch(link.href, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download resume');
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      link.href = url;
      
      // Trigger the download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showStatus('success', 'Resume downloaded successfully');
    } catch (error) {
      console.error('Error downloading resume:', error);
      showStatus('error', 'Failed to download resume');
    }
  };

  const handlePreview = async (resume: Resume) => {
    try {
      const token = await getValidToken();
      
      // Convert string ID to number for the API
      const resumeId = parseInt(resume.id);
      if (isNaN(resumeId)) {
        throw new Error('Invalid resume ID');
      }

      // Get the preview URL
      const previewUrl = `https://localhost:7127/api/CV/${resumeId}/preview`;
      
      // Set the resume to preview with the URL
      setResumeToPreview({
        ...resume,
        previewUrl: previewUrl
      });
      setIsPreviewModalOpen(true);
    } catch (error) {
      console.error('Error preparing resume preview:', error);
      showStatus('error', 'Failed to load resume preview');
    }
  };

  const handleEnhance = (resume: Resume) => {
    setSelectedResume(resume);
    setJobTitle('');
    setEnhancement(null);
    setIsEnhanceModalOpen(true);
  };

  const handleEnhanceSubmit = async () => {
    if (!selectedResume) return;

    setIsEnhancing(true);
    setStatusMessage(null);

    try {
      const token = await getValidToken();
      
      // Use the new enhancement endpoint that automatically creates enhancements
      const endpoint = jobTitle.trim() 
        ? `https://localhost:7127/api/CV/${selectedResume.id}/enhancement/${encodeURIComponent(jobTitle.trim())}`
        : `https://localhost:7127/api/CV/${selectedResume.id}/enhancement`;
        
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to enhance resume:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Failed to enhance resume: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      setEnhancement({
        suggestions: result.suggestions,
        enhancedCvText: result.enhancedCvText
      });
      
      const successMessage = jobTitle.trim() 
        ? `Resume enhanced for ${jobTitle.trim()} position`
        : 'Resume enhanced successfully';
      showStatus('success', successMessage);
    } catch (error) {
      console.error('Error enhancing resume:', error);
      showStatus('error', 'Failed to enhance resume');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleDownloadEnhanced = async () => {
    if (!selectedResume) return;

    try {
      const token = await getValidToken();
      const response = await fetch(`https://localhost:7127/api/CV/${selectedResume.id}/enhancement/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download enhanced resume');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `enhanced_${selectedResume.title}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showStatus('success', 'Enhanced resume downloaded successfully');
    } catch (error) {
      console.error('Error downloading enhanced resume:', error);
      showStatus('error', 'Failed to download enhanced resume');
    }
  };

  return (
    <div className="flex-1 p-6 px-6 bg-gray-100 dark:bg-gray-900">
      <div className="w-full mx-auto flex flex-col gap-6">
        {/* Status Message */}
        {statusMessage && (
          <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 p-4 rounded-lg shadow-lg z-50 flex items-center space-x-3 ${
            statusMessage.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/50 dark:border-green-800 dark:text-green-200' 
              : 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/50 dark:border-red-800 dark:text-red-200'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            ) : (
              <XCircleIcon className="h-5 w-5 text-red-500" />
            )}
            <span className="text-sm font-medium">{statusMessage.message}</span>
          </div>
        )}

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">My Resumes</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Manage and organize your professional resumes
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Filter Dropdown */}
              <div>
                <label htmlFor="template-filter" className="sr-only">Filter by Template</label>
                <select
                  id="template-filter"
                  name="template-filter"
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                  value={filterTemplate}
                  onChange={(e) => setFilterTemplate(e.target.value)}
                >
                  <option value="All">All Templates</option>
                  <option value="Modern">Modern</option>
                  <option value="Professional">Professional</option>
                  <option value="Creative">Creative</option>
                  <option value="Simple">Simple</option>
                </select>
              </div>

              {/* Sort Dropdown */}
              <div>
                 <label htmlFor="sort-by" className="sr-only">Sort By</label>
                 <select
                   id="sort-by"
                   name="sort-by"
                   className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                   value={sortBy}
                   onChange={(e) => setSortBy(e.target.value)}
                 >
                   <option value="lastModifiedDesc">Last Modified (Newest)</option>
                   <option value="lastModifiedAsc">Last Modified (Oldest)</option>
                   <option value="titleAsc">Title (A-Z)</option>
                 </select>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx"
                className="hidden"
                disabled={isUploading}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isUploading ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:bg-purple-700 dark:hover:bg-purple-600`}
              >
                <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                {isUploading ? 'Uploading...' : 'Upload Resume'}
              </button>
            </div>
          </div>
        </div>

        {/* Resumes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes
            .filter(resume => filterTemplate === 'All' || resume.template === filterTemplate)
            .sort((a, b) => {
              if (sortBy === 'lastModifiedDesc') {
                return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
              } else if (sortBy === 'lastModifiedAsc') {
                return new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime();
              } else if (sortBy === 'titleAsc') {
                return a.title.localeCompare(b.title);
              }
              return 0;
            })
            .map((resume) => (
            <div
              key={resume.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-600"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <DocumentTextIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                        {resume.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Last modified: {resume.lastModified}
                      </p>
                    </div>
                  </div>
                  {resume.isDefault && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Default
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Template: {resume.template}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    onClick={() => handlePreview(resume)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    Preview
                  </button>
                  <button
                    onClick={() => handleEdit(resume)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDownload(resume)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                    Download
                  </button>
                  <button
                    onClick={() => handleDuplicate(resume)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => handleSetDefault(resume)}
                    disabled={resume.isDefault}
                    className={`inline-flex items-center px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-md text-sm font-medium ${
                      resume.isDefault
                        ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                    } bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    Set as Default
                  </button>
                  <button
                    onClick={() => handleDelete(resume)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-md text-sm font-medium text-red-600 dark:text-red-300 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                  <button
                    onClick={() => handleEnhance(resume)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    <SparklesIcon className="h-4 w-4 mr-1" />
                    Enhance
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Preview Modal */}
        {isPreviewModalOpen && resumeToPreview && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full h-5/6 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Preview: {resumeToPreview.title}</h3>
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                >
                  <PlusIcon className="h-6 w-6 rotate-45" />
                </button>
              </div>
              <div className="flex-grow overflow-auto border border-gray-200 dark:border-gray-700 rounded-md p-4">
                {resumeToPreview.previewUrl ? (
                  <iframe
                    src={resumeToPreview.previewUrl}
                    title="Resume Preview"
                    width="100%"
                    height="100%"
                    className="border-none"
                  ></iframe>
                ) : (
                  <div className="text-center text-gray-600 dark:text-gray-400">
                    <p>No preview available for this resume type.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && selectedResume && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Delete Resume
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete "{selectedResume.title}"? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    isDeleting ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen && selectedResume && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Edit Resume
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={selectedResume.title}
                    onChange={(e) => setSelectedResume({ ...selectedResume, title: e.target.value })}
                    className="mt-1 block w-full border border-gray-200 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="template" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Template
                  </label>
                  <select
                    id="template"
                    value={selectedResume.template}
                    onChange={(e) => setSelectedResume({ ...selectedResume, template: e.target.value })}
                    className="mt-1 block w-full border border-gray-200 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="Modern">Modern</option>
                    <option value="Professional">Professional</option>
                    <option value="Creative">Creative</option>
                    <option value="Simple">Simple</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhance Modal */}
        {isEnhanceModalOpen && selectedResume && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full h-5/6 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Enhance Resume: {selectedResume.title}
                </h3>
                <button
                  onClick={() => setIsEnhanceModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                >
                  <PlusIcon className="h-6 w-6 rotate-45" />
                </button>
              </div>

              {!enhancement ? (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Target Job Title (Optional)
                    </label>
                    <input
                      type="text"
                      id="jobTitle"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g., Senior Software Engineer (leave empty for general enhancement)"
                      className="mt-1 block w-full border border-gray-200 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Leave empty for a general enhancement, or specify a job title for targeted improvements.
                    </p>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setIsEnhanceModalOpen(false)}
                      className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleEnhanceSubmit}
                      disabled={isEnhancing}
                      className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                        isEnhancing
                          ? 'bg-purple-400 cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-700'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
                    >
                      {isEnhancing ? 'Enhancing...' : 'Enhance Resume'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-grow overflow-auto space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Suggestions</h4>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                      <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                        {enhancement.suggestions}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Enhanced Resume</h4>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                      <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                        {enhancement.enhancedCvText}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setEnhancement(null);
                        setJobTitle('');
                      }}
                      className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      Enhance Another
                    </button>
                    <button
                      onClick={handleDownloadEnhanced}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      Download PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Resumes;