import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getValidToken } from '../utils/auth';
import { useTheme } from '../context/ThemeContext';

interface Question {
  questionId: number;
  questionText: string;
  difficultyLevel: string;
  questionMark: number;
}

interface Answer {
  userAnswerId: number;
  questionId: number;
  userAnswerText: string;
  userAnswerNotes: string;
}

const InterviewRoom: React.FC = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [interviewType, setInterviewType] = useState<'Chat' | 'Voice'>('Chat');
  const [showExitModal, setShowExitModal] = useState(false);

  useEffect(() => {
    fetchInterviewQuestions();
  }, [interviewId]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  const fetchInterviewQuestions = async () => {
    try {
      if (!interviewId) {
        throw new Error('Interview ID is missing');
      }

      const token = await getValidToken();
      console.log('Fetching interview questions for ID:', interviewId);
      
      const response = await fetch(`https://localhost:7127/api/Interview/${interviewId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to fetch interview questions: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Received interview data:', data);

      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error('Invalid interview data format: questions array is missing or invalid');
      }

      setQuestions(data.questions);
      setAnswers(data.answers || []);
      setInterviewType(data.interviewType || 'Chat');
      setTimeLeft(data.timeLimit || 45 * 60); // Default 45 minutes if not specified
    } catch (error) {
      console.error('Error fetching interview questions:', error);
      setError(error instanceof Error ? error.message : 'Failed to load interview questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (answerText: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    const existingAnswerIndex = answers.findIndex(a => a.questionId === currentQuestion.questionId);

    if (existingAnswerIndex >= 0) {
      const updatedAnswers = [...answers];
      updatedAnswers[existingAnswerIndex] = {
        ...updatedAnswers[existingAnswerIndex],
        userAnswerText: answerText
      };
      setAnswers(updatedAnswers);
    } else {
      setAnswers([...answers, {
        userAnswerId: 0, // This will be set by the backend
        questionId: currentQuestion.questionId,
        userAnswerText: answerText,
        userAnswerNotes: ''
      }]);
    }
  };

  const handleNotesChange = (notes: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    const existingAnswerIndex = answers.findIndex(a => a.questionId === currentQuestion.questionId);

    if (existingAnswerIndex >= 0) {
      const updatedAnswers = [...answers];
      updatedAnswers[existingAnswerIndex] = {
        ...updatedAnswers[existingAnswerIndex],
        userAnswerNotes: notes
      };
      setAnswers(updatedAnswers);
    }
  };

  const handleSubmitAnswer = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers.find(a => a.questionId === currentQuestion.questionId);

    if (!currentAnswer) {
      setError('Please provide an answer before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getValidToken();
      const response = await fetch(`https://localhost:7127/api/Interview/${interviewId}/answer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentAnswer),
      });

      if (!response.ok) {
        throw new Error('Failed to submit answer');
      }

      // Move to next question or finish interview
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // Interview completed - call the end endpoint
        await handleInterviewEnd('Interview completed');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setError('Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInterviewEnd = async (reason: string) => {
    console.log(`Interview ended: ${reason}`);
    
    try {
      // Call the backend to mark the interview as finished
      const token = await getValidToken();
      const response = await fetch(`https://localhost:7127/api/Interview/${interviewId}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log('Interview marked as finished successfully');
      } else {
        console.warn('Failed to mark interview as finished:', response.status);
      }
    } catch (error) {
      console.error('Error ending interview:', error);
    }
    
    // Navigate to interviews page
    navigate('/interviews');
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-gray-100'}`}>
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
          <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Loading interview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-gray-100'}`}>
        <div className={`p-8 rounded-lg border max-w-md w-full ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="text-red-400 text-center">
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-lg font-semibold mb-2">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers.find(a => a.questionId === currentQuestion?.questionId);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-black text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className={`border p-6 rounded-xl shadow-2xl mb-8 ${
          theme === 'dark' 
            ? 'bg-gray-900 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex justify-between items-center">
            <div>
              <h1 className={`text-3xl font-bold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {interviewType} Interview
              </h1>
              <div className="flex items-center space-x-4">
                <p className={`text-lg ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
                <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className={`text-2xl font-bold mb-1 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {formatTime(timeLeft)}
                </div>
                <div className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>Time Left</div>
              </div>
              <button
                onClick={() => setShowExitModal(true)}
                className="px-6 py-3 text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg hover:bg-red-900/40 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all duration-200 font-medium"
              >
                Exit Interview
              </button>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className={`border p-8 rounded-xl shadow-2xl mb-8 ${
          theme === 'dark' 
            ? 'bg-gray-900 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <span className="inline-block px-4 py-2 text-sm font-semibold text-purple-300 bg-purple-900/30 border border-purple-500/30 rounded-lg">
                {currentQuestion.difficultyLevel}
              </span>
              <span className={`text-lg ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {currentQuestion.questionMark} points
              </span>
            </div>
            <h2 className={`text-2xl font-semibold leading-relaxed ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {currentQuestion.questionText}
            </h2>
          </div>
        </div>

        {/* Answer Section */}
        <div className={`border p-8 rounded-xl shadow-2xl mb-8 ${
          theme === 'dark' 
            ? 'bg-gray-900 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="mb-6">
            <label className={`block text-lg font-medium mb-3 ${
              theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
            }`}>
              Your Answer
            </label>
            <textarea
              value={currentAnswer?.userAnswerText || ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
              className={`w-full h-40 p-4 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none transition-all duration-200 ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              placeholder="Type your detailed answer here..."
            />
          </div>
          <div className="mb-6">
            <label className={`block text-lg font-medium mb-3 ${
              theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
            }`}>
              Notes (optional)
            </label>
            <textarea
              value={currentAnswer?.userAnswerNotes || ''}
              onChange={(e) => handleNotesChange(e.target.value)}
              className={`w-full h-24 p-4 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none transition-all duration-200 ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              placeholder="Add any additional notes or thoughts here..."
            />
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            disabled={currentQuestionIndex === 0}
            className={`px-8 py-4 border rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-lg ${
              theme === 'dark' 
                ? 'text-gray-300 bg-gray-800 border-gray-600 hover:bg-gray-700' 
                : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
            }`}
          >
            ← Previous Question
          </button>
          <button
            onClick={handleSubmitAnswer}
            disabled={isSubmitting}
            className="px-8 py-4 text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-lg shadow-lg"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                <span>Submitting...</span>
              </div>
            ) : currentQuestionIndex === questions.length - 1 ? (
              'Finish Interview'
            ) : (
              'Submit & Next →'
            )}
          </button>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`border rounded-xl p-8 max-w-md w-full shadow-2xl ${
            theme === 'dark' 
              ? 'bg-gray-900 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-900/20 mb-4">
                <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className={`text-xl font-semibold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Exit Interview
              </h3>
              <p className={`mb-8 leading-relaxed ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Are you sure you want to exit the interview? Your progress will be saved and you can resume later.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowExitModal(false)}
                  className={`px-6 py-3 border rounded-lg transition-all duration-200 font-medium ${
                    theme === 'dark' 
                      ? 'text-gray-300 bg-gray-800 border-gray-600 hover:bg-gray-700' 
                      : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowExitModal(false);
                    handleInterviewEnd('User exited');
                  }}
                  className="px-6 py-3 border border-transparent rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all duration-200 font-medium"
                >
                  Exit Interview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewRoom; 