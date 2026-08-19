'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/PageHeader';
import PermissionGate from '@/components/PermissionGate';
import api from '@/lib/api';
import { P } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Upload, Trash2, Camera, Info } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import UserForm from './component/UserForm';
import UserDetailsModal from './component/UserDetailsModal';

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

    const fetchImage = async () => {
      if (!userId) return;

      try {
        const response = await api.get(
          `/users/${userId}/profile-photo`,
          {
            responseType: 'blob',
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
    return (
      <div
        className={
          className ||
          'w-8 h-8 rounded-full bg-muted flex items-center justify-center cursor-pointer'
        }
        onClick={onClick}
        style={{ width, height }}
      >
        <span className="text-xs font-medium">
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
export default function UsersPage() {
  const queryClient = useQueryClient();
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingRole, setEditingRole] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewPhotoOpen, setViewPhotoOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [detailsUser, setDetailsUser] = useState(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get('/roles').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const createUser = useMutation({
    mutationFn: (payload) => api.post('/users', payload),
    onSuccess: (response) => {
      toast.success('User created');
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? 'Failed to create user');
    },
  });

  const uploadProfilePhoto = useMutation({
    mutationFn: ({ userId, file }) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post(`/users/${userId}/profile-photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: () => {
      toast.success('Profile photo uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? 'Failed to upload profile photo');
    },
  });

  const deleteProfilePhoto = useMutation({
    mutationFn: (userId) => api.delete(`/users/${userId}/profile-photo`),
    onSuccess: () => {
      toast.success('Profile photo deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setViewPhotoOpen(false);
      setViewingUser(null);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? 'Failed to delete profile photo');
    },
  });

  const updateUser = useMutation({
    mutationFn: ({ id, payload }) => api.put(`/users/${id}`, payload),
    onSuccess: () => {
      toast.success('User updated');
      setEditingUserId(null);
      setEditingRole('');
      setEditOpen(false);
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? 'Failed to update user');
    },
  });

  const deleteUser = useMutation({
    mutationFn: (id) => api.delete(`/users/${id}`),
    onSuccess: () => {
      toast.success('User deleted');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? 'Failed to delete user');
    },
  });

  const handleCreateUser = (payload, profilePhoto) => {
    createUser.mutate(payload, {
      onSuccess: (response) => {
        if (profilePhoto && response.data?.id) {
          uploadProfilePhoto.mutate({ userId: response.data.id, file: profilePhoto });
        }
      }
    });
  };

  const handleUpdateUser = (payload, profilePhoto) => {
    updateUser.mutate({ 
      id: selectedUser?.id, 
      payload 
    }, {
      onSuccess: () => {
        if (profilePhoto && selectedUser?.id) {
          uploadProfilePhoto.mutate({ userId: selectedUser.id, file: profilePhoto });
        }
      }
    });
  };

  const handleDeletePhoto = (userId) => {
    if (window.confirm('Are you sure you want to delete this profile photo?')) {
      deleteProfilePhoto.mutate(userId);
    }
  };

  const handleViewUserPhoto = useCallback((user) => {
    setViewingUser(user);
    setViewPhotoOpen(true);
  }, []);

  const handleViewDetails = useCallback((user) => {
    setDetailsUser(user);
    setViewDetailsOpen(true);
  }, []);

  const handleUploadPhoto = useCallback((userId, file) => {
    uploadProfilePhoto.mutate({ userId, file });
    setViewDetailsOpen(false);
  }, [uploadProfilePhoto]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Custom Image component with authentication
  

  return (
    <PermissionGate permission={P.USERS_VIEW} fallback={<p className="text-sm text-muted-foreground">Access denied.</p>}>
      <div className="space-y-6">
        <PageHeader
          title="Users"
          description="Create, update and manage users with dynamic role assignments."
          actions={(
            <PermissionGate permission={P.USERS_MANAGE}>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="size-3.5 mr-1.5" /> Create User
              </Button>
            </PermissionGate>
          )}
        />

        <PermissionGate permission={P.USERS_MANAGE}>
          {/* Create User Form */}
          <UserForm
            open={createOpen}
            onOpenChange={setCreateOpen}
            title="Create User"
            description="Add a new user and assign a role."
            onSubmit={handleCreateUser}
            isPending={createUser.isPending || uploadProfilePhoto.isPending}
            roles={roles}
            mode="create"
          />

          {/* Edit User Form */}
          {selectedUser && (
            <UserForm
              open={editOpen}
              onOpenChange={setEditOpen}
              title="Edit User"
              description="Update user details and role."
              onSubmit={handleUpdateUser}
              isPending={updateUser.isPending || uploadProfilePhoto.isPending}
              initialData={selectedUser}
              roles={roles}
              mode="edit"
            />
          )}
        </PermissionGate>

        {/* Profile Photo View Dialog */}
        <Dialog open={viewPhotoOpen} onOpenChange={setViewPhotoOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{viewingUser?.fullName || viewingUser?.username}'s Profile Photo</DialogTitle>
              <DialogDescription>
                View and manage profile photo
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center space-y-4 py-4">
              {viewingUser?.id ? (
                <AuthImage
                  userId={viewingUser.id}
                  alt={viewingUser?.fullName || viewingUser?.username}
                  className="rounded-full object-cover w-48 h-48 border-4 border-muted"
                  width={200}
                  height={200}
                />
              ) : (
                <div className="w-48 h-48 rounded-full bg-muted flex items-center justify-center border-4 border-muted">
                  <span className="text-6xl font-medium text-muted-foreground">
                    {viewingUser?.fullName?.charAt(0)?.toUpperCase() || viewingUser?.username?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-2 w-full">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Username:</span> {viewingUser?.username}
                  </p>
                  {viewingUser?.fullName && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Full Name:</span> {viewingUser?.fullName}
                    </p>
                  )}
                  {viewingUser?.email && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Email:</span> {viewingUser?.email}
                    </p>
                  )}
                </div>
              </div>

              <PermissionGate permission={P.USERS_MANAGE}>
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
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
                          uploadProfilePhoto.mutate({ 
                            userId: viewingUser?.id, 
                            file 
                          });
                          setViewPhotoOpen(false);
                          setViewingUser(null);
                        }
                      };
                      input.click();
                    }}
                    className="flex-1"
                  >
                    <Upload className="size-3.5 mr-1.5" />
                    Upload New
                  </Button>
                  {viewingUser?.profilePhotoUrl && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeletePhoto(viewingUser?.id)}
                      className="flex-1"
                    >
                      <Trash2 className="size-3.5 mr-1.5" />
                      Delete
                    </Button>
                  )}
                </div>
              </PermissionGate>
            </div>
          </DialogContent>
        </Dialog>

        {/* User Details Modal - Separate Component */}
        <UserDetailsModal
          open={viewDetailsOpen}
          onOpenChange={setViewDetailsOpen}
          user={detailsUser}
          onViewPhoto={handleViewUserPhoto}
          onUploadPhoto={handleUploadPhoto}
          onDeletePhoto={handleDeletePhoto}
          formatDate={formatDate}
          AuthImage={AuthImage}
          uploadProfilePhoto={uploadProfilePhoto}
          setViewPhotoOpen={setViewPhotoOpen}
          setViewingUser={setViewingUser}
        />

        <div className="rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left w-8"></th>
                <th className="px-3 py-2 text-left">User</th>
                <th className="px-3 py-2 text-left">Role</th>
                <th className="px-3 py-2 text-left">Contact</th>
                <th className="px-3 py-2 text-left">Department</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="px-3 py-3" colSpan={7}>Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td className="px-3 py-3" colSpan={7}>No users found.</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className="border-t hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <button
                      onClick={() => handleViewDetails(u)}
                      className="p-1 cursor-pointer hover:bg-muted rounded"
                      title="View Details"
                    >
                      <Info className="size-4" />
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <div className="relative group">
                        <AuthImage
                          userId={u.id}
                          alt={u.fullName || u.username}
                          className="rounded-full cursor-pointer object-cover w-8 h-8"
                          width={32}
                          height={32}
                          onClick={() => handleViewUserPhoto(u)}
                        />
                        <PermissionGate permission={P.USERS_MANAGE}>
                          <div className="absolute -bottom-1 -right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewUserPhoto(u);
                              }}
                              className="bg-primary cursor-pointer text-white rounded-full p-0.5 hover:bg-primary/80 transition-colors"
                              title="View photo"
                            >
                              <Eye className="size-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.onchange = (e) => {
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
                                    uploadProfilePhoto.mutate({ userId: u.id, file });
                                  }
                                };
                                input.click();
                              }}
                              className="bg-green-500 cursor-pointer text-white rounded-full p-0.5 hover:bg-green-600 transition-colors"
                              title="Upload photo"
                            >
                              <Camera className="size-3" />
                            </button>
                            {u.profilePhotoUrl && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePhoto(u.id);
                                }}
                                className="bg-red-500 cursor-pointer text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                                title="Delete photo"
                              >
                                <Trash2 className="size-3" />
                              </button>
                            )}
                          </div>
                        </PermissionGate>
                      </div>
                      <div>
                        <div className="font-medium">{u.fullName || u.username}</div>
                        <div className="text-xs text-muted-foreground">@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {editingUserId === u.id ? (
                      <select
                        className="h-8 rounded-md border border-input bg-background px-2"
                        value={editingRole}
                        onChange={(e) => setEditingRole(e.target.value)}
                      >
                        {roles.map((r) => (
                          <option key={r.name} value={r.name}>{r.name}</option>
                        ))}
                      </select>
                    ) : (
                      <Badge variant="secondary">{u.role}</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-xs">
                      {u.email && <div className="text-muted-foreground">{u.email}</div>}
                      {u.mobileNumber && <div>{u.mobileNumber}</div>}
                      {u.employeeId && <div className="text-muted-foreground">ID: {u.employeeId}</div>}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-xs">
                      {u.designation && <div>{u.designation}</div>}
                      {u.department && <div className="text-muted-foreground">{u.department}</div>}
                      {u.location && <div className="text-muted-foreground">{u.location}</div>}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={u.isActive ? "default" : "secondary"}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <PermissionGate permission={P.USERS_MANAGE}>
                      <div className="inline-flex gap-2">
                        {editingUserId === u.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => updateUser.mutate({ id: u.id, payload: { role: editingRole } })}
                              disabled={updateUser.isPending}
                            >
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => { setEditingUserId(null); setEditingRole(''); }}>
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => {
                                setSelectedUser(u);
                                setEditOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteUser.mutate(u.id)} disabled={deleteUser.isPending}>
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </PermissionGate>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PermissionGate>
  );
}