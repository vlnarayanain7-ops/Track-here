import SessionCompletion from '@/components/study/SessionCompletion';
import { useState, useEffect, Suspense } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Header from './Header';
import MobileTabBar from './MobileTabBar';
import CommandPalette from '@/components/search/CommandPalette';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import WakeBanner from '@/components/WakeBanner';
import ProductTour from '@/components/onboarding/ProductTour';
import { TimerProvider } from '@/contexts/TimerContext';
import { cn } from '@/lib/utils';

function ContentFallback() {
  return (
    <div
      role="status"
      aria-label="Loading view"
      className="min-h-[40vh] w-full flex items-center justify-center text-[var(--muted)]"
    >
      <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function AppLayoutShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [tourReplay, setTourReplay] = useState(0);
  const [tourActive, setTourActive] = useState(false);

  // Global Keyboard shortcut for Command Palette (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (tourActive) return;
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tourActive]);

  const handleQuickAdd = (kind = 'task') => {
    if (kind === 'session') {
      navigate('/study?action=start');
    } else if (kind === 'goal') {
      navigate('/plan?tab=subjects&action=new');
    } else if (kind === 'task') {
      navigate('/plan?tab=tasks&action=new');
    } else if (kind === 'note') {
      navigate('/notes?action=new');
    } else if (kind === 'mock' || kind === 'mockTest') {
      navigate('/progress?tab=practice&action=mockTest');
    } else if (kind === 'problem') {
      navigate('/progress?tab=practice&action=problem');
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-[var(--bg)] text-[var(--text)]">
      {/* Server wake-up banner mounted above the app shell */}
      <WakeBanner />

      <div className="shell min-h-0 flex-1 w-full bg-[var(--bg)] flex flex-col text-[var(--text)] antialiased relative">
        {/* Main Content Flow */}
        <div className="flex-1 flex flex-col min-w-0 min-h-[100dvh]">
          {/* Calm Top Bar */}
          <Header
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
            onQuickAdd={handleQuickAdd}
            onStartTour={() => setTourReplay((value) => value + 1)}
          />

          {/* Unified Page Content: strictly 960px across all routes */}
          <main className={cn("flex-1 page w-full max-w-[960px] mx-auto px-4 sm:px-8 py-4 sm:py-6 pb-[calc(72px+env(safe-area-inset-bottom))] md:pb-12 transition-all", location.pathname === '/' && 'today-page')}>
            <ErrorBoundary>
              <Suspense fallback={<ContentFallback />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>

        <SessionCompletion />
        <ProductTour replay={tourReplay} onActiveChange={setTourActive} />
        {/* 3. Mobile Bottom Tab Bar (< 768px) */}
        <MobileTabBar />

        {/* Global Command Palette */}
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
        />
      </div>
    </div>
  );
}

export default function AppLayout() {
  return (
    <TimerProvider>
      <AppLayoutShell />
    </TimerProvider>
  );
}
