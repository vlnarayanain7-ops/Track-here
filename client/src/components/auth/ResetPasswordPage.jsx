import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as authApi from '@/api/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { Lock, ArrowLeft, ShieldCheck } from 'lucide-react';

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

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
      await authApi.resetPassword(token, { password: values.password });
      toast.success('Password updated successfully! Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <div className="w-10 h-10 rounded-xl bg-success/15 border border-success/30 flex items-center justify-center text-success mb-4">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-text-primary">Set new password</h1>
        <p className="text-xs text-text-muted mt-1">Choose a strong password for your account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="relative">
          <Lock className="w-4 h-4 text-text-muted absolute left-3 top-[34px] z-10" />
          <Input
            label="New Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            className="pl-9"
            {...register('password')}
          />
        </div>

        <div className="relative">
          <Lock className="w-4 h-4 text-text-muted absolute left-3 top-[34px] z-10" />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            className="pl-9"
            {...register('confirmPassword')}
          />
        </div>

        <Button type="submit" className="w-full mt-2" loading={loading}>
          Reset Password
        </Button>
      </form>

      <div className="text-center mt-6">
        <Link to="/login" className="text-xs text-text-muted hover:text-text-primary transition-colors inline-flex items-center gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </div>
    </div>
  );
}
