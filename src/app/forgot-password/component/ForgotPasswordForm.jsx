'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { toast } from 'sonner';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const ForgotPasswordForm = ({ onSubmit, onBack }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const handleFormSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      await api.post('/auth/password/forgot', { email: values.email });
      toast.success('OTP sent to your email successfully');
      onSubmit(values.email);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-xs font-semibold text-slate-600">
          Email Address
        </Label>
        <div className="relative">
          <Input
            id="email"
            type="email"
            className="h-11 rounded-xl border-slate-200/80 bg-slate-50/50 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/80 focus-visible:bg-white transition-all"
            placeholder="Enter your email address"
            {...register('email')}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-rose-500 font-medium flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
            {errors.email.message}
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
            Sending OTP...
          </>
        ) : (
          <>
            Send OTP
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </Button>

      {/* Back to Login */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          Back to Login
        </button>
      </div>
    </form>
  );
};

export default ForgotPasswordForm;