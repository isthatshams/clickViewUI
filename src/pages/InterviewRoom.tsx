import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getValidToken } from '../utils/auth';

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
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [interviewType, setInterviewType] = useState<'Chat' | 'Voice'>('Chat');

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
        // Interview completed
        navigate('/interviews');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setError('Failed to submit answer');
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
  const currentAnswer = answers.find(a => a.questionId === currentQuestion?.questionId);

  return (
    <div className="flex-1 p-6 bg-gray-100 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                {interviewType} Interview
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            <div className="text-lg font-semibold text-gray-800 dark:text-white">
              Time Left: {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
          <div className="mb-4">
            <span className="inline-block px-3 py-1 text-sm font-semibold text-purple-600 bg-purple-100 rounded-full">
              {currentQuestion.difficultyLevel}
            </span>
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              {currentQuestion.questionMark} points
            </span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            {currentQuestion.questionText}
          </h2>
        </div>

        {/* Answer Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Answer
            </label>
            <textarea
              value={currentAnswer?.userAnswerText || ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
              className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Type your answer here..."
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={currentAnswer?.userAnswerNotes || ''}
              onChange={(e) => handleNotesChange(e.target.value)}
              className="w-full h-24 p-3 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Add any notes or thoughts here..."
            />
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300"
          >
            Previous Question
          </button>
          <button
            onClick={handleSubmitAnswer}
            disabled={isSubmitting}
            className="px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : currentQuestionIndex === questions.length - 1 ? 'Finish Interview' : 'Submit & Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewRoom; 