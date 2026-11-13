import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileTabBar from './MobileTabBar';
import CommandPalette from '@/components/search/CommandPalette';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { cn } from '@/lib/utils';

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Determine if current view should use wide container (1040px for Plan and Progress)
  const isWide =
    location.pathname.startsWith('/plan') ||
    location.pathname.startsWith('/progress');

  // Global Keyboard shortcut for Command Palette (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    <div className="shell min-h-[100dvh] w-full bg-[var(--bg)] flex text-[var(--text)] antialiased relative">
      {/* 1. Desktop Persistent Left Sidebar (216px, >= 768px) */}
      <div className="hidden md:block w-[216px] h-[100dvh] sticky top-0 shrink-0">
        <Sidebar />
      </div>

      {/* 2. Main Content Flow */}
      <div className="flex-1 flex flex-col min-w-0 min-h-[100dvh]">
        {/* Calm Top Bar */}
        <Header
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onQuickAdd={handleQuickAdd}
        />

        {/* Dynamic Page Content: 880px for Today/Focus/Notes, 1040px for Plan/Progress */}
        <main
          className={cn(
            'flex-1 page w-full mx-auto px-4 sm:px-8 py-4 sm:py-6 pb-[calc(72px+env(safe-area-inset-bottom))] md:pb-12 transition-all',
            isWide ? 'max-w-[1040px]' : 'max-w-[880px]'
          )}
        >
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* 3. Mobile Bottom Tab Bar (< 768px) */}
      <MobileTabBar />

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}
