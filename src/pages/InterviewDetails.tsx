import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  StarIcon,
  ChatBubbleLeftRightIcon,
  MicrophoneIcon,
  DocumentTextIcon,
  LightBulbIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { getValidToken } from '../utils/auth';
import { useTheme } from '../context/ThemeContext';

interface Question {
  questionId: number;
  questionText: string;
  difficultyLevel: string;
  questionMark: number;
  isSubQuestion?: boolean;
  parentQuestionId?: number;
}

interface Answer {
  userAnswerId: number;
  questionId: number;
  userAnswerText: string;
  userAnswerNotes: string;
  aiFeedback?: {
    score: number;
    feedback: string;
    strengths?: string[];
    areasForImprovement?: string[];
  };
}

interface InterviewDetails {
  id: string;
  title: string;
  date: string;
  time: string;
  status: string;
  type: string;
  duration: number;
  questionCount: number;
  answerCount: number;
  mark: number;
  interviewType: number; // 0 for Chat, 1 for Voice
  startedAt: string;
  questions: Question[];
  answers: Answer[];
  feedback?: {
    score: number;
    strengths: string[];
    areasForImprovement: string[];
  };
  isFinished: boolean;
}

const InterviewDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [interview, setInterview] = useState<InterviewDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchInterviewDetails();
    }
  }, [id]);

  const fetchInterviewDetails = async () => {
    try {
      setIsLoading(true);
      const token = await getValidToken();
      
      if (!token) {
        throw new Error('No valid token available');
      }

      // Get interview details using existing endpoint
      const detailsResponse = await fetch(`https://localhost:7127/api/Interview/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!detailsResponse.ok) {
        throw new Error(`Failed to fetch interview details: ${detailsResponse.status}`);
      }

      const details = await detailsResponse.json();
      console.log('Interview details response:', details);

      // Get AI summary if available
      const summaryResponse = await fetch(`https://localhost:7127/api/Interview/${id}/summary/ai`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      let feedback = null;
      if (summaryResponse.ok) {
        try {
          feedback = await summaryResponse.json();
          console.log('AI feedback response:', feedback);
          
          // Transform the feedback to match our expected format
          if (feedback) {
            feedback = {
              score: feedback.Score || feedback.score || 0,
              strengths: feedback.Strengths || feedback.strengths || [],
              areasForImprovement: feedback.Weaknesses || feedback.areasForImprovement || []
            };
          }
        } catch (error) {
          console.warn('Failed to parse AI feedback response:', error);
          feedback = null;
        }
      } else {
        console.warn(`AI summary endpoint returned ${summaryResponse.status}: ${summaryResponse.statusText}`);
      }

      // Handle case where backend returns empty or unexpected data
      if (!details || (typeof details === 'object' && Object.keys(details).length === 0)) {
        throw new Error('No interview data received from server');
      }

      // Transform the data to match our interface with more robust fallbacks
      const transformedInterview: InterviewDetails = {
        id: details.interviewId || details.id || id,
        title: details.title || `Interview ${id}`,
        date: details.startedAt || details.date || new Date().toISOString(),
        time: details.startedAt || details.time || new Date().toISOString(),
        status: details.status || 'completed',
        type: details.type || 'technical',
        duration: details.duration || 45,
        questionCount: details.questionCount || (details.questions ? details.questions.length : 0),
        answerCount: details.answerCount || (details.answers ? details.answers.length : 0),
        mark: details.interviewMark || details.mark || 0,
        interviewType: details.interviewType || 0,
        startedAt: details.startedAt || details.date || new Date().toISOString(),
        questions: Array.isArray(details.questions) ? details.questions : [],
        answers: Array.isArray(details.answers) ? details.answers : [],
        feedback: feedback,
        isFinished: details.isFinished !== undefined ? details.isFinished : true
      };

      console.log('Transformed interview data:', transformedInterview);
      setInterview(transformedInterview);
    } catch (error) {
      console.error('Error fetching interview details:', error);
      setError(error instanceof Error ? error.message : 'Failed to load interview details');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeInfo = (type: number) => {
    switch (type) {
      case 0:
        return {
          label: 'Text Interview',
          icon: ChatBubbleLeftRightIcon,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100 dark:bg-purple-900/20'
        };
      case 1:
        return {
          label: 'Voice Interview',
          icon: MicrophoneIcon,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-100 dark:bg-indigo-900/20'
        };
      default:
        return {
          label: 'Interview',
          icon: DocumentTextIcon,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100 dark:bg-gray-900/20'
        };
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'hard':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAnswerForQuestion = (questionId: number) => {
    return interview?.answers.find(answer => answer.questionId === questionId);
  };

  const getSubQuestions = (questionId: number) => {
    return interview?.questions.filter(q => q.parentQuestionId === questionId) || [];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <button
              onClick={() => navigate('/interviews')}
              className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Interviews
            </button>
          </div>
          
          <div className="text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Error</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {error || 'Failed to load interview details'}
            </p>
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
              The interview details endpoint might not be available yet. Please try again later.
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/interviews')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Interviews
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const typeInfo = getTypeInfo(interview.interviewType);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/interviews')}
            className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Interviews
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {interview.title}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {formatDate(interview.date)}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${typeInfo.bgColor} ${typeInfo.color}`}>
                <typeInfo.icon className="h-4 w-4 mr-2" />
                {typeInfo.label}
              </div>
              
              <div className="inline-flex items-center px-4 py-2 bg-white dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 rounded-lg text-sm font-semibold shadow-sm">
                <CheckCircleIcon className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                <span className="font-bold">{interview.mark}%</span>
                <span className="ml-1 text-green-600 dark:text-green-400">Score</span>
              </div>
            </div>
          </div>
        </div>

        {/* Interview Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Interview Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center">
              <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">{interview.duration} minutes</p>
              </div>
            </div>
            <div className="flex items-center">
              <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Questions</p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">{interview.questionCount}</p>
              </div>
            </div>
            <div className="flex items-center">
              <StarIcon className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Overall Score</p>
                <p className={`text-lg font-medium ${getScoreColor(interview.mark)}`}>{interview.mark}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Questions and Answers */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Questions & Answers
          </h2>
          
          {interview.questions
            .filter(q => !q.isSubQuestion) // Only show main questions
            .map((question) => {
              const answer = getAnswerForQuestion(question.questionId);
              const subQuestions = getSubQuestions(question.questionId);
              
              return (
                <div key={question.questionId} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* Main Question */}
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">
                        {question.questionText}
                      </h3>
                      <div className="flex items-center space-x-2 ml-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficultyLevel)}`}>
                          {question.difficultyLevel}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {question.questionMark} pts
                        </span>
                      </div>
                    </div>
                    
                    {/* User Answer */}
                    {answer && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Your Answer:
                        </h4>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                            {answer.userAnswerText}
                          </p>
                          {answer.userAnswerNotes && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <strong>Notes:</strong> {answer.userAnswerNotes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* AI Feedback */}
                    {answer?.aiFeedback && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          AI Feedback:
                        </h4>
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Score: {answer.aiFeedback.score}/10
                            </span>
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(answer.aiFeedback.score)} bg-white dark:bg-gray-800`}>
                              {answer.aiFeedback.score >= 8 ? 'Excellent' : answer.aiFeedback.score >= 6 ? 'Good' : 'Needs Improvement'}
                            </div>
                          </div>
                          <p className="text-gray-900 dark:text-white text-sm">
                            {answer.aiFeedback.feedback}
                          </p>
                          
                          {answer.aiFeedback.strengths && answer.aiFeedback.strengths.length > 0 && (
                            <div className="mt-3">
                              <h5 className="text-xs font-medium text-green-700 dark:text-green-400 mb-1 flex items-center">
                                <LightBulbIcon className="h-3 w-3 mr-1" />
                                Strengths:
                              </h5>
                              <ul className="text-xs text-green-600 dark:text-green-300 space-y-1">
                                {answer.aiFeedback.strengths.map((strength, index) => (
                                  <li key={index} className="flex items-start">
                                    <span className="text-green-500 mr-1">•</span>
                                    {strength}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {answer.aiFeedback.areasForImprovement && answer.aiFeedback.areasForImprovement.length > 0 && (
                            <div className="mt-3">
                              <h5 className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-1 flex items-center">
                                <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                                Areas for Improvement:
                              </h5>
                              <ul className="text-xs text-yellow-600 dark:text-yellow-300 space-y-1">
                                {answer.aiFeedback.areasForImprovement.map((area, index) => (
                                  <li key={index} className="flex items-start">
                                    <span className="text-yellow-500 mr-1">•</span>
                                    {area}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Sub Questions */}
                  {subQuestions.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-700">
                      {subQuestions.map((subQuestion) => {
                        const subAnswer = getAnswerForQuestion(subQuestion.questionId);
                        
                        return (
                          <div key={subQuestion.questionId} className="p-4 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 flex-1">
                                {subQuestion.questionText}
                              </h4>
                              <div className="flex items-center space-x-2 ml-4">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(subQuestion.difficultyLevel)}`}>
                                  {subQuestion.difficultyLevel}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {subQuestion.questionMark} pts
                                </span>
                              </div>
                            </div>
                            
                            {subAnswer && (
                              <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                                  {subAnswer.userAnswerText}
                                </p>
                                {subAnswer.aiFeedback && (
                                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-gray-600 dark:text-gray-400">
                                        Score: {subAnswer.aiFeedback.score}/10
                                      </span>
                                      <span className={`text-xs font-medium ${getScoreColor(subAnswer.aiFeedback.score)}`}>
                                        {subAnswer.aiFeedback.score >= 8 ? 'Excellent' : subAnswer.aiFeedback.score >= 6 ? 'Good' : 'Needs Improvement'}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                                      {subAnswer.aiFeedback.feedback}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* Overall Feedback */}
        {interview.feedback && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Overall Interview Feedback
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-green-700 dark:text-green-400 mb-2 flex items-center">
                  <LightBulbIcon className="h-4 w-4 mr-2" />
                  Strengths
                </h3>
                <ul className="space-y-1">
                  {interview.feedback.strengths && interview.feedback.strengths.length > 0 ? (
                    interview.feedback.strengths.map((strength, index) => (
                      <li key={index} className="text-sm text-green-600 dark:text-green-300 flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        {strength}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-gray-500 dark:text-gray-400">No specific strengths identified</li>
                  )}
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-2 flex items-center">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                  Areas for Improvement
                </h3>
                <ul className="space-y-1">
                  {interview.feedback.areasForImprovement && interview.feedback.areasForImprovement.length > 0 ? (
                    interview.feedback.areasForImprovement.map((area, index) => (
                      <li key={index} className="text-sm text-yellow-600 dark:text-yellow-300 flex items-start">
                        <span className="text-yellow-500 mr-2">•</span>
                        {area}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-gray-500 dark:text-gray-400">No specific areas for improvement identified</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewDetails;