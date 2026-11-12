import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import * as authApi from '@/api/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';

const schema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
});

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(values);
      setSent(true);
      if (res?.resetToken) {
        setDevToken(res.resetToken);
      }
      toast.success('Password reset instructions generated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent mb-4">
          <KeyRound className="w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-text-primary">Reset your password</h1>
        <p className="text-xs text-text-muted mt-1">
          Enter your email to receive recovery instructions
        </p>
      </div>

      {sent ? (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 rounded-xl bg-success/10 border border-success/30 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-text-primary">Instructions sent</p>
              <p className="text-xs text-text-secondary mt-1">
                If an account matches that email address, reset instructions have been generated.
              </p>
            </div>
          </div>
          {devToken && (
            <div className="p-4 rounded-xl bg-accent/10 border border-accent/30 text-xs">
              <p className="font-semibold text-accent mb-1">Development Mode Reset Link:</p>
              <Link
                to={`/reset-password/${devToken}`}
                className="text-text-primary underline break-all hover:text-accent transition-colors"
              >
                Click here to reset password with token
              </Link>
            </div>
          )}
          <Link to="/login">
            <Button variant="outline" className="w-full mt-2 gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="relative">
            <Mail className="w-4 h-4 text-text-muted absolute left-3 top-[34px] z-10" />
            <Input
              label="Email address"
              type="email"
              placeholder="student@example.com"
              error={errors.email?.message}
              className="pl-9"
              {...register('email')}
            />
          </div>

          <Button type="submit" className="w-full mt-2" loading={loading}>
            Send Reset Instructions
          </Button>

          <div className="text-center mt-4">
            <Link to="/login" className="text-xs text-text-muted hover:text-text-primary transition-colors inline-flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
