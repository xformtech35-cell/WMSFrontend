'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Loader2,
  LockKeyhole,
  UserRound,
  Eye,
  EyeOff,
  Warehouse,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { toast } from 'sonner';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    localStorage.removeItem('wms_token');
    localStorage.removeItem('wms_username');
    localStorage.removeItem('wms_role');
    localStorage.removeItem('wms_permissions');
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: 'demo',
      password: '12345678',
    },
  });

  const onSubmit = async (values) => {
    try {
      const { data } = await api.post('/auth/login', values);
      localStorage.setItem('wms_token', data.token);
      localStorage.setItem('wms_username', data.username);
      localStorage.setItem('userid', data.id);
      localStorage.setItem('wms_role', data.role);
      localStorage.setItem('wms_permissions', JSON.stringify(data.permissions ?? []));
      toast.success('Signed in successfully');
      router.push('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid username or password');
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    router.push('/forgot-password');
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
        {/* Glow border effect */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-slate-200 via-indigo-100 to-slate-200 rounded-[2rem] blur-sm opacity-80 pointer-events-none" />
        
        <Card className="relative rounded-[2rem] border border-slate-150/80 bg-white/90 p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.05)] backdrop-blur-3xl overflow-hidden w-full">
          {/* Top gradient line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-indigo-500 to-sky-500 rounded-full" />
          
          <CardHeader className="space-y-4 text-center p-0 pb-7">
            {/* Logo */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 text-indigo-600 shadow-[0_8px_30px_rgba(99,102,241,0.12)] border border-indigo-100/50">
              <Warehouse className="h-8 w-8" />
            </div>
            
            <div className="space-y-1.5">
              <CardTitle className="text-2xl font-bold tracking-tight text-slate-800">
                WMS Login
              </CardTitle>
              <CardDescription className="text-sm text-slate-400 font-medium">
                Enter your credentials to continue
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Username */}
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs font-semibold text-slate-600">
                  Username
                </Label>
                <div className="relative">
                  <UserRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="username"
                    className="h-11 rounded-xl border-slate-200/80 bg-slate-50/50 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/80 focus-visible:bg-white transition-all"
                    placeholder="Enter your username"
                    {...register('username')}
                  />
                </div>
                {errors.username && (
                  <p className="text-xs text-rose-500 font-medium flex items-center gap-1.5">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-600">
                  Password
                </Label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="h-11 rounded-xl border-slate-200/80 bg-slate-50/50 !pl-10 pr-11 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/80 focus-visible:bg-white transition-all"
                    placeholder="Enter your password"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-rose-500 font-medium flex items-center gap-1.5">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Forgot Password Link - Using button with onClick */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
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
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}