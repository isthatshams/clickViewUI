import React, { useState, useEffect } from 'react';
import {
  CalendarIcon,
  ClockIcon,
  PlayIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PauseIcon,
  ChartBarIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  MicrophoneIcon,
  StarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { getValidToken, getUserDetails } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

interface MockInterview {
  id: string;
  title: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'incomplete';
  type: 'technical' | 'behavioral' | 'system_design';
  duration: number;
  questionCount: number;
  answerCount: number;
  mark: number;
  interviewType?: number; // 0 for Chat, 1 for Voice
  startedAt?: string;
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
  isFinished: boolean;
}

interface CV {
  id: string;
  title: string;
  isDefault: boolean;
}

const Interviews: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
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

  // Helper functions for status and type display
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Completed',
          icon: CheckCircleIcon,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-200'
        };
      case 'incomplete':
        return {
          label: 'Incomplete',
          icon: ExclamationTriangleIcon,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          borderColor: 'border-yellow-200'
        };
      case 'scheduled':
        return {
          label: 'Scheduled',
          icon: ClockIcon,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-200'
        };
      default:
        return {
          label: 'Unknown',
          icon: ExclamationTriangleIcon,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-200'
        };
    }
  };

  // Helper function to get the display status for an interview
  const getDisplayStatus = (interview: MockInterview) => {
    if (interview.isFinished) {
      return {
        label: 'Completed',
        icon: CheckCircleIcon,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-200'
      };
    }
    return getStatusInfo(interview.status);
  };

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'chat':
        return {
          label: 'Text Interview',
          icon: ChatBubbleLeftRightIcon,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
          borderColor: 'border-purple-200'
        };
      case 'voice':
        return {
          label: 'Voice Interview',
          icon: MicrophoneIcon,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-100',
          borderColor: 'border-indigo-200'
        };
      default:
        return {
          label: 'Interview',
          icon: DocumentTextIcon,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-200'
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (startedAt: string) => {
    const startTime = new Date(startedAt);
    const currentTime = new Date();
    const timeDiffMinutes = (currentTime.getTime() - startTime.getTime()) / (1000 * 60);
    const remainingMinutes = Math.max(0, 45 - timeDiffMinutes);

    if (remainingMinutes <= 0) {
      return 'Expired';
    }

    const hours = Math.floor(remainingMinutes / 60);
    const minutes = Math.floor(remainingMinutes % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

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

      console.log('Raw API response:', data);
      console.log('First interview data:', data[0]);

      setMockInterviews(data.map((interview: any) => {
        // Handle both capitalized and lowercase property names from API
        const questionCount = interview.QuestionCount || interview.questionCount || 0;
        const answerCount = interview.AnswerCount || interview.answerCount || 0;
        const interviewMark = interview.InterviewMark || interview.interviewMark || 0;
        const startedAt = interview.StartedAt || interview.startedAt;
        const interviewId = interview.InterviewId || interview.interviewId;
        const interviewType = interview.InterviewType || interview.interviewType || 0;
        const isFinished = interview.IsFinished || interview.isFinished || false;
        const finishedAt = interview.FinishedAt || interview.finishedAt;

        // Ensure interviewType is a string and has a default value
        const interviewTypeStr = interviewType.toString();
        const interviewTypeName = interviewTypeStr === '0' ? 'Chat' : 'Voice';

        // Calculate status based on isFinished field and FinishedAt timestamp
        let status: 'scheduled' | 'completed' | 'incomplete';
        let actualIsFinished = isFinished;
        
        // If isFinished is false but we have a FinishedAt timestamp, consider it finished
        if (!isFinished && finishedAt) {
          actualIsFinished = true;
        }
        
        if (actualIsFinished) {
          status = 'completed';
        } else {
          status = 'incomplete';
        }

        console.log('Interview data mapping:', {
          id: interviewId,
          questionCount,
          answerCount,
          interviewMark,
          startedAt,
          isFinished,
          actualIsFinished,
          finishedAt,
          status,
          localTime: new Date(startedAt).toLocaleString('en-US'),
          isoString: new Date(startedAt).toISOString()
        });

        return {
          id: interviewId,
          title: `${interviewTypeName} Interview`,
          date: startedAt,
          time: startedAt,
          status: status,
          type: interviewTypeName.toLowerCase() as 'technical' | 'behavioral' | 'system_design',
          duration: 45, // Default duration
          questionCount: questionCount,
          answerCount: answerCount,
          mark: interviewMark,
          interviewType: interviewType,
          startedAt: startedAt,
          isFinished: actualIsFinished
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

  const handleSummaryInterview = async (interview: MockInterview) => {
    try {
      setIsLoadingSummary(true);
      const token = await getValidToken();

      const response = await fetch(`https://localhost:7127/api/Interview/${interview.id}/summary`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const summary = await response.json();
        setInterviewSummary(summary);
        setShowPreviewModal(true);
      } else {
        console.error('Failed to fetch interview summary');
      }
    } catch (error) {
      console.error('Error fetching interview summary:', error);
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
              {mockInterviews.map(interview => {
                const statusInfo = getDisplayStatus(interview);
                const typeInfo = getTypeInfo(interview.type);
                const StatusIcon = statusInfo.icon;
                const TypeIcon = typeInfo.icon;

                return (
                  <div 
                    key={interview.id} 
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      {/* Left side - Main info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${typeInfo.bgColor} ${typeInfo.color} ${typeInfo.borderColor} border`}>
                            <TypeIcon className="h-3 w-3 mr-1" />
                            {typeInfo.label}
                          </div>
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color} ${statusInfo.borderColor} border`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.label}
                          </div>
                          {interview.isFinished && (
                            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                              <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Time Expired
                            </div>
                          )}
                          {interview.mark > 0 && (
                            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                              <StarIcon className="h-3 w-3 mr-1" />
                              {interview.mark.toFixed(2)}% Score
                            </div>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                          {interview.title}
                        </h3>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            <span>Started: {formatDate(interview.date)}</span>
                          </div>
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            <span>{formatTime(interview.time)}</span>
                          </div>
                          {!interview.isFinished && (
                            <div className="flex items-center">
                              <svg className="h-4 w-4 mr-1 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-orange-600 font-medium">{getTimeRemaining(interview.startedAt || '')}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center">
                            <QuestionMarkCircleIcon className="h-4 w-4 mr-1" />
                            <span>{interview.questionCount} Questions</span>
                          </div>
                          <div className="flex items-center">
                            <DocumentTextIcon className="h-4 w-4 mr-1" />
                            <span>{interview.answerCount} Answered</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Right side - Actions */}
                      <div className="flex items-center gap-2 ml-4">
                        {/* Show Start Interview button only for scheduled interviews that haven't finished */}
                        {interview.status === 'scheduled' && !interview.isFinished && (
                          <button
                            onClick={() => {
                              setSelectedInterview(interview);
                              // Navigate to the appropriate interview type
                              if (interview.interviewType === 0) {
                                navigate(`/interview/text/${interview.id}`);
                              } else {
                                navigate(`/interview/voice/${interview.id}`);
                              }
                            }}
                            className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transform hover:scale-105 transition-all duration-200 ease-in-out"
                          >
                            <PlayIcon className="h-5 w-5 mr-2" />
                            Start Interview
                          </button>
                        )}
                        {/* Show Complete Interview button only for incomplete interviews that haven't finished */}
                        {interview.status === 'incomplete' && !interview.isFinished && (
                          <button
                            onClick={() => {
                              console.log('Complete Interview clicked for interview:', interview.id, 'Type:', interview.interviewType);
                              setSelectedInterview(interview);
                              // Navigate to continue the interview
                              if (interview.interviewType === 0) {
                                console.log('Navigating to text interview:', `/interview/text/${interview.id}`);
                                navigate(`/interview/text/${interview.id}`);
                              } else {
                                console.log('Navigating to voice interview:', `/interview/voice/${interview.id}`);
                                navigate(`/interview/voice/${interview.id}`);
                              }
                            }}
                            className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transform hover:scale-105 transition-all duration-200 ease-in-out"
                          >
                            <PlayIcon className="h-5 w-5 mr-2" />
                            Complete Interview
                          </button>
                        )}
                        {/* Show completion message for finished interviews */}
                        {interview.isFinished && (
                          <div className="flex items-center gap-2">
                            {interview.mark > 0 ? (
                              <>
                                <div className="inline-flex items-center px-4 py-2 bg-white dark:bg-green-900/20 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 rounded-lg text-sm font-semibold shadow-sm">
                                  <CheckCircleIcon className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                                  <span className="font-bold">{interview.mark.toFixed(2)}%</span>
                                </div>
                                <button
                                  onClick={() => navigate(`/interview/results/${interview.id}`)}
                                  className={`inline-flex items-center px-4 py-2 border-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                    theme === 'dark'
                                      ? 'text-gray-300 bg-gray-800 border-purple-500 hover:bg-gray-700 focus:ring-purple-500'
                                      : 'text-black bg-gray-100 border-purple-500 hover:bg-gray-200 focus:ring-purple-500'
                                  }`}
                                >
                                  <EyeIcon className="h-4 w-4 mr-2" />
                                  View Results
                                </button>
                              </>
                            ) : interview.answerCount > 0 ? (
                              <>
                                <div className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-semibold shadow-sm">
                                  <ExclamationTriangleIcon className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" />
                                  <span>No Score</span>
                                </div>
                                <button
                                  onClick={async () => {
                                    try {
                                      const token = await getValidToken();
                                      const response = await fetch(`https://localhost:7127/api/Interview/calculate-score/${interview.id}`, {
                                        method: 'POST',
                                        headers: {
                                          'Authorization': `Bearer ${token}`,
                                          'Content-Type': 'application/json',
                                        },
                                      });

                                      if (response.ok) {
                                        const result = await response.json();
                                        console.log('Score calculated:', result);
                                        await fetchInterviews(); // Refresh the list
                                        alert(`Score calculated: ${result.score.toFixed(2)}% (${result.grade})`);
                                      } else {
                                        const errorData = await response.json();
                                        alert(`Failed to calculate score: ${errorData.error || 'Unknown error'}`);
                                      }
                                    } catch (error) {
                                      console.error('Error calculating score:', error);
                                      alert('Error calculating score. Please try again.');
                                    }
                                  }}
                                  className={`inline-flex items-center px-4 py-2 border-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                    theme === 'dark'
                                      ? 'text-gray-300 bg-gray-800 border-orange-500 hover:bg-gray-700 focus:ring-orange-500'
                                      : 'text-black bg-gray-100 border-orange-500 hover:bg-gray-200 focus:ring-orange-500'
                                  }`}
                                >
                                  <StarIcon className="h-4 w-4 mr-2" />
                                  Calculate Score
                                </button>
                              </>
                            ) : (
                              <div className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-semibold shadow-sm">
                                <ExclamationTriangleIcon className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" />
                                <span>No Score</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
                      className={`p-4 rounded-lg border-2 ${interviewType === 'Chat'
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
                      className={`p-4 rounded-lg border-2 ${interviewType === 'Voice'
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

                {/* CV Selection and Job Title - Only show for Chat interviews */}
                {interviewType === 'Chat' ? (
                  <>
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
                  </>
                ) : (
                  /* Future Work message for Voice interviews */
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Future Work</h3>
                    <p className="text-gray-600 dark:text-gray-400">Voice interview configuration is coming soon.</p>
                  </div>
                )}

                {/* Interview Level - Only show for Chat interviews */}
                {interviewType === 'Chat' && (
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
                )}
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
                  disabled={isScheduling || interviewType === 'Voice'}
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                  Interview Details
                </h3>
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Header Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Interview Type</h4>
                    <div className="flex items-center">
                      {(() => {
                        const typeInfo = getTypeInfo(selectedInterview.type);
                        const TypeIcon = typeInfo.icon;
                        return (
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${typeInfo.bgColor} ${typeInfo.color} ${typeInfo.borderColor} border`}>
                            <TypeIcon className="h-4 w-4 mr-2" />
                            {typeInfo.label}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Status</h4>
                    <div className="flex items-center">
                      {(() => {
                        const statusInfo = getDisplayStatus(selectedInterview);
                        const StatusIcon = statusInfo.icon;
                        return (
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color} ${statusInfo.borderColor} border`}>
                            <StatusIcon className="h-4 w-4 mr-2" />
                            {statusInfo.label}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Start Date</h4>
                    <div className="flex items-center text-gray-800 dark:text-white">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {formatDate(selectedInterview.date)}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Start Time</h4>
                    <div className="flex items-center text-gray-800 dark:text-white">
                      <ClockIcon className="h-4 w-4 mr-2" />
                      {formatTime(selectedInterview.time)}
                    </div>
                  </div>
                </div>

                {/* Progress and Statistics */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Statistics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {selectedInterview.questionCount}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Total Questions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {selectedInterview.answerCount}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Answered</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {selectedInterview.mark.toFixed(2)}%
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Score</div>
                    </div>
                  </div>
                </div>

                {/* Duration */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Duration</h4>
                  <div className="flex items-center text-gray-800 dark:text-white">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    {selectedInterview.duration} minutes
                  </div>
                </div>

                {/* Feedback Section */}
                {selectedInterview.feedback && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">AI Feedback</h4>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <StarIcon className="h-5 w-5 text-yellow-500 mr-2" />
                        <span className="text-lg font-semibold text-gray-800 dark:text-white">
                          Score: {selectedInterview.feedback.score}/10
                        </span>
                      </div>

                      {selectedInterview.feedback.strengths && selectedInterview.feedback.strengths.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">Strengths:</h5>
                          <ul className="list-disc list-inside text-gray-800 dark:text-white space-y-1">
                            {selectedInterview.feedback.strengths.map((strength, index) => (
                              <li key={index} className="text-sm">{strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {selectedInterview.feedback.areasForImprovement && selectedInterview.feedback.areasForImprovement.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-2">Areas for Improvement:</h5>
                          <ul className="list-disc list-inside text-gray-800 dark:text-white space-y-1">
                            {selectedInterview.feedback.areasForImprovement.map((area, index) => (
                              <li key={index} className="text-sm">{area}</li>
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
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Summary Modal */}
        {showPreviewModal && selectedInterview && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className={`rounded-xl p-6 max-w-4xl w-full h-5/6 flex flex-col ${
              theme === 'dark' ? 'bg-gray-900 border border-gray-700' : 'bg-white'
            }`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-medium ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Interview Summary</h3>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className={`hover:text-gray-500 ${
                    theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'
                  }`}
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-grow overflow-auto space-y-6">
                {/* Progress Summary */}
                <div className={`rounded-lg p-4 ${
                  theme === 'dark' ? 'bg-gray-800 border border-gray-600' : 'bg-gray-50'
                }`}>
                  <h4 className={`text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                  }`}>Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className={`${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>Total Questions:</span>
                      <span className={`ml-2 font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>{selectedInterview.questions?.length || 0}</span>
                    </div>
                    <div>
                      <span className={`${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>Answered:</span>
                      <span className={`ml-2 font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>{selectedInterview.answers?.length || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Questions and Answers */}
                {selectedInterview.questions && (
                  <div>
                    <h4 className={`text-sm font-medium mb-3 ${
                      theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                    }`}>Questions & Answers</h4>
                    <div className="space-y-4 max-h-96 overflow-auto">
                      {selectedInterview.questions.map((question, index) => {
                        const answer = selectedInterview.answers?.find(a => a.questionId === question.questionId);
                        return (
                          <div key={question.questionId} className={`border rounded-lg p-4 ${
                            theme === 'dark' ? 'border-gray-600 bg-gray-800' : 'border-gray-200'
                          }`}>
                            <div className="flex items-start space-x-3">
                              <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-medium">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <p className={`text-sm font-medium mb-2 ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>{question.questionText}</p>
                                {answer ? (
                                  <div className={`border rounded-md p-3 ${
                                    theme === 'dark' 
                                      ? 'bg-green-900/20 border-green-500/30' 
                                      : 'bg-green-50 border-green-200'
                                  }`}>
                                    <p className={`text-sm ${
                                      theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                                    }`}>{answer.userAnswerText}</p>
                                  </div>
                                ) : (
                                  <div className={`border rounded-md p-3 ${
                                    theme === 'dark' 
                                      ? 'bg-gray-700 border-gray-600' 
                                      : 'bg-gray-50 border-gray-200'
                                  }`}>
                                    <p className={`text-sm italic ${
                                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                    }`}>Not answered yet</p>
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
                    <h4 className={`text-sm font-medium mb-3 ${
                      theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                    }`}>Analysis</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className={`border rounded-lg p-4 ${
                        theme === 'dark' 
                          ? 'bg-blue-900/20 border-blue-500/30' 
                          : 'bg-blue-50 border-blue-200'
                      }`}>
                        <h5 className={`text-sm font-medium mb-2 ${
                          theme === 'dark' ? 'text-blue-300' : 'text-blue-800'
                        }`}>Overall Tone</h5>
                        <p className={`text-sm ${
                          theme === 'dark' ? 'text-blue-200' : 'text-blue-700'
                        }`}>{interviewSummary.overallTone || 'Not available'}</p>
                      </div>
                      <div className={`border rounded-lg p-4 ${
                        theme === 'dark' 
                          ? 'bg-green-900/20 border-green-500/30' 
                          : 'bg-green-50 border-green-200'
                      }`}>
                        <h5 className={`text-sm font-medium mb-2 ${
                          theme === 'dark' ? 'text-green-300' : 'text-green-800'
                        }`}>Dominant Personality Traits</h5>
                        <p className={`text-sm ${
                          theme === 'dark' ? 'text-green-200' : 'text-green-700'
                        }`}>
                          {Array.isArray(interviewSummary.dominantPersonalityTraits)
                            ? interviewSummary.dominantPersonalityTraits.join(', ')
                            : 'Not available'}
                        </p>
                      </div>
                      <div className={`border rounded-lg p-4 ${
                        theme === 'dark' 
                          ? 'bg-purple-900/20 border-purple-500/30' 
                          : 'bg-purple-50 border-purple-200'
                      }`}>
                        <h5 className={`text-sm font-medium mb-2 ${
                          theme === 'dark' ? 'text-purple-300' : 'text-purple-800'
                        }`}>Dominant Soft Skills</h5>
                        <p className={`text-sm ${
                          theme === 'dark' ? 'text-purple-200' : 'text-purple-700'
                        }`}>
                          {Array.isArray(interviewSummary.dominantSoftSkills)
                            ? interviewSummary.dominantSoftSkills.join(', ')
                            : 'Not available'}
                        </p>
                      </div>
                      <div className={`border rounded-lg p-4 ${
                        theme === 'dark' 
                          ? 'bg-yellow-900/20 border-yellow-500/30' 
                          : 'bg-yellow-50 border-yellow-200'
                      }`}>
                        <h5 className={`text-sm font-medium mb-2 ${
                          theme === 'dark' ? 'text-yellow-300' : 'text-yellow-800'
                        }`}>Strengths</h5>
                        <p className={`text-sm ${
                          theme === 'dark' ? 'text-yellow-200' : 'text-yellow-700'
                        }`}>
                          {Array.isArray(interviewSummary.strengths)
                            ? interviewSummary.strengths.join(', ')
                            : 'Not available'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {isLoadingSummary && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                    <span className={`ml-3 text-sm ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>Loading summary...</span>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className={`px-4 py-2 border rounded-md text-sm font-medium transition-all duration-200 ${
                    theme === 'dark' 
                      ? 'border-gray-600 text-gray-300 bg-gray-800 hover:bg-gray-700' 
                      : 'border-gray-200 text-gray-700 bg-gray-100 hover:bg-gray-200'
                  }`}
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