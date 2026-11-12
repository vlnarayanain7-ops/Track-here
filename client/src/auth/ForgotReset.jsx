import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as authApi from '../api/auth';
import { Button, Field } from '../components/ui';
import { AuthLayout } from './AuthLayout';
import toast from 'react-hot-toast';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!email.trim()) return;

    setBusy(true);
    try {
      await authApi.forgotPassword(email.trim());
    } catch {
      // Intentionally silent: security rule requires identical response
    } finally {
      setBusy(false);
      setSubmitted(true);
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      sub="Enter your email and we’ll send you recovery instructions."
    >
      {submitted ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            If an account exists with <b className="text-[var(--text)]">{email}</b>, we have sent a password reset link. Please check your inbox and spam folder.
          </p>
          <Link to="/signin" className="btn btn-primary btn-lg w-full">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <Field
            label="Account email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="scholar@example.com"
            required
          />

          <Button variant="primary" size="lg" loading={busy} type="submit" className="w-full mt-2">
            Send reset link
          </Button>

          <p className="text-center text-xs text-[var(--muted)] mt-2">
            Remembered your password?{' '}
            <Link to="/signin" className="text-[var(--primary)] font-semibold hover:underline">
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}

export function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');

    if (password.length < 8) {
      setErr('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErr('Passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      await authApi.resetPassword(token, password);
      toast.success('Password updated successfully! Please sign in.');
      navigate('/signin', { replace: true });
    } catch (error) {
      setErr(error.response?.data?.message || 'Password reset link is invalid or expired.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Choose new password" sub="Create a secure new password for your account.">
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Field
          label="New password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          required
        />

        <Field
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={err}
          placeholder="Re-type new password"
          required
        />

        <Button variant="primary" size="lg" loading={busy} type="submit" className="w-full mt-2">
          Update password
        </Button>

        <p className="text-center text-xs text-[var(--muted)] mt-2">
          <Link to="/signin" className="text-[var(--primary)] font-semibold hover:underline">
            Cancel and return to sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

