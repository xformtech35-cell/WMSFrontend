'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ForgotPasswordForm from './component/ForgotPasswordForm';
import VerifyOTPForm from './component/VerifyOTPForm';
import ResetPasswordForm from './component/ResetPasswordForm';
// import ForgotPasswordForm from './components/ForgotPasswordForm';
// import VerifyOTPForm from './components/VerifyOTPForm';
// import ResetPasswordForm from './components/ResetPasswordForm';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Forgot Password, 2: Verify OTP, 3: Reset Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  const handleEmailSubmit = (submittedEmail) => {
    setEmail(submittedEmail);
    setStep(2);
  };

  const handleOTPVerify = (submittedOtp) => {
    setOtp(submittedOtp);
    setStep(3);
  };

  const handleResetSuccess = () => {
    router.push('/login');
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#f8fafc] text-slate-800 flex items-center justify-center p-4 font-sans select-none">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-50 pointer-events-none" />
      
      {/* Ambient Light Gradients */}
      <div className="absolute -left-20 -top-20 size-[400px] rounded-full bg-indigo-200/30 blur-[100px] pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 size-[400px] rounded-full bg-sky-200/30 blur-[100px] pointer-events-none" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] rounded-full bg-indigo-100/10 blur-[120px] pointer-events-none" />
      
      <div className="relative w-full max-w-[400px] mx-auto">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="absolute -top-14 left-0 cursor-pointer inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Glow border effect */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-slate-200 via-indigo-100 to-slate-200 rounded-[2rem] blur-sm opacity-80 pointer-events-none" />
        
        <Card className="relative rounded-[2rem] border border-slate-150/80 bg-white/90 p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.05)] backdrop-blur-3xl overflow-hidden w-full">
          {/* Top gradient line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-indigo-500 to-sky-500 rounded-full" />
          
          <CardHeader className="space-y-4 text-center p-0 pb-7">
            <div className="space-y-1.5">
              <CardTitle className="text-2xl font-bold tracking-tight text-slate-800">
                {step === 1 && 'Forgot Password'}
                {step === 2 && 'Verify OTP'}
                {step === 3 && 'Reset Password'}
              </CardTitle>
              <CardDescription className="text-sm text-slate-400 font-medium">
                {step === 1 && 'Enter your email to receive OTP'}
                {step === 2 && 'Enter the OTP sent to your email'}
                {step === 3 && 'Create your new password'}
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {step === 1 && (
              <ForgotPasswordForm 
                onSubmit={handleEmailSubmit}
                onBack={() => router.push('/login')}
              />
            )}
            {step === 2 && (
              <VerifyOTPForm 
                email={email}
                onSubmit={handleOTPVerify}
                onBack={handleBack}
              />
            )}
            {step === 3 && (
              <ResetPasswordForm 
                email={email}
                otp={otp}
                onSuccess={handleResetSuccess}
                onBack={handleBack}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}