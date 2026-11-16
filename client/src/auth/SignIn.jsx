import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button, Field } from '../components/ui.jsx';
import { AuthLayout } from './AuthLayout';
import GoogleAuthButton from './GoogleAuthButton';
import toast from 'react-hot-toast';

export function SignIn() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErr('Please enter both email and password.');
      return;
    }

    setErr('');
    setBusy(true);

    try {
      const loggedUser = await login({ email: email.trim(), password });
      toast.success('Welcome back!');
      if (!loggedUser?.subjects || loggedUser.subjects.length === 0) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (error) {
      const serverMsg = error.response?.data?.message;
      if (serverMsg) {
        setErr(serverMsg);
        toast.error(serverMsg);
      } else if (error.response?.status === 401) {
        setErr('Invalid email or password.');
        toast.error('Invalid email or password.');
      } else if (error.response?.status === 500 || !error.response) {
        setErr('Cannot connect to backend server. Please ensure "npm run dev" is running.');
        toast.error('Server offline or unreachable. Please run "npm run dev" to start both client and server.');
      } else {
        const msg = error.message || 'Email or password is incorrect.';
        setErr(msg);
        toast.error(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" sub="Sign in to continue your streak.">
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="scholar@example.com"
          required
        />

        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="signin-password" className="text-xs font-semibold text-[var(--text)] font-heading">Password</label>
            <Link to="/forgot-password" className="text-[11px] text-[var(--primary)] hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="signin-password"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              aria-label="Password"
              required
              className="w-full h-10 px-3 pr-16 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)] transition-colors"
            />
            <button
              type="button"
              className="absolute right-1 top-1 text-xs text-[var(--muted)] hover:text-[var(--text)] px-2.5 h-8 flex items-center justify-center cursor-pointer"
              onClick={() => setShow(!show)}
              aria-label={show ? 'Hide password' : 'Show password'}
            >
              {show ? 'Hide' : 'Show'}
            </button>
          </div>
          {err && <p className="text-[11px] text-[var(--danger)] mt-1">{err}</p>}
        </div>

        <Button variant="primary" size="lg" loading={busy} type="submit" className="w-full mt-1">
          Sign in
        </Button>

        <div className="relative my-1">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[var(--line)]" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[var(--surface)] px-2 text-[var(--muted)]">or</span>
          </div>
        </div>

        <GoogleAuthButton buttonText="Continue with Google" />

        <p className="text-center text-xs text-[var(--muted)] mt-2">
          New here?{' '}
          <Link to="/signup" className="text-[var(--primary)] font-semibold hover:underline">
            Create an account
          </Link>
        </p>

        <div className="flex items-center justify-center gap-3 pt-3 border-t border-[var(--line)] text-[11px] text-[var(--muted)]">
          <Link to="/terms" className="hover:underline hover:text-[var(--text)]">Terms</Link>
          <span>·</span>
          <Link to="/privacy" className="hover:underline hover:text-[var(--text)]">Privacy</Link>
          <span>·</span>
          <Link to="/rewards-rules" className="hover:underline hover:text-[var(--text)]">Rewards Rules</Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export default SignIn;

