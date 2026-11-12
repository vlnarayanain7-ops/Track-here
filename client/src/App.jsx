import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

// Layouts
import AppLayout from '@/components/layout/AppLayout';

// Public & Onboarding Pages
import LandingPage from '@/components/landing/LandingPage';
import OnboardingFlow from '@/components/onboarding/OnboardingFlow';

// Auth Pages & Guards
import { SignIn } from './auth/SignIn';
import { SignUp } from './auth/SignUp';
import { ForgotPassword, ResetPassword } from './auth/ForgotReset';
import { RequireAuth, RequireProfile, CompleteProfile } from './auth/RequireProfile';

// Legal Pages
import { TermsPage, PrivacyPage } from '@/components/legal/LegalPages';

// Main Application Modules
import DashboardPage from '@/components/dashboard/DashboardPage';
import StudyPage from '@/components/study/StudyPage';
import SubjectsPage from '@/components/subjects/SubjectsPage';
import TimetablePage from '@/components/timetable/TimetablePage';
import PracticePage from '@/components/practice/PracticePage';
import TasksPage from '@/components/tasks/TasksPage';
import NotesPage from '@/components/notes/NotesPage';
import AccountabilityPage from '@/components/accountability/AccountabilityPage';
import StreaksPage from '@/components/streaks/StreaksPage';
import RevisionsPage from '@/components/revisions/RevisionsPage';
import AnalyticsPage from '@/components/analytics/AnalyticsPage';
import SettingsPage from '@/components/settings/SettingsPage';

// Guest Guard (redirect already logged-in users to home)
function GuestRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div role="status" className="h-[100dvh] w-full flex items-center justify-center bg-[var(--bg)] text-[var(--muted)]">
        <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public Legal Pages */}
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />

      {/* Guest Landing & Auth Routes */}
      <Route
        path="/welcome"
        element={
          <GuestRoute>
            <LandingPage />
          </GuestRoute>
        }
      />
      <Route
        path="/signin"
        element={
          <GuestRoute>
            <SignIn />
          </GuestRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <GuestRoute>
            <SignUp />
          </GuestRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <GuestRoute>
            <ForgotPassword />
          </GuestRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <GuestRoute>
            <ResetPassword />
          </GuestRoute>
        }
      />
      <Route
        path="/reset-password/:token"
        element={
          <GuestRoute>
            <ResetPassword />
          </GuestRoute>
        }
      />

      {/* Aliases for legacy paths */}
      <Route path="/login" element={<Navigate to="/signin" replace />} />
      <Route path="/register" element={<Navigate to="/signup" replace />} />

      {/* RequireAuth Protected Scope */}
      <Route element={<RequireAuth />}>
        {/* Profile Completion (for Google signups missing ageBand) */}
        <Route path="/complete-profile" element={<CompleteProfile />} />

        {/* RequireProfile Scope (Users with confirmed ageBand) */}
        <Route element={<RequireProfile />}>
          <Route path="/onboarding" element={<OnboardingFlow />} />

          {/* Main AppShell Protected Routes */}
          <Route path="/" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="study" element={<StudyPage />} />
            <Route path="subjects" element={<SubjectsPage />} />
            <Route path="timetable" element={<TimetablePage />} />
            <Route path="practice" element={<PracticePage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="notes" element={<NotesPage />} />
            <Route path="problems" element={<PracticePage defaultTab="problems" />} />
            <Route path="accountability" element={<AccountabilityPage />} />
            <Route path="streaks" element={<StreaksPage />} />
            <Route path="revisions" element={<RevisionsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>

      {/* Catch-all Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
