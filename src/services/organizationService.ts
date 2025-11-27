import { supabase } from '@/lib/supabase';
import { Organization, OrganizationUser, OrganizationContact, UserWithRole, UserRole } from '@/types/organization';
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
 * Update organization details
 */
export const updateOrganization = async (
  organizationId: string,
  updates: Partial<Omit<Organization, 'id' | 'created_by' | 'created_at' | 'updated_at'>>
): Promise<Organization> => {
  const { data, error } = await supabase
    .from('organizations')
    .update({
      ...updates,
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

// =============================================================================
// ORGANIZATION CONTACTS
// =============================================================================

/**
 * Get organization contacts
 */
export const getOrganizationContacts = async (
  organizationId: string
): Promise<OrganizationContact[]> => {
  const { data, error } = await supabase
    .from('organization_contacts')
    .select('*')
    .eq('organization_id', organizationId)
    .order('is_primary', { ascending: false })
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch organization contacts: ${error.message}`);
  }

  return data || [];
};

/**
 * Add a contact person to organization
 */
export const addOrganizationContact = async (
  organizationId: string,
  contact: Omit<OrganizationContact, 'id' | 'organization_id' | 'created_at' | 'updated_at'>
): Promise<OrganizationContact> => {
  // If this is set as primary, unset other primary contacts first
  if (contact.is_primary) {
    await supabase
      .from('organization_contacts')
      .update({ is_primary: false })
      .eq('organization_id', organizationId);
  }

  const { data, error } = await supabase
    .from('organization_contacts')
    .insert({
      organization_id: organizationId,
      name: contact.name,
      title: contact.title || null,
      email: contact.email || null,
      phone: contact.phone || null,
      is_primary: contact.is_primary
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add organization contact: ${error.message}`);
  }

  return data;
};

/**
 * Update a contact person
 */
export const updateOrganizationContact = async (
  contactId: string,
  organizationId: string,
  updates: Partial<Omit<OrganizationContact, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>
): Promise<OrganizationContact> => {
  // If setting as primary, unset other primary contacts first
  if (updates.is_primary) {
    await supabase
      .from('organization_contacts')
      .update({ is_primary: false })
      .eq('organization_id', organizationId)
      .neq('id', contactId);
  }

  const { data, error } = await supabase
    .from('organization_contacts')
    .update(updates)
    .eq('id', contactId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update organization contact: ${error.message}`);
  }

  return data;
};

/**
 * Delete a contact person
 */
export const deleteOrganizationContact = async (contactId: string): Promise<void> => {
  const { error } = await supabase
    .from('organization_contacts')
    .delete()
    .eq('id', contactId);

  if (error) {
    throw new Error(`Failed to delete organization contact: ${error.message}`);
  }
};

/**
 * Get organization with contacts (for shared links)
 */
export const getOrganizationWithContacts = async (
  organizationId: string
): Promise<{ organization: Organization; contacts: OrganizationContact[] } | null> => {
  const [orgResult, contactsResult] = await Promise.all([
    supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single(),
    supabase
      .from('organization_contacts')
      .select('*')
      .eq('organization_id', organizationId)
      .order('is_primary', { ascending: false })
  ]);

  if (orgResult.error) {
    return null;
  }

  return {
    organization: orgResult.data,
    contacts: contactsResult.data || []
  };
};
