import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
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
import TextInterviewRoom from './pages/TextInterviewRoom';
import AboutUs from './pages/AboutUs';
import Features from './pages/Features';

const App: React.FC = () => {
  return (
    <GoogleOAuthProvider clientId="546063441484-565u7vmohghbkbko0rsjve0sh76500f1.apps.googleusercontent.com">
      <Router>
        <SidebarProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/features" element={<Features />} />
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
            <Route path="/interview/text/:interviewId" element={<TextInterviewRoom />} />
          </Routes>
        </SidebarProvider>
      </Router>
    </GoogleOAuthProvider>
  );
};

export default App; 