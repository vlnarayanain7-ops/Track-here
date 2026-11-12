import { useState } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import * as usersApi from '@/api/users';
import { getTheme, setTheme } from '@/lib/theme';
import { Sun, Moon, Laptop } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfileSettings() {
  const { user, checkAuth } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [currentThemeState, setCurrentThemeState] = useState(() => getTheme());
  const [loading, setLoading] = useState(false);

  // Age group display (read-only per Prompt 5)
  const ageDisplay =
    user?.ageBand === '13_17'
      ? 'Ages 13 to 17 (Teen Scholar)'
      : user?.ageBand === '18_plus'
      ? 'Ages 18 and over (Adult)'
      : 'Verified 13+';

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    setCurrentThemeState(newTheme);
    toast.success(`Theme set to ${newTheme}`);
  };

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await usersApi.updateProfile({ name });
      await checkAuth();
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setPasswordLoading(true);
    try {
      await usersApi.changePassword({ currentPassword, newPassword });
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-base font-semibold">Profile Information</CardTitle>
          <p className="text-xs text-text-secondary">Update your name and personal details</p>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Email Address"
              value={email}
              disabled
              className="opacity-70 bg-surface/50"
            />

            {/* Age Group (Read-Only per Prompt 5) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--muted)] block">
                Age Group (Verified at sign-up)
              </label>
              <div className="h-[44px] px-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] text-xs font-mono text-[var(--muted)] flex items-center justify-between">
                <span>{ageDisplay}</span>
                <span className="text-[10px] text-[var(--primary)] font-bold uppercase tracking-wider">
                  Verified 13+
                </span>
              </div>
            </div>

            {/* Appearance Theme Selector */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-[var(--text)] block">
                Appearance Theme
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleThemeChange('light')}
                  className={`h-[44px] rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    currentThemeState === 'light'
                      ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--text)] ring-1 ring-[var(--primary)]'
                      : 'border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--muted)]'
                  }`}
                >
                  <Sun className="w-4 h-4 text-[var(--warn)]" />
                  <span>Light</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeChange('dark')}
                  className={`h-[44px] rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    currentThemeState === 'dark'
                      ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--text)] ring-1 ring-[var(--primary)]'
                      : 'border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--muted)]'
                  }`}
                >
                  <Moon className="w-4 h-4 text-[var(--c-violet)]" />
                  <span>Dark</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeChange('system')}
                  className={`h-[44px] rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    currentThemeState === 'system'
                      ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--text)] ring-1 ring-[var(--primary)]'
                      : 'border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--muted)]'
                  }`}
                >
                  <Laptop className="w-4 h-4 text-[var(--muted)]" />
                  <span>System</span>
                </button>
              </div>
            </div>

            <Button type="submit" loading={loading} size="sm" className="text-xs">
              Save Profile
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Security & Password Card */}
      <Card>
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-base font-semibold">Security &amp; Password</CardTitle>
          <p className="text-xs text-text-secondary">Update your password to keep your account safe</p>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />

            <Input
              label="New Password"
              type="password"
              placeholder="•••••••• (Min 8 chars, 1 uppercase, 1 number, 1 symbol)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              loading={passwordLoading}
              size="sm"
              className="text-xs bg-[#216E39] hover:bg-[#17522A] text-white"
            >
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

