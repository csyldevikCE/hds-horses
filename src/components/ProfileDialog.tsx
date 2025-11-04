import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { User, Users, Mail, Shield, Trash2 } from 'lucide-react'
import { isAdmin } from '@/types/organization'

interface OrganizationMember {
  id: string
  user_id: string
  role: 'admin' | 'read_only'
  email: string
  invited_at: string
}

interface ProfileDialogProps {
  children: React.ReactNode
}

export const ProfileDialog = ({ children }: ProfileDialogProps) => {
  const { user, organization, userRole, refreshOrganization } = useAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'read_only'>('read_only')
  const [isInviting, setIsInviting] = useState(false)

  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)

  // Profile state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [profileLoaded, setProfileLoaded] = useState(false)


  // Load user profile
  const loadProfile = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error loading profile:', error)
        setProfileLoaded(true)
        return
      }

      if (data) {
        setFirstName(data.first_name || '')
        setLastName(data.last_name || '')
      }
      setProfileLoaded(true)
    } catch (error: any) {
      console.error('Error loading profile:', error)
      setProfileLoaded(true)
    }
  }

  // Load profile when dialog opens
  useEffect(() => {
    if (open && user && !profileLoaded) {
      loadProfile()
    }
  }, [open, user])

  // Load organization members
  const loadMembers = async () => {
    if (!organization?.id) {
      return
    }

    setIsLoadingMembers(true)
    try {
      // Single query with JOIN to profiles via FK relationship
      const { data, error } = await supabase
        .from('organization_users')
        .select(`
          *,
          profiles (
            first_name,
            last_name
          )
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching org members:', error)
        throw error
      }

      if (!data || data.length === 0) {
        setMembers([])
        return
      }

      // Map the joined data
      const membersList = data.map(member => {
        const profile = member.profiles as { first_name: string | null; last_name: string | null } | null
        const firstName = profile?.first_name || ''
        const lastName = profile?.last_name || ''

        let displayName = ''
        if (firstName && lastName) {
          displayName = `${firstName} ${lastName}`
        } else if (firstName) {
          displayName = firstName
        } else if (lastName) {
          displayName = lastName
        } else if (member.user_id === user?.id) {
          displayName = user.email || 'Unknown'
        } else {
          displayName = 'Team Member'
        }

        return {
          id: member.id,
          user_id: member.user_id,
          role: member.role,
          email: displayName,
          invited_at: member.invited_at
        }
      })

      setMembers(membersList)
    } catch (error: any) {
      console.error('Error loading members:', error)
      toast({
        title: 'Error',
        description: 'Failed to load team members',
        variant: 'destructive'
      })
    } finally {
      setIsLoadingMembers(false)
    }
  }

  // Update profile
  const handleUpdateProfile = async () => {
    if (!user) return

    setIsUpdatingProfile(true)
    try {
      // Update profiles table (single source of truth)
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: firstName,
          last_name: lastName
        })

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Profile updated successfully'
      })

      // Reload members to show updated name
      if (activeTab === 'organization') {
        loadMembers()
      }

      // Dispatch custom event to notify UserProfile to refresh
      window.dispatchEvent(new CustomEvent('profile-updated'))
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  // Invite user - Generate invitation link
  const handleInviteUser = async () => {
    if (!organization?.id || !user?.id) return
    if (!inviteEmail.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive'
      })
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(inviteEmail)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address',
        variant: 'destructive'
      })
      return
    }

    setIsInviting(true)
    try {
      // Check member count
      const currentAdmins = members.filter(m => m.role === 'admin').length
      const currentReadOnly = members.filter(m => m.role === 'read_only').length

      if (inviteRole === 'admin' && currentAdmins >= 4) {
        toast({
          title: 'Error',
          description: 'Maximum 4 admins per organization',
          variant: 'destructive'
        })
        setIsInviting(false)
        return
      }

      if (inviteRole === 'read_only' && currentReadOnly >= 2) {
        toast({
          title: 'Error',
          description: 'Maximum 2 read-only users per organization',
          variant: 'destructive'
        })
        setIsInviting(false)
        return
      }

      // Generate unique invitation token
      const token = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // Expires in 7 days

      // Create invitation record
      const { error } = await supabase
        .from('invitations')
        .insert({
          organization_id: organization.id,
          token,
          email: inviteEmail,
          role: inviteRole,
          invited_by: user.id,
          expires_at: expiresAt.toISOString()
        })

      if (error) throw error

      // Generate invitation link
      const inviteLink = `${window.location.origin}/signup?invite=${token}`

      // Copy to clipboard
      await navigator.clipboard.writeText(inviteLink)

      toast({
        title: 'Invitation Link Created!',
        description: `Link copied to clipboard! Share it with ${inviteEmail}. They'll join as ${inviteRole === 'admin' ? 'Administrator' : 'Read-Only user'}. Link expires in 7 days.`,
        duration: 8000,
      })

      setInviteEmail('')
      setInviteRole('read_only')
      setIsInviteDialogOpen(false)
    } catch (error: any) {
      console.error('Invitation error:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to create invitation',
        variant: 'destructive'
      })
    } finally {
      setIsInviting(false)
    }
  }

  // Change user role
  const handleChangeRole = async (memberId: string, newRole: 'admin' | 'read_only') => {
    if (!isAdmin(userRole)) return

    try {
      const { error } = await supabase
        .from('organization_users')
        .update({ role: newRole })
        .eq('id', memberId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'User role updated successfully'
      })

      loadMembers()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  // Remove user
  const handleRemoveUser = async (memberId: string, memberUserId: string) => {
    if (!isAdmin(userRole)) return
    if (memberUserId === user?.id) {
      toast({
        title: 'Error',
        description: 'You cannot remove yourself',
        variant: 'destructive'
      })
      return
    }

    if (!organization?.id) {
      toast({
        title: 'Error',
        description: 'Organization not found',
        variant: 'destructive'
      })
      return
    }

    try {
      // Check if user is the organization creator
      const { data: org } = await supabase
        .from('organizations')
        .select('created_by')
        .eq('id', organization.id)
        .single()

      if (org?.created_by === memberUserId) {
        toast({
          title: 'Error',
          description: 'Cannot remove the organization creator',
          variant: 'destructive'
        })
        return
      }

      // Delete using both id and organization_id for better RLS handling
      const { error } = await supabase
        .from('organization_users')
        .delete()
        .eq('id', memberId)
        .eq('organization_id', organization.id)

      if (error) {
        console.error('Delete error details:', error)
        throw new Error(error.message || 'Failed to delete user')
      }

      toast({
        title: 'Success',
        description: 'User removed from organization'
      })

      loadMembers()
    } catch (error: any) {
      console.error('Error removing user:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove user from organization',
        variant: 'destructive'
      })
    }
  }

  // Load members when tab changes to organization
  useEffect(() => {
    if (activeTab === 'organization' && open) {
      loadMembers()
    }
  }, [activeTab, open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl">Settings</DialogTitle>
          <DialogDescription>
            Manage your profile and organization settings
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="organization" className="gap-2">
              <Users className="h-4 w-4" />
              Organization
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-sm text-gray-500">Email cannot be changed</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Organization</Label>
                <Input
                  value={organization?.name || 'No organization'}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Input
                  value={userRole === 'admin' ? 'Administrator' : 'Read Only'}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <Button
                onClick={handleUpdateProfile}
                disabled={isUpdatingProfile}
                className="w-full"
              >
                {isUpdatingProfile ? 'Updating...' : 'Update Profile'}
              </Button>
            </div>
          </TabsContent>

          {/* Organization Tab */}
          <TabsContent value="organization" className="space-y-4 mt-6">
            {!isAdmin(userRole) ? (
              <div className="text-center py-8 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Only administrators can manage organization settings</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Organization Info */}
                <div className="space-y-2">
                  <Label>Organization Name</Label>
                  <Input
                    value={organization?.name || ''}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                {/* Team Members Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Team Members</h3>
                      <p className="text-sm text-gray-500">
                        Manage your team members and their roles
                      </p>
                    </div>
                    <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="gap-2">
                          <Mail className="h-4 w-4" />
                          Invite User
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Invite Team Member</DialogTitle>
                          <DialogDescription>
                            Send an invitation to join your organization
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="inviteEmail">Email Address</Label>
                            <Input
                              id="inviteEmail"
                              type="email"
                              placeholder="colleague@example.com"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="inviteRole">Role</Label>
                            <Select
                              value={inviteRole}
                              onValueChange={(value: 'admin' | 'read_only') => setInviteRole(value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Administrator</SelectItem>
                                <SelectItem value="read_only">Read Only</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-sm text-gray-500">
                              {inviteRole === 'admin'
                                ? 'Full access to manage horses and team members'
                                : 'Can view horses but cannot edit or delete'}
                            </p>
                          </div>
                          <Button
                            onClick={handleInviteUser}
                            disabled={isInviting}
                            className="w-full"
                          >
                            {isInviting ? 'Sending Invite...' : 'Send Invitation'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Members List */}
                  <div className="space-y-2">
                    {isLoadingMembers ? (
                      <p className="text-center py-4 text-gray-500">Loading members...</p>
                    ) : members.length === 0 ? (
                      <p className="text-center py-4 text-gray-500">No team members found</p>
                    ) : (
                      members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-4 border rounded-lg bg-white"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{member.email}</p>
                              <p className="text-sm text-gray-500">
                                {member.user_id === user?.id && '(You) '}
                                {member.role === 'admin' ? 'Administrator' : 'Read Only'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {member.user_id !== user?.id && (
                              <>
                                <Select
                                  value={member.role}
                                  onValueChange={(value: 'admin' | 'read_only') =>
                                    handleChangeRole(member.id, value)
                                  }
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="read_only">Read Only</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveUser(member.id, member.user_id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Member Limits */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-900">
                      <strong>Team Limits:</strong> Maximum 4 administrators and 2 read-only users per organization
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Current: {members.filter(m => m.role === 'admin').length}/4 Admins, {members.filter(m => m.role === 'read_only').length}/2 Read-Only
                    </p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
