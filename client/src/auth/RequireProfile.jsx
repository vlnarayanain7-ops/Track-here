import { useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import * as userApi from '../api/users';
import { Button } from '../components/ui.jsx';
import { AuthLayout } from './AuthLayout';
import toast from 'react-hot-toast';

export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div role="status" className="h-[100dvh] w-full flex flex-col items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <div className="w-10 h-10 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs text-[var(--muted)] font-mono tracking-wider uppercase">
          Verifying Session...
        </span>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/signin" state={{ from: location }} replace />;
}

export function RequireProfile() {
  const { user } = useAuth();

  // If user signed in via Google and has not declared their age band yet
  if (user && !user.ageBand) {
    return <Navigate to="/complete-profile" replace />;
  }

  return <Outlet />;
}

export function CompleteProfile() {
  const { user, logout, checkAuth } = useAuth();
  const navigate = useNavigate();

  const [age, setAge] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');

    if (!age) {
      setErr('Please select your age group to continue.');
      return;
    }

    if (age === 'under13') {
      try {
        await userApi.deleteAccount({ reason: 'under13' });
      } catch (err) {
        console.error('Failed to purge under13 account:', err);
      }
      toast.error('Track Here is for ages 13 and up. Your account has been deleted.');
      await logout();
      navigate('/signin', { replace: true });
      return;
    }

    setBusy(true);
    try {
      await userApi.updateProfile({ ageBand: age });
      await checkAuth();
      toast.success('Profile complete! Welcome to Track Here.');
      navigate('/', { replace: true });
    } catch (error) {
      setErr(error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="One last step" sub="Please confirm your age group to finish setting up your account.">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <fieldset className="border-0 p-0 m-0">
          <legend className="text-xs font-bold text-[var(--text)] uppercase tracking-wider block font-heading mb-2">
            Age group
          </legend>
          <div className="space-y-1.5">
            {[
              ['under13', 'Under 13'],
              ['13_17', '13 to 17'],
              ['18_plus', '18 or older'],
            ].map(([val, label]) => (
              <label
                key={val}
                className="flex items-center gap-3 min-h-[44px] px-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] hover:border-[var(--primary)]/50 cursor-pointer transition-colors text-xs font-semibold text-[var(--text)]"
              >
                <input
                  type="radio"
                  name="age"
                  checked={age === val}
                  onChange={() => setAge(val)}
                  className="w-4.5 h-4.5 accent-[var(--primary)]"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
          {err && (
            <small role="alert" className="text-xs text-[var(--danger)] block mt-2 font-medium">
              {err}
            </small>
          )}
        </fieldset>

        <Button variant="primary" size="lg" loading={busy} type="submit" className="w-full mt-2">
          Complete setup
        </Button>
      </form>
    </AuthLayout>
  );
}

