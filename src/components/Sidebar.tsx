import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import visualLogoImage from '../assets/Logo Visualed.png';
import {
  HomeIcon,
  ClockIcon,
  DocumentTextIcon,
  CogIcon,
  ArrowLeftOnRectangleIcon,
  XMarkIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from '@heroicons/react/24/solid';
import { useSidebar } from '../context/SidebarContext';
import { getUserDetails, logout } from '../utils/auth';

interface UserDetails {
  firstName: string;
  lastName: string;
  professionalTitle: string;
  profilePicture: string | null;
}

const Sidebar: React.FC = () => {
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setIsLoading(true);
        setError('');
        const details = await getUserDetails();
        setUserDetails(details);
      } catch (err) {
        console.error('Error in Sidebar:', err);
        setError(err instanceof Error ? err.message : 'Failed to load user details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDetails();
  }, []);

  return (
    <div className={`fixed inset-y-0 left-0 z-40 bg-white shadow-lg flex flex-col border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full'} lg:static lg:translate-x-0 lg:transition-all ${isSidebarOpen ? 'lg:w-64' : 'lg:w-20'} overflow-hidden dark:bg-gray-800 dark:border-gray-700`}>
      {/* Logo and Toggle */}
      <div className="flex items-center h-16 border-b border-gray-200 bg-gray-50 px-4 justify-between dark:border-gray-700 dark:bg-gray-900">
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
             onClick={toggleSidebar}
             className="p-1 rounded-lg hover:bg-gray-200 transition-colors w-auto flex justify-end lg:w-auto lg:justify-center dark:hover:bg-gray-700"
           >
             <XMarkIcon className="h-6 w-6 text-gray-600 lg:hidden dark:text-gray-300" /> {/* X icon for closing on mobile */}
             <ChevronDoubleLeftIcon className="h-5 w-5 text-gray-600 hidden lg:block dark:text-gray-300" /> {/* Left chevron for collapsing on LG */}
           </button>
         ) : (
           <button
             onClick={toggleSidebar}
             className="p-1 rounded-lg hover:bg-gray-200 transition-colors w-full flex justify-center lg:w-auto dark:hover:bg-gray-700"
           >
             <ChevronDoubleRightIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" /> {/* Right chevron for expanding on LG */}
           </button>
         )}
      </div>

      {/* User Info */}
      {isSidebarOpen && (
        <div className="flex items-center p-4 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : error ? (
            <div className="text-sm text-red-600">
              <p>{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="text-blue-600 hover:text-blue-800 mt-2"
              >
                Retry
              </button>
            </div>
          ) : userDetails ? (
            <>
              {userDetails.profilePicture ? (
                <img 
                  src={`https://localhost:7127/${userDetails.profilePicture}`}
                  alt={`${userDetails.firstName} ${userDetails.lastName}`}
                  className="w-10 h-10 rounded-full object-cover mr-3"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold text-base mr-3">
                  {userDetails.firstName.charAt(0)}
                  {userDetails.lastName.charAt(0)}
                </div>
              )}
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {userDetails.firstName} {userDetails.lastName}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{userDetails.professionalTitle}</p>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3">
        <div className="space-y-2">
          <Link
            to="/dashboard"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors group ${isSidebarOpen ? '' : 'justify-center lg:px-0'} ${
              location.pathname === '/dashboard'
                ? (isSidebarOpen ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-900 dark:hover:bg-purple-800 dark:text-purple-300' : 'bg-purple-50 hover:bg-purple-100 lg:hover:bg-gray-50 text-purple-700 dark:bg-purple-900 dark:hover:bg-purple-800 dark:text-purple-300 lg:dark:hover:bg-gray-700')
                : (isSidebarOpen ? 'text-gray-700 hover:bg-purple-50 dark:text-gray-300 dark:hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700')
            }`}
          >
            <HomeIcon className={`group-hover:text-purple-700 ${location.pathname === '/dashboard' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400'} ${isSidebarOpen ? 'h-6 w-6 mr-3' : 'h-8 w-8 lg:h-10 lg:w-10'}`} />
            {isSidebarOpen && <span className="text-base font-medium">Dashboard</span>}
          </Link>
          <Link
            to="/interviews"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors group ${!isSidebarOpen ? 'justify-center lg:px-0' : ''} ${
              location.pathname === '/interviews'
                ? (isSidebarOpen ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-900 dark:hover:bg-purple-800 dark:text-purple-300' : 'bg-purple-50 hover:bg-purple-100 lg:hover:bg-gray-50 text-purple-700 dark:bg-purple-900 dark:hover:bg-purple-800 dark:text-purple-300 lg:dark:hover:bg-gray-700')
                : (isSidebarOpen ? 'text-gray-700 hover:bg-purple-50 dark:text-gray-300 dark:hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700')
            }`}
          >
            <ClockIcon className={`group-hover:text-purple-700 ${location.pathname === '/interviews' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400'} ${isSidebarOpen ? 'h-6 w-6 mr-3' : 'h-8 w-8 lg:h-10 lg:w-10'}`} />
            {isSidebarOpen && <span className="text-base font-medium">Interviews</span>}
          </Link>
          <Link
            to="/resumes"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors group ${!isSidebarOpen ? 'justify-center lg:px-0' : ''} ${
              location.pathname === '/resumes'
                ? (isSidebarOpen ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-900 dark:hover:bg-purple-800 dark:text-purple-300' : 'bg-purple-50 hover:bg-purple-100 lg:hover:bg-gray-50 text-purple-700 dark:bg-purple-900 dark:hover:bg-purple-800 dark:text-purple-300 lg:dark:hover:bg-gray-700')
                : (isSidebarOpen ? 'text-gray-700 hover:bg-purple-50 dark:text-gray-300 dark:hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700')
            }`}
          >
            <DocumentTextIcon className={`group-hover:text-purple-700 ${location.pathname === '/resumes' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400'} ${isSidebarOpen ? 'h-6 w-6 mr-3' : 'h-8 w-8 lg:h-10 lg:w-10'}`} />
            {isSidebarOpen && <span className="text-base font-medium">Resumes</span>}
          </Link>
          <Link
            to="/settings"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors group ${!isSidebarOpen ? 'justify-center lg:px-0' : ''} ${
              location.pathname === '/settings'
                ? (isSidebarOpen ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-900 dark:hover:bg-purple-800 dark:text-purple-300' : 'bg-purple-50 hover:bg-purple-100 lg:hover:bg-gray-50 text-purple-700 dark:bg-purple-900 dark:hover:bg-purple-800 dark:text-purple-300 lg:dark:hover:bg-gray-700')
                : (isSidebarOpen ? 'text-gray-700 hover:bg-purple-50 dark:text-gray-300 dark:hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700')
            }`}
          >
            <CogIcon className={`group-hover:text-purple-700 ${location.pathname === '/settings' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400'} ${isSidebarOpen ? 'h-6 w-6 mr-3' : 'h-8 w-8 lg:h-10 lg:w-10'}`} />
            {isSidebarOpen && <span className="text-base font-medium">Settings</span>}
          </Link>
        </div>
      </nav>

      {/* Log Out */}
      <div className="border-t border-gray-200 p-3 dark:border-gray-700">
         <button
          onClick={() => logout()}
          className={`flex items-center px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors group w-full ${!isSidebarOpen ? 'justify-center lg:px-0' : ''} dark:hover:bg-gray-700`}
        >
          <ArrowLeftOnRectangleIcon className={`group-hover:text-gray-500 ${isSidebarOpen ? 'h-6 w-6 mr-3' : 'h-8 w-8 lg:h-10 lg:w-10'} text-gray-400 dark:text-gray-500 dark:group-hover:text-gray-400`} />
          {isSidebarOpen && <span className="text-base font-medium text-gray-600 dark:text-gray-400">Log Out</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 