// Organization types for multi-tenant system

export type UserRole = 'admin' | 'read_only';

export interface Organization {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Contact information
  email?: string;
  phone?: string;
  website?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  description?: string;
  logo_url?: string;
}

export interface OrganizationContact {
  id: string;
  organization_id: string;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationUser {
  id: string;
  organization_id: string;
  user_id: string;
  role: UserRole;
  invited_by: string | null;
  invited_at: string;
  joined_at: string;
  created_at: string;
  // Populated from auth.users join
  email?: string;
}

export interface UserWithRole extends OrganizationUser {
  email: string;
}

export interface OrganizationWithMembers extends Organization {
  members: UserWithRole[];
  admin_count: number;
  read_only_count: number;
}

// Helper to check if user has specific role
export const hasRole = (role: UserRole | undefined, requiredRole: UserRole): boolean => {
  if (!role) return false;
  if (requiredRole === 'read_only') return role === 'admin' || role === 'read_only';
  return role === 'admin';
};

// Helper to check if user is admin
export const isAdmin = (role: UserRole | undefined): boolean => {
  return role === 'admin';
};

// Helper to check if org can add more users of a role
export const canAddRole = (
  currentCount: number,
  role: UserRole,
  maxAdmins: number = 2,
  maxReadOnly: number = 2
): boolean => {
  if (role === 'admin') {
    return currentCount < maxAdmins;
  }
  return currentCount < maxReadOnly;
};
