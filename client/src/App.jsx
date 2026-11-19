import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

// Layouts (eager for instant shell render)
import AppLayout from '@/components/layout/AppLayout';

// Auth Guards (eager lightweight checks)
import { RequireAuth, RequireProfile, CompleteProfile } from './auth/RequireProfile';

// Lazy-Loaded Application Modules
const DashboardPage = lazy(() => import('@/components/dashboard/DashboardPage'));
const StudyPage = lazy(() => import('@/components/study/StudyPage'));
const PlanPage = lazy(() => import('@/components/plan/PlanPage'));
const NotesPage = lazy(() => import('@/components/notes/NotesPage'));
const ProgressPage = lazy(() => import('@/components/progress/ProgressPage'));
const SettingsPage = lazy(() => import('@/components/settings/SettingsPage'));
const RevisionsPage = lazy(() => import('@/components/revisions/RevisionsPage'));

// Lazy-Loaded Public & Auth Pages
const LandingPage = lazy(() => import('@/components/landing/LandingPage'));
const FinalsPlanner = lazy(() => import('@/components/landing/FinalsPlanner'));
const OnboardingFlow = lazy(() => import('@/components/onboarding/OnboardingFlow'));
const SignIn = lazy(() => import('./auth/SignIn').then((m) => ({ default: m.SignIn })));
const SignUp = lazy(() => import('./auth/SignUp').then((m) => ({ default: m.SignUp })));
const ForgotPassword = lazy(() => import('./auth/ForgotReset').then((m) => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('./auth/ForgotReset').then((m) => ({ default: m.ResetPassword })));

// Lazy-Loaded Legal & Verification Pages
const TermsPage = lazy(() => import('@/components/legal/LegalPages').then((m) => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('@/components/legal/LegalPages').then((m) => ({ default: m.PrivacyPage })));
const RewardsRulesPage = lazy(() => import('@/components/legal/LegalPages').then((m) => ({ default: m.RewardsRulesPage })));
const VerifyCertificatePage = lazy(() => import('@/components/verify/VerifyCertificatePage'));
const AdminPage = lazy(() => import('@/components/admin/AdminPage'));

import RequireTerms from '@/components/RequireTerms';

// Calm Fallback Loader
function PageFallback() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="min-h-[50vh] w-full flex items-center justify-center text-[var(--muted)]"
    >
      <div className="w-7 h-7 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

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

// Accountability redirect preserving tab query
function AccountabilityRedirect() {
  const location = useLocation();
  const search = new URLSearchParams(location.search);
  const tab = search.get('tab');
  return <Navigate to={tab === 'evening' ? '/?journal=evening' : '/?journal=morning'} replace />;
}

export default function App() {
  const { user, checkAuth } = useAuth();

  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
      {/* Public Legal & Verification Pages */}
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/finals-planner" element={<FinalsPlanner />} />
      <Route path="/rewards-rules" element={<RewardsRulesPage />} />
      <Route path="/verify/:serial" element={<VerifyCertificatePage />} />
      <Route path="/admin" element={<AdminPage />} />

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
          <Route
            path="/"
            element={
              <RequireTerms user={user} onAccepted={() => checkAuth()}>
                <AppLayout />
              </RequireTerms>
            }
          >
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
            <Route path="revisions" element={<RevisionsPage />} />
            <Route path="accountability" element={<AccountabilityRedirect />} />
          </Route>
        </Route>
      </Route>

      {/* Catch-all Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
  );
}
