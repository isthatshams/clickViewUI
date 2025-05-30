import React from 'react';
import type { ReactNode } from 'react';
import Sidebar from '../components/Sidebar';
import { useSidebar } from '../context/SidebarContext';

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({ children }) => {
  const { isSidebarOpen } = useSidebar();

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className={`flex-1 p-6 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
         {/* Inner container for padding - adjust max-width as needed for content */}
         <div className="w-full mx-auto max-w-full"> {/* Adjusted max-w to full for flexibility */}
            {children}
         </div>
      </div>
    </div>
  );
};

export default AuthenticatedLayout; 