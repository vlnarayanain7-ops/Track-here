import { Link } from 'react-router-dom';
import { Timer, Layers, CalendarCheck, RotateCcw, Code2, Flame, ArrowRight, Check, Atom, Microscope, BookOpen, Settings2, GraduationCap, Target } from 'lucide-react';
import BrandMark from '@/components/brand/BrandMark';
import ProductPreview from '@/components/brand/ProductPreview';

const capabilities = [
  { title: 'Make time for deep focus', description: 'Choose a focus block or stopwatch, take a break, and keep a record of the time you spend studying.', icon: Timer },
  { title: 'Build a plan that fits you', description: 'Organize your own subjects, chapters, tasks, and weekly study schedule around the goal you are working toward.', icon: Layers },
  { title: 'Start with an intention', description: 'Set your morning priorities, then use an evening review to see what worked and what to change tomorrow.', icon: CalendarCheck },
  { title: 'Return to what matters', description: 'Turn notes and topics into a review queue. Your feedback helps schedule the next revision.', icon: RotateCcw },
  { title: 'Learn from each attempt', description: 'Record practice problems, approaches, and mistakes so your next attempt builds on the last.', icon: Code2 },
  { title: 'See your consistency grow', description: 'Compare focused time with your goals and explore your study history, subject breakdown, and streak.', icon: Flame },
];
const prepProfiles = [
  { name: 'JEE', desc: 'Physics, chemistry, mathematics', icon: Atom },
  { name: 'NEET', desc: 'Science and biology', icon: Microscope },
  { name: 'UPSC', desc: 'General studies and optional subjects', icon: BookOpen },
  { name: 'GATE', desc: 'Engineering and aptitude', icon: Settings2 },
  { name: 'Programming', desc: 'Algorithms and problem solving', icon: Code2 },
  { name: 'Your own goal', desc: 'University, skills, or certifications', icon: GraduationCap },
];
const primaryLink = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 transition-opacity';
const secondaryLink = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-medium border border-[var(--line)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 bg-[var(--surface)] p-3 rounded-lg">Skip to content</a>
      <header className="sticky top-0 z-40 h-16 bg-[var(--bg)] border-b border-[var(--line)]">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-3">
          <Link to="/welcome" className="flex items-center gap-2.5 font-heading font-bold tracking-tight"><BrandMark /><span>Track Here</span></Link>
          <nav aria-label="Welcome navigation" className="flex items-center gap-2 sm:gap-4">
            <Link to="/signin" className="inline-flex items-center min-h-11 px-2 text-sm text-[var(--muted)] hover:text-[var(--text)]">Sign in</Link>
            <Link to="/signup" className={primaryLink}>Get started <ArrowRight className="w-4 h-4 hidden sm:block" aria-hidden="true" /></Link>
          </nav>
        </div>
      </header>
      <main id="main-content">
        <section className="px-4 sm:px-6 pt-14 sm:pt-20 pb-14">
          <div className="max-w-3xl mx-auto text-center">
            <p className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--primary)] bg-[var(--primary-soft)] px-3 py-2 rounded-full"><Target className="w-4 h-4" aria-hidden="true" />Your study day, thoughtfully organized</p>
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.12] tracking-tight">A clear plan.<br /><span className="text-[var(--primary)]">A little progress, every day.</span></h1>
            <p className="mt-6 text-base sm:text-lg leading-relaxed text-[var(--muted)] max-w-xl mx-auto">Bring your tasks, focused study, notes, and revisions into one calm workspace. Know what to work on next—and see how far you have come.</p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
              <Link to="/signup" className={primaryLink}>Start your study journey <ArrowRight className="w-4 h-4" aria-hidden="true" /></Link>
              <Link to="/finals-planner" className={secondaryLink}>Try the free finals planner</Link>
            </div>
            <p className="mt-5 text-xs text-[var(--muted)]">Your subjects. Your pace. Your next step.</p>
          </div>
          <ProductPreview />
        </section>
        <section id="your-study-day" className="scroll-mt-20 border-y border-[var(--line)] bg-[var(--surface)] py-14 sm:py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="max-w-xl"><p className="text-xs font-semibold tracking-widest text-[var(--primary)] uppercase">One connected study day</p><h2 className="text-2xl sm:text-3xl font-semibold mt-3">Turn an intention into something learned.</h2></div>
            <ol className="mt-9 grid md:grid-cols-3 gap-8">
              {[
                ['01', 'Choose your next step', 'Plan a task, pick a subject, and give your study time a clear purpose.'],
                ['02', 'Make space to focus', 'Work through a focused session. Keep the timer close while you move through your workspace.'],
                ['03', 'Keep what you learned', 'Capture a note, schedule a revision, and reflect on the progress you made.'],
              ].map(([number, title, text]) => (
                <li key={number} className="border-t border-[var(--line)] pt-5"><span className="text-sm font-mono text-[var(--primary)]">{number}</span><h3 className="text-lg font-semibold mt-3">{title}</h3><p className="text-sm text-[var(--muted)] leading-relaxed mt-2">{text}</p></li>
              ))}
            </ol>
          </div>
        </section>
        <section className="py-14 sm:py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-xl mx-auto"><h2 className="text-2xl sm:text-3xl font-semibold">A place for the whole process.</h2><p className="text-sm sm:text-base text-[var(--muted)] mt-3">From the first task to your next review, keep the useful details together.</p></div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10 mt-10">
              {capabilities.map(({ title, description, icon: Icon }) => (
                <div key={title}><Icon className="w-6 h-6 text-[var(--primary)] mb-4" strokeWidth={1.7} aria-hidden="true" /><h3 className="text-base font-semibold">{title}</h3><p className="text-sm leading-relaxed text-[var(--muted)] mt-2">{description}</p></div>
              ))}
            </div>
          </div>
        </section>
        <section className="px-4 sm:px-6 pb-14 sm:pb-20">
          <div className="max-w-5xl mx-auto border-t border-[var(--line)] pt-10">
            <h2 className="text-xl font-semibold">Whatever you are preparing for.</h2><p className="text-sm text-[var(--muted)] mt-2">Start with your subjects and shape the workspace around your goal.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-7">
              {prepProfiles.map(({ name, desc, icon: Icon }) => (
                <div key={name} className="rounded-xl p-4 bg-[var(--surface)] border border-[var(--line)]"><Icon className="w-5 h-5 text-[var(--primary)] mb-3" aria-hidden="true" /><h3 className="text-sm font-semibold">{name}</h3><p className="text-xs leading-relaxed text-[var(--muted)] mt-1">{desc}</p></div>
              ))}
            </div>
          </div>
        </section>
        <section className="px-4 sm:px-6 pb-16">
          <div className="max-w-5xl mx-auto rounded-2xl bg-[var(--primary-soft)] p-7 sm:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-7">
            <div><p className="flex items-center gap-2 text-sm text-[var(--primary)] mb-3"><Check className="w-4 h-4" aria-hidden="true" />Start with one achievable step</p><h2 className="text-2xl sm:text-3xl font-semibold">Your next focused day starts here.</h2><p className="text-sm text-[var(--muted)] mt-3">Create your workspace, add a subject, and begin your first session.</p></div>
            <Link to="/signup" className={primaryLink + ' shrink-0'}>Create your account <ArrowRight className="w-4 h-4" aria-hidden="true" /></Link>
          </div>
        </section>
      </main>
      <footer className="border-t border-[var(--line)] bg-[var(--surface)] py-7 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <Link to="/welcome" className="flex items-center gap-2 font-heading font-semibold text-sm"><BrandMark className="w-7 h-7" />Track Here</Link>
          <p className="text-xs text-[var(--muted)]">© {new Date().getFullYear()} Track Here. A little progress, every day.</p>
          <Link to="/explore" className="font-semibold">Explore study features</Link><nav aria-label="Legal" className="flex gap-5 text-xs text-[var(--muted)]"><Link className="hover:text-[var(--text)]" to="/privacy">Privacy</Link><Link className="hover:text-[var(--text)]" to="/terms">Terms</Link></nav>
        </div>
      </footer>
    </div>
  );
}
