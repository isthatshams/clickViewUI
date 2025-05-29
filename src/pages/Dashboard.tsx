import React, { PureComponent, useState } from 'react';
import { Link } from 'react-router-dom';
import visualLogoImage from '../assets/Logo Visualed.png';
import { 
  HomeIcon, 
  ClockIcon, 
  DocumentTextIcon, 
  CogIcon, 
  ArrowLeftOnRectangleIcon, 
  CalendarIcon, 
  CheckIcon, 
  ClockIcon as ClockOutlineIcon, 
  StarIcon, 
  PlusIcon, 
  ChevronUpIcon, 
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  LightBulbIcon,
  PlayIcon,
  BookOpenIcon,
  MagnifyingGlassIcon
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
  { id: 1, title: 'Mock Interview - FAANG', date: 'October 26, 2023', result: '75%' },
  { id: 2, title: 'Coding Practice - Arrays', date: 'October 25, 2023', result: 'Completed' },
  { id: 3, title: 'System Design - Microservices', date: 'October 24, 2023', result: 'Needs Review' },
  { id: 4, title: 'Behavioral Questions', date: 'October 23, 2023', result: '90%' },
  { id: 5, title: 'Mock Interview - Startup', date: 'October 22, 2023', result: 'Completed' },
];

const recommendations = [
  { id: 1, type: 'skill', text: 'Focus on Dynamic Programming', icon: LightBulbIcon },
  { id: 2, type: 'question', text: 'Practice Two Pointer problems', icon: MagnifyingGlassIcon },
  { id: 3, type: 'resource', text: 'Read article on Concurrency', icon: BookOpenIcon },
];

