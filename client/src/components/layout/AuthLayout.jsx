import { Outlet, Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen w-full bg-background flex flex-col justify-center items-center p-4 selection:bg-emerald-100 selection:text-emerald-900 relative overflow-hidden">
      {/* Brand Header */}
      <div className="mb-8 text-center animate-fade-in">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shadow-2xs group-hover:scale-105 transition-transform duration-200">
            <Compass className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="font-bold text-xl tracking-tight text-text-primary block">Track Here</span>
            <span className="text-[10px] text-text-muted font-mono tracking-widest uppercase">Plan • Focus • Master</span>
          </div>
        </Link>
      </div>

      {/* Card container */}
      <div className="w-full max-w-md relative animate-fade-in-up">
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-card">
          <Outlet />
        </div>
      </div>

      {/* Footer */}
      <p className="text-xs text-text-muted mt-8 text-center font-medium">
        &copy; {new Date().getFullYear()} Track Here. Focused preparation for ambitious goals.
      </p>
    </div>
  );
}
