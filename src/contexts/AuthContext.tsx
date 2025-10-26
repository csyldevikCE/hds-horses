import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Organization, OrganizationUser, UserRole } from '@/types/organization'

interface AuthContextType {
  user: User | null
  session: Session | null
  organization: Organization | null
  organizationUser: OrganizationUser | null
  userRole: UserRole | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    organizationName: string | null,
    inviteToken?: string
  ) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  refreshOrganization: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [organizationUser, setOrganizationUser] = useState<OrganizationUser | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  // Fetch organization and role data for the current user
  const fetchOrganizationData = async (userId: string) => {
    try {
      // Fetch user's organization membership
      const { data: membershipData, error: membershipError } = await supabase
        .from('organization_users')
        .select('*')
        .eq('user_id', userId)
        .limit(1)

      if (membershipError) {
        console.error('Failed to fetch organization membership:', membershipError)
        setOrganization(null)
        setOrganizationUser(null)
        setUserRole(null)
        return
      }

      const membership = membershipData?.[0]
      if (!membership) {
        setOrganization(null)
        setOrganizationUser(null)
        setUserRole(null)
        return
      }

      setOrganizationUser(membership)
      setUserRole(membership.role)

      // Fetch organization details
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', membership.organization_id)
        .limit(1)

      if (orgError) {
        console.error('Failed to fetch organization:', orgError)
        setOrganization(null)
        return
      }

      const org = orgData?.[0]
      if (org) {
        setOrganization(org)
      } else {
        setOrganization(null)
      }
    } catch (error: any) {
      console.error('Error fetching organization data:', error)
      setOrganization(null)
      setOrganizationUser(null)
      setUserRole(null)
    }
  }

  const refreshOrganization = async () => {
    if (user?.id) {
      await fetchOrganizationData(user.id)
    }
  }

  // Wrapper with timeout to prevent hanging
  const fetchOrganizationDataWithTimeout = async (userId: string) => {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Organization fetch timeout')), 15000) // 15 seconds
    })

    try {
      await Promise.race([
        fetchOrganizationData(userId),
        timeoutPromise
      ])
    } catch (error: any) {
      console.error('Organization fetch timed out')
      // Clear org data but DON'T prevent app from loading
      setOrganization(null)
      setOrganizationUser(null)
      setUserRole(null)
    }
  }

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Failed to get session:', error)
        }

        setSession(session)
        setUser(session?.user ?? null)

        // Set loading to false IMMEDIATELY after setting user
        // Don't wait for org fetch - it can happen in background
        setLoading(false)

        if (session?.user) {
          // Fetch org in background, don't block the UI
          await fetchOrganizationDataWithTimeout(session.user.id)
        }

        // Mark as initialized AFTER everything completes
        setIsInitialized(true)
      } catch (error) {
        console.error('Error initializing auth:', error)
        setLoading(false)
        setIsInitialized(true)
      }
    }

    initializeAuth()

    // Listen for auth changes - only handle actual auth events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Skip INITIAL_SESSION - already handled in initializeAuth
      if (event === 'INITIAL_SESSION') {
        return
      }

      // Only handle events after initialization is complete
      if (!isInitialized) {
        return
      }

      // Only handle real auth changes: SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED
      if (event === 'SIGNED_IN') {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchOrganizationDataWithTimeout(session.user.id)
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null)
        setUser(null)
        setOrganization(null)
        setOrganizationUser(null)
        setUserRole(null)
      } else if (event === 'TOKEN_REFRESHED') {
        setSession(session)
        setUser(session?.user ?? null)
      }
    })

    return () => subscription.unsubscribe()
  }, [isInitialized])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    organizationName: string | null,
    inviteToken?: string
  ) => {
    // Step 1: Create the user account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError || !authData.user) {
      return { error: authError }
    }

    try {
      // Step 2: Create/update the user profile with first and last name
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
        })

      if (profileError) {
        console.error('Failed to create profile:', profileError)
        // Don't fail signup if profile creation fails, just log it
      }

      // Step 3: Handle invitation or create new organization
      if (inviteToken) {
        // Invitation-based signup
        // Load the invitation
        const { data: invitation, error: inviteError } = await supabase
          .from('invitations')
          .select('*')
          .eq('token', inviteToken)
          .is('used_at', null)
          .single()

        if (inviteError || !invitation) {
          return { error: inviteError || new Error('Invalid or expired invitation') }
        }

        // Verify invitation hasn't expired
        if (new Date(invitation.expires_at) < new Date()) {
          return { error: new Error('This invitation has expired') }
        }

        // Add user to the organization with the role from invitation
        const { error: membershipError } = await supabase
          .from('organization_users')
          .insert({
            organization_id: invitation.organization_id,
            user_id: authData.user.id,
            role: invitation.role,
            invited_by: invitation.invited_by,
          })

        if (membershipError) {
          return { error: membershipError }
        }

        // Mark invitation as used
        const { error: updateInviteError } = await supabase
          .from('invitations')
          .update({
            used_at: new Date().toISOString(),
            used_by: authData.user.id,
          })
          .eq('id', invitation.id)

        if (updateInviteError) {
          console.error('Failed to mark invitation as used:', updateInviteError)
          // Don't fail signup if this fails
        }

        // Refresh organization data
        await fetchOrganizationData(authData.user.id)

        return { error: null }
      } else {
        // Regular signup - create new organization
        if (!organizationName) {
          return { error: new Error('Organization name is required') }
        }

        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: organizationName,
            created_by: authData.user.id,
          })
          .select()
          .single()

        if (orgError || !orgData) {
          return { error: orgError || new Error('Failed to create organization') }
        }

        // Create organization membership with admin role
        const { error: membershipError } = await supabase
          .from('organization_users')
          .insert({
            organization_id: orgData.id,
            user_id: authData.user.id,
            role: 'admin',
            invited_by: authData.user.id,
          })

        if (membershipError) {
          return { error: membershipError }
        }

        // Refresh organization data
        await fetchOrganizationData(authData.user.id)

        return { error: null }
      }
    } catch (error) {
      return { error }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setOrganization(null)
    setOrganizationUser(null)
    setUserRole(null)
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  }

  const value = {
    user,
    session,
    organization,
    organizationUser,
    userRole,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshOrganization,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
} 