// Custom Tooltip component for dark background
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-700 text-white p-2 rounded-md text-sm shadow-md">
        <p className="font-bold">{`${label}`}</p>
        <p>{`Activity: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Start closed by default for mobile

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Mobile Sidebar Toggle Button (Visible only on small screens when sidebar is closed) */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg hover:bg-gray-50 transition-colors border border-gray-200 lg:hidden"
        >
          <Bars3Icon className="h-6 w-6 text-gray-600" />
        </button>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 bg-white shadow-lg flex flex-col border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full'} lg:static lg:translate-x-0 lg:transition-all ${isSidebarOpen ? 'lg:w-64' : 'lg:w-20'} overflow-hidden`}>
        {/* Logo and Toggle */}
        <div className="flex items-center h-16 border-b border-gray-200 bg-gray-50 px-4 justify-between">
          {isSidebarOpen && (
            <Link to="/dashboard" className="hover:opacity-80 transition-opacity">
              <img
                className="h-8 w-auto"
                src={visualLogoImage}
                alt="ClickView Visual Logo"
              />
            </Link>
          )}
           {/* Toggle Button (Visible on LG screens always, and when sidebar is open on smaller screens) */}
           {isSidebarOpen ? (
             <button
               onClick={() => setIsSidebarOpen(!isSidebarOpen)}
               className="p-1 rounded-lg hover:bg-gray-200 transition-colors w-auto flex justify-end lg:w-auto lg:justify-center"
             >
               <XMarkIcon className="h-6 w-6 text-gray-600 lg:hidden" /> {/* X icon for closing on mobile */}
               <ChevronDoubleLeftIcon className="h-5 w-5 text-gray-600 hidden lg:block" /> {/* Left chevron for collapsing on LG */}
             </button>
           ) : (
             <button
               onClick={() => setIsSidebarOpen(!isSidebarOpen)}
               className="p-1 rounded-lg hover:bg-gray-200 transition-colors w-full flex justify-center lg:w-auto"
             >
               <ChevronDoubleRightIcon className="h-5 w-5 text-gray-600" /> {/* Right chevron for expanding on LG */}
             </button>
           )}
        </div>

        {/* User Info */}
        {isSidebarOpen && (
          <div className="flex items-center p-4 border-b border-gray-200 bg-white">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold text-base mr-3">
              HN
            </div>
            <div>
              <p className="text-base font-semibold text-gray-800">Helmi Nofal</p>
              <p className="text-sm text-gray-500">Front-End Dev</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3">
          <div className="space-y-2">
            <Link
              to="/dashboard"
              className={`flex items-center px-4 py-3 text-gray-700 rounded-lg transition-colors group ${isSidebarOpen ? 'bg-purple-50 hover:bg-purple-100' : 'justify-center bg-purple-50 hover:bg-purple-100 lg:hover:bg-gray-50'} ${!isSidebarOpen ? 'lg:px-0' : ''}`}
            >
              <HomeIcon className={`text-purple-600 group-hover:text-purple-700 ${isSidebarOpen ? 'h-6 w-6 mr-3' : 'h-8 w-8 lg:h-10 lg:w-10'}`} />
              {isSidebarOpen && <span className="text-base font-medium">Dashboard</span>}
            </Link>
            <Link
              to="/interviews"
              className={`flex items-center px-4 py-3 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors group ${!isSidebarOpen ? 'justify-center lg:px-0' : ''}`}
            >
              <ClockIcon className={`text-gray-400 group-hover:text-gray-500 ${isSidebarOpen ? 'h-6 w-6 mr-3' : 'h-8 w-8 lg:h-10 lg:w-10'}`} />
              {isSidebarOpen && <span className="text-base font-medium">Interviews</span>}
            </Link>
            <Link
              to="/resumes"
              className={`flex items-center px-4 py-3 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors group ${!isSidebarOpen ? 'justify-center lg:px-0' : ''}`}
            >
              <DocumentTextIcon className={`text-gray-400 group-hover:text-gray-500 ${isSidebarOpen ? 'h-6 w-6 mr-3' : 'h-8 w-8 lg:h-10 lg:w-10'}`} />
              {isSidebarOpen && <span className="text-base font-medium">Resumes</span>}
            </Link>
            <Link
              to="/settings"
              className={`flex items-center px-4 py-3 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors group ${!isSidebarOpen ? 'justify-center lg:px-0' : ''}`}
            >
              <CogIcon className={`text-gray-400 group-hover:text-gray-500 ${isSidebarOpen ? 'h-6 w-6 mr-3' : 'h-8 w-8 lg:h-10 lg:w-10'}`} />
              {isSidebarOpen && <span className="text-base font-medium">Settings</span>}
            </Link>
          </div>
        </nav>

        {/* Log Out */}
        <div className="border-t border-gray-200 p-3">
           <Link
            to="/logout"
            className={`flex items-center px-4 py-3 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors group ${!isSidebarOpen ? 'justify-center lg:px-0' : ''}`}
          >
            <ArrowLeftOnRectangleIcon className={`text-gray-400 group-hover:text-gray-500 ${isSidebarOpen ? 'h-6 w-6 mr-3' : 'h-8 w-8 lg:h-10 lg:w-10'}`} />
            {isSidebarOpen && <span className="text-base font-medium">Log Out</span>}
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 p-6 px-6 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
         {/* Inner container for padding */}
         <div className="w-full mx-auto">
           {/* Dashboard Content */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">

              {/* Performance Card */}
             <div className="bg-purple-700 text-white p-6 rounded-lg shadow-md flex flex-col lg:col-span-1">
               <h4 className="text-base font-semibold mb-4">Performance</h4>

                <div className="flex justify-around items-center mb-4">
                   <div className="text-center">
                     <p className="text-3xl font-bold">75%</p>
                     <p className="text-sm text-purple-200">Success Rate</p>
                   </div>
                    <div className="text-center">
                     <p className="text-3xl font-bold">25%</p>
                     <p className="text-sm text-purple-200">Failure Rate</p>
                   </div>
                </div>

                <div className="space-y-2">
                   <div className="flex items-center">
                      <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center mr-2">
                        <PlusIcon className="h-3 w-3 text-white" />
                      </div>
                      <p className="text-sm text-purple-200">Earned Asynchronous programming skill.</p>
                   </div>
                    <div className="flex items-center">
                      <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center mr-2">
                        <ChevronUpIcon className="h-3 w-3 text-white" />
                      </div>
                      <p className="text-sm text-purple-200">Improved your explanation skill.</p>
                   </div>
                    <div className="flex items-center">
                      <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center mr-2">
                        <ChevronDownIcon className="h-3 w-3 text-white" />
                      </div>
                      <p className="text-sm text-purple-200">Your Dart skills got backed down</p>
                   </div>
                </div>
             </div>

              {/* Personalized Recommendations Card */}
              <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2 lg:col-span-1 flex flex-col">
                <h4 className="text-base font-semibold text-gray-800 mb-4">Personalized Recommendations</h4>
                <div className="space-y-3">
                   {recommendations.map((rec) => (
                     <div key={rec.id} className="flex items-start text-gray-700">
                       <rec.icon className="h-5 w-5 mr-3 flex-shrink-0 text-purple-600" />
                       <p className="text-sm">{rec.text}</p>
                     </div>
                   ))}
                </div>
              </div>

              {/* Activity Card */}
             <div className="bg-gray-900 text-white p-6 rounded-lg shadow-md md:col-span-2 lg:col-span-2 flex flex-col">
               <h4 className="text-base font-semibold mb-4">Activity</h4>
                <p className="text-sm text-gray-300 mb-3">Your Data updates every day</p>

                {/* Graph */}
                <div style={{ width: '100%', height: '200px' }}>
                  <ResponsiveContainer>
                    <AreaChart
                      data={data}
                      margin={{
                        top: 10,
                        right: 20,
                        left: 0,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" vertical={false} />
                      <XAxis dataKey="name" stroke="#999" tick={{ fill: '#999' }} />
                      <YAxis stroke="#999" tick={{ fill: '#999' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="uv" stroke="#fff" fill="#ffffff" fillOpacity={0.3} activeDot={{ r: 6, fill: '#fff', stroke: '#fff', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
             </div>

              {/* Interviews Section */}
            <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2 lg:col-span-4 flex flex-col">
              <h4 className="text-lg font-bold text-gray-800 mb-4">Interviews</h4>
               {/* Interviews Boxes */}
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-4">

                 {/* Today Box */}
                 <div className="bg-gray-900 text-white p-4 rounded-lg shadow-md flex flex-col items-start space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                      <CalendarIcon className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-sm text-gray-300">Today</p>
                    <p className="text-2xl font-bold">5</p>
                 </div>

                  {/* Answers Box */}
                 <div className="bg-gray-900 text-white p-4 rounded-lg shadow-md flex flex-col items-start space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
                       <CheckIcon className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-sm text-gray-300">Answers</p>
                    <p className="text-2xl font-bold">46</p>
                 </div>

                  {/* Time Box */}
                 <div className="bg-gray-900 text-white p-4 rounded-lg shadow-md flex flex-col items-start space-y-2">
                     <div className="w-8 h-8 rounded-lg bg-yellow-600 flex items-center justify-center">
                       <ClockOutlineIcon className="h-5 w-5 text-white" />
                     </div>
                    <p className="text-sm text-gray-300">Time</p>
                    <p className="text-2xl font-bold">2.6 h</p>
                 </div>

                  {/* Highest Mark Box */}
                 <div className="bg-gray-900 text-white p-4 rounded-lg shadow-md flex flex-col items-start space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
                       <StarIcon className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-sm text-gray-300">Highest Mark</p>
                    <p className="text-2xl font-bold">150</p>
                 </div>
               </div>

               {/* Recent Interviews List (Styled) */}
               <div className="mt-6">
                  <h5 className="text-lg font-bold text-gray-800 mb-3">Recent Activity Details</h5>
                  <div className="space-y-4">
                    {recentInterviews.map((interview) => (
                      <div key={interview.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-gray-700 text-sm border-b border-gray-200 pb-4 last:border-b-0">
                         <div className="mb-2 sm:mb-0">
                            <p className="font-semibold text-gray-800 text-base">{interview.title}</p>
                            <p className="text-xs text-gray-500">{interview.date}</p>
                         </div>
                         <span className={`px-3 py-1 text-xs font-semibold rounded-full ${interview.result === 'Completed' ? 'bg-green-100 text-green-800' : interview.result === 'Needs Review' ? 'bg-yellow-100 text-yellow-800' : 'bg-purple-100 text-purple-800'}`}>
                            {interview.result}
                         </span>
                      </div>
                    ))}
                  </div>
               </div>

            </div>
           </div>
         </div> {/* End of Inner container for padding */}
      </div>
    </div>
  );
};

export default Dashboard; 