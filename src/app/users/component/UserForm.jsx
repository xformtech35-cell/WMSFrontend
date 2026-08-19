'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { SheetFooter } from '@/components/ui/sheet';
import SlideOverForm from '@/components/ui/SlideOverForm';
import DynamicFormFields from '@/components/ui/DynamicFormFields';
import { Button } from '@/components/ui/button';
import { Plus, Upload, X, Camera } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

const UserForm = ({
  open,
  onOpenChange,
  title = "Create User",
  description = "Add a new user and assign a role.",
  onSubmit,
  isPending = false,
  initialData = null,
  roles = [],
  mode = 'create', // 'create' or 'edit'
}) => {
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [designation, setDesignation] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Sort roles only when roles change
  const sortedRoles = useMemo(() => {
    return roles.map((r) => r.name).sort();
  }, [roles]);

  // Initialize form with initial data when in edit mode
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setUsername(initialData.username || '');
      setPassword(''); // Don't populate password for security
      setRole(initialData.role || '');
      setFullName(initialData.fullName || '');
      setMobileNumber(initialData.mobileNumber || '');
      setDesignation(initialData.designation || '');
      setEmployeeId(initialData.employeeId || '');
      setEmail(initialData.email || '');
      setDepartment(initialData.department || '');
      setLocation(initialData.location || '');
      setBio(initialData.bio || '');
    }
  }, [initialData, mode]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setRole('');
    setFullName('');
    setMobileNumber('');
    setDesignation('');
    setEmployeeId('');
    setEmail('');
    setDepartment('');
    setLocation('');
    setBio('');
    setProfilePhoto(null);
    setProfilePhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e) => {
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
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfilePhoto = () => {
    setProfilePhoto(null);
    setProfilePhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'create' && (!username || !password || !role)) {
      toast.error('Username, password and role are required');
      return;
    }
    if (mode === 'edit' && !role) {
      toast.error('Role is required');
      return;
    }

    const payload = {
      username,
      role,
      fullName,
      mobileNumber,
      designation,
      employeeId,
      email,
      department,
      location,
      bio
    };

    // Only include password for create mode
    if (mode === 'create') {
      payload.password = password;
    }

    onSubmit(payload, profilePhoto);
  };

  // Memoize form fields to prevent unnecessary re-renders
  const formFields = useMemo(() => {
    const fields = [
      {
        name: 'username',
        label: 'Username',
        value: username,
        onChange: setUsername,
        required: mode === 'create',
        disabled: mode === 'edit',
      },
      ...(mode === 'create' ? [{
        name: 'password',
        label: 'Password',
        type: 'password',
        value: password,
        onChange: setPassword,
        required: true,
      }] : []),
      {
        name: 'role',
        label: 'Role',
        type: 'select',
        value: role,
        onChange: setRole,
        required: true,
        options: [
          { value: '', label: 'Select role' },
          ...sortedRoles.map((name) => ({ value: name, label: name })),
        ],
      },
      {
        name: 'fullName',
        label: 'Full Name',
        value: fullName,
        onChange: setFullName,
      },
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        value: email,
        onChange: setEmail,
      },
      {
        name: 'mobileNumber',
        label: 'Mobile Number',
        value: mobileNumber,
        onChange: setMobileNumber,
      },
      {
        name: 'employeeId',
        label: 'Employee ID',
        value: employeeId,
        onChange: setEmployeeId,
      },
      {
        name: 'designation',
        label: 'Designation',
        value: designation,
        onChange: setDesignation,
      },
      {
        name: 'department',
        label: 'Department',
        value: department,
        onChange: setDepartment,
      },
      {
        name: 'location',
        label: 'Location',
        value: location,
        onChange: setLocation,
      },
      {
        name: 'bio',
        label: 'Bio',
        type: 'textarea',
        value: bio,
        onChange: setBio,
        rows: 3,
      },
    ];
    return fields;
  }, [
    username, password, role, fullName, email, mobileNumber,
    employeeId, designation, department, location, bio,
    sortedRoles, mode
  ]);

  return (
    <SlideOverForm
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <DynamicFormFields fields={formFields} />
        
        {/* Profile Photo Upload Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Profile Photo</label>
          <div className="flex items-center gap-4">
            {profilePhotoPreview ? (
              <div className="relative">
                <Image
                  src={profilePhotoPreview}
                  alt="Profile preview"
                  width={80}
                  height={80}
                  className="rounded-full object-cover w-20 h-20 border-2 border-muted"
                />
                <button
                  type="button"
                  onClick={removeProfilePhoto}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-muted">
                <Camera className="size-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="profile-photo-upload"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="size-3.5 mr-1.5" />
                Choose Photo
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Max size: 5MB. Supported: JPG, PNG, GIF
              </p>
            </div>
          </div>
        </div>

        <SheetFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            <Plus className="size-3.5 mr-1.5" />
            {isPending ? (mode === 'create' ? 'Creating...' : 'Updating...') : (mode === 'create' ? 'Create User' : 'Update User')}
          </Button>
        </SheetFooter>
      </form>
    </SlideOverForm>
  );
};

export default UserForm;