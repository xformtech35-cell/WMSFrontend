'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import Image from 'next/image';
import {
  User,
  Lock,
  Mail,
  Phone,
  Briefcase,
  Building2,
  MapPin,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  UserCheck,
  Camera,
  Upload,
  Trash2,
} from 'lucide-react';

const AuthImage = React.memo(function AuthImage({
  userId,
  alt,
  className,
  onClick,
  width,
  height,
}) {
  const [imgSrc, setImgSrc] = useState(null);
  const [error, setError] = useState(false);

  React.useEffect(() => {
    let objectUrl = null;
    let cancelled = false;

    setImgSrc(null);
    setError(false);

    const fetchImage = async () => {
      if (!userId) return;

      try {
        const response = await api.get(
          `/users/${userId}/profile-photo`,
          {
            responseType: 'blob',
            skipToast: true,
          }
        );

        if (cancelled) return;

        objectUrl = URL.createObjectURL(response.data);
        setImgSrc(objectUrl);
      } catch (err) {
        if (!cancelled) {
          setError(true);
        }
      }
    };

    fetchImage();

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [userId]);

  if (error || !imgSrc) {
    const isLarge = (width || 32) > 40;
    return (
      <div
        className={
          className ||
          'w-8 h-8 rounded-full bg-muted flex flex-col items-center justify-center cursor-pointer select-none text-muted-foreground'
        }
        onClick={onClick}
        style={{ width, height }}
      >
        <span className={isLarge ? "text-3xl font-semibold" : "text-xs font-medium"}>
          {alt?.charAt(0)?.toUpperCase() || '?'}
        </span>
      </div>
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt || ''}
      width={width || 32}
      height={height || 32}
      className={
        className ||
        'rounded-full object-cover cursor-pointer'
      }
      onClick={onClick}
    />
  );
});

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState(null);
  const fileInputRef = useRef(null);

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  // Edit form state
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    mobileNumber: '',
    designation: '',
    email: '',
    department: '',
    location: '',
    bio: '',
    isActive: true,
  });

  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    const id = localStorage.getItem('userid');
    if (id) {
      setUserId(id);
    }
  }, []);

  // Fetch logged-in user profile
  const { data: userProfile, isLoading, refetch } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      if (userId) {
        try {
          const res = await api.get(`/users/${userId}`);
          return res.data;
        } catch (e) {
          console.warn('Failed to fetch user by id, trying /auth/me fallback');
        }
      }
      const meRes = await api.get('/auth/me');
      const meData = meRes.data;
      if (meData.id) {
        setUserId(meData.id);
        localStorage.setItem('userid', meData.id);
        const detailRes = await api.get(`/users/${meData.id}`);
        return detailRes.data;
      }
      return meData;
    },
    enabled: true,
    staleTime: 30000,
  });

  // Populate edit form when user profile data loads
  useEffect(() => {
    if (userProfile) {
      setFormData({
        username: userProfile.username || '',
        fullName: userProfile.fullName || '',
        mobileNumber: userProfile.mobileNumber || '',
        designation: userProfile.designation || '',
        email: userProfile.email || '',
        department: userProfile.department || '',
        location: userProfile.location || '',
        bio: userProfile.bio || '',
        isActive: userProfile.isActive ?? true,
      });
    }
  }, [userProfile]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (payload) => {
      const activeId = userId || userProfile?.id;
      if (!activeId) throw new Error('User ID not found');
      return api.put(`/users/${activeId}`, payload);
    },
    onSuccess: () => {
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      refetch();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.response?.data?.detail || 'Failed to update profile');
    },
  });

  // Upload photo mutation
  const uploadProfilePhotoMutation = useMutation({
    mutationFn: ({ activeUserId, file }) => {
      const fd = new FormData();
      fd.append('file', file);
      return api.post(`/users/${activeUserId}/profile-photo`, fd, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: () => {
      toast.success('Profile photo uploaded successfully');
      setSelectedPhotoFile(null);
      setPhotoPreview(null);
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      refetch();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? 'Failed to upload profile photo');
    },
  });

  // Delete photo mutation
  const deleteProfilePhotoMutation = useMutation({
    mutationFn: (activeUserId) => api.delete(`/users/${activeUserId}/profile-photo`),
    onSuccess: () => {
      toast.success('Profile photo deleted successfully');
      setSelectedPhotoFile(null);
      setPhotoPreview(null);
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      refetch();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? 'Failed to delete profile photo');
    },
  });

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      const activeId = userId || userProfile?.id;
      if (activeId) {
        uploadProfilePhotoMutation.mutate({ activeUserId: activeId, file });
      }
    }
  };

  const handleDeletePhoto = () => {
    const activeId = userId || userProfile?.id;
    if (activeId && window.confirm('Are you sure you want to delete your profile photo?')) {
      deleteProfilePhotoMutation.mutate(activeId);
    }
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!oldPassword) {
      toast.error('Current password is required');
      return;
    }
    if (!newPassword) {
      toast.error('New password is required');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    const activeId = userId || userProfile?.id;
    setPwSaving(true);
    try {
      await api.post('/auth/password/change', {
        id: activeId ? Number(activeId) : undefined,
        oldPassword,
        newPassword,
        confirmPassword,
      });
      toast.success('Password changed successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          'Failed to change password'
      );
    } finally {
      setPwSaving(false);
    }
  };

  const activeId = userId || userProfile?.id;

  return (
    <div className="flex flex-col gap-6 sm:gap-8 max-w-7xl mx-auto pb-8">
      <PageHeader
        title="My Profile"
        description="View and manage your user details, profile photo, and security settings."
      />

      {/* Top Banner Card */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-background p-6 shadow-sm">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-80 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_65%)]" />
        
        {isLoading ? (
          <div className="flex items-center gap-5">
            <Skeleton className="size-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Profile Photo Container */}
              <div className="relative group">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />

                {activeId ? (
                  <AuthImage
                    userId={activeId}
                    alt={userProfile?.fullName || userProfile?.username}
                    className="rounded-2xl object-cover w-20 h-20 border-2 border-primary/20 shadow-md shadow-indigo-500/10 cursor-pointer"
                    width={80}
                    height={80}
                    onClick={() => fileInputRef.current?.click()}
                  />
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-2xl font-bold text-white shadow-lg shadow-indigo-500/25 cursor-pointer ring-4 ring-background"
                  >
                    {(userProfile?.fullName || userProfile?.username || 'U').slice(0, 2).toUpperCase()}
                  </div>
                )}

                {/* Camera Overlay Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadProfilePhotoMutation.isPending}
                  className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-transform active:scale-95 cursor-pointer"
                  title="Upload / Change profile photo"
                >
                  {uploadProfilePhotoMutation.isPending ? (
                    <RefreshCw className="size-3.5 animate-spin" />
                  ) : (
                    <Camera className="size-3.5" />
                  )}
                </button>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {userProfile?.fullName || userProfile?.username || 'User Profile'}
                  </h1>
                  <Badge variant="secondary" className="rounded-full px-3 py-0.5 text-xs font-semibold bg-primary/10 text-primary border-primary/20">
                    {userProfile?.role || 'USER'}
                  </Badge>
                  {userProfile?.isActive !== false ? (
                    <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs font-medium text-emerald-600 border-emerald-500/30 bg-emerald-500/10 gap-1">
                      <UserCheck className="size-3" /> Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs font-medium text-rose-600 border-rose-500/30 bg-rose-500/10">
                      Inactive
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                  <span>@{userProfile?.username}</span>
                  {userProfile?.email && (
                    <>
                      <span>•</span>
                      <span>{userProfile?.email}</span>
                    </>
                  )}
                  {userProfile?.designation && (
                    <>
                      <span>•</span>
                      <span className="font-medium text-foreground">{userProfile?.designation}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadProfilePhotoMutation.isPending}
                className="gap-1.5 rounded-xl border-border/80 text-xs cursor-pointer"
              >
                <Upload className="size-3.5" /> Photo
              </Button>

              {userProfile?.profilePhotoUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeletePhoto}
                  disabled={deleteProfilePhotoMutation.isPending}
                  className="gap-1.5 rounded-xl text-xs text-rose-600 border-rose-500/30 hover:bg-rose-500/10 cursor-pointer"
                >
                  <Trash2 className="size-3.5" /> Remove
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="gap-1.5 rounded-xl border-border/80 text-xs cursor-pointer"
              >
                <RefreshCw className="size-3.5" /> Refresh
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Main Tabs Component */}
      <Tabs defaultValue="view" className="w-full">
        <div className="rounded-2xl border border-border/60 bg-card/80 p-2 shadow-sm backdrop-blur-sm">
          <TabsList className="grid h-12 w-full grid-cols-3 gap-2 rounded-xl bg-muted/50 p-1">
            <TabsTrigger
              value="view"
              className="h-full justify-center gap-2 rounded-lg text-xs sm:text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground cursor-pointer"
            >
              <User className="size-4" /> View Profile
            </TabsTrigger>
            <TabsTrigger
              value="edit"
              className="h-full justify-center gap-2 rounded-lg text-xs sm:text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground cursor-pointer"
            >
              <Briefcase className="size-4" /> Edit Profile
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="h-full justify-center gap-2 rounded-lg text-xs sm:text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground cursor-pointer"
            >
              <Lock className="size-4" /> Change Password
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── View Profile Tab ── */}
        <TabsContent value="view" className="mt-6 space-y-6">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2">
              <Skeleton className="h-64 rounded-3xl" />
              <Skeleton className="h-64 rounded-3xl" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Personal & Work Info */}
              <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3 border-b border-border/50 pb-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <User className="size-4.5" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground">Personal & Work Info</h3>
                </div>

                <div className="grid gap-4 text-sm">
                  <div className="flex justify-between items-center py-1.5 border-b border-border/30">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <User className="size-4 text-primary/70" /> Full Name
                    </span>
                    <span className="font-medium text-foreground">{userProfile?.fullName || '—'}</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-border/30">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <KeyRound className="size-4 text-primary/70" /> Username
                    </span>
                    <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{userProfile?.username || '—'}</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-border/30">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Mail className="size-4 text-primary/70" /> Email
                    </span>
                    <span className="font-medium text-foreground">{userProfile?.email || '—'}</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-border/30">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Phone className="size-4 text-primary/70" /> Mobile Number
                    </span>
                    <span className="font-medium text-foreground">{userProfile?.mobileNumber || '—'}</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-border/30">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Briefcase className="size-4 text-primary/70" /> Designation
                    </span>
                    <span className="font-medium text-foreground">{userProfile?.designation || '—'}</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-border/30">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Building2 className="size-4 text-primary/70" /> Department
                    </span>
                    <span className="font-medium text-foreground">{userProfile?.department || '—'}</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-border/30">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <MapPin className="size-4 text-primary/70" /> Location
                    </span>
                    <span className="font-medium text-foreground">{userProfile?.location || '—'}</span>
                  </div>

                  {userProfile?.bio && (
                    <div className="pt-2">
                      <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-1">Bio</span>
                      <p className="text-sm text-foreground/90 bg-muted/40 p-3 rounded-2xl border border-border/40">
                        {userProfile.bio}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Roles & System Permissions */}
              <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3 border-b border-border/50 pb-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Shield className="size-4.5" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground">Role & Access Permissions</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-2xl bg-muted/40 border border-border/50">
                    <span className="text-sm text-muted-foreground font-medium">Assigned Role</span>
                    <Badge variant="secondary" className="px-3 py-1 font-semibold text-xs bg-primary/10 text-primary border-primary/20">
                      {userProfile?.role || 'USER'}
                    </Badge>
                  </div>

                  <div>
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block mb-2">
                      Granted Permissions ({userProfile?.permissions?.length || 0})
                    </span>
                    <div className="max-h-72 overflow-y-auto flex flex-wrap gap-1.5 p-3 rounded-2xl border border-border/50 bg-background/50">
                      {userProfile?.permissions && userProfile.permissions.length > 0 ? (
                        userProfile.permissions.map((perm, idx) => (
                          <Badge key={idx} variant="outline" className="text-[11px] font-mono py-1 px-2.5 rounded-lg border-border/70 bg-card hover:bg-muted transition-colors">
                            {perm}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No specific permissions assigned.</p>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </TabsContent>

        {/* ── Edit Profile Tab ── */}
        <TabsContent value="edit" className="mt-6">
          <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-border/50 pb-4 mb-6">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Briefcase className="size-4.5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground">Edit Account Details</h3>
                <p className="text-xs text-muted-foreground">Update your personal, contact, and work information.</p>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="grid gap-5 sm:grid-cols-2">
                {/* Profile Photo Uploader Field */}
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-xs font-semibold">Profile Photo</Label>
                  <div className="flex items-center gap-4 p-4 rounded-2xl border border-border/60 bg-muted/30">
                    {activeId ? (
                      <AuthImage
                        userId={activeId}
                        alt={userProfile?.fullName || userProfile?.username}
                        className="rounded-full object-cover w-16 h-16 border-2 border-muted"
                        width={64}
                        height={64}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 border-muted">
                        <Camera className="size-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadProfilePhotoMutation.isPending}
                        className="rounded-xl text-xs cursor-pointer"
                      >
                        <Upload className="size-3.5 mr-1.5" />
                        {uploadProfilePhotoMutation.isPending ? 'Uploading...' : 'Upload Photo'}
                      </Button>
                      {userProfile?.profilePhotoUrl && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={handleDeletePhoto}
                          disabled={deleteProfilePhotoMutation.isPending}
                          className="rounded-xl text-xs cursor-pointer"
                        >
                          <Trash2 className="size-3.5 mr-1.5" /> Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-xs font-semibold">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                    placeholder="Username"
                    className="rounded-xl text-sm"
                  />
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-xs font-semibold">Full Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Enter full name"
                    className="rounded-xl text-sm"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-semibold">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="email@domain.com"
                    className="rounded-xl text-sm"
                  />
                </div>

                {/* Mobile Number */}
                <div className="space-y-2">
                  <Label htmlFor="mobileNumber" className="text-xs font-semibold">Mobile Number</Label>
                  <Input
                    id="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, mobileNumber: e.target.value }))}
                    placeholder="e.g. 9876543210"
                    className="rounded-xl text-sm"
                  />
                </div>

                {/* Designation */}
                <div className="space-y-2">
                  <Label htmlFor="designation" className="text-xs font-semibold">Designation</Label>
                  <Input
                    id="designation"
                    value={formData.designation}
                    onChange={(e) => setFormData((prev) => ({ ...prev, designation: e.target.value }))}
                    placeholder="e.g. Warehouse Manager"
                    className="rounded-xl text-sm"
                  />
                </div>

                {/* Department */}
                <div className="space-y-2">
                  <Label htmlFor="department" className="text-xs font-semibold">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
                    placeholder="e.g. Operations"
                    className="rounded-xl text-sm"
                  />
                </div>

                {/* Location */}
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="location" className="text-xs font-semibold">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g. Pune / Warehouse Main Floor"
                    className="rounded-xl text-sm"
                  />
                </div>

                {/* Bio */}
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="bio" className="text-xs font-semibold">Bio / Notes</Label>
                  <Textarea
                    id="bio"
                    rows={3}
                    value={formData.bio}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                    placeholder="Short bio or description..."
                    className="rounded-xl text-sm resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end border-t border-border/50 pt-4">
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="rounded-xl px-6 gap-2 cursor-pointer"
                >
                  {updateProfileMutation.isPending ? (
                    <RefreshCw className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            </form>
          </section>
        </TabsContent>

        {/* ── Change Password Tab ── */}
        <TabsContent value="security" className="mt-6">
          <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm max-w-2xl">
            <div className="flex items-center gap-3 border-b border-border/50 pb-4 mb-6">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Lock className="size-4.5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground">Change Password</h3>
                <p className="text-xs text-muted-foreground">Ensure your account is using a strong, secret password.</p>
              </div>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-5">
              {/* Old Password */}
              <div className="space-y-2">
                <Label htmlFor="oldPassword" className="text-xs font-semibold">Current Password</Label>
                <div className="relative">
                  <Input
                    id="oldPassword"
                    type={showOldPw ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="rounded-xl pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showOldPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-xs font-semibold">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                    className="rounded-xl pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showNewPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPw ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="rounded-xl pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showConfirmPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end border-t border-border/50 pt-4">
                <Button
                  type="submit"
                  disabled={pwSaving}
                  className="rounded-xl px-6 gap-2 cursor-pointer"
                >
                  {pwSaving ? (
                    <RefreshCw className="size-4 animate-spin" />
                  ) : (
                    <Lock className="size-4" />
                  )}
                  Update Password
                </Button>
              </div>
            </form>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
