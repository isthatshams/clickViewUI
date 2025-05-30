import React, { useState, useRef } from 'react';
import {
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  DocumentDuplicateIcon,
  DocumentArrowUpIcon,
} from '@heroicons/react/24/outline';

interface Resume {
  id: string;
  title: string;
  lastModified: string;
  template: string;
  isDefault: boolean;
  file?: File;
}

const Resumes: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resumes, setResumes] = useState<Resume[]>([
    {
      id: '1',
      title: 'Software Engineer Resume',
      lastModified: '2024-03-20',
      template: 'Modern',
      isDefault: true,
    },
    {
      id: '2',
      title: 'Frontend Developer Resume',
      lastModified: '2024-03-15',
      template: 'Professional',
      isDefault: false,
    },
  ]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [filterTemplate, setFilterTemplate] = useState('All');
  const [sortBy, setSortBy] = useState('lastModifiedDesc'); // 'lastModifiedDesc', 'lastModifiedAsc', 'titleAsc'
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [resumeToPreview, setResumeToPreview] = useState<Resume | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const newResume: Resume = {
        id: Date.now().toString(),
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
        lastModified: new Date().toISOString().split('T')[0],
        template: 'Modern',
        isDefault: false,
        file: file
      };
      setResumes([...resumes, newResume]);
    }
  };

  const handleDelete = (resume: Resume) => {
    setSelectedResume(resume);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedResume) {
      setResumes(resumes.filter(r => r.id !== selectedResume.id));
      setIsDeleteModalOpen(false);
      setSelectedResume(null);
    }
  };

  const handleEdit = (resume: Resume) => {
    setSelectedResume(resume);
    setIsEditModalOpen(true);
  };

  const handleDuplicate = (resume: Resume) => {
    const newResume = {
      ...resume,
      id: Date.now().toString(),
      title: `${resume.title} (Copy)`,
      lastModified: new Date().toISOString().split('T')[0],
      isDefault: false,
    };
    setResumes([...resumes, newResume]);
  };

  const handleSetDefault = (resume: Resume) => {
    setResumes(resumes.map(r => ({
      ...r,
      isDefault: r.id === resume.id,
    })));
  };

  const handleDownload = (resume: Resume) => {
    if (resume.file) {
      const url = URL.createObjectURL(resume.file);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', resume.file.name);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up the URL object
    }
  };

  const handlePreview = (resume: Resume) => {
    setResumeToPreview(resume);
    setIsPreviewModalOpen(true);
  };

  return (
    <div className="flex-1 p-6 px-6 bg-gray-100 dark:bg-gray-900">
      <div className="w-full mx-auto flex flex-col gap-6">
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
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:bg-purple-700 dark:hover:bg-purple-600"
              >
                <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                Upload Resume
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
                  {resume.file && (
                    <button
                      onClick={() => handleDownload(resume)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                      Download
                    </button>
                  )}
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
                {resumeToPreview.file ? (
                  <iframe
                    src={URL.createObjectURL(resumeToPreview.file)}
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
                  className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
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
                  onClick={() => {
                    setResumes(resumes.map(r => 
                      r.id === selectedResume.id ? selectedResume : r
                    ));
                    setIsEditModalOpen(false);
                  }}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Resumes;