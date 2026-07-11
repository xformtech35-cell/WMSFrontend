'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import api from '@/lib/api';
import { BACKEND_BASE } from '@/lib/config';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  User,
  Lock,
  Warehouse,
  Bell,
  Palette,
  Database,
  Shield,
  CheckCircle2,
  Server,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Info,
  Moon,
  Sun,
  Monitor,
  ChevronDown,
  Scan,
} from 'lucide-react';

/* ── Section card with responsive icon + title ─────────── */
function Section({
  icon: Icon,
  title,
  description,
  children,
  fullWidth,
  collapsible = true,
  open,
  onToggle,
}) {
  return (
    <section className={`relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-background via-card/95 to-muted/20 p-4 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.45)] backdrop-blur-sm sm:p-6 ${fullWidth ? 'col-span-full' : ''}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_60%)]" />
      <div className="relative flex items-start justify-between gap-3 sm:gap-4">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary shadow-sm shadow-primary/10">
            <Icon className="size-4.5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-[1.02rem] tracking-tight text-foreground sm:text-lg">{title}</h3>
            {description && <p className="mt-1 text-xs text-muted-foreground/90 sm:text-sm">{description}</p>}
          </div>
        </div>
        {collapsible && onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition-all hover:border-primary/25 hover:text-foreground"
          >
            {open ? 'Collapse' : 'Expand'}
            <ChevronDown className={`size-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
      <Separator className="relative my-4 opacity-70" />
      {open !== false && (
        <div className="relative">
          {children}
        </div>
      )}
    </section>
  );
}

function MetricCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="min-w-0 rounded-2xl border border-border/60 bg-gradient-to-br from-background via-background to-muted/35 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 pr-2">
          <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">{label}</p>
          <p className="mt-2 break-words text-sm font-semibold leading-snug text-foreground sm:text-[0.95rem]">{value}</p>
          {hint && <p className="mt-1 break-words text-xs leading-snug text-muted-foreground/90 sm:text-[0.8rem]">{hint}</p>}
        </div>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10 sm:size-9">
          <Icon className="size-4" />
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, children, subtle = false }) {
  return (
    <div className={`flex flex-col gap-2 rounded-2xl border px-3 py-2.5 transition-all duration-200 sm:flex-row sm:items-center sm:justify-between ${subtle ? 'border-border/50 bg-muted/25 hover:bg-muted/40' : 'border-transparent bg-background/50 hover:bg-background hover:shadow-sm'}`}>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div className="min-w-0 text-left sm:text-right">{children}</div>
    </div>
  );
}

function TabPanel({ children }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/20 p-4 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.45)] sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.05),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.05),transparent_50%)]" />
      <div className="relative flex flex-col gap-4 sm:gap-6">
        {children}
      </div>
    </div>
  );
}

