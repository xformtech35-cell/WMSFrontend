// utils/permissionUtils.js

export const hasPermission = (permission) => {
  try {
    const permissions = JSON.parse(
      localStorage.getItem("wms_permissions") || "[]"
    );

    return Array.isArray(permissions)
      ? permissions.includes(permission)
      : false;
  } catch (error) {
    console.error("Error reading permissions:", error);
    return false;
  }
};

export const shouldRestrictByAssignment = (allPermission) => {
  return !hasPermission(allPermission);
};