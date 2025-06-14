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

const TextInterviewRoom: React.FC = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [isQuestionsPanelCollapsed, setIsQuestionsPanelCollapsed] = useState(false);
  const [completedQuestions, setCompletedQuestions] = useState<Set<number>>(new Set());
  const [showExitModal, setShowExitModal] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [showCompletionAlert, setShowCompletionAlert] = useState(false);
  const [completionMessage, setCompletionMessage] = useState('');

  useEffect(() => {
    fetchInterviewQuestions();
  }, [interviewId]);

  useEffect(() => {
    console.log(`Timer useEffect triggered - timeLeft: ${timeLeft}, questions.length: ${questions.length}`);

    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Interview ends when timer reaches 0
            console.log('Timer reached 0, ending interview');
            handleInterviewEnd('Time limit reached');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && questions.length > 0) {
      // If timer is 0 and we have questions, check if this is a fresh interview
      const hasAnswers = answers.length > 0;
      if (hasAnswers) {
        console.log('Timer is 0 and questions exist with answers, ending interview');
        handleInterviewEnd('Time limit reached');
      } else if (endTime) {
        // Recalculate timer using the stored end time
        const now = new Date();
        const remainingTime = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));
        console.log(`Recalculating timer from end time: ${remainingTime} seconds remaining`);
        setTimeLeft(remainingTime);
      } else {
        console.log('No end time available, setting default timer');
        setTimeLeft(45 * 60);
      }
    }
  }, [timeLeft, questions.length, answers.length, endTime]);

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
      const startedAt = data.StartedAt || data.startedAt;

      if (!questions || !Array.isArray(questions)) {
        throw new Error('Invalid interview data format: questions array is missing or invalid');
      }

      setQuestions(questions);
      setAnswers(answers || []);

      // Calculate timer based on StartedAt from backend
      const interviewTimeLimit = 45 * 60; // 45 minutes in seconds

      if (startedAt) {
        // Parse the start time from backend
        let startTime: Date;

        // Since we're now storing local time, we can directly parse it
        if (startedAt.includes('Z') || startedAt.includes('+') || startedAt.includes('-')) {
          // Has timezone info - parse as is
          startTime = new Date(startedAt);
        } else {
          // No timezone info - treat as local time (which it now is)
          startTime = new Date(startedAt);
          console.log(`Parsed local time ${startedAt} as: ${startTime.toLocaleString()}`);
        }

        const calculatedEndTime = new Date(startTime.getTime() + (interviewTimeLimit * 1000)); // Add 45 minutes in milliseconds
        const now = new Date();

        // Calculate remaining time by subtracting current time from end time
        let remainingTime = Math.max(0, Math.floor((calculatedEndTime.getTime() - now.getTime()) / 1000));

        // If remaining time is 0 but this is a fresh interview, there might be a timezone issue
        // In that case, assume the interview just started and set it to full time
        if (remainingTime === 0 && answers.length === 0) {
          console.log('Timer shows 0 but no answers - possible timezone issue, setting to full time');
          remainingTime = interviewTimeLimit;
          // Recalculate end time from now
          const newEndTime = new Date(now.getTime() + (interviewTimeLimit * 1000));
          setEndTime(newEndTime);
        } else {
          setEndTime(calculatedEndTime);
        }

        // Additional safety check: if this is a very fresh interview (less than 1 minute old), 
        // ensure it has at least 44 minutes remaining
        const timeSinceStart = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        if (timeSinceStart < 60 && remainingTime < (44 * 60)) { // Less than 1 minute old and less than 44 minutes remaining
          console.log('Very fresh interview detected, ensuring minimum time remaining');
          remainingTime = Math.max(remainingTime, 44 * 60);
          const safetyEndTime = new Date(now.getTime() + (remainingTime * 1000));
          setEndTime(safetyEndTime);
        }

        setTimeLeft(remainingTime);

        // Detailed debugging
        console.log('=== TIMER DEBUGGING ===');
        console.log(`Raw StartedAt from backend: ${startedAt}`);
        console.log(`Parsed start time: ${startTime.toISOString()}`);
        console.log(`Calculated end time: ${calculatedEndTime.toISOString()}`);
        console.log(`Current time: ${now.toISOString()}`);
        console.log(`Start time timestamp: ${startTime.getTime()}`);
        console.log(`End time timestamp: ${calculatedEndTime.getTime()}`);
        console.log(`Current time timestamp: ${now.getTime()}`);
        console.log(`Time difference (end - current): ${calculatedEndTime.getTime() - now.getTime()} ms`);
        console.log(`Interview time limit: ${interviewTimeLimit} seconds`);
        console.log(`Remaining time: ${remainingTime} seconds`);
        console.log(`Time zone offset: ${now.getTimezoneOffset()} minutes`);
        console.log(`Number of answers: ${answers.length}`);
        console.log(`Time since start: ${timeSinceStart} seconds`);
        console.log('=== END DEBUGGING ===');

        // If interview has already expired, it will be handled by the timer useEffect
      } else {
        // Fallback to default time if no start time available
        const now = new Date();
        const calculatedEndTime = new Date(now.getTime() + (interviewTimeLimit * 1000));
        setEndTime(calculatedEndTime);
        setTimeLeft(interviewTimeLimit);
        console.log('No start time available, using default timer:', interviewTimeLimit, 'seconds');
      }

      // Initialize completed questions based on existing answers
      if (answers && Array.isArray(answers)) {
        const completedQuestionIds = new Set<number>();
        answers.forEach((answer: Answer) => {
          completedQuestionIds.add(answer.QuestionId);
        });
        setCompletedQuestions(completedQuestionIds);
      }
    } catch (error) {
      console.error('Error fetching interview questions:', error);
      setError(error instanceof Error ? error.message : 'Failed to load interview questions');
    } finally {
      setIsLoading(false);
    }
  };

  // Set current question index after questions are loaded
  useEffect(() => {
    if (questions.length > 0) {
      const orderedQuestions = getQuestionsInOrder();
      const firstUnansweredIndex = orderedQuestions.findIndex(question => !completedQuestions.has(question.QuestionId));
      if (firstUnansweredIndex !== -1) {
        setCurrentQuestionIndex(firstUnansweredIndex);
      }
    }
  }, [questions, completedQuestions]);

  const handleAnswerChange = (answerText: string) => {
    const currentQuestion = getQuestionsInOrder()[currentQuestionIndex];
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
    const currentQuestion = getQuestionsInOrder()[currentQuestionIndex];
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
    const currentQuestion = getQuestionsInOrder()[currentQuestionIndex];
    const currentAnswer = answers.find(a => a.QuestionId === currentQuestion.QuestionId);

    if (!currentAnswer) {
      setError('Please provide an answer before submitting');
      return;
    }

    if (!currentAnswer.UserAnswerText.trim()) {
      setError('Please enter an answer before submitting');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const token = await getValidToken();

      // Check if this is an edit (answer already exists in database) or new answer
      const isEdit = currentAnswer.UserAnswerId > 0;
      const endpoint = isEdit ? 'chat/edit-answer' : 'chat/answer-next';

      const requestBody = isEdit ? {
        interviewId: parseInt(interviewId!),
        questionId: currentQuestion.QuestionId,
        newAnswerText: currentAnswer.UserAnswerText
      } : {
        interviewId: parseInt(interviewId!),
        questionId: currentQuestion.QuestionId,
        userAnswerText: currentAnswer.UserAnswerText
      };

      console.log('Submitting answer:', {
        endpoint,
        isEdit,
        requestBody,
        currentQuestion: currentQuestion,
        currentAnswer: currentAnswer
      });

      const response = await fetch(`https://localhost:7127/api/Interview/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.error('Error response data:', errorData);
          errorMessage = errorData?.message || errorData?.error || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Success response:', result);
      
      // Mark current question as completed only after successful submission
      setCompletedQuestions(prev => new Set([...prev, currentQuestion.QuestionId]));
      
      // Update the answer with the UserAnswerId from the backend (for new answers)
      if (!isEdit && result.userAnswerId) {
        setAnswers(prev => prev.map(a => 
          a.QuestionId === currentQuestion.QuestionId 
            ? { ...a, UserAnswerId: result.userAnswerId }
            : a
        ));
      }
      
      // Handle the new AI response format with should_continue
      if (result.should_continue === false) {
        // AI determined the answer is sufficient
        console.log('AI response: Answer accepted', result.reason);
        
        if (result.interview_completed) {
          // Interview is completed
          console.log('Interview completed:', result.message);
          const farewellMessage = result.farewell_message || result.message || 'Thank you, you\'ve completed all questions. We will review your answers.';
          setCompletionMessage(farewellMessage);
          setShowCompletionAlert(true);
          setTimeout(() => {
            setShowCompletionAlert(false);
            handleInterviewEnd('Interview completed - all questions answered satisfactorily');
          }, 4000); // Give user time to read the completion message
          return;
        } else if (result.next_question_id) {
          // Move to the next main question
          console.log('Moving to next main question:', result.next_question_text);
          setSuccess('Great answer! Moving to the next question.');
          
          // Find the index of the next question in the questions array
          const nextQuestionIndex = questions.findIndex(q => q.QuestionId === result.next_question_id);
          if (nextQuestionIndex !== -1) {
            setCurrentQuestionIndex(nextQuestionIndex);
          } else {
            // If the next question is not in the current questions array, 
            // we need to fetch the updated questions from the backend
            await fetchInterviewQuestions();
          }
          
          // Clear success message after 3 seconds
          setTimeout(() => setSuccess(null), 3000);
        }
      } else if (result.should_continue === true && result.question) {
        // AI wants to continue with a follow-up question
        console.log('AI response: Continue with follow-up', result.reason);
        
        if (isEdit) {
          // Handle edit response - remove old follow-up questions and add new ones
          const questionsToDelete = getQuestionsToDelete(currentQuestion.QuestionId);
          
          // Remove questions that should be deleted
          setQuestions(prev => {
            const newQuestions = prev.filter(q => !questionsToDelete.includes(q.QuestionId));
            
            // Add the new follow-up question
            const newQuestion: Question = {
              QuestionId: result.questionId,
              QuestionText: result.question,
              DifficultyLevel: currentQuestion.DifficultyLevel,
              QuestionMark: 5,
              ParentQuestionId: currentQuestion.QuestionId
            };
            
            // Find the position to insert the new question
            const currentIndex = newQuestions.findIndex(q => q.QuestionId === currentQuestion.QuestionId);
            if (currentIndex !== -1) {
              newQuestions.splice(currentIndex + 1, 0, newQuestion);
            }
            
            return newQuestions;
          });
          
          // Update answers to remove deleted questions
          setAnswers(prev => prev.filter(a => !questionsToDelete.includes(a.QuestionId)));
          
          // Update completed questions to remove deleted questions
          setCompletedQuestions(prev => {
            const newCompleted = new Set(prev);
            questionsToDelete.forEach(id => newCompleted.delete(id));
            return newCompleted;
          });
          
          // Move to the new follow-up question
          setCurrentQuestionIndex(prev => prev + 1);
        } else {
          // Handle new answer response with follow-up
          const newQuestion: Question = {
            QuestionId: result.questionId,
            QuestionText: result.question,
            DifficultyLevel: currentQuestion.DifficultyLevel,
            QuestionMark: 5,
            ParentQuestionId: currentQuestion.QuestionId
          };
          
          // Insert the follow-up question right after the current question
          setQuestions(prev => {
            const newQuestions = [...prev];
            newQuestions.splice(currentQuestionIndex + 1, 0, newQuestion);
            return newQuestions;
          });
          
          // Move to next question
          setCurrentQuestionIndex(prev => prev + 1);
        }
      } else {
        // Fallback: no follow-up question or should_continue not provided
        console.log('No follow-up question or should_continue not provided');
        
        if (!isEdit) {
          // For new answers without follow-ups, move to next question
          setCurrentQuestionIndex(prev => prev + 1);
        }
        // If it's an edit, stay on current question
      }

    } catch (error) {
      console.error('Error submitting answer:', error);

      // Provide more specific error messages based on the error
      let userErrorMessage = 'Failed to submit answer';
      if (error instanceof Error) {
        if (error.message.includes('500')) {
          userErrorMessage = 'Server error occurred. Please try again or contact support if the problem persists.';
        } else if (error.message.includes('401')) {
          userErrorMessage = 'Session expired. Please refresh the page and try again.';
        } else if (error.message.includes('404')) {
          userErrorMessage = 'Interview not found. Please return to the interviews page.';
        } else {
          userErrorMessage = error.message;
        }
      }

      setError(userErrorMessage);
      setSuccess(null);

      // If it's a server error, we might want to show a retry option
      if (error instanceof Error && error.message.includes('500')) {
        console.warn('Server error detected - user may need to retry or contact support');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleInterviewEnd = async (reason: string) => {
    console.log(`Interview ended: ${reason}`);
    
    // Set loading state for exit button
    setIsExiting(true);

    try {
      // Only call the backend to mark the interview as finished if it's not already completed by AI
      // The AI completion already marks the interview as finished in the database
      if (!reason.includes('Interview completed - all questions answered satisfactorily')) {
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
      } else {
        console.log('Interview already completed by AI, skipping backend call');
      }
    } catch (error) {
      console.error('Error ending interview:', error);
    } finally {
      // Reset loading state
      setIsExiting(false);
    }

    // Navigate to interviews page
    navigate('/interviews');
  };

  // Helper function to find the main question (root) of any question
  const findMainQuestion = (questionId: number): number => {
    const question = questions.find(q => q.QuestionId === questionId);
    if (!question) return -1;

    // If no parent, it's a main question
    if (!question.ParentQuestionId) return questionId;

    // Recursively find the root parent
    return findMainQuestion(question.ParentQuestionId);
  };

  // Helper function to get all questions in a branch (main question + all its follow-ups)
  const getBranchQuestions = (mainQuestionId: number): Question[] => {
    const branchQuestions: Question[] = [];
    const mainQuestion = questions.find(q => q.QuestionId === mainQuestionId);
    if (!mainQuestion) return branchQuestions;

    branchQuestions.push(mainQuestion);

    // Find all direct and indirect children
    const findChildren = (parentId: number) => {
      const children = questions.filter(q => q.ParentQuestionId === parentId);
      children.forEach(child => {
        branchQuestions.push(child);
        findChildren(child.QuestionId);
      });
    };

    findChildren(mainQuestionId);
    return branchQuestions;
  };

  // Helper function to get all question IDs that should be deleted when editing a question
  const getQuestionsToDelete = (editedQuestionId: number): number[] => {
    const question = questions.find(q => q.QuestionId === editedQuestionId);
    if (!question) return [];

    const questionsToDelete: number[] = [];

    // If editing a main question, delete all its follow-ups
    if (!question.ParentQuestionId) {
      const branchQuestions = getBranchQuestions(editedQuestionId);
      questionsToDelete.push(...branchQuestions.filter(q => q.QuestionId !== editedQuestionId).map(q => q.QuestionId));
    } else {
      // If editing a follow-up question, delete all subsequent follow-ups in the same branch
      const mainQuestionId = findMainQuestion(editedQuestionId);
      const branchQuestions = getBranchQuestions(mainQuestionId);

      // Find the index of the edited question in the branch
      const editedIndex = branchQuestions.findIndex(q => q.QuestionId === editedQuestionId);
      if (editedIndex !== -1) {
        // Delete all questions that come after the edited question in the branch
        for (let i = editedIndex + 1; i < branchQuestions.length; i++) {
          questionsToDelete.push(branchQuestions[i].QuestionId);
        }
      }
    }

    return questionsToDelete;
  };

  // Helper function to get questions in proper display order (main questions first, then their follow-ups)
  const getQuestionsInOrder = (): Question[] => {
    const mainQuestions = questions.filter(q => !q.ParentQuestionId);
    const orderedQuestions: Question[] = [];

    mainQuestions.forEach(mainQuestion => {
      // Add main question
      orderedQuestions.push(mainQuestion);

      // Add all follow-ups for this main question
      const branchQuestions = getBranchQuestions(mainQuestion.QuestionId);
      branchQuestions.forEach(question => {
        if (question.QuestionId !== mainQuestion.QuestionId) {
          orderedQuestions.push(question);
        }
      });
    });

    return orderedQuestions;
  };

  // Helper function to get question label (number for main questions, alphabet for sub-questions)
  const getQuestionLabel = (question: Question, index: number): string => {
    const isMainQuestion = !question.ParentQuestionId;

    if (isMainQuestion) {
      // For main questions, use the main question number
      const mainQuestionIndex = questions.filter(q => !q.ParentQuestionId).findIndex(q => q.QuestionId === question.QuestionId);
      return `${mainQuestionIndex + 1}`;
    } else {
      // For sub-questions, find the main question and count sub-questions
      const mainQuestionId = findMainQuestion(question.QuestionId);
      const mainQuestion = questions.find(q => q.QuestionId === mainQuestionId);
      if (!mainQuestion) return `${index + 1}`;

      const branchQuestions = getBranchQuestions(mainQuestionId);
      const subQuestionIndex = branchQuestions.findIndex(q => q.QuestionId === question.QuestionId) - 1; // -1 because first is main question

      // Convert to alphabet (A, B, C, etc.)
      return String.fromCharCode(65 + subQuestionIndex); // 65 is ASCII for 'A'
    }
  };

  // Function to recalculate timer from end time
  const recalculateTimer = () => {
    if (endTime) {
      const now = new Date();
      const remainingTime = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));
      setTimeLeft(remainingTime);
      console.log(`Timer recalculated: ${remainingTime} seconds remaining`);
      return remainingTime;
    }
    return 0;
  };

  // Periodically recalculate timer to ensure accuracy (every 30 seconds)
  useEffect(() => {
    if (endTime && timeLeft > 0) {
      const interval = setInterval(() => {
        const newTimeLeft = recalculateTimer();
        if (newTimeLeft === 0) {
          handleInterviewEnd('Time limit reached');
        }
      }, 30000); // Recalculate every 30 seconds

      return () => clearInterval(interval);
    }
  }, [endTime, timeLeft]);

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

  const currentQuestion = getQuestionsInOrder()[currentQuestionIndex];
  const currentAnswer = answers.find(a => a.QuestionId === currentQuestion?.QuestionId);

  // Safety check for when questions are not loaded yet
  if (!currentQuestion) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-gray-100'}`}>
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
          <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-screen flex flex-col ${theme === 'dark' ? 'bg-black' : 'bg-gray-100'}`}>
      <div className="w-full h-full flex flex-col">
        {/* Header with Timer - Compact */}
        <div className={`border-b px-6 py-4 shadow-2xl flex justify-between items-center ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
          }`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Interview Session</h1>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Question {currentQuestion ? getQuestionLabel(currentQuestion, currentQuestionIndex) : currentQuestionIndex + 1} of {getQuestionsInOrder().length}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`inline-flex items-center px-3 py-1.5 border rounded-lg text-sm font-medium transition-all duration-200 ${theme === 'dark'
                ? 'border-gray-600 text-gray-300 bg-gray-800 hover:bg-gray-700'
                : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
              }`}>
              <svg className="w-4 h-4 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">{formatTime(timeLeft)}</span>
            </div>
            <button
              onClick={() => setShowExitModal(true)}
              disabled={isExiting}
              className={`inline-flex items-center px-3 py-1.5 border focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all duration-200 ${
                theme === 'dark' ?
                  'border-red-500/30 rounded-lg text-sm font-medium text-red-400 bg-red-900/20 hover:bg-red-900/40 disabled:opacity-50 disabled:cursor-not-allowed'
                  : 'border-red-500/30 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
            {isExiting ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Exiting...</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Exit</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar - Full Width */}
      <div className={`w-full h-1 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}>
        <div
          className="bg-gradient-to-r from-purple-500 to-blue-500 h-1 transition-all duration-700 ease-out"
          style={{ width: `${((currentQuestionIndex + 1) / Math.max(getQuestionsInOrder().length, 1)) * 100}%` }}
        ></div>
      </div>

      {/* Main Content Area - Full Height */}
      <div className="flex-1 flex min-h-0">
        {/* Foldable Questions Panel */}
        <div className={`transition-all duration-300 ease-in-out ${isQuestionsPanelCollapsed ? 'w-16' : 'w-80'
          }`}>
          <div className={`shadow-2xl border-r flex flex-col h-full ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
            }`}>
            {/* Header with Toggle */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 text-white flex items-center justify-between">
              {!isQuestionsPanelCollapsed && (
                <div className="flex items-center justify-between w-full">
                  <h3 className="text-sm font-semibold">Questions</h3>
                  <span className="text-xs text-purple-200">
                    {currentQuestion ? getQuestionLabel(currentQuestion, currentQuestionIndex) : currentQuestionIndex + 1}/{getQuestionsInOrder().length}
                  </span>
                </div>
              )}
              <button
                onClick={() => setIsQuestionsPanelCollapsed(!isQuestionsPanelCollapsed)}
                className={`flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 transition-all duration-200 ${isQuestionsPanelCollapsed ? 'ml-0' : 'ml-2'
                  }`}
              >
                <svg
                  className={`w-4 h-4 text-white transition-transform duration-300 ${isQuestionsPanelCollapsed ? 'rotate-180' : ''
                    }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>

            {/* Questions List */}
            <div className={`flex-1 overflow-hidden transition-all duration-300 ${isQuestionsPanelCollapsed ? 'opacity-0' : 'opacity-100'
              }`}>
              <div className="p-3 overflow-y-auto h-full">
                <div className="space-y-2">
                  {getQuestionsInOrder().map((question, index) => {
                    const isMainQuestion = !question.ParentQuestionId;
                    const isCompleted = completedQuestions.has(question.QuestionId);
                    const isCurrent = currentQuestionIndex === index;

                    return (
                      <button
                        key={question.QuestionId}
                        onClick={() => setCurrentQuestionIndex(index)}
                        className={`w-full text-left p-3 rounded-lg transition-all duration-200 group ${isCurrent
                            ? 'bg-purple-900/30 border-2 border-purple-500/50 shadow-lg'
                            : isCompleted
                              ? 'bg-green-900/20 border border-green-500/30 hover:bg-green-900/30'
                              : theme === 'dark'
                                ? 'bg-gray-800 border border-gray-600 hover:bg-gray-700'
                                : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                          } ${isMainQuestion ? 'ml-0' : 'ml-4'}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${isCurrent
                              ? 'bg-purple-500 text-white'
                              : isCompleted
                                ? 'bg-green-500 text-white'
                                : theme === 'dark'
                                  ? 'bg-gray-600 text-gray-300'
                                  : 'bg-gray-300 text-gray-600'
                            }`}>
                            {getQuestionLabel(question, index)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className={`text-sm font-medium truncate ${isCurrent
                                  ? 'text-black'
                                  : theme === 'dark'
                                    ? 'text-gray-300'
                                    : 'text-gray-700'
                                }`}>
                                {isMainQuestion ? `Question ${getQuestionLabel(question, index)}` : `Question ${getQuestionLabel(question, index)}`}
                              </span>
                              <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{question.QuestionMark}p</span>
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`px-2 py-0.5 rounded-full text-xs ${question.DifficultyLevel === 0 ? 'bg-blue-900/30 text-blue-300 border border-blue-500/30' :
                                  question.DifficultyLevel === 1 ? 'bg-green-900/30 text-green-300 border border-green-500/30' :
                                    question.DifficultyLevel === 2 ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-500/30' :
                                      'bg-red-900/30 text-red-300 border border-red-500/30'
                                }`}>
                                {question.DifficultyLevel === 0 ? 'Intern' :
                                  question.DifficultyLevel === 1 ? 'Junior' :
                                    question.DifficultyLevel === 2 ? 'Mid' : 'Senior'}
                              </span>
                              {isCompleted && (
                                <span className="text-xs text-green-400 font-medium">✓</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Collapsed State Indicator */}
            {isQuestionsPanelCollapsed && (
              <div className="flex-1 flex flex-col items-center justify-center p-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500 text-white flex items-center justify-center text-sm font-bold mb-2">
                  {currentQuestionIndex + 1}
                </div>
                <div className={`text-xs text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {currentQuestionIndex + 1}/{questions.length}
                </div>
                <div className={`mt-2 text-xs text-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                  Click to expand
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Question and Answer - Full Width */}
        <div className={`flex-1 flex flex-col ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
          {/* Current Question Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <span className="text-xl font-bold">{currentQuestionIndex + 1}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Current Question</h3>
                  <p className="text-sm text-indigo-200">Share your expertise</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-indigo-200">Difficulty</div>
                <div className="text-lg font-bold">
                  {currentQuestion.DifficultyLevel === 0 ? 'Internship' :
                    currentQuestion.DifficultyLevel === 1 ? 'Junior' :
                      currentQuestion.DifficultyLevel === 2 ? 'Mid' : 'Senior'}
                </div>
              </div>
            </div>
          </div>

          {/* Question and Answer Content */}
          <div className="flex-1 flex flex-col p-8">
            {/* Question Display */}
            <div className={`p-6 rounded-xl border mb-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className={`text-xl leading-relaxed font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>{currentQuestion.QuestionText}</p>
                  <div className="flex items-center space-x-4 mt-4">
                    <div className={`flex items-center space-x-2 px-4 py-2 rounded-full shadow-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                      }`}>
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>Points:</span>
                      <span className="text-lg font-bold text-purple-400">{currentQuestion.QuestionMark}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Answer Section */}
            <div className="flex-1 flex flex-col">
              <div className={`border-2 rounded-xl flex-1 flex flex-col ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                }`}>
                <div className={`px-6 py-4 border-b rounded-t-xl ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                  }`}>
                  <label htmlFor="answer" className={`block text-lg font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                    Your Answer
                  </label>
                </div>
                <div className="flex-1 p-6">
                  <textarea
                    id="answer"
                    className={`w-full h-full resize-none border-0 focus:ring-0 focus:outline-none text-lg leading-relaxed ${theme === 'dark'
                        ? 'bg-gray-800 text-white placeholder-gray-400'
                        : 'bg-white text-gray-900 placeholder-gray-500'
                      }`}
                    placeholder="Share your thoughts and expertise..."
                    value={currentAnswer?.UserAnswerText || ''}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-6">
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className={`group px-8 py-4 text-base font-medium border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-3 ${theme === 'dark'
                    ? 'text-gray-300 bg-gray-800 border-gray-600 hover:bg-gray-700'
                    : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                <span>Previous Question</span>
              </button>
              <button
                onClick={handleSubmitAnswer}
                disabled={isSubmitting || !currentAnswer?.UserAnswerText}
                className="group px-10 py-4 text-base font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-3 shadow-lg"
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
                    <span>{currentAnswer && currentAnswer.UserAnswerId > 0 ? 'Change Answer' : 'Submit Answer'}</span>
                    <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`p-4 border-t ${
          theme === 'dark' ? 'bg-red-900/20 border-red-500/30' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className={`text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
            </div>
            {error.includes('Server error') && (
              <button
                onClick={() => {
                  setError(null);
                  handleSubmitAnswer();
                }}
                disabled={isSubmitting}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-800'
                    : 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400'
                }`}
              >
                {isSubmitting ? 'Retrying...' : 'Retry'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className={`p-4 border-t ${
          theme === 'dark' ? 'bg-green-900/20 border-green-500/30' : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className={`text-sm ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>{success}</p>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`border rounded-xl p-8 max-w-md w-full shadow-2xl ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
            }`}>
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-900/20 mb-4">
                <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                Exit Interview
              </h3>
              <p className={`mb-8 leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                Are you sure you want to exit the interview? Your progress will be saved and you can resume later.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowExitModal(false)}
                  disabled={isExiting}
                  className={`px-6 py-3 border rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'dark'
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
                  disabled={isExiting}
                  className="px-6 py-3 border border-transparent rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExiting ? (
                    <div className="flex items-center space-x-2">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Exiting...</span>
                    </div>
                  ) : (
                    'Exit Interview'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Completion Alert */}
      {showCompletionAlert && (
        <div className={`fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50`}>
          <div className={`border rounded-xl p-8 max-w-md w-full shadow-2xl ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
            }`}>
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-900/20 mb-4">
                <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                Interview Completed
              </h3>
              <p className={`mb-8 leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                {completionMessage}
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setShowCompletionAlert(false);
                    handleInterviewEnd('Interview completed - all questions answered satisfactorily');
                  }}
                  className="px-6 py-3 border border-transparent rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all duration-200 font-medium"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div >
  );
};

export default TextInterviewRoom; 