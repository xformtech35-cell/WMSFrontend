'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/PageHeader';
import PermissionGate from '@/components/PermissionGate';
import api from '@/lib/api';
import { P } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function RoleAccessPage() {
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [draftPermissions, setDraftPermissions] = useState([]);

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get('/roles').then((r) => r.data),
  });

  const { data: permissionItems = [] } = useQuery({
    queryKey: ['rolePermissionsCatalog'],
    queryFn: () =>
      api
        .get('/roles/permissions')
        .then((r) =>
          // Map to names + sort alphabetically (case-insensitive)
          [...r.data.map((x) => x.name)].sort((a, b) =>
            a.localeCompare(b, undefined, { sensitivity: 'base' })
          )
        ),
  });

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) || null,
    [roles, selectedRoleId]
  );

  const saveAccess = useMutation({
    mutationFn: (payload) => api.put(`/roles/${payload.id}`, payload.body),
    onSuccess: () => {
      toast.success('Role access updated');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message ?? 'Failed to update role access'
      );
    },
  });

  const selectRole = (role) => {
    setSelectedRoleId(role.id);
    setDraftPermissions([...(role.permissions || [])]);
  };

  const togglePermission = (permission) => {
    setDraftPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const onSave = () => {
    if (!selectedRole) return;
    if (selectedRole.name === 'SUPER_ADMIN') {
      toast.error('SUPER_ADMIN access should remain unrestricted');
      return;
    }
    saveAccess.mutate({
      id: selectedRole.id,
      body: {
        name: selectedRole.name,
        permissions: draftPermissions,
      },
    });
  };

  // Sort roles alphabetically by name too
  const sortedRoles = useMemo(
    () =>
      [...roles].sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', undefined, {
          sensitivity: 'base',
        })
      ),
    [roles]
  );

  return (
    <PermissionGate
      permission={P.USERS_MANAGE}
      fallback={
        <p className="text-sm text-muted-foreground">
          Super admin access required.
        </p>
      }
    >
      <div className="space-y-6">
        <PageHeader
          title="Role Access"
          description="Separate page to assign module access with checkbox permissions."
        />

        <div className="grid gap-4 md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr]">
          {/* ===== Roles list ===== */}
          <div className="rounded-xl border p-3">
            <h3 className="mb-3 text-sm font-semibold">Roles</h3>

            {rolesLoading ? (
              <p className="text-sm text-muted-foreground">
                Loading roles...
              </p>
            ) : sortedRoles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No roles found.</p>
            ) : (
              <div className="space-y-2">
                {sortedRoles.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => selectRole(r)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      selectedRoleId === r.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">{r.name}</span>
                      <Badge variant="outline" className="shrink-0">
                        {(r.permissions || []).length}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ===== Permissions panel ===== */}
          <div className="rounded-xl border p-4">
            {!selectedRole ? (
              <p className="text-sm text-muted-foreground">
                Select a role to configure access.
              </p>
            ) : (
              <>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold truncate">
                      {selectedRole.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Toggle permissions using checkboxes and save.
                    </p>
                  </div>
                  <Button
                    onClick={onSave}
                    disabled={
                      saveAccess.isPending ||
                      selectedRole.name === 'SUPER_ADMIN'
                    }
                    className="w-full sm:w-auto shrink-0"
                  >
                    {saveAccess.isPending ? 'Saving...' : 'Save Access'}
                  </Button>
                </div>

                {/* Responsive checkbox grid:
                    - 1 col on small phones
                    - 2 cols on sm+
                    - 3 cols on lg+
                    - 4 cols on xl+
                */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {permissionItems.map((permission) => {
                    const checked = draftPermissions.includes(permission);
                    return (
                      <label
                        key={permission}
                        className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted/50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={selectedRole.name === 'SUPER_ADMIN'}
                          onChange={() => togglePermission(permission)}
                          className="shrink-0"
                        />
                        <span className="truncate" title={permission}>
                          {permission}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </PermissionGate>
  );
}