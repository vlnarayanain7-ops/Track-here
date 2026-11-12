import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { ArrowLeft, User, Mail, Lock, ShieldCheck } from 'lucide-react';

const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50),
    email: z.string().trim().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
      });
      toast.success('Account created successfully!');
      navigate('/onboarding');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-bold text-text-primary tracking-tight">
          Create your account
        </h1>
        <p className="text-xs text-text-muted mt-1">
          Set up your study workspace in under a minute
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <Input
          label="Full Name"
          placeholder="Ada Lovelace"
          icon={User}
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Email address"
          type="email"
          placeholder="student@example.com"
          icon={Mail}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type="password"
          placeholder="Min 8 characters"
          icon={Lock}
          helperText="Use 8+ characters with letters, numbers & symbols"
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Re-enter password"
          icon={ShieldCheck}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button
          type="submit"
          className="w-full mt-2 h-10"
          loading={loading}
        >
          Create Account
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-border/60 text-center">
        <p className="text-xs text-text-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:text-accent-hover font-semibold transition-colors inline-flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" />
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
