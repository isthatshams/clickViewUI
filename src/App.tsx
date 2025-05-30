import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SidebarProvider } from './context/SidebarContext';
import AuthenticatedLayout from './components/AuthenticatedLayout';

// Pages
import LandingPage from './pages/LandingPage';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import TwoFactorAuth from './pages/TwoFactorAuth';
import ForgotPassword from './pages/ForgotPassword';
import CheckEmail from './pages/CheckEmail';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Resumes from './pages/Resumes';
import Interviews from './pages/Interviews';

const App: React.FC = () => {
  return (
    <Router>
      <SidebarProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/two-factor-auth" element={<TwoFactorAuth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/check-email" element={<CheckEmail />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<AuthenticatedLayout><Dashboard /></AuthenticatedLayout>} />
          <Route path="/settings" element={<AuthenticatedLayout><Settings /></AuthenticatedLayout>} />
          <Route path="/resumes" element={<AuthenticatedLayout><Resumes /></AuthenticatedLayout>} />
          <Route path="/interviews" element={<AuthenticatedLayout><Interviews /></AuthenticatedLayout>} />
        </Routes>
      </SidebarProvider>
    </Router>
  );
};

export default App; 