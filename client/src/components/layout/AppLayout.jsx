import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileTabBar from './MobileTabBar';
import CommandPalette from '@/components/search/CommandPalette';
import QuickActionsModal from '@/components/dashboard/QuickActions';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function AppLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState('task');

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
      navigate('/subjects');
    } else {
      setQuickAddType(kind);
      setQuickAddOpen(true);
    }
  };

  return (
    <div className="shell min-h-[100dvh] w-full bg-[var(--bg)] flex text-[var(--text)] antialiased relative">
      {/* 1. Desktop Persistent Left Sidebar (>= 1024px) */}
      <div className="hidden lg:block w-64 h-[100dvh] sticky top-0 shrink-0">
        <Sidebar />
      </div>

      {/* 2. Tablet / Mobile Drawer Sidebar (768px - 1023px and drawer trigger) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-64 max-w-[85vw] h-full z-10 animate-slide-in-left shadow-2xl">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* 3. Main Content Flow */}
      <div className="flex-1 flex flex-col min-w-0 min-h-[100dvh]">
        {/* Responsive Top Bar */}
        <Header
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onQuickAdd={handleQuickAdd}
        />

        {/* Dynamic Page Content with Safe Area Padding */}
        <main className="flex-1 page w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-[calc(88px+env(safe-area-inset-bottom))] md:pb-12">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* 4. Phone Bottom Navigation & Floating Quick Add (< 768px) */}
      <MobileTabBar onQuickAdd={handleQuickAdd} />

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      {/* Quick Add Modal */}
      {quickAddOpen && (
        <QuickActionsModal
          isOpen={quickAddOpen}
          initialType={quickAddType}
          onClose={() => setQuickAddOpen(false)}
        />
      )}
    </div>
  );
}
