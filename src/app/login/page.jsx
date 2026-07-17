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
  BookOpen,
  Layers3,
  Gauge,
  Route,
  ShieldCheck,
  Clock3,
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
    setValue,
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

  return (
    <div className="relative min-h-screen w-full overflow-y-auto bg-[#f8fafc] text-slate-800 flex items-center justify-center p-4 md:p-8 font-sans select-none">
      {/* Sleek Light Grid Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-50 pointer-events-none" />
      
      {/* Soft Ambient Light Gradient Drops */}
      <div className="absolute -left-20 -top-20 size-[400px] rounded-full bg-indigo-200/30 blur-[100px] pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 size-[400px] rounded-full bg-sky-200/30 blur-[100px] pointer-events-none" />
      
      <div className="relative w-full max-w-7xl mx-auto flex items-center justify-center py-4 lg:py-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr] xl:grid-cols-[1.2fr_0.8fr] items-center">
          
          {/* Left Panel: High-Impact Features Presentation for Landscape/Wide Screens */}
          <div className="glass-card relative hidden lg:flex lg:flex-col rounded-[2.5rem] border border-white bg-white/70 p-6 xl:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.02)] backdrop-blur-xl overflow-hidden">
            <div className="absolute right-[-3rem] top-[-3rem] size-64 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-3rem] left-[-3rem] size-64 rounded-full bg-sky-500/5 blur-3xl pointer-events-none" />
            
            <div className="relative space-y-6">
              {/* Product Badge */}
              <div className="inline-flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-white/90 px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur">
                <span className="flex size-6 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white shadow shadow-indigo-500/20">
                  <Layers3 className="size-3" />
                </span>
                WMS Pro Control Tower
              </div>

              {/* Main Heading */}
              <div className="max-w-2xl space-y-4">
                <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                  A faster warehouse command center for inbound, picking, packing, and shipping.
                </h1>
                <p className="max-w-xl text-xs xl:text-sm leading-relaxed text-slate-500">
                  Access your secure gateway to control inventory workflows with high speed, shared component surfaces, consistent operator queues, and full desktop scan capability.
                </p>
              </div>

              {/* Mini Features Grid */}
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { icon: Gauge, title: 'Optimized Routing', description: 'Zero-latency prefetched link navigation', badgeColor: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
                  { icon: Route, title: 'Shared Surfaces', description: 'Unified UX grid patterns across all views', badgeColor: 'bg-sky-50 text-sky-600 border-sky-100' },
                  { icon: ShieldCheck, title: 'Role Specifics', description: 'Tailored permissions for worker to client', badgeColor: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                  { icon: Clock3, title: 'Real-time Queues', description: 'Immediate visibility on inbound & putaway', badgeColor: 'bg-amber-50 text-amber-600 border-amber-100' },
                ].map(({ icon: Icon, title, description, badgeColor }) => (
                  <div key={title} className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm backdrop-blur-sm flex gap-3 items-start transition-all hover:scale-[1.01]">
                    <span className={`flex size-8 shrink-0 items-center justify-center rounded-xl border ${badgeColor}`}>
                      <Icon className="size-4" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{title}</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Guide Quick-link banner */}
            <div className="relative mt-4 flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-gradient-to-r from-slate-50/50 to-white/50 p-4 backdrop-blur-sm">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Documentation & Setup</p>
                <p className="mt-0.5 text-xs text-slate-500">Read our structured reference guide for roles.</p>
              </div>
              <Link
                href="/guide"
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-600 shadow-sm transition-all hover:bg-indigo-100 active:scale-[0.98]"
              >
                <BookOpen className="size-3.5" />
                Guide Book
              </Link>
            </div>
          </div>

          {/* Right Panel: Premium Light Glassmorphism Card for Login */}
          <div className="relative flex flex-col justify-center items-center w-full max-w-[390px] mx-auto">
            {/* Subtle glow border ring */}
            <div className="absolute -inset-[1px] bg-gradient-to-r from-slate-200 via-indigo-100 to-slate-200 rounded-[2rem] blur-sm opacity-80 pointer-events-none" />
            
            <Card className="relative rounded-[2rem] border border-slate-150/80 bg-white/90 p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.03)] backdrop-blur-3xl overflow-hidden w-full">
              {/* Card header */}
              <CardHeader className="space-y-3.5 text-center p-0 pb-5">
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-[0_8px_20px_rgba(99,102,241,0.12)] border border-indigo-100">
                  <LockKeyhole className="size-5" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-bold tracking-tight text-slate-800">
                    Sign in
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400 font-medium">
                    Use WMS secure credentials to establish session
                  </CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Username input */}
                  <div className="space-y-1.5">
                    <Label htmlFor="username" className="text-xs font-semibold text-slate-600">Username</Label>
                    <div className="relative group">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 z-10 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-sm text-slate-400 transition-colors group-focus-within:text-indigo-600">
                        <UserRound className="size-4" />
                      </span>
                      <Input
                        id="username"
                        className="h-10 rounded-xl border border-slate-200/80 bg-slate-50/50 pl-10 pr-3 text-xs text-slate-800 shadow-sm transition-all placeholder-slate-400 focus-visible:ring-1 focus-visible:ring-indigo-500/40 focus-visible:border-indigo-500/80 focus-visible:bg-white"
                        placeholder="WMS Operator Username"
                        {...register('username')}
                      />
                    </div>
                    {errors.username ? <p className="text-[10px] text-rose-500 font-medium">{errors.username.message}</p> : null}
                  </div>

                  {/* Password input */}
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-semibold text-slate-600">Password</Label>
                    <div className="relative group">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 z-10 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-sm text-slate-400 transition-colors group-focus-within:text-indigo-600">
                        <LockKeyhole className="size-4" />
                      </span>
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        className="h-10 rounded-xl border border-slate-200/80 bg-slate-50/50 pl-10 pr-10 text-xs text-slate-800 shadow-sm transition-all placeholder-slate-400 focus-visible:ring-1 focus-visible:ring-indigo-500/40 focus-visible:border-indigo-500/80 focus-visible:bg-white"
                        placeholder="Operator Password"
                        {...register('password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute right-2 top-1/2 z-10 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                      >
                        {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                    </div>
                    {errors.password ? <p className="text-[10px] text-rose-500 font-medium">{errors.password.message}</p> : null}
                  </div>

                  {/* Login button */}
                  <Button 
                    type="submit" 
                    className="h-10 w-full rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/10 hover:from-indigo-500 hover:to-indigo-600 transition-all hover:-translate-y-[1px] hover:shadow-lg hover:shadow-indigo-500/15 active:scale-[0.98]" 
                    size="sm" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="size-3.5 animate-spin mr-2" /> : null}
                    Establish Secure Session
                  </Button>

                  {/* Separator to keep styling clean */}
                  <div className="pt-2 border-t border-slate-100">
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
          
        </div>
      </div>
    </div>
  );
}
