import { supabase } from '@/lib/supabase';
import { UserRole } from '@/types/organization';
import { Database } from '@/lib/supabase';

type InvitationRow = Database['public']['Tables']['invitations']['Row'];
type InvitationInsert = Database['public']['Tables']['invitations']['Insert'];

export interface Invitation {
  id: string;
  organization_id: string;
  token: string;
  email: string;
  role: UserRole;
  invited_by: string;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
  created_at: string;
}

/**
 * Generate a secure random token for invitations
 */
const generateInvitationToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Create an invitation and send email
 */
export const createInvitation = async (
  organizationId: string,
  email: string,
  role: UserRole,
  invitedBy: string,
  organizationName: string
): Promise<{ success: boolean; error?: string; invitation?: Invitation }> => {
  try {
    // Note: We can't easily check if a user exists by email since auth.users is not directly accessible
    // Instead, we'll just check for existing invitations and let the system handle duplicate memberships
    // when the invitation is accepted

    // Check for existing pending invitation
    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('email', email)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingInvitation) {
      return {
        success: false,
        error: 'An invitation has already been sent to this email',
      };
    }

    // Generate token and expiry (7 days from now)
    const token = generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation record
    const { data: invitation, error: insertError } = await supabase
      .from('invitations')
      .insert({
        organization_id: organizationId,
        token,
        email: email.toLowerCase(),
        role,
        invited_by: invitedBy,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating invitation:', insertError);
      return {
        success: false,
        error: 'Failed to create invitation',
      };
    }

    // Send invitation email using Supabase Auth
    // The invitation link will be to /accept-invitation?token=xxx
    const invitationLink = `${window.location.origin}/accept-invitation?token=${token}`;

    // Use Supabase's built-in email functionality
    // Note: You'll need to configure email templates in Supabase dashboard
    const { error: emailError } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase(),
      options: {
        emailRedirectTo: invitationLink,
        data: {
          invitation_token: token,
          organization_name: organizationName,
          role: role,
        },
      },
    });

    if (emailError) {
      console.error('Error sending invitation email:', emailError);
      // Don't fail if email doesn't send - invitation still exists
      // The admin can manually share the link
      return {
        success: true,
        error: 'Invitation created but email failed to send. Please share this link manually: ' + invitationLink,
        invitation: invitation as Invitation,
      };
    }

    return {
      success: true,
      invitation: invitation as Invitation,
    };
  } catch (error) {
    console.error('Unexpected error creating invitation:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
};

/**
 * Get invitation by token
 */
export const getInvitationByToken = async (
  token: string
): Promise<Invitation | null> => {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Invitation;
};

/**
 * Check if invitation is valid
 */
export const isInvitationValid = (invitation: Invitation): boolean => {
  // Check if already used
  if (invitation.used_at) {
    return false;
  }

  // Check if expired
  const now = new Date();
  const expiresAt = new Date(invitation.expires_at);

  if (now > expiresAt) {
    return false;
  }

  return true;
};

/**
 * Accept an invitation (mark as used)
 */
export const acceptInvitation = async (
  token: string,
  userId: string
): Promise<{ success: boolean; error?: string; organizationId?: string }> => {
  try {
    // Get invitation
    const invitation = await getInvitationByToken(token);

    if (!invitation) {
      return {
        success: false,
        error: 'Invalid invitation token',
      };
    }

    // Validate invitation
    if (!isInvitationValid(invitation)) {
      return {
        success: false,
        error: invitation.used_at
          ? 'This invitation has already been used'
          : 'This invitation has expired',
      };
    }

    // Mark invitation as used
    const { error: updateError } = await supabase
      .from('invitations')
      .update({
        used_at: new Date().toISOString(),
        used_by: userId,
      })
      .eq('token', token);

    if (updateError) {
      console.error('Error updating invitation:', updateError);
      return {
        success: false,
        error: 'Failed to accept invitation',
      };
    }

    // Add user to organization
    const { error: addError } = await supabase
      .from('organization_users')
      .insert({
        organization_id: invitation.organization_id,
        user_id: userId,
        role: invitation.role,
        invited_by: invitation.invited_by,
      });

    if (addError) {
      console.error('Error adding user to organization:', addError);
      return {
        success: false,
        error: 'Failed to add you to the organization',
      };
    }

    return {
      success: true,
      organizationId: invitation.organization_id,
    };
  } catch (error) {
    console.error('Unexpected error accepting invitation:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
};

/**
 * Get all pending invitations for an organization
 */
export const getPendingInvitations = async (
  organizationId: string
): Promise<Invitation[]> => {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('organization_id', organizationId)
    .is('used_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending invitations:', error);
    return [];
  }

  return (data as Invitation[]) || [];
};

/**
 * Cancel an invitation (delete it)
 */
export const cancelInvitation = async (
  invitationId: string
): Promise<{ success: boolean; error?: string }> => {
  const { error } = await supabase
    .from('invitations')
    .delete()
    .eq('id', invitationId)
    .is('used_at', null); // Only allow canceling unused invitations

  if (error) {
    console.error('Error canceling invitation:', error);
    return {
      success: false,
      error: 'Failed to cancel invitation',
    };
  }

  return { success: true };
};

/**
 * Resend an invitation email
 */
export const resendInvitation = async (
  invitationId: string,
  organizationName: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Get invitation
    const { data: invitation, error: fetchError } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (fetchError || !invitation) {
      return {
        success: false,
        error: 'Invitation not found',
      };
    }

    // Check if still valid
    if (!isInvitationValid(invitation as Invitation)) {
      return {
        success: false,
        error: 'Cannot resend an expired or used invitation',
      };
    }

    // Resend email
    const invitationLink = `${window.location.origin}/accept-invitation?token=${invitation.token}`;

    const { error: emailError } = await supabase.auth.signInWithOtp({
      email: invitation.email,
      options: {
        emailRedirectTo: invitationLink,
        data: {
          invitation_token: invitation.token,
          organization_name: organizationName,
          role: invitation.role,
        },
      },
    });

    if (emailError) {
      console.error('Error resending invitation email:', emailError);
      return {
        success: false,
        error: 'Failed to send email. Link: ' + invitationLink,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error resending invitation:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
};
