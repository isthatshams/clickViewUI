import React, { PureComponent } from 'react';
import { 
  LightBulbIcon,
  PlayIcon,
  BookOpenIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CalendarIcon,
  CheckIcon,
  StarIcon,
  ClockIcon as ClockOutlineIcon,
} from '@heroicons/react/24/solid';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const data = [
  { name: 'Tu', uv: 300 },
  { name: 'We', uv: 400 },
  { name: 'Th', uv: 12500 },
  { name: 'Fr', uv: 800 },
  { name: 'Sa', uv: 1000 },
  { name: 'Su', uv: 1200 },
];

// Placeholder data for Recent Interviews and Recommendations
const recentInterviews = [
  { id: 1, title: 'Mock Interview - FAANG', date: 'October 26, 2023', result: '75%', reviewLink: '/reviews/1', interestingFact: 'Identified strength in algorithms.' },
  { id: 2, title: 'Coding Practice - Arrays', date: 'October 25, 2023', result: 'Completed', reviewLink: '/reviews/2', interestingFact: 'Solved 15 problems in under an hour.' },
  { id: 3, title: 'System Design - Microservices', date: 'October 24, 2023', result: 'Needs Review', reviewLink: '/reviews/3', interestingFact: 'Focus on scalability and fault tolerance needed.' },
  { id: 4, title: 'Behavioral Questions', date: 'October 23, 2023', result: '90%', reviewLink: '/reviews/4', interestingFact: 'Showcased strong communication skills.' },
  { id: 5, title: 'Mock Interview - Startup', date: 'October 22, 2023', result: 'Completed', reviewLink: '/reviews/5', interestingFact: 'Received positive feedback on problem-solving approach.' },
];

const recommendations = [
  { id: 1, type: 'skill', text: 'Focus on Dynamic Programming', icon: LightBulbIcon },
  { id: 2, type: 'question', text: 'Practice Two Pointer problems', icon: MagnifyingGlassIcon },
  { id: 3, type: 'resource', text: 'Read article on Concurrency', icon: BookOpenIcon },
];

