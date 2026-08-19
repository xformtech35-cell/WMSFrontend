'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, KeyRound, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { toast } from 'sonner';

const verifyOTPSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

const VerifyOTPForm = ({ email, onSubmit, onBack }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const otpInputRefs = useRef([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(verifyOTPSchema),
    defaultValues: {
      otp: '',
    },
  });

  useEffect(() => {
    // Auto-focus first OTP input
    if (otpInputRefs.current[0]) {
      otpInputRefs.current[0].focus();
    }
  }, []);

  useEffect(() => {
    let interval = null;
    if (timer > 0 && !canResend) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer, canResend]);

  const handleOTPChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const otpArray = otpInputRefs.current.map((ref) => ref.value);
    otpArray[index] = value;
    setValue('otp', otpArray.join(''));

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1].focus();
    }
  };

  const handleOTPKeyDown = (index, e) => {
    // Backspace goes to previous input
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      otpInputRefs.current[index - 1].focus();
    }
  };

  const handleOTPPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    if (!/^\d{6}$/.test(pastedData)) {
      toast.error('Please paste a valid 6-digit OTP');
      return;
    }

    const otpArray = pastedData.split('');
    otpInputRefs.current.forEach((ref, index) => {
      if (ref) {
        ref.value = otpArray[index] || '';
      }
    });
    setValue('otp', pastedData);
    otpInputRefs.current[5]?.focus();
  };

  const handleFormSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      await api.post('/auth/password/verify-otp', {
        email,
        otp: values.otp,
      });
      toast.success('OTP verified successfully');
      onSubmit(values.otp);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    try {
      await api.post('/auth/password/resend-otp', { email });
      toast.success('OTP resent successfully');
      setTimer(60);
      setCanResend(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-slate-600">
          Enter OTP
        </Label>
        <p className="text-xs text-slate-400 mb-2">
          We sent a 6-digit code to <span className="font-medium text-slate-600">{email}</span>
        </p>
        <div className="flex gap-2 justify-center">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <Input
              key={index}
              ref={(el) => (otpInputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              className="h-12 w-12 text-center text-lg font-semibold rounded-xl border-slate-200/80 bg-slate-50/50 focus-visible:ring-2 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/80 focus-visible:bg-white transition-all"
              onChange={(e) => handleOTPChange(index, e.target.value)}
              onKeyDown={(e) => handleOTPKeyDown(index, e)}
              onPaste={index === 0 ? handleOTPPaste : undefined}
            />
          ))}
        </div>
        <input type="hidden" {...register('otp')} />
        {errors.otp && (
          <p className="text-xs text-rose-500 font-medium flex items-center justify-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
            {errors.otp.message}
          </p>
        )}
      </div>

      {/* Resend OTP */}
      <div className="text-center">
        {canResend ? (
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={isResending}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
          >
            {isResending ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
                Resending...
              </>
            ) : (
              'Resend OTP'
            )}
          </button>
        ) : (
          <p className="text-sm text-slate-400">
            Resend in <span className="font-medium text-slate-600">{timer}s</span>
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
            Verifying...
          </>
        ) : (
          <>
            Verify OTP
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

export default VerifyOTPForm;