import { useAdminAuthStore } from '../stores/adminAuthStore';
import { Permission, hasPermission } from '../lib/permissions';

export const usePermissions = () => {
  const { admin } = useAdminAuthStore();
  const role = admin?.role;

  const can = (permission: Permission) => {
    return hasPermission(role, permission);
  };

  const canAny = (permissions: Permission[]) => {
    return permissions.some(p => can(p));
  };

  const canAll = (permissions: Permission[]) => {
    return permissions.every(p => can(p));
  };

  return {
    can,
    canAny,
    canAll,
    role,
    isAdmin: role === 'superadmin' || role === 'tenant_admin' || role === 'company_admin',
  };
};
