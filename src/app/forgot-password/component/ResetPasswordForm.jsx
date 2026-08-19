'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, LockKeyhole, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { toast } from 'sonner';

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const ResetPasswordForm = ({ email, otp, onSuccess, onBack }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watch('newPassword');

  const handleFormSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      await api.post('/auth/password/reset', {
        email,
        otp,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      toast.success('Password reset successfully');
      onSuccess();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password strength indicators
  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: 'Weak', color: 'bg-red-500' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    return {
      score,
      label: score <= 1 ? 'Weak' : score === 2 ? 'Fair' : score === 3 ? 'Good' : 'Strong',
      color: score <= 1 ? 'bg-red-500' : score === 2 ? 'bg-yellow-500' : score === 3 ? 'bg-blue-500' : 'bg-green-500',
    };
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* New Password */}
      <div className="space-y-1.5">
        <Label htmlFor="newPassword" className="text-xs font-semibold text-slate-600">
          New Password
        </Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showNewPassword ? 'text' : 'password'}
            className="h-11 rounded-xl border-slate-200/80 bg-slate-50/50 !pl-10 pr-11 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/80 focus-visible:bg-white transition-all"
            placeholder="Enter new password"
            {...register('newPassword')}
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        
        {/* Password Strength Indicator */}
        {newPassword && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((bar) => (
                <div
                  key={bar}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    bar <= strength.score ? strength.color : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-slate-400">
              Password strength: <span className="font-medium text-slate-600">{strength.label}</span>
            </p>
          </div>
        )}
        
        {errors.newPassword && (
          <p className="text-xs text-rose-500 font-medium flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
            {errors.newPassword.message}
          </p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-600">
          Confirm Password
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            className="h-11 rounded-xl border-slate-200/80 bg-slate-50/50 !pl-10 pr-11 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/80 focus-visible:bg-white transition-all"
            placeholder="Confirm new password"
            {...register('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-rose-500 font-medium flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        className="h-12 w-full cursor-pointer rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:shadow-xl hover:shadow-indigo-600/30 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] group" 
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Resetting Password...
          </>
        ) : (
          <>
            Reset Password
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </Button>

      {/* Back Button */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          ← Back
        </button>
      </div>
    </form>
  );
};

export default ResetPasswordForm;