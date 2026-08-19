'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import api from '@/lib/api';
import PermissionGate from '@/components/PermissionGate';
import { P } from '@/lib/permissions';

const UserDetailsModal = ({
  open,
  onOpenChange,
  user,
  onViewPhoto,
  onUploadPhoto,
  onDeletePhoto,
  formatDate,
  AuthImage,
  uploadProfilePhoto,
  setViewPhotoOpen,
  setViewingUser,
}) => {
  if (!user) return null;

  const handleUploadClick = () => {
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
        if (onUploadPhoto) {
          onUploadPhoto(user.id, file);
        }
      }
    };
    input.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            Complete information about the user
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Profile Photo Section */}
          <div className="flex items-center gap-4">
            <AuthImage
              userId={user.id}
              alt={user.fullName || user.username}
              className="rounded-full object-cover w-20 h-20 border-2 border-muted cursor-pointer"
              width={80}
              height={80}
              onClick={() => {
                if (onViewPhoto) {
                  onViewPhoto(user);
                }
              }}
            />
            <div>
              <h3 className="text-lg font-semibold">{user.fullName || user.username}</h3>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
              <Badge variant={user.isActive ? "default" : "secondary"} className="mt-1">
                {user.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>

          {/* User Information Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Username</p>
              <p className="font-medium">{user.username}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Role</p>
              <Badge variant="secondary">{user.role}</Badge>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Full Name</p>
              <p>{user.fullName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Email</p>
              <p>{user.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Mobile Number</p>
              <p>{user.mobileNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Employee ID</p>
              <p>{user.employeeId || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Designation</p>
              <p>{user.designation || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Department</p>
              <p>{user.department || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Location</p>
              <p>{user.location || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Joining Date</p>
              <p>{formatDate(user.joiningDate)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Last Login</p>
              <p>{formatDate(user.lastLoginAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Created At</p>
              <p>{formatDate(user.createdAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Updated At</p>
              <p>{formatDate(user.updatedAt)}</p>
            </div>
          </div>

          {/* Bio Section */}
          {user.bio && (
            <div>
              <p className="text-muted-foreground text-xs">Bio</p>
              <p className="text-sm mt-1">{user.bio}</p>
            </div>
          )}

          {/* Permissions Section */}
          <div>
            <p className="text-muted-foreground text-xs">Permissions</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {(user.permissions || []).map((p) => (
                <Badge key={p} variant="outline" className="text-xs">
                  {p}
                </Badge>
              ))}
              {(user.permissions || []).length === 0 && (
                <span className="text-muted-foreground text-sm">No permissions</span>
              )}
            </div>
          </div>

          {/* Photo Management Actions */}
          <PermissionGate permission={P.USERS_MANAGE}>
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleUploadClick}
                className="flex-1"
              >
                <Upload className="size-3.5 mr-1.5" />
                Upload Photo
              </Button>
              {user.profilePhotoUrl && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (onDeletePhoto) {
                      onDeletePhoto(user.id);
                    }
                  }}
                  className="flex-1"
                >
                  <Trash2 className="size-3.5 mr-1.5" />
                  Delete Photo
                </Button>
              )}
            </div>
          </PermissionGate>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsModal;