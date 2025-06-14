import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getValidToken } from '../utils/auth';
import { useTheme } from '../context/ThemeContext';

interface Question {
  QuestionId: number;
  QuestionText: string;
  DifficultyLevel: number;
  QuestionMark: number;
  ParentQuestionId?: number;
}

interface Answer {
  UserAnswerId: number;
  QuestionId: number;
  UserAnswerText: string;
  UserAnswerNotes: string;
}

interface AnswerAnalysis {
  AnswerAnalysisId: number;
  UserAnswerId: number;
  Tone: string;
  PersonalityTraits: string; // JSON string
  SoftSkills: string; // JSON string
}

interface FeedbackReport {
  FeedbackReportId: number;
  InterviewId: number;
  Strengths: string;
  Weaknesses: string;
  PersonalitySummary: string;
  Recommendation: string;
}

interface InterviewData {
  InterviewId: number;
  InterviewType: string;
  InterviewMark: number;
  UserId: number;
  StartedAt: string;
  FinishedAt?: string;
  IsFinished: boolean;
  ScoreGrade?: string;
  ScoreFeedback?: string;
  Questions: Question[];
  Answers: Answer[];
}

interface InterviewSummary {
  OverallTone: string;
  DominantPersonalityTraits: string[];
  DominantSoftSkills: string[];
  Strengths: string[];
  Weaknesses: string[];
  SuggestedImprovements: string[];
}

interface ScoreBreakdown {
  InterviewId: number;
  TotalScore: number;
  Grade: string;
  Feedback: string;
  ScoreComponents: {
    Completion: {
      Score: number;
      Weight: number;
      WeightedScore: number;
      Description: string;
    };
    Quality: {
      Score: number;
      Weight: number;
      WeightedScore: number;
      Description: string;
    };
    Difficulty: {
      Score: number;
      Weight: number;
      WeightedScore: number;
      Description: string;
    };
    TimeEfficiency: {
      Score: number;
      Weight: number;
      WeightedScore: number;
      Description: string;
    };
  };
  InterviewDetails: {
    TotalQuestions: number;
    AnsweredQuestions: number;
    CompletionRate: number;
    Duration: number;
    AverageTimePerAnswer: number;
  };
}

const InterviewResults: React.FC = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [feedback, setFeedback] = useState<FeedbackReport | null>(null);
  const [summary, setSummary] = useState<InterviewSummary | null>(null);
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (interviewId) {
      fetchInterviewResults();
    }
  }, [interviewId]);

  const fetchInterviewResults = async () => {
    try {
      setIsLoading(true);
      const token = await getValidToken();

      // Fetch interview data
      const interviewResponse = await fetch(`https://localhost:7127/api/Interview/${interviewId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!interviewResponse.ok) {
        throw new Error(`Failed to fetch interview: ${interviewResponse.status}`);
      }

      const interviewData = await interviewResponse.json();
      setInterview(interviewData);

      // Fetch feedback report
      try {
        const feedbackResponse = await fetch(`https://localhost:7127/api/Interview/${interviewId}/feedback`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (feedbackResponse.ok) {
          const feedbackData = await feedbackResponse.json();
          setFeedback(feedbackData);
          console.log('Feedback data loaded successfully:', feedbackData);
        } else {
          const errorText = await feedbackResponse.text();
          console.warn(`Feedback endpoint returned ${feedbackResponse.status}: ${errorText}`);
          
          // If it's a 400 error (no answers), we can handle it gracefully
          if (feedbackResponse.status === 400) {
            console.log('No answers available for feedback generation');
          } else {
            console.error('Failed to fetch feedback:', feedbackResponse.status, errorText);
          }
        }
      } catch (feedbackError) {
        console.warn('Failed to fetch feedback:', feedbackError);
      }

      // Fetch AI summary
      try {
        const summaryResponse = await fetch(`https://localhost:7127/api/Interview/${interviewId}/summary/ai`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          setSummary(summaryData);
        }
      } catch (summaryError) {
        console.warn('Failed to fetch AI summary:', summaryError);
      }

      // Fetch score breakdown
      try {
        const scoreResponse = await fetch(`https://localhost:7127/api/Interview/${interviewId}/score-breakdown`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (scoreResponse.ok) {
          const scoreData = await scoreResponse.json();
          setScoreBreakdown(scoreData);
          console.log('Score breakdown loaded successfully:', scoreData);
        } else {
          const errorText = await scoreResponse.text();
          console.warn(`Score breakdown endpoint returned ${scoreResponse.status}: ${errorText}`);
        }
      } catch (scoreError) {
        console.warn('Failed to fetch score breakdown:', scoreError);
      }

    } catch (error) {
      console.error('Error fetching interview results:', error);
      setError(error instanceof Error ? error.message : 'Failed to load interview results');
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

  const getDifficultyLabel = (level: number) => {
    switch (level) {
      case 0: return 'Intern';
      case 1: return 'Junior';
      case 2: return 'Mid';
      case 3: return 'Senior';
      default: return 'Unknown';
    }
  };

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 1: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 2: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 3: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getAnswerForQuestion = (questionId: number) => {
    return interview?.Answers.find(a => a.QuestionId === questionId);
  };

  const getQuestionsInOrder = () => {
    if (!interview?.Questions) return [];
    
    const mainQuestions = interview.Questions.filter(q => !q.ParentQuestionId);
    const orderedQuestions: Question[] = [];

    mainQuestions.forEach(mainQuestion => {
      orderedQuestions.push(mainQuestion);
      
      // Add follow-up questions
      const followUps = interview.Questions.filter(q => q.ParentQuestionId === mainQuestion.QuestionId);
      orderedQuestions.push(...followUps);
    });

    return orderedQuestions;
  };

  const getQuestionLabel = (question: Question, index: number) => {
    const isMainQuestion = !question.ParentQuestionId;
    
    if (isMainQuestion) {
      const mainQuestionIndex = interview?.Questions.filter(q => !q.ParentQuestionId).findIndex(q => q.QuestionId === question.QuestionId) || 0;
      return `${mainQuestionIndex + 1}`;
    } else {
      const mainQuestionId = question.ParentQuestionId;
      const mainQuestion = interview?.Questions.find(q => q.QuestionId === mainQuestionId);
      if (!mainQuestion) return `${index + 1}`;

      const followUps = interview?.Questions.filter(q => q.ParentQuestionId === mainQuestionId) || [];
      const followUpIndex = followUps.findIndex(q => q.QuestionId === question.QuestionId);
      return String.fromCharCode(65 + followUpIndex); // A, B, C, etc.
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 px-6 bg-gray-100 dark:bg-gray-900">
        <div className="flex items-center justify-center min-h-96">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
            <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Loading interview results...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6 px-6 bg-gray-100 dark:bg-gray-900">
        <div className="flex items-center justify-center min-h-96">
          <div className={`p-8 rounded-lg border max-w-md w-full ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="text-red-400 text-center">
              <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-lg font-semibold mb-2">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="flex-1 p-6 px-6 bg-gray-100 dark:bg-gray-900">
        <div className="flex items-center justify-center min-h-96">
          <div className={`p-8 rounded-lg border max-w-md w-full ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="text-center">
              <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Interview not found</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const questionsInOrder = getQuestionsInOrder();

  return (
    <div className="flex-1 p-6 px-6 bg-gray-100 dark:bg-gray-900">
      <div className="w-full mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <button
                  onClick={() => navigate('/interviews')}
                  className={`p-2 rounded-lg transition-colors ${
                    theme === 'dark' 
                      ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Interview Results
                </h1>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Started</p>
                  <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {formatDate(interview.StartedAt)}
                  </p>
                </div>
                {interview.FinishedAt && (
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Completed</p>
                    <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {formatDate(interview.FinishedAt)}
                    </p>
                  </div>
                )}
                <div>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Type</p>
                  <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {interview.InterviewType}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`text-3xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {interview.InterviewMark}%
              </div>
              <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Score</div>
            </div>
          </div>
        </div>

        {/* Feedback Section */}
        {feedback && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className={`text-xl font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              AI Feedback Report
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                  Strengths
                </h3>
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-green-900/20 border border-green-500/30' : 'bg-green-50 border border-green-200'}`}>
                  <p className={`${theme === 'dark' ? 'text-green-300' : 'text-green-800'}`}>
                    {feedback.Strengths}
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                  Areas for Improvement
                </h3>
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-red-900/20 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`${theme === 'dark' ? 'text-red-300' : 'text-red-800'}`}>
                    {feedback.Weaknesses}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                Personality Summary
              </h3>
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-blue-900/20 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'}`}>
                <p className={`${theme === 'dark' ? 'text-blue-300' : 'text-blue-800'}`}>
                  {feedback.PersonalitySummary}
                </p>
              </div>
            </div>
            
            {feedback.Recommendation && (
              <div className="mt-6">
                <h3 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
                  Recommendation
                </h3>
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-purple-900/20 border border-purple-500/30' : 'bg-purple-50 border border-purple-200'}`}>
                  <p className={`${theme === 'dark' ? 'text-purple-300' : 'text-purple-800'}`}>
                    {feedback.Recommendation}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Summary Section */}
        {summary && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className={`text-xl font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              AI Analysis Summary
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h3 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>
                  Overall Tone
                </h3>
                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-indigo-900/20 border border-indigo-500/30' : 'bg-indigo-50 border border-indigo-200'}`}>
                  <p className={`${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-800'}`}>
                    {summary.OverallTone}
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                  Dominant Personality Traits
                </h3>
                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-green-900/20 border border-green-500/30' : 'bg-green-50 border border-green-200'}`}>
                  <div className="flex flex-wrap gap-2">
                    {summary.DominantPersonalityTraits.map((trait, index) => (
                      <span key={index} className={`px-2 py-1 rounded-full text-xs ${theme === 'dark' ? 'bg-green-800/50 text-green-200' : 'bg-green-200 text-green-800'}`}>
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                  Key Soft Skills
                </h3>
                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-blue-900/20 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'}`}>
                  <div className="flex flex-wrap gap-2">
                    {summary.DominantSoftSkills.map((skill, index) => (
                      <span key={index} className={`px-2 py-1 rounded-full text-xs ${theme === 'dark' ? 'bg-blue-800/50 text-blue-200' : 'bg-blue-200 text-blue-800'}`}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Questions and Answers Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className={`text-xl font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Questions & Answers
          </h2>
          
          <div className="space-y-6">
            {questionsInOrder.map((question, index) => {
              const answer = getAnswerForQuestion(question.QuestionId);
              const isMainQuestion = !question.ParentQuestionId;
              
              return (
                <div key={question.QuestionId} className={`border rounded-lg p-6 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-start space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isMainQuestion ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'}`}>
                      {getQuestionLabel(question, index)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(question.DifficultyLevel)}`}>
                          {getDifficultyLabel(question.DifficultyLevel)}
                        </span>
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {question.QuestionMark} points
                        </span>
                      </div>
                      
                      <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {question.QuestionText}
                      </h3>
                      
                      {answer ? (
                        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-600 border border-gray-500' : 'bg-white border border-gray-300'}`}>
                          <h4 className={`font-medium mb-2 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                            Your Answer:
                          </h4>
                          <p className={`leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            {answer.UserAnswerText}
                          </p>
                          
                          {answer.UserAnswerNotes && (
                            <div className="mt-4 pt-4 border-t border-gray-600">
                              <h5 className={`font-medium mb-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                                Notes:
                              </h5>
                              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {answer.UserAnswerNotes}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-600 border border-gray-500' : 'bg-white border border-gray-300'}`}>
                          <p className={`italic ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            No answer provided
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewResults;