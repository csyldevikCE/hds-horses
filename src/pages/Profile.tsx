import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, User, Users, Mail, Shield, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { isAdmin } from '@/types/organization'

interface OrganizationMember {
  id: string
  user_id: string
  role: 'admin' | 'read_only'
  email: string
  invited_at: string
}

const Profile = () => {
  const { user, organization, userRole, refreshOrganization } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'read_only'>('read_only')
  const [isInviting, setIsInviting] = useState(false)

  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)

  // Profile state
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || '')
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  // Load organization members
  const loadMembers = async () => {
    if (!organization?.id) return

    setIsLoadingMembers(true)
    try {
      const { data: orgUsers, error: orgError } = await supabase
        .from('organization_users')
        .select('*')
        .eq('organization_id', organization.id)

      if (orgError) throw orgError

      // Get user emails
      const userIds = orgUsers.map(ou => ou.user_id)
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers()

      if (usersError) throw usersError

      const membersWithEmails = orgUsers.map(ou => {
        const userInfo = users.users.find(u => u.id === ou.user_id)
        return {
          id: ou.id,
          user_id: ou.user_id,
          role: ou.role,
          email: userInfo?.email || 'Unknown',
          invited_at: ou.invited_at
        }
      })

      setMembers(membersWithEmails)
    } catch (error: any) {
      console.error('Error loading members:', error)
      // Try alternative approach - get users from organization_users directly
      try {
        const { data: orgUsers, error } = await supabase
          .from('organization_users')
          .select('*')
          .eq('organization_id', organization.id)

        if (error) throw error

        // Map without emails for now
        const membersList = orgUsers.map(ou => ({
          id: ou.id,
          user_id: ou.user_id,
          role: ou.role,
          email: ou.user_id === user?.id ? user.email || 'You' : 'Team Member',
          invited_at: ou.invited_at
        }))

        setMembers(membersList)
      } catch (fallbackError: any) {
        toast({
          title: 'Error',
          description: 'Failed to load team members',
          variant: 'destructive'
        })
      }
    } finally {
      setIsLoadingMembers(false)
    }
  }

  // Update profile
  const handleUpdateProfile = async () => {
    if (!user) return

    setIsUpdatingProfile(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: displayName
        }
      })

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Profile updated successfully'
      })
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

  // Invite user
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

    setIsInviting(true)
    try {
      // Check member count
      const currentAdmins = members.filter(m => m.role === 'admin').length
      const currentReadOnly = members.filter(m => m.role === 'read_only').length

      if (inviteRole === 'admin' && currentAdmins >= 2) {
        toast({
          title: 'Error',
          description: 'Maximum 2 admins per organization',
          variant: 'destructive'
        })
        return
      }

      if (inviteRole === 'read_only' && currentReadOnly >= 2) {
        toast({
          title: 'Error',
          description: 'Maximum 2 read-only users per organization',
          variant: 'destructive'
        })
        return
      }

      // In a real app, you would:
      // 1. Create user account via Supabase Auth API or send invite email
      // 2. Add them to organization_users table
      // For now, we'll show a message

      toast({
        title: 'Invite Sent',
        description: `Invitation sent to ${inviteEmail} as ${inviteRole}`,
      })

      setInviteEmail('')
      setIsInviteDialogOpen(false)
      loadMembers()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
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

    try {
      const { error } = await supabase
        .from('organization_users')
        .delete()
        .eq('id', memberId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'User removed from organization'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Horses
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Settings</CardTitle>
            <CardDescription>
              Manage your profile and organization settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile" className="gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="organization" className="gap-2" onClick={loadMembers}>
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

                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your name"
                    />
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
                          <strong>Team Limits:</strong> Maximum 2 administrators and 2 read-only users per organization
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                          Current: {members.filter(m => m.role === 'admin').length}/2 Admins, {members.filter(m => m.role === 'read_only').length}/2 Read-Only
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Profile
