import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getValidToken } from '../utils/auth';

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

const TextInterviewRoom: React.FC = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

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
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to fetch interview questions: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Received interview data:', data);

      // Handle both capitalized and lowercase property names
      const questions = data.Questions || data.questions;
      const answers = data.Answers || data.answers;

      if (!questions || !Array.isArray(questions)) {
        throw new Error('Invalid interview data format: questions array is missing or invalid');
      }

      setQuestions(questions);
      setAnswers(answers || []);
      setTimeLeft(45 * 60); // Default 45 minutes
    } catch (error) {
      console.error('Error fetching interview questions:', error);
      setError(error instanceof Error ? error.message : 'Failed to load interview questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (answerText: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    const existingAnswerIndex = answers.findIndex(a => a.QuestionId === currentQuestion.QuestionId);

    if (existingAnswerIndex >= 0) {
      const updatedAnswers = [...answers];
      updatedAnswers[existingAnswerIndex] = {
        ...updatedAnswers[existingAnswerIndex],
        UserAnswerText: answerText
      };
      setAnswers(updatedAnswers);
    } else {
      setAnswers([...answers, {
        UserAnswerId: 0, // This will be set by the backend
        QuestionId: currentQuestion.QuestionId,
        UserAnswerText: answerText,
        UserAnswerNotes: ''
      }]);
    }
  };

  const handleNotesChange = (notes: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    const existingAnswerIndex = answers.findIndex(a => a.QuestionId === currentQuestion.QuestionId);

    if (existingAnswerIndex >= 0) {
      const updatedAnswers = [...answers];
      updatedAnswers[existingAnswerIndex] = {
        ...updatedAnswers[existingAnswerIndex],
        UserAnswerNotes: notes
      };
      setAnswers(updatedAnswers);
    }
  };

  const handleSubmitAnswer = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers.find(a => a.QuestionId === currentQuestion.QuestionId);

    if (!currentAnswer) {
      setError('Please provide an answer before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getValidToken();
      const response = await fetch(`https://localhost:7127/api/Interview/chat/answer-next`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interviewId: parseInt(interviewId!),
          questionId: currentQuestion.QuestionId,
          userAnswerText: currentAnswer.UserAnswerText
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to submit answer');
      }

      const result = await response.json();
      
      // If there's a follow-up question, add it to the questions list
      if (result.question) {
        const newQuestion: Question = {
          QuestionId: result.questionId,
          QuestionText: result.question,
          DifficultyLevel: currentQuestion.DifficultyLevel,
          QuestionMark: 5,
          ParentQuestionId: currentQuestion.QuestionId
        };
        setQuestions(prev => [...prev, newQuestion]);
      }

      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1);
    } catch (error) {
      console.error('Error submitting answer:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers.find(a => a.QuestionId === currentQuestion?.QuestionId);

  return (
    <div className="flex-1 p-6 bg-gray-100 min-h-screen">
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
        {/* Header with Timer */}
        <div className="bg-white p-6 rounded-lg shadow-md flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Interview Session</h1>
              <p className="text-sm text-gray-600">Let's explore your expertise together</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 bg-gray-100 px-4 py-2 rounded-full">
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-lg font-semibold text-gray-700">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-purple-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>

        {/* Question Navigation */}
        <div className="flex justify-center space-x-2">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`px-3 py-1 rounded-full transition-all duration-300 ${
                currentQuestionIndex === index
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {/* Question Card */}
        <div className="relative">
          <div className="absolute -left-4 top-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
            Q
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md ml-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="px-4 py-1.5 text-sm font-medium rounded-full bg-purple-100 text-purple-800">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span className="px-4 py-1.5 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                  {currentQuestion.DifficultyLevel === 0 ? 'Internship' : 
                   currentQuestion.DifficultyLevel === 1 ? 'Junior' : 
                   currentQuestion.DifficultyLevel === 2 ? 'Mid' : 'Senior'}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-500">
                {currentQuestion.QuestionMark} points
              </span>
            </div>
            <p className="text-lg text-gray-900 leading-relaxed">{currentQuestion.QuestionText}</p>
          </div>
        </div>

        {/* Answer Section */}
        <div className="relative">
          <div className="absolute -left-4 top-0 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
            A
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md ml-4">
            <div className="space-y-6">
              <div>
                <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Answer
                </label>
                <div className="relative">
                  <textarea
                    id="answer"
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    placeholder="Share your thoughts and expertise..."
                    value={currentAnswer?.UserAnswerText || ''}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                    Press Enter to submit
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-4">
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="group px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
          >
            <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Previous Question</span>
          </button>
          <button
            onClick={handleSubmitAnswer}
            disabled={isSubmitting || !currentAnswer?.UserAnswerText}
            className="group px-8 py-3 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>Submit Answer</span>
                <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextInterviewRoom; 