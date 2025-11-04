import { supabase } from '@/lib/supabase';
import { Organization, OrganizationUser, UserWithRole, UserRole } from '@/types/organization';
import { createInvitation } from './invitationService';

/**
 * Get organization by ID
 */
export const getOrganizationById = async (organizationId: string): Promise<Organization | null> => {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch organization: ${error.message}`);
  }

  return data;
};

/**
 * Update organization details (name)
 */
export const updateOrganization = async (
  organizationId: string,
  updates: { name: string }
): Promise<Organization> => {
  const { data, error } = await supabase
    .from('organizations')
    .update({
      name: updates.name,
      updated_at: new Date().toISOString(),
    })
    .eq('id', organizationId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update organization: ${error.message}`);
  }

  return data;
};

/**
 * Get all members of an organization with their profile information
 * Now uses direct JOIN via FK relationship (organization_users.user_id → profiles.id)
 */
export const getOrganizationMembers = async (
  organizationId: string
): Promise<UserWithRole[]> => {
  // Single query with JOIN to profiles table
  const { data, error } = await supabase
    .from('organization_users')
    .select(`
      *,
      profiles (
        first_name,
        last_name
      )
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch organization members: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Map the joined data to UserWithRole format
  const members: UserWithRole[] = data.map((member) => {
    const profile = member.profiles as { first_name: string | null; last_name: string | null } | null;

    // Generate display name from profile
    let displayName = 'Team Member';
    if (profile?.first_name && profile?.last_name) {
      displayName = `${profile.first_name} ${profile.last_name}`;
    } else if (profile?.first_name) {
      displayName = profile.first_name;
    } else if (profile?.last_name) {
      displayName = profile.last_name;
    }

    return {
      id: member.id,
      organization_id: member.organization_id,
      user_id: member.user_id,
      role: member.role,
      invited_by: member.invited_by,
      invited_at: member.invited_at,
      joined_at: member.joined_at,
      created_at: member.created_at,
      email: displayName, // Using display name instead of email for privacy
    };
  });

  return members;
};

/**
 * Count users by role in an organization
 */
export const countUsersByRole = async (
  organizationId: string
): Promise<{ admin: number; read_only: number }> => {
  const { data, error } = await supabase
    .from('organization_users')
    .select('role')
    .eq('organization_id', organizationId);

  if (error) {
    throw new Error(`Failed to count users by role: ${error.message}`);
  }

  const counts = {
    admin: data.filter((u) => u.role === 'admin').length,
    read_only: data.filter((u) => u.role === 'read_only').length,
  };

  return counts;
};

/**
 * Invite a new user to the organization
 * Creates an invitation record and sends an email to the user
 */
export const inviteUserToOrganization = async (
  organizationId: string,
  email: string,
  role: UserRole,
  invitedBy: string
): Promise<{ success: boolean; error?: string }> => {
  // Check current role counts
  const counts = await countUsersByRole(organizationId);

  if (role === 'admin' && counts.admin >= 4) {
    return { success: false, error: 'Maximum number of admins (4) reached' };
  }

  if (role === 'read_only' && counts.read_only >= 2) {
    return { success: false, error: 'Maximum number of read-only users (2) reached' };
  }

  // Get organization name for email
  const organization = await getOrganizationById(organizationId);
  if (!organization) {
    return { success: false, error: 'Organization not found' };
  }

  // Create invitation and send email
  const result = await createInvitation(
    organizationId,
    email,
    role,
    invitedBy,
    organization.name
  );

  return result;
};

/**
 * Add an existing user to an organization
 * (Used when user accepts invitation or admin manually adds them)
 */
export const addUserToOrganization = async (
  organizationId: string,
  userId: string,
  role: UserRole,
  invitedBy: string
): Promise<OrganizationUser> => {
  // Check current role counts
  const counts = await countUsersByRole(organizationId);

  if (role === 'admin' && counts.admin >= 4) {
    throw new Error('Maximum number of admins (4) reached');
  }

  if (role === 'read_only' && counts.read_only >= 2) {
    throw new Error('Maximum number of read-only users (2) reached');
  }

  // Check if user is already a member
  const { data: existing } = await supabase
    .from('organization_users')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    throw new Error('User is already a member of this organization');
  }

  // Add user to organization
  const { data, error } = await supabase
    .from('organization_users')
    .insert({
      organization_id: organizationId,
      user_id: userId,
      role,
      invited_by: invitedBy,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add user to organization: ${error.message}`);
  }

  return data;
};

/**
 * Remove a user from an organization
 */
export const removeUserFromOrganization = async (
  organizationId: string,
  userId: string
): Promise<void> => {
  // Check if user is the organization creator
  const { data: org } = await supabase
    .from('organizations')
    .select('created_by')
    .eq('id', organizationId)
    .single();

  if (org?.created_by === userId) {
    throw new Error('Cannot remove the organization creator');
  }

  const { error } = await supabase
    .from('organization_users')
    .delete()
    .eq('organization_id', organizationId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to remove user from organization: ${error.message}`);
  }
};

/**
 * Update a user's role in an organization
 */
export const updateUserRole = async (
  organizationId: string,
  userId: string,
  newRole: UserRole
): Promise<OrganizationUser> => {
  // Get current role
  const { data: currentMember } = await supabase
    .from('organization_users')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .single();

  if (!currentMember) {
    throw new Error('User is not a member of this organization');
  }

  // If role is not changing, just return current data
  if (currentMember.role === newRole) {
    const { data } = await supabase
      .from('organization_users')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single();
    return data!;
  }

  // Check if the new role would exceed limits
  const counts = await countUsersByRole(organizationId);

  if (newRole === 'admin') {
    // If changing to admin, check if we have room (accounting for this user leaving their current role)
    const currentAdmins = currentMember.role === 'admin' ? counts.admin - 1 : counts.admin;
    if (currentAdmins >= 4) {
      throw new Error('Maximum number of admins (4) reached');
    }
  } else if (newRole === 'read_only') {
    // If changing to read_only, check if we have room
    const currentReadOnly =
      currentMember.role === 'read_only' ? counts.read_only - 1 : counts.read_only;
    if (currentReadOnly >= 2) {
      throw new Error('Maximum number of read-only users (2) reached');
    }
  }

  // Update the role
  const { data, error } = await supabase
    .from('organization_users')
    .update({ role: newRole })
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update user role: ${error.message}`);
  }

  return data;
};

/**
 * Get user's membership info for an organization
 */
export const getUserMembership = async (
  organizationId: string,
  userId: string
): Promise<OrganizationUser | null> => {
  const { data, error } = await supabase
    .from('organization_users')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .single();

  if (error) {
    return null;
  }

  return data;
};
