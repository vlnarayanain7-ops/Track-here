import { Link } from 'react-router-dom';
import {
  Compass,
  Timer,
  CheckSquare,
  FileText,
  Code2,
  RotateCcw,
  Flame,
  BarChart3,
  CalendarCheck,
  ArrowRight,
  Shield,
  Layers,
  GraduationCap,
  Zap,
  Clock,
  Target,
} from 'lucide-react';
import Button from '@/components/ui/Button';

export default function LandingPage() {
  const capabilities = [
    {
      title: 'Precision Focus Timer',
      description:
        'Server-persisted focus timer with pause, resume, and cross-device recovery. Automatically attributes hours to your subjects and topics.',
      icon: Timer,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50 border-emerald-200/80',
    },
    {
      title: 'Universal Subject Architecture',
      description:
        'Whether preparing for NEET, JEE, UPSC, GATE, University courses, or Competitive Programming, define your own syllabus, chapters, and topics.',
      icon: Layers,
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-50 border-indigo-200/80',
    },
    {
      title: 'Daily Accountability System',
      description:
        'Start with a focused morning preparation plan and close your day with an evening review. Track actual hours against planned targets.',
      icon: CalendarCheck,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50 border-emerald-200/80',
    },
    {
      title: 'Spaced Repetition & Revisions',
      description:
        'Never forget critical formulas or problem solutions. Automatic spaced interval scheduling ensures timely reviews before concepts fade.',
      icon: RotateCcw,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50 border-amber-200/80',
    },
    {
      title: 'Practice & Mistake Journal',
      description:
        'Log practice sessions and problem attempts with time complexity, approaches, and mistakes made to prevent repeating errors.',
      icon: Code2,
      color: 'text-rose-700',
      bgColor: 'bg-rose-50 border-rose-200/80',
    },
    {
      title: 'Consistency Heatmaps & Analytics',
      description:
        'Visual consistency calendar with a 25-minute minimum daily focused study requirement. Deep subject-wise and topic-wise distributions.',
      icon: Flame,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 border-amber-200/80',
    },
  ];

  const prepProfiles = [
    { name: 'JEE', desc: 'Physics, Chemistry, Mathematics', icon: '⚡' },
    { name: 'NEET', desc: 'Physics, Chemistry, Botany, Zoology', icon: '🔬' },
    { name: 'UPSC', desc: 'General Studies, CSAT, Optional', icon: '📚' },
    { name: 'GATE', desc: 'Engineering Math, Core, Aptitude', icon: '⚙️' },
    { name: 'CP', desc: 'C++, Data Structures, Algorithms', icon: '💻' },
    { name: 'Custom', desc: 'Semester, Skills, Certifications', icon: '🎯' },
  ];

  const stats = [
    { label: 'Active Learners', value: '2,500+', icon: Target },
    { label: 'Sessions Tracked', value: '85,000+', icon: Clock },
    { label: 'Hours Focused', value: '120,000+', icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col selection:bg-emerald-100 selection:text-emerald-900 relative overflow-hidden">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 h-16 bg-white/90 backdrop-blur-md border-b border-border/80">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shadow-2xs">
              <Compass className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-text-primary">
                Track Here
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] text-emerald-800 font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60">
                Productivity OS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-xs text-text-secondary hover:text-text-primary">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="text-xs gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs">
                <span>Get Started</span>
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION ────────────────────────────────────────── */}
      <section className="relative py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-7">
          {/* Status badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface/60 border border-border/80 text-xs text-text-secondary backdrop-blur-sm shadow-xs animate-fade-in-down">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span>Universal Study, Revision & Preparation Platform</span>
          </div>

          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight text-text-primary leading-[1.15] animate-fade-in-up">
            Structure your preparation.{' '}
            <span className="text-gradient">Master consistency.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-sm sm:text-base text-text-secondary max-w-2xl mx-auto leading-relaxed animate-fade-in-up">
            The all-in-one productivity operating system built for competitive-exam aspirants,
            university students, and serious learners. Track focused hours, manage spaced revisions,
            and monitor syllabus progress — all in one place.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 animate-fade-in-up">
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-sm gap-2 shadow-glow-accent">
                <span>Start Tracking Free</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-sm">
                Sign In to Your Workspace
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-text-muted pt-2">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-success" />
              Isolated user data
            </span>
            <span className="hidden sm:inline text-border">·</span>
            <span>Zero ad tracking</span>
            <span className="hidden sm:inline text-border">·</span>
            <span>Spaced repetition engine</span>
            <span className="hidden sm:inline text-border">·</span>
            <span>Real-time analytics</span>
          </div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF STATS ──────────────────────────────────── */}
      <section className="py-10 px-4 sm:px-6 border-y border-border/40 bg-surface/20">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-4 sm:gap-6">
            {stats.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div key={idx} className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Icon className="w-4 h-4 text-accent hidden sm:block" />
                    <span className="text-xl sm:text-2xl font-bold font-mono text-text-primary tracking-tight">
                      {s.value}
                    </span>
                  </div>
                  <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider">
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── TARGET AUDIENCE / SUPPORTED PREPS ───────────────────── */}
      <section className="py-14 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xs uppercase font-mono tracking-widest text-accent font-bold mb-2">
              Built for every learning journey
            </h2>
            <p className="text-xs text-text-muted max-w-md mx-auto">
              Configure your own subjects, chapters, and goals — Track Here adapts to your prep type.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {prepProfiles.map((p, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl bg-card border text-center transition-all duration-200 hover:bg-surface hover:-translate-y-0.5 hover:shadow-card cursor-default ${p.color}`}
              >
                <span className="text-2xl mb-2 block">{p.icon}</span>
                <span className="text-xs font-semibold text-text-primary block">
                  {p.name}
                </span>
                <span className="text-[10px] text-text-muted mt-1 block leading-tight">
                  {p.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── KEY CAPABILITIES GRID ───────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
              Engineered for <span className="text-gradient">disciplined study</span>
            </h2>
            <p className="text-xs sm:text-sm text-text-muted max-w-xl mx-auto leading-relaxed">
              Track Here is not a content library or coaching provider. It is your personal preparation
              management system.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {capabilities.map((cap, idx) => {
              const Icon = cap.icon;
              return (
                <div
                  key={idx}
                  className="group p-5 sm:p-6 rounded-2xl bg-card border border-border hover:border-border-light transition-all duration-300 flex flex-col hover:-translate-y-1 hover:shadow-elevated"
                >
                  <div className="space-y-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center border ${cap.bgColor} transition-shadow duration-300 group-hover:${cap.glowColor}`}
                    >
                      <Icon className={`w-5 h-5 ${cap.color}`} />
                    </div>
                    <h3 className="text-sm font-semibold text-text-primary tracking-tight">
                      {cap.title}
                    </h3>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {cap.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ──────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-3xl mx-auto text-center relative">
          {/* Glow background */}
          <div className="relative p-8 sm:p-12 rounded-2xl bg-card border border-border shadow-card">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary mb-3">
              Ready to elevate your study habits?
            </h2>
            <p className="text-xs sm:text-sm text-text-muted max-w-md mx-auto mb-6">
              Configure your preparation track in two minutes and start your first focused session.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/register">
                <Button size="lg" className="text-sm gap-2 bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs">
                  <span>Create Your Free Account</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────── */}
      <footer className="py-8 px-4 sm:px-6 border-t border-border/80 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700">
                <Compass className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-text-primary">Track Here</span>
            </div>
            <p className="text-xs text-text-muted text-center">
              &copy; {new Date().getFullYear()} Track Here. Universal Study Operating System. Built for focused learners.
            </p>
            <div className="flex items-center gap-4 text-xs text-text-muted">
              <Link to="/login" className="hover:text-text-primary transition-colors">Sign In</Link>
              <Link to="/register" className="hover:text-text-primary transition-colors">Register</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
