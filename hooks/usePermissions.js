"use client";

import { useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { hasModulePermission, isAdminUser, isSubAdminUser, getFirstAllowedAdminPath } from '@/lib/permissions';

export function usePermissions() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  
  const hasPermission = useCallback((module, type = 'view') => {
    if (isLoading) return false;
    return hasModulePermission(user, module, type);
  }, [isLoading, user]);

  const isAdmin = useMemo(() => isAdminUser(user), [user]);
  const isSubAdmin = useMemo(() => isSubAdminUser(user), [user]);
  const defaultAdminPath = useMemo(() => getFirstAllowedAdminPath(user), [user]);

  return { 
    hasPermission, 
    isAdmin,
    isSubAdmin,
    isLoading,
    user,
    defaultAdminPath,
  };
}
