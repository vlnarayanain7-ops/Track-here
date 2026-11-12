import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button, Field } from '../components/ui';
import { AuthLayout } from './AuthLayout';
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
    } catch {
      // Security rule: Never reveal whether an email exists in the database
      setErr('Email or password is incorrect.');
    } finally {
      setBusy(false);
    }
  }

  function handleGoogleAuth() {
    toast('Google sign-in will be enabled with your domain setup.', { icon: 'ℹ️' });
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
          <Field
            label="Password"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={err}
            placeholder="••••••••"
            required
          />
          <button
            type="button"
            className="btn btn-ghost absolute right-1 top-[28px] text-xs text-[var(--muted)] hover:text-[var(--text)] px-2.5 h-[38px]"
            onClick={() => setShow(!show)}
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? 'Hide' : 'Show'}
          </button>
        </div>

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-xs text-[var(--primary)] hover:underline font-semibold"
          >
            Forgot password?
          </Link>
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

        <Button
          type="button"
          size="lg"
          onClick={handleGoogleAuth}
          className="w-full"
        >
          Continue with Google
        </Button>

        <p className="text-center text-xs text-[var(--muted)] mt-2">
          New here?{' '}
          <Link to="/signup" className="text-[var(--primary)] font-semibold hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default SignIn;

