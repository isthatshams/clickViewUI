import React, { useState } from 'react';
import { CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';

interface MockInterview {
  id: string;
  title: string;
  date: string;
  time: string;
}

const Interviews: React.FC = () => {
  const [mockInterviews, setMockInterviews] = useState<MockInterview[]>([
    {
      id: '1',
      title: 'Technical Interview - Algorithms',
      date: '2024-04-28',
      time: '10:00 AM',
    },
    {
      id: '2',
      title: 'Behavioral Interview',
      date: '2024-04-29',
      time: '02:00 PM',
    },
    {
      id: '3',
      title: 'System Design Interview',
      date: '2024-04-30',
      time: '11:30 AM',
    },
  ]);

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
            {/* Add buttons like 'Schedule New Interview' here later */}
            <div>
              <button
                 className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:bg-purple-700 dark:hover:bg-purple-600"
              >
                Schedule Mock Interview
              </button>
            </div>
          </div>
        </div>

        {/* Content Area - Mock Interviews List */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
           <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Mock Interviews</h2>
           <div className="space-y-4">
             {mockInterviews.map(interview => (
               <div key={interview.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:pb-0 last:border-b-0 flex items-center justify-between">
                 <div>
                   <p className="text-lg font-medium text-gray-800 dark:text-white">{interview.title}</p>
                   <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                     <CalendarIcon className="h-4 w-4 mr-1" />
                     <span>{interview.date}</span>
                     <ClockIcon className="h-4 w-4 mr-1 ml-4" />
                     <span>{interview.time}</span>
                   </div>
                 </div>
                 {/* Add action buttons here later (e.g., View Details, Start Interview) */}
                 <div>

                 </div>
               </div>
             ))}
           </div>
        </div>

      </div>
    </div>
  );
};

export default Interviews;