/* ── Field row - responsive ────────────────────────────── */
function FieldRow({ label, children, hint }) {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div>
        <Label className="text-xs sm:text-sm font-medium">{label}</Label>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

/* ── Toggle row - responsive ──────────────────────────── */
function ToggleRow({ label, hint, checked, onCheckedChange }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-border/50 bg-background/60 px-3 py-3 transition-all duration-200 hover:border-primary/20 hover:bg-background sm:items-center">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} className="shrink-0" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════ */
import { usePermissions } from '@/lib/hooks/usePermissions';
import { P } from '@/lib/permissions';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const { can } = usePermissions();
  const [authToken, setAuthToken] = useState('');
  const [openSections, setOpenSections] = useState({
    accountProfile: true,
    accountPassword: false,
    warehousePrimary: true,
    warehouseData: false,
    preferencesAppearance: true,
    preferencesDisplay: false,
    notificationsAlerts: true,
    systemApi: true,
    systemSecurity: false,
    systemAbout: false,
    systemHardware: false,
  });
  const resolvedApiBase = BACKEND_BASE || (typeof window !== 'undefined' ? window.location.origin : '');
  const swaggerUrl = resolvedApiBase ? `${resolvedApiBase}/swagger-ui/index.html` : '/swagger-ui/index.html';
  const backendBaseLabel = resolvedApiBase || 'Same origin';

  const toggleSection = (key) => {
    setOpenSections((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  useEffect(() => {
    setAuthToken(localStorage.getItem('wms_token') || '');
  }, []);

  /* ── Notification prefs (local state / localStorage) ── */
  const [notifPickAlert,    setNotifPickAlert]    = useState(true);
  const [notifOrderAlert,   setNotifOrderAlert]   = useState(true);
  const [notifLowStock,     setNotifLowStock]     = useState(false);
  const [notifSoundEnabled, setNotifSoundEnabled] = useState(false);

  /* ── Password change state ─────────────────────────── */
  const [currentPw,   setCurrentPw]   = useState('');
  const [newPw,       setNewPw]       = useState('');
  const [confirmPw,   setConfirmPw]   = useState('');
  const [showPw,      setShowPw]      = useState(false);
  const [pwSaving,    setPwSaving]    = useState(false);

  /* ── Warehouse form ────────────────────────────────── */
  const [whName,     setWhName]     = useState('');
  const [whLocation, setWhLocation] = useState('');
  const [whEdited,   setWhEdited]   = useState(false);

  /* Load prefs from localStorage on mount */
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem('wms_notif_prefs') || '{}');
      if (p.pickAlert    !== undefined) setNotifPickAlert(p.pickAlert);
      if (p.orderAlert   !== undefined) setNotifOrderAlert(p.orderAlert);
      if (p.lowStock     !== undefined) setNotifLowStock(p.lowStock);
      if (p.soundEnabled !== undefined) setNotifSoundEnabled(p.soundEnabled);
    } catch { /* ignore */ }
  }, []);

  const saveNotifPrefs = () => {
    localStorage.setItem('wms_notif_prefs', JSON.stringify({
      pickAlert: notifPickAlert,
      orderAlert: notifOrderAlert,
      lowStock: notifLowStock,
      soundEnabled: notifSoundEnabled,
    }));
    toast.success('Notification preferences saved');
  };

  /* ── Current user ──────────────────────────────────── */
  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ['me', authToken],
    queryFn: () => api.get('/auth/me').then((r) => r.data).catch(() => {
      try {
        const token = authToken || localStorage.getItem('wms_token');
        if (!token) return null;
        const payload = JSON.parse(atob(token.split('.')[1]));
        return { username: payload.sub, role: payload.role ?? 'USER' };
      } catch { return null; }
    }),
    enabled: !!authToken,
    staleTime: 0,
    refetchOnMount: 'always',
    retry: false,
  });

  /* ── Warehouses ────────────────────────────────────── */
  const { data: warehouses, isLoading: whLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => api.get('/master/warehouses').then((r) => r.data),
    staleTime: 60_000,
    enabled: can(P.MASTER_VIEW),
    retry: false,
  });

  const primaryWarehouse = warehouses?.[0];

  useEffect(() => {
    if (primaryWarehouse && !whEdited) {
      setWhName(primaryWarehouse.name ?? '');
      setWhLocation(primaryWarehouse.location ?? '');
    }
  }, [primaryWarehouse, whEdited]);

  const whMutation = useMutation({
    mutationFn: (data) =>
      primaryWarehouse
        ? api.put(`/master/warehouses/${primaryWarehouse.id}`, data)
        : api.post('/master/warehouses', data),
    onSuccess: () => {
      toast.success('Warehouse settings saved');
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setWhEdited(false);
    },
    onError: () => toast.error('Failed to save warehouse settings'),
  });

  /* ── Password change ───────────────────────────────── */
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPw !== confirmPw) { toast.error('New passwords do not match'); return; }
    if (newPw.length < 6)   { toast.error('Password must be at least 6 characters'); return; }
    setPwSaving(true);
    try {
      await api.post('/auth/change-password', { currentPassword: currentPw, newPassword: newPw });
      toast.success('Password changed successfully');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? err?.response?.data?.message ?? 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  /* ── API health ────────────────────────────────────── */
  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await fetch(`${resolvedApiBase}/actuator/health`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`Health check failed (${response.status})`);
      }
      return response.json();
    },
    staleTime: 30_000,
    retry: false,
  });

  const apiStatus = health?.status === 'UP' ? 'UP' : healthLoading ? 'Checking...' : 'DOWN';
  const apiStatusTone = apiStatus === 'UP'
    ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20'
    : apiStatus === 'DOWN'
      ? 'text-red-600 bg-red-500/10 border-red-500/20'
      : 'text-amber-600 bg-amber-500/10 border-amber-500/20';

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader title="Settings" description="Manage your account, warehouse, and system preferences." />

      <div className="grid gap-4 xl:grid-cols-[1.5fr_0.9fr]">
        <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-background p-5 shadow-sm sm:p-6">
          <div className="absolute inset-y-0 right-0 w-44 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_65%)] pointer-events-none" />
          <div className="relative flex flex-col gap-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.24em]">
                  Control Center
                </Badge>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Settings
                </h1>
                {/* <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                  Tune account access, warehouse defaults, notifications, and backend connections from one polished workspace.
                </p> */}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => refetchHealth()} className="gap-2 rounded-xl">
                  <RefreshCw className="size-3.5" /> Refresh health
                </Button>
                <Button
                  size="sm"
                  onClick={() => window.open(swaggerUrl, '_blank', 'noopener,noreferrer')}
                  className="gap-2 rounded-xl"
                >
                  <Server className="size-3.5" /> Open Swagger
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
              <MetricCard icon={Server} label="Backend" value={apiStatus} hint={backendBaseLabel} />
              <MetricCard icon={User} label="Account" value={me?.username ?? 'Signed in user'} hint={me?.role ?? 'USER'} />
              <MetricCard icon={Warehouse} label="Warehouse" value={primaryWarehouse?.name ?? 'Not set'} hint={primaryWarehouse?.location ?? 'Primary warehouse'} />
              <MetricCard icon={Palette} label="Theme" value={theme ?? 'system'} hint="Light, dark, or system" />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Quick reference</p>
              <h2 className="mt-2 text-base font-semibold tracking-tight">Live configuration</h2>
            </div>
            <Badge variant="outline" className={`rounded-full border px-3 py-1 text-xs font-medium ${apiStatusTone}`}>
              {apiStatus}
            </Badge>
          </div>

          <div className="mt-4 space-y-2">
            <DetailRow label="API Base URL" subtle>
              <span className="inline-flex max-w-full items-center rounded-full bg-muted px-3 py-1 font-mono text-xs whitespace-nowrap overflow-x-auto sm:max-w-[280px] sm:justify-end">
                {backendBaseLabel}
              </span>
            </DetailRow>
            <DetailRow label="Swagger UI">
              <a href={swaggerUrl} target="_blank" rel="noopener noreferrer" className="break-all font-mono text-xs text-primary hover:underline sm:break-normal">
                /swagger-ui/index.html
              </a>
            </DetailRow>
            <DetailRow label="Session token" subtle>
              <span className="font-mono text-xs text-foreground">{authToken ? 'Loaded' : 'Missing'}</span>
            </DetailRow>
            <DetailRow label="Current role">
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{me?.role ?? 'USER'}</span>
            </DetailRow>
          </div>
        </section>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <div className="rounded-3xl border border-border/60 bg-card/80 p-2 shadow-sm backdrop-blur-sm sm:p-3">
          {/* ── Responsive TabsList ──────────────────────────── */}
          <TabsList className="grid h-14 w-full grid-cols-2 gap-2 rounded-2xl bg-muted/40 p-2 sm:grid-cols-3 lg:grid-cols-5">
            <TabsTrigger value="account" className="h-full min-w-0 justify-center gap-2 rounded-xl px-3 text-center text-[0.75rem] sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <User className="size-3.5" /> Account
            </TabsTrigger>
            <TabsTrigger value="warehouse" className="h-full min-w-0 justify-center gap-2 rounded-xl px-3 text-center text-[0.75rem] sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Warehouse className="size-3.5" /> Warehouse
            </TabsTrigger>
            <TabsTrigger value="preferences" className="h-full min-w-0 justify-center gap-2 rounded-xl px-3 text-center text-[0.75rem] sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Palette className="size-3.5" /> Prefs
            </TabsTrigger>
            <TabsTrigger value="notifications" className="h-full min-w-0 justify-center gap-2 rounded-xl px-3 text-center text-[0.75rem] sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Bell className="size-3.5" /> Notifications
            </TabsTrigger>
            <TabsTrigger value="system" className="h-full min-w-0 justify-center gap-2 rounded-xl px-3 text-center text-[0.75rem] sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Server className="size-3.5" /> System
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── Account Tab ──────────────────────────────────── */}
        <TabsContent value="account" className="mt-0">
          <TabPanel>
            <Section
              icon={User}
              title="Profile"
              description="Your account information"
              open={openSections.accountProfile}
              onToggle={() => toggleSection('accountProfile')}
            >
              {meLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-full sm:w-48" />
                  <Skeleton className="h-8 w-full sm:w-32" />
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-border/50 bg-background/70 p-4 shadow-sm">
                    <FieldRow label="Username">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Input value={me?.username ?? '—'} disabled className="flex-1 font-mono text-xs sm:text-sm" />
                        <Badge variant="secondary" className="shrink-0 text-xs sm:text-sm">{me?.role ?? 'USER'}</Badge>
                      </div>
                    </FieldRow>
                  </div>
                  <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 to-background p-4 shadow-sm">
                    <FieldRow label="Role" hint="Contact admin to change role">
                      <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm sm:text-sm">
                        <Shield className="size-3.5 sm:size-4" />
                        {me?.role ?? 'USER'}
                      </div>
                    </FieldRow>
                  </div>
                </div>
              )}
            </Section>

            <Section
              icon={Lock}
              title="Change Password"
              description="Update your login password"
              open={openSections.accountPassword}
              onToggle={() => toggleSection('accountPassword')}
            >
              <form onSubmit={handlePasswordChange} className="grid gap-4 sm:gap-5 lg:grid-cols-2">
                <FieldRow label="Current Password">
                  <div className="relative">
                    <Input
                      type={showPw ? 'text' : 'password'}
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                      placeholder="Enter current password"
                      className="pr-9 text-xs sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPw ? <EyeOff className="size-3.5 sm:size-4" /> : <Eye className="size-3.5 sm:size-4" />}
                    </button>
                  </div>
                </FieldRow>
                <FieldRow label="New Password">
                  <Input
                    type={showPw ? 'text' : 'password'}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="At least 6 characters"
                    className="text-xs sm:text-sm"
                  />
                </FieldRow>
                <FieldRow label="Confirm Password">
                  <Input
                    type={showPw ? 'text' : 'password'}
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    placeholder="Repeat new password"
                    className="text-xs sm:text-sm"
                  />
                </FieldRow>
                <div className="lg:col-span-2 flex justify-end pt-2">
                  <Button type="submit" size="sm" disabled={pwSaving || !currentPw || !newPw || !confirmPw} className="text-xs sm:text-sm">
                    {pwSaving ? <RefreshCw className="size-3.5 mr-1.5 animate-spin" /> : <Save className="size-3.5 mr-1.5" />}
                    Update Password
                  </Button>
                </div>
              </form>
            </Section>
          </TabPanel>
        </TabsContent>

        {/* ── Warehouse Tab ────────────────────────────────── */}
        <TabsContent value="warehouse" className="mt-0">
          <TabPanel>
            {!can(P.MASTER_VIEW) ? (
              <div className="flex flex-col items-center gap-4 rounded-3xl border border-border/60 bg-gradient-to-br from-background to-muted/20 p-10 text-center text-muted-foreground shadow-sm">
                <div className="flex size-14 items-center justify-center rounded-2xl border border-border/60 bg-background text-primary shadow-sm">
                  <Shield className="size-6 opacity-70" />
                </div>
                <div className="max-w-md">
                  <p className="text-base font-semibold text-foreground">Warehouse configuration requires Master Data access.</p>
                  <p className="mt-2 text-sm">Contact your administrator to request the `MASTER_VIEW` permission.</p>
                </div>
              </div>
            ) : (
              <Section
                icon={Warehouse}
                title="Primary Warehouse"
                description="Configure your main warehouse location"
                open={openSections.warehousePrimary}
                onToggle={() => toggleSection('warehousePrimary')}
              >
              {whLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => <Skeleton key={i} className="h-9 w-full" />)}
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
                  <div className="flex flex-col gap-4 sm:gap-5">
                    <FieldRow label="Warehouse Name">
                      <Input
                        value={whName}
                        onChange={(e) => { setWhName(e.target.value); setWhEdited(true); }}
                        placeholder="e.g. Main Warehouse"
                        className="text-xs sm:text-sm"
                      />
                    </FieldRow>
                    <FieldRow label="Location / Address">
                      <Input
                        value={whLocation}
                        onChange={(e) => { setWhLocation(e.target.value); setWhEdited(true); }}
                        placeholder="e.g. Mumbai, Maharashtra"
                        className="text-xs sm:text-sm"
                      />
                    </FieldRow>
                    <div className="flex justify-end pt-2">
                      <Button
                        size="sm"
                        onClick={() => whMutation.mutate({ name: whName, location: whLocation })}
                        disabled={whMutation.isPending || !whName}
                        className="text-xs sm:text-sm"
                      >
                        {whMutation.isPending
                          ? <RefreshCw className="size-3.5 mr-1.5 animate-spin" />
                          : <Save className="size-3.5 mr-1.5" />}
                        Save Warehouse
                      </Button>
                    </div>
                  </div>

                  {warehouses?.length > 0 && (
                    <div className="rounded-3xl border border-border/60 bg-background/70 p-4 shadow-sm">
                      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Warehouse snapshot</p>
                      <div className="mt-3 space-y-2">
                        <DetailRow label="Primary" subtle>
                          <span className="font-mono text-xs">{primaryWarehouse?.name ?? 'Not set'}</span>
                        </DetailRow>
                        <DetailRow label="Location">
                          <span className="font-mono text-xs">{primaryWarehouse?.location ?? 'Not set'}</span>
                        </DetailRow>
                        <DetailRow label="Known warehouses" subtle>
                          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{warehouses.length}</span>
                        </DetailRow>
                        {warehouses?.length > 1 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {warehouses.map((w) => (
                              <Badge key={w.id} variant="outline" className="rounded-full text-xs sm:text-sm">{w.name}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Section>
            )}

            <Section
              icon={Database}
              title="Data & Storage"
              description="Database and migration information"
              open={openSections.warehouseData}
              onToggle={() => toggleSection('warehouseData')}
            >
              <div className="grid gap-2">
                <DetailRow label="Database" subtle>
                  <span className="font-mono text-xs">MySQL · wms_db</span>
                </DetailRow>
                <DetailRow label="Migrations">
                  <Badge variant="secondary" className="rounded-full font-mono text-xs">Flyway · V5</Badge>
                </DetailRow>
                <DetailRow label="Connection pool" subtle>
                  <span className="font-mono text-xs">HikariCP · max 20</span>
                </DetailRow>
              </div>
            </Section>
          </TabPanel>
        </TabsContent>

        {/* ── Preferences Tab ──────────────────────────────── */}
        <TabsContent value="preferences" className="mt-0">
          <TabPanel>
            <Section
              icon={Palette}
              title="Appearance"
              description="Customize the look and feel"
              open={openSections.preferencesAppearance}
              onToggle={() => toggleSection('preferencesAppearance')}
            >
              <div className="flex flex-col gap-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Theme</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    { value: 'light', label: 'Light', icon: Sun, desc: 'Bright interface' },
                    { value: 'dark', label: 'Dark', icon: Moon, desc: 'Low-light comfort' },
                    { value: 'system', label: 'System', icon: Monitor, desc: 'Match device' },
                  ].map(({ value: t, label, icon: Icon, desc }) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border px-4 py-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                        theme === t
                          ? 'border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10'
                          : 'border-border/60 bg-background/70 text-muted-foreground hover:border-primary/20 hover:text-foreground'
                      }`}
                    >
                      <div className={`flex size-10 items-center justify-center rounded-full ${theme === t ? 'bg-primary/10' : 'bg-muted'}`}>
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{label}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </Section>

            <Section
              icon={Info}
              title="Display"
              description="Table and pagination preferences"
              open={openSections.preferencesDisplay}
              onToggle={() => toggleSection('preferencesDisplay')}
            >
              <div className="grid gap-3">
                <ToggleRow
                  label="Compact tables"
                  hint="Reduce row height for denser data display"
                  checked={false}
                  onCheckedChange={() => toast.info('Coming soon')}
                />
                <ToggleRow
                  label="Auto-refresh queues"
                  hint="Picking, packing, shipping queues refresh every 15 seconds"
                  checked={true}
                  onCheckedChange={() => toast.info('Managed per page')}
                />
              </div>
            </Section>
          </TabPanel>
        </TabsContent>

        {/* ── Notifications Tab ────────────────────────────── */}
        <TabsContent value="notifications" className="mt-0">
          <TabPanel>
            <Section
              icon={Bell}
              title="Alerts"
              description="Choose which in-app notifications to show"
              fullWidth
              open={openSections.notificationsAlerts}
              onToggle={() => toggleSection('notificationsAlerts')}
            >
              <div className="grid gap-3">
                <ToggleRow
                  label="Pending pick tasks"
                  hint="Alert on dashboard when picks are waiting"
                  checked={notifPickAlert}
                  onCheckedChange={setNotifPickAlert}
                />
                <ToggleRow
                  label="Open orders"
                  hint="Alert on dashboard when orders need attention"
                  checked={notifOrderAlert}
                  onCheckedChange={setNotifOrderAlert}
                />
                <ToggleRow
                  label="Low stock warnings"
                  hint="Show alert when inventory quantity falls below threshold"
                  checked={notifLowStock}
                  onCheckedChange={setNotifLowStock}
                />
                <ToggleRow
                  label="Sound on scan"
                  hint="Play a beep when a barcode is successfully scanned"
                  checked={notifSoundEnabled}
                  onCheckedChange={setNotifSoundEnabled}
                />
              </div>
              <div className="flex justify-end pt-3 sm:pt-4 border-t border-border/50">
                <Button size="sm" onClick={saveNotifPrefs} className="text-xs sm:text-sm">
                  <Save className="size-3.5 mr-1.5" /> Save Preferences
                </Button>
              </div>
            </Section>
          </TabPanel>
        </TabsContent>

        {/* ── System Tab ───────────────────────────────────── */}
        <TabsContent value="system" className="mt-0">
          <TabPanel>
            <Section
              icon={Server}
              title="API & Backend"
              description="Connection and health status"
              open={openSections.systemApi}
              onToggle={() => toggleSection('systemApi')}
            >
              <div className="grid gap-2 text-xs sm:text-sm">
                <DetailRow label="API Base URL" subtle>
                  <span className="inline-flex max-w-full items-center rounded-full bg-muted px-3 py-1 font-mono text-xs whitespace-nowrap overflow-x-auto sm:max-w-[320px]">{resolvedApiBase}</span>
                </DetailRow>
                <DetailRow label="Health Status">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex size-2 rounded-full ${
                      apiStatus === 'UP' ? 'bg-emerald-500' :
                      apiStatus === 'DOWN' ? 'bg-red-500' :
                      'bg-amber-400 animate-pulse'
                    }`} />
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${apiStatusTone}`}>{apiStatus}</span>
                    <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => refetchHealth()}>
                      <RefreshCw className="size-3" />
                    </Button>
                  </div>
                </DetailRow>
                <DetailRow label="Authentication" subtle>
                  <span className="font-mono text-xs">JWT · Bearer</span>
                </DetailRow>
                <DetailRow label="API Docs">
                  <a
                    href={swaggerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-primary hover:underline"
                  >
                    Swagger UI →
                  </a>
                </DetailRow>
              </div>
            </Section>

            <Section
              icon={Shield}
              title="Security"
              description="Authentication and session settings"
              open={openSections.systemSecurity}
              onToggle={() => toggleSection('systemSecurity')}
            >
              <div className="grid gap-2 text-xs sm:text-sm">
                <DetailRow label="JWT Secret" subtle>
                  <Badge variant="outline" className="font-mono text-xs">Configured</Badge>
                </DetailRow>
                <DetailRow label="Session storage">
                  <span className="font-mono text-xs">localStorage · wms_token</span>
                </DetailRow>
                <DetailRow label="Session" subtle>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      localStorage.removeItem('wms_token');
                      window.location.href = '/login';
                    }}
                    className="text-xs sm:text-sm"
                  >
                    Sign Out
                  </Button>
                </DetailRow>
              </div>
            </Section>

            <Section
              icon={Scan}
              title="Hardware & Diagnostics"
              description="Zebra DataWedge scanner and offline buffer test tools"
              open={openSections.systemHardware}
              onToggle={() => toggleSection('systemHardware')}
            >
              <div className="grid gap-2 text-xs sm:text-sm">
                <DetailRow label="Scanner Sandbox">
                  <a
                    href="/settings/scanner-test"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
                  >
                    Open Verification Screen →
                  </a>
                </DetailRow>
              </div>
            </Section>

            <Section
              icon={Info}
              title="About"
              description="Application version and build info"
              open={openSections.systemAbout}
              onToggle={() => toggleSection('systemAbout')}
            >
              <div className="grid gap-2 text-xs sm:text-sm">
                <DetailRow label="Application" subtle>
                  <span className="font-medium">WMS Pro</span>
                </DetailRow>
                <DetailRow label="Frontend">
                  <span className="font-mono text-xs">Next.js 16.2.0 · React 19.2.4</span>
                </DetailRow>
                <DetailRow label="Backend" subtle>
                  <span className="font-mono text-xs">Spring Boot 3.3.0 · Java 17</span>
                </DetailRow>
                <DetailRow label="Build date">
                  <span className="font-mono text-xs">2026-05-29</span>
                </DetailRow>
              </div>
            </Section>
          </TabPanel>
        </TabsContent>
      </Tabs>
    </div>
  );
}
