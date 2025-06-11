import React, { useState, useEffect } from 'react';
import { CalendarIcon, ClockIcon, PlayIcon, EyeIcon } from '@heroicons/react/24/outline';
import { getValidToken, getUserDetails } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

interface MockInterview {
  id: string;
  title: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'in_progress';
  type: 'technical' | 'behavioral' | 'system_design';
  duration: number;
  questionCount: number;
  answerCount: number;
  mark: number;
  questions?: Array<{
    questionId: number;
    questionText: string;
    difficultyLevel: string;
    questionMark: number;
  }>;
  answers?: Array<{
    userAnswerId: number;
    questionId: number;
    userAnswerText: string;
    userAnswerNotes: string;
  }>;
  feedback?: {
    score: number;
    strengths: string[];
    areasForImprovement: string[];
  };
}

interface CV {
  id: string;
  title: string;
  isDefault: boolean;
}

const Interviews: React.FC = () => {
  const navigate = useNavigate();
  const [mockInterviews, setMockInterviews] = useState<MockInterview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<MockInterview | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  // New state for interview configuration
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [availableCVs, setAvailableCVs] = useState<CV[]>([]);
  const [selectedCV, setSelectedCV] = useState<string>('');
  const [jobTitle, setJobTitle] = useState('');
  const [interviewLevel, setInterviewLevel] = useState('junior');
  const [isLoadingCVs, setIsLoadingCVs] = useState(false);
  const [interviewType, setInterviewType] = useState<'Chat' | 'Voice'>('Chat');

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const token = await getValidToken();
      const userDetails = await getUserDetails();
      
      if (!userDetails.id) {
        throw new Error('User ID not available');
      }

      const response = await fetch(`https://localhost:7127/api/Interview/user/${userDetails.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to fetch interviews: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format from server');
      }

      setMockInterviews(data.map((interview: any) => {
        // Ensure interviewType is a string and has a default value
        const interviewType = (interview.interviewType || 'Chat').toString();
        
        return {
          id: interview.interviewId,
          title: `${interviewType} Interview`,
          date: interview.startedAt,
          time: interview.startedAt,
          status: interview.answerCount === 0 ? 'scheduled' : 
                  interview.answerCount === interview.questionCount ? 'completed' : 'in_progress',
          type: interviewType.toLowerCase() as 'technical' | 'behavioral' | 'system_design',
          duration: 45, // Default duration
          questionCount: interview.questionCount || 0,
          answerCount: interview.answerCount || 0,
          mark: interview.interviewMark || 0
        };
      }));
    } catch (error) {
      console.error('Error fetching interviews:', error);
      setError(error instanceof Error ? error.message : 'Failed to load interviews');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCVs = async () => {
    setIsLoadingCVs(true);
    try {
      const token = await getValidToken();
      const userDetails = await getUserDetails();
      
      if (!userDetails.id) {
        throw new Error('User ID not available');
      }

      const response = await fetch(`https://localhost:7127/api/CV/${userDetails.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch CVs');
      }

      const data = await response.json();
      setAvailableCVs(data);
      
      // Set default CV if available
      const defaultCV = data.find((cv: CV) => cv.isDefault);
      if (defaultCV) {
        setSelectedCV(defaultCV.id);
      }
    } catch (error) {
      console.error('Error fetching CVs:', error);
      setError('Failed to load CVs');
    } finally {
      setIsLoadingCVs(false);
    }
  };

  const handleStartInterview = async () => {
    if (!jobTitle.trim()) {
      setError('Please enter a job title');
      return;
    }

    setIsScheduling(true);
    setError(null); // Clear any previous errors
    try {
      const token = await getValidToken();
      const userDetails = await getUserDetails();
      
      if (!userDetails.id) {
        throw new Error('User ID not available');
      }

      const response = await fetch('https://localhost:7127/api/Interview/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userDetails.id,
          interviewType: interviewType,
          level: interviewLevel,
          jobTitle: jobTitle.trim(),
          cvId: selectedCV || null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start interview');
      }

      const result = await response.json();
      setIsConfigModalOpen(false);
      
      // Navigate based on interview type
      if (interviewType === 'Chat') {
        navigate(`/interview/text/${result.interviewId}`);
      } else {
        navigate(`/interview/voice/${result.interviewId}`);
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      setError(error instanceof Error ? error.message : 'Failed to start interview');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleViewDetails = async (interview: MockInterview) => {
    try {
      const token = await getValidToken();
      
      // Get interview details
      const detailsResponse = await fetch(`https://localhost:7127/api/Interview/${interview.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!detailsResponse.ok) {
        throw new Error('Failed to get interview details');
      }

      const details = await detailsResponse.json();
      
      // Get AI summary if available
      const summaryResponse = await fetch(`https://localhost:7127/api/Interview/${interview.id}/summary/ai`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      let feedback = null;
      if (summaryResponse.ok) {
        feedback = await summaryResponse.json();
      }

      setSelectedInterview({
        ...interview,
        questions: details.questions,
        answers: details.answers,
        feedback: feedback
      });
      setIsDetailsModalOpen(true);
    } catch (error) {
      console.error('Error getting interview details:', error);
      setError('Failed to load interview details');
    }
  };

  return (
    <div className="flex-1 p-6 px-6 bg-gray-100 dark:bg-gray-900">
      <div className="w-full mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">My Interviews</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Manage and review your interview activities
              </p>
            </div>
            <div>
              <button
                onClick={() => {
                  setIsConfigModalOpen(true);
                  fetchCVs();
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:bg-purple-700 dark:hover:bg-purple-600"
              >
                Start an Interview
              </button>
            </div>
          </div>
        </div>

        {/* Content Area - Mock Interviews List */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Mock Interviews</h2>
          {isLoading ? (
            <div className="text-center py-4">Loading interviews...</div>
          ) : error ? (
            <div className="text-center py-4 text-red-600">{error}</div>
          ) : mockInterviews.length === 0 ? (
            <div className="text-center py-4 text-gray-600">No interviews scheduled yet</div>
          ) : (
            <div className="space-y-4">
              {mockInterviews.map(interview => (
                <div key={interview.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:pb-0 last:border-b-0 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-medium text-gray-800 dark:text-white">{interview.title}</p>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      <span>{new Date(interview.date).toLocaleDateString()}</span>
                      <ClockIcon className="h-4 w-4 mr-1 ml-4" />
                      <span>{new Date(interview.time).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(interview)}
                      className="p-2 text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    {interview.status === 'scheduled' && (
                      <button
                        onClick={handleStartInterview}
                        disabled={isScheduling}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isScheduling ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Starting Interview...
                          </>
                        ) : (
                          'Start Interview'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Interview Configuration Modal */}
        {isConfigModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                Configure Your Interview
              </h3>
              <div className="space-y-4">
                {/* Interview Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Interview Type
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setInterviewType('Chat')}
                      className={`p-4 rounded-lg border-2 ${
                        interviewType === 'Chat'
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      } hover:border-purple-600 transition-colors`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Text Interview</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setInterviewType('Voice')}
                      className={`p-4 rounded-lg border-2 ${
                        interviewType === 'Voice'
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      } hover:border-purple-600 transition-colors`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Voice Interview</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* CV Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Select CV (Optional)
                  </label>
                  {isLoadingCVs ? (
                    <div className="text-gray-600 dark:text-gray-400">Loading CVs...</div>
                  ) : (
                    <select
                      value={selectedCV}
                      onChange={(e) => setSelectedCV(e.target.value)}
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">No CV</option>
                      {availableCVs.map((cv) => (
                        <option key={cv.id} value={cv.id}>
                          {cv.title} {cv.isDefault ? '(Default)' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Job Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g., Software Developer"
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Interview Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Interview Level
                  </label>
                  <select
                    value={interviewLevel}
                    onChange={(e) => setInterviewLevel(e.target.value)}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="internship">Internship</option>
                    <option value="junior">Junior</option>
                    <option value="mid">Mid-Level</option>
                    <option value="senior">Senior</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartInterview}
                  disabled={isScheduling}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isScheduling ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Starting Interview...
                    </>
                  ) : (
                    'Start Interview'
                  )}
                </button>
              </div>

              {error && (
                <div className="mt-2 text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Interview Details Modal */}
        {isDetailsModalOpen && selectedInterview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                Interview Details
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Title</p>
                  <p className="text-lg font-medium text-gray-800 dark:text-white">{selectedInterview.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Type</p>
                  <p className="text-lg font-medium text-gray-800 dark:text-white">
                    {selectedInterview.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                  <p className="text-lg font-medium text-gray-800 dark:text-white">{selectedInterview.duration} minutes</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <p className="text-lg font-medium text-gray-800 dark:text-white">
                    {selectedInterview.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </p>
                </div>
                {selectedInterview.feedback && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Feedback</p>
                    <div className="mt-2">
                      <p className="text-lg font-medium text-gray-800 dark:text-white">
                        Score: {selectedInterview.feedback.score}/10
                      </p>
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Strengths:</p>
                        <ul className="list-disc list-inside text-gray-800 dark:text-white">
                          {selectedInterview.feedback.strengths.map((strength, index) => (
                            <li key={index}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Areas for Improvement:</p>
                        <ul className="list-disc list-inside text-gray-800 dark:text-white">
                          {selectedInterview.feedback.areasForImprovement.map((area, index) => (
                            <li key={index}>{area}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Interviews;