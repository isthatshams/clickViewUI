import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage.tsx';
import SignUp from './pages/SignUp.tsx';
import SignIn from './pages/SignIn.tsx';
import Dashboard from './pages/Dashboard.tsx';
import TwoFactorAuth from './pages/TwoFactorAuth.tsx';
import ForgotPassword from './pages/ForgotPassword.tsx';
import CheckEmail from './pages/CheckEmail.tsx';
import ResetPassword from './pages/ResetPassword.tsx';
import Settings from './pages/Settings.tsx';
import Resumes from './pages/Resumes.tsx';
import Interviews from './pages/Interviews.tsx';
import { SidebarProvider } from './context/SidebarContext';
import AuthenticatedLayout from './components/AuthenticatedLayout';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
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
  </StrictMode>,
)