// Custom Tooltip component for dark background - add light background as well
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // Determine background and text color based on theme (checking for dark class on html)
    const isDarkMode = document.documentElement.classList.contains('dark');
    const bgColor = isDarkMode ? 'bg-gray-700' : 'bg-white'; // Adjusted light mode tooltip background
    const textColor = isDarkMode ? 'text-white' : 'text-gray-800'; // Adjusted light mode tooltip text
    
    return (
      <div className={`${bgColor} ${textColor} p-2 rounded-md text-sm shadow-md`}>
        <p className="font-bold">{`${label}`}</p>
        <p>{`Activity: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC = () => {
  const isDarkMode = document.documentElement.classList.contains('dark');

  return (
    <div className="flex-1 p-6 px-6 bg-gray-100 dark:bg-gray-900">
      {/* Inner container for padding and layout */}
      <div className="w-full mx-auto flex flex-col gap-6">

        {/* Top Row: Performance, Recommendations, Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Performance Card */}
          <div className="bg-purple-700 text-white p-6 rounded-lg shadow-md flex flex-col lg:col-span-1 dark:bg-purple-900">
            <h4 className="text-base font-semibold mb-4 dark:text-white">Performance</h4>
            <div className="flex justify-around items-center mb-4">
              <div className="text-center">
                <p className="text-3xl font-bold dark:text-white">75%</p>
                <p className="text-sm text-purple-200 dark:text-purple-300">Success Rate</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold dark:text-white">25%</p>
                <p className="text-sm text-purple-200 dark:text-purple-300">Failure Rate</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center mr-2">
                  <PlusIcon className="h-3 w-3 text-white" />
                </div>
                <p className="text-sm text-purple-200 dark:text-purple-300">Earned Asynchronous programming skill.</p>
              </div>
              <div className="flex items-center">
                <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center mr-2">
                  <ChevronUpIcon className="h-3 w-3 text-white" />
                </div>
                <p className="text-sm text-purple-200 dark:text-purple-300">Improved your explanation skill.</p>
              </div>
              <div className="flex items-center">
                <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center mr-2">
                  <ChevronDownIcon className="h-3 w-3 text-white" />
                </div>
                <p className="text-sm text-purple-200 dark:text-purple-300">Your Dart skills got backed down</p>
              </div>
            </div>
          </div>

          {/* Personalized Recommendations Card */}
          <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2 lg:col-span-1 flex flex-col dark:bg-gray-800">
            <h4 className="text-base font-semibold text-gray-800 mb-4 dark:text-white">Personalized Recommendations</h4>
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <div key={rec.id} className="flex items-start text-gray-700 dark:text-gray-300">
                  <rec.icon className="h-5 w-5 mr-3 flex-shrink-0 text-purple-600 dark:text-purple-400" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">{rec.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Card */}
          <div className="bg-gray-900 text-white p-6 rounded-lg shadow-md md:col-span-2 lg:col-span-2 flex flex-col dark:bg-gray-800 bg-white text-gray-800">
            <h4 className="text-base font-semibold mb-4 text-white dark:text-white text-gray-800">Activity</h4>
            <p className="text-sm text-gray-300 mb-3 dark:text-gray-400 text-gray-600">Your Data updates every day</p>
            <div style={{ width: '100%', height: '200px' }}>
              <ResponsiveContainer>
                <AreaChart
                  data={data}
                  margin={{
                    top: 10, right: 20, left: 0, bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#444" : "#ccc"} vertical={false} />
                  <XAxis dataKey="name" stroke={isDarkMode ? "#999" : "#888"} tick={{ fill: isDarkMode ? '#999' : '#666' }} />
                  <YAxis stroke={isDarkMode ? "#999" : "#888"} tick={{ fill: isDarkMode ? '#999' : '#666' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="uv" stroke={isDarkMode ? "#a78bfa" : "#8884d8"} fill={isDarkMode ? "#a78bfa" : "#8884d8"} fillOpacity={isDarkMode ? 0.5 : 0.3} activeDot={{ r: 6, fill: isDarkMode ? '#a78bfa' : '#8884d8', stroke: isDarkMode ? '#a78bfa' : '#8884d8', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Middle Row: Tip of the Day */}
        <div className="w-full">
           <div className="bg-white p-6 rounded-lg shadow-md flex flex-col dark:bg-gray-800">
            <h4 className="text-base font-semibold text-gray-800 mb-4 dark:text-white">Tip of the Day</h4>
            <div className="flex items-start text-gray-700 dark:text-gray-300">
              <LightBulbIcon className="h-5 w-5 mr-3 flex-shrink-0 text-yellow-500 dark:text-yellow-300" />
              <p className="text-sm text-gray-700 dark:text-gray-300">Remember to think out loud during coding interviews. It helps the interviewer understand your thought process.</p>
            </div>
          </div>
        </div>

        {/* Bottom Section: Interviews and Recent Activity */}
        <div className="flex flex-col gap-6">
           {/* Interviews Card Section */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {/* Today Card */}
            <div className="bg-gray-800 text-white p-6 rounded-lg shadow-md flex flex-col items-start dark:bg-gray-800 bg-white text-gray-800">
              <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center mb-3 dark:bg-purple-700">
                <CalendarIcon className="h-6 w-6 text-white" />
              </div>
              <h5 className="text-sm font-semibold text-gray-300 mb-1 dark:text-gray-400 text-gray-600">Today</h5>
              <p className="text-2xl font-bold text-white dark:text-white text-gray-800">5</p>
            </div>
            
            {/* Answers Card */}
            <div className="bg-gray-800 text-white p-6 rounded-lg shadow-md flex flex-col items-start dark:bg-gray-800 bg-white text-gray-800">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center mb-3 dark:bg-green-600">
                <CheckIcon className="h-6 w-6 text-white" />
              </div>
               <h5 className="text-sm font-semibold text-gray-300 mb-1 dark:text-gray-400 text-gray-600">Answers</h5>
              <p className="text-2xl font-bold text-white dark:text-white text-gray-800">46</p>
            </div>

            {/* Highest Mark Card */}
            <div className="bg-gray-800 text-white p-6 rounded-lg shadow-md flex flex-col items-start dark:bg-gray-800 bg-white text-gray-800">
               <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center mb-3 dark:bg-red-600">
                <StarIcon className="h-6 w-6 text-white" />
              </div>
              <h5 className="text-sm font-semibold text-gray-300 mb-1 dark:text-gray-400 text-gray-600">Highest Mark</h5>
              <p className="text-2xl font-bold text-white dark:text-white text-gray-800">150</p>
            </div>
          </div>

          {/* Recent Interviews List */}
          <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 dark:text-white">Recent Interviews</h4>
            <div className="space-y-4">
              {recentInterviews.slice(0, 4).map((interview) => (
                <div key={interview.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 pb-4 last:border-b-0 dark:border-gray-700">
                  <div className="flex-1 mb-2 sm:mb-0 mr-4">
                    <p className="text-base font-medium text-gray-800 dark:text-white">{interview.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{interview.date}</p>
                    {interview.interestingFact && (
                       <p className="text-sm text-gray-600 italic dark:text-gray-500 mt-1">{interview.interestingFact}</p>
                    )}
                     {interview.reviewLink && (
                       <a href={interview.reviewLink} className="text-sm text-purple-600 hover:underline dark:text-purple-400">Review Details</a>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${interview.result === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : interview.result === 'Needs Review' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'}`}>
                            {interview.result}
                         </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard; 