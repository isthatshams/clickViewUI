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
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [interviewSummary, setInterviewSummary] = useState<any>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  
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

      console.log('Raw interview data from backend:', data);

      setMockInterviews(data.map((interview: any) => {
        console.log('Processing interview:', interview);
        
        // Check all possible ID fields
        const interviewId = interview.interviewId || interview.id || interview.InterviewId || interview.Id;
        
        // Ensure interviewType is a string and has a default value
        const interviewType = (interview.interviewType || 'Chat').toString();
        
        // Check if interviewId exists
        if (!interviewId) {
          console.warn('Interview without ID found:', interview);
          console.warn('Available fields:', Object.keys(interview));
          return null;
        }
        
        return {
          id: interviewId.toString(),
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
      }).filter((interview): interview is MockInterview => interview !== null)); // Remove any null entries
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
      console.log('View details for interview:', interview);
      
      if (!interview.id) {
        console.error('Interview ID is undefined:', interview);
        setError('Invalid interview data');
        return;
      }
      
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

  const handlePreviewInterview = async (interview: MockInterview) => {
    setIsLoadingSummary(true);
    try {
      console.log('Preview interview:', interview);
      
      if (!interview.id) {
        console.error('Interview ID is undefined for preview:', interview);
        setError('Invalid interview data for preview');
        return;
      }
      
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
      console.log('Interview details from backend:', details);
      
      // Get AI summary
      const summaryResponse = await fetch(`https://localhost:7127/api/Interview/${interview.id}/summary/ai`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      let summary = null;
      if (summaryResponse.ok) {
        summary = await summaryResponse.json();
        console.log('AI summary from backend:', summary);
      }

      // Map the backend response to the frontend interface with safety checks
      const mappedInterview = {
        ...interview,
        questions: Array.isArray(details.Questions) 
          ? details.Questions.map((q: any) => ({
              questionId: q.QuestionId || 0,
              questionText: q.QuestionText || '',
              difficultyLevel: (q.DifficultyLevel || '').toString(),
              questionMark: q.QuestionMark || 0
            }))
          : [],
        answers: Array.isArray(details.Answers)
          ? details.Answers.map((a: any) => ({
              userAnswerId: a.UserAnswerId || 0,
              questionId: a.QuestionId || 0,
              userAnswerText: a.UserAnswerText || '',
              userAnswerNotes: a.UserAnswerNotes || ''
            }))
          : [],
        feedback: summary
      };

      console.log('Mapped interview data:', mappedInterview);
      setSelectedInterview(mappedInterview);
      setInterviewSummary(summary);
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Error getting interview preview:', error);
      setError('Failed to load interview preview');
    } finally {
      setIsLoadingSummary(false);
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
                 <div className="flex-1">
                   <div className="flex items-center justify-between mb-2">
                     <p className="text-lg font-medium text-gray-800 dark:text-white">{interview.title}</p>
                     <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                       interview.status === 'completed' 
                         ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                         : interview.status === 'in_progress'
                         ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                         : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                     }`}>
                       {interview.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                     </div>
                   </div>
                   <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                     <CalendarIcon className="h-4 w-4 mr-1" />
                      <span>{interview.date ? new Date(interview.date).toLocaleDateString() : 'No date'}</span>
                     <ClockIcon className="h-4 w-4 mr-1 ml-4" />
                      <span>{interview.time ? new Date(interview.time).toLocaleTimeString() : 'No time'}</span>
                     <span className="ml-4">
                       {interview.answers?.length || 0}/{interview.questions?.length || 0} questions
                     </span>
                   </div>
                 </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(interview)}
                      className="p-2 text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
                      title="View Details"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handlePreviewInterview(interview)}
                      className="p-2 text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
                      title="AI Preview"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
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
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                  Interview Details
                </h3>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  selectedInterview.status === 'completed' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : selectedInterview.status === 'in_progress'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                  {selectedInterview.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </div>
              </div>
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">Progress</p>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          selectedInterview.status === 'completed' 
                            ? 'bg-green-500' 
                            : selectedInterview.status === 'in_progress'
                            ? 'bg-yellow-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ 
                          width: `${selectedInterview.questions?.length 
                            ? Math.round(((selectedInterview.answers?.length || 0) / selectedInterview.questions.length) * 100)
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedInterview.answers?.length || 0}/{selectedInterview.questions?.length || 0} questions
                    </span>
                  </div>
                </div>
                {selectedInterview.feedback && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Feedback</p>
                    <div className="mt-2">
                      <p className="text-lg font-medium text-gray-800 dark:text-white">
                        Score: {selectedInterview.feedback.score}/10
                      </p>
                      {selectedInterview.feedback.strengths && selectedInterview.feedback.strengths.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Strengths:</p>
                          <ul className="list-disc list-inside text-gray-800 dark:text-white">
                            {selectedInterview.feedback.strengths.map((strength, index) => (
                              <li key={index}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedInterview.feedback.areasForImprovement && selectedInterview.feedback.areasForImprovement.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Areas for Improvement:</p>
                          <ul className="list-disc list-inside text-gray-800 dark:text-white">
                            {selectedInterview.feedback.areasForImprovement.map((area, index) => (
                              <li key={index}>{area}</li>
                            ))}
                          </ul>
                        </div>
                      )}
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

        {/* Preview Modal */}
        {showPreviewModal && selectedInterview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full h-5/6 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">AI Interview Analysis</h3>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex-grow overflow-auto space-y-6">
                {/* Progress Summary */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Progress Summary</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Total Questions:</span>
                      <span className="ml-2 font-medium text-gray-800 dark:text-white">{selectedInterview.questions?.length || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Answered:</span>
                      <span className="ml-2 font-medium text-gray-800 dark:text-white">{selectedInterview.answers?.length || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Progress:</span>
                      <span className="ml-2 font-medium text-gray-800 dark:text-white">
                        {selectedInterview.questions?.length 
                          ? Math.round(((selectedInterview.answers?.length || 0) / selectedInterview.questions.length) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Questions and Answers */}
                {selectedInterview.questions && selectedInterview.questions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Questions & Answers</h4>
                    <div className="space-y-4 max-h-96 overflow-auto">
                      {selectedInterview.questions.map((question, index) => {
                        const answer = selectedInterview.answers?.find(a => a.questionId === question.questionId);
                        return (
                          <div key={question.questionId} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-700">
                            <div className="flex items-start space-x-3">
                              <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{question.questionText}</p>
                                {answer ? (
                                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md p-3">
                                    <p className="text-sm text-gray-700 dark:text-green-200">{answer.userAnswerText}</p>
                                  </div>
                                ) : (
                                  <div className="bg-gray-50 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-md p-3">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">Not answered yet</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* AI Analysis */}
                {interviewSummary && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">AI Analysis</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Overall Tone</h5>
                        <p className="text-sm text-blue-700 dark:text-blue-300">{interviewSummary.overallTone || 'Not available'}</p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">Dominant Personality Traits</h5>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          {Array.isArray(interviewSummary.dominantPersonalityTraits) 
                            ? interviewSummary.dominantPersonalityTraits.join(', ')
                            : 'Not available'}
                        </p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2">Dominant Soft Skills</h5>
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                          {Array.isArray(interviewSummary.dominantSoftSkills)
                            ? interviewSummary.dominantSoftSkills.join(', ')
                            : 'Not available'}
                        </p>
                      </div>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">Strengths</h5>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          {Array.isArray(interviewSummary.strengths)
                            ? interviewSummary.strengths.join(', ')
                            : 'Not available'}
                        </p>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">Weaknesses</h5>
                        <p className="text-sm text-red-700 dark:text-red-300">
                          {Array.isArray(interviewSummary.weaknesses)
                            ? interviewSummary.weaknesses.join(', ')
                            : 'Not available'}
                        </p>
                      </div>
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-indigo-800 dark:text-indigo-200 mb-2">Suggested Improvements</h5>
                        <p className="text-sm text-indigo-700 dark:text-indigo-300">
                          {Array.isArray(interviewSummary.suggestedImprovements)
                            ? interviewSummary.suggestedImprovements.join(', ')
                            : 'Not available'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {isLoadingSummary && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                    <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">Loading AI analysis...</span>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
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