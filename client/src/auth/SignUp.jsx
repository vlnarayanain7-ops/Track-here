import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button, Field } from '../components/ui';
import { AuthLayout } from './AuthLayout';
import GoogleAuthButton from './GoogleAuthButton';
import toast from 'react-hot-toast';

const calculateStrength = (p) =>
  [p.length >= 8, /[A-Z]/.test(p), /[0-9]/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length;

export function SignUp() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    age: '', // '' | 'under13' | '13_17' | '18_plus'
    terms: false,
  });

  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const errors = {};

    if (!form.name.trim()) errors.name = 'Enter your name.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email.';
    if (form.password.length < 8) errors.password = 'Use at least 8 characters.';

    if (!form.age) {
      errors.age = 'Choose your age group.';
    } else if (form.age === 'under13') {
      errors.age = 'Track Here is for ages 13 and up.';
    }

    if (!form.terms) {
      errors.terms = 'Please accept the Terms and Privacy Policy.';
    }

    setErr(errors);
    if (Object.keys(errors).length > 0) return;

    setBusy(true);

    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        ageBand: form.age, // '13_17' or '18_plus'
      });

      toast.success('Account created successfully!');
      navigate('/onboarding', { replace: true });
    } catch (error) {
      const serverMsg = error.response?.data?.message || error.message || 'Registration failed.';
      setErr({ form: serverMsg });
    } finally {
      setBusy(false);
    }
  }

  const strengthScore = calculateStrength(form.password);
  const strengthLabels = ['Weak', 'Weak', 'Okay', 'Good', 'Strong'];

  return (
    <AuthLayout title="Create your account" sub="Free while we’re in early access.">
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Field
          label="Full name"
          autoComplete="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={err.name}
          placeholder="Scholar Name"
          required
        />

        <Field
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={err.email}
          placeholder="scholar@example.com"
          required
        />

        <Field
          label="Password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={err.password}
          hint={form.password ? strengthLabels[strengthScore] : 'At least 8 characters.'}
          placeholder="••••••••"
          required
        />

        {/* REQUIRED Age Group Choice (Under 13 is blocked, stores ageBand 13_17 or 18_plus) */}
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
                  checked={form.age === val}
                  onChange={() => setForm({ ...form, age: val })}
                  className="w-4.5 h-4.5 accent-[var(--primary)]"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
          {err.age && (
            <small role="alert" className="text-xs text-[var(--danger)] block mt-1.5 font-medium">
              {err.age}
            </small>
          )}
        </fieldset>

        {/* Terms and Privacy Checkbox */}
        <label className="flex items-start gap-3 min-h-[44px] cursor-pointer text-xs text-[var(--muted)] pt-1 select-none">
          <input
            type="checkbox"
            checked={form.terms}
            onChange={(e) => setForm({ ...form, terms: e.target.checked })}
            className="w-4.5 h-4.5 rounded accent-[var(--primary)] mt-0.5 shrink-0"
          />
          <span>
            I agree to the{' '}
            <Link to="/terms" className="text-[var(--primary)] font-semibold hover:underline">
              Terms
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-[var(--primary)] font-semibold hover:underline">
              Privacy Policy
            </Link>
          </span>
        </label>
        {err.terms && (
          <small role="alert" className="text-xs text-[var(--danger)] block -mt-2 font-medium">
            {err.terms}
          </small>
        )}

        {err.form && (
          <small role="alert" className="text-xs text-[var(--danger)] block font-medium">
            {err.form}
          </small>
        )}

        <Button variant="primary" size="lg" loading={busy} type="submit" className="w-full mt-1">
          Create account
        </Button>

        <div className="relative my-1">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[var(--line)]" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[var(--surface)] px-2 text-[var(--muted)]">or</span>
          </div>
        </div>

        <GoogleAuthButton buttonText="Sign up with Google" />

        <p className="text-center text-xs text-[var(--muted)] mt-2">
          Already have an account?{' '}
          <Link to="/signin" className="text-[var(--primary)] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default SignUp;

