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
import PlanPage from '@/components/plan/PlanPage';
import NotesPage from '@/components/notes/NotesPage';
import ProgressPage from '@/components/progress/ProgressPage';
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
      {/* Password Recovery Routes */}
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
            <ForgotPassword />
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
            <Route path="plan" element={<PlanPage />} />
            <Route path="notes" element={<NotesPage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="settings" element={<SettingsPage />} />

            {/* Legacy route redirects to preserve all bookmarks and links */}
            <Route path="timetable" element={<Navigate to="/plan?tab=week" replace />} />
            <Route path="subjects" element={<Navigate to="/plan?tab=subjects" replace />} />
            <Route path="tasks" element={<Navigate to="/plan?tab=tasks" replace />} />
            <Route path="streaks" element={<Navigate to="/progress" replace />} />
            <Route path="analytics" element={<Navigate to="/progress?tab=stats" replace />} />
            <Route path="practice" element={<Navigate to="/progress?tab=practice" replace />} />
            <Route path="problems" element={<Navigate to="/progress?tab=practice" replace />} />
            <Route path="revisions" element={<Navigate to="/?review=1" replace />} />
            <Route path="accountability" element={<Navigate to="/?journal=morning" replace />} />
          </Route>
        </Route>
      </Route>

      {/* Catch-all Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
