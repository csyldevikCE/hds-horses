import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, User, Users, Mail, Shield, Trash2, Building2, Phone, Globe, MapPin, Plus, Edit, UserCircle, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { isAdmin, OrganizationContact } from '@/types/organization'
import {
  updateOrganization,
  getOrganizationContacts,
  addOrganizationContact,
  updateOrganizationContact,
  deleteOrganizationContact
} from '@/services/organizationService'

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

  // Organization info state
  const [orgName, setOrgName] = useState(organization?.name || '')
  const [orgEmail, setOrgEmail] = useState(organization?.email || '')
  const [orgPhone, setOrgPhone] = useState(organization?.phone || '')
  const [orgWebsite, setOrgWebsite] = useState(organization?.website || '')
  const [orgAddressLine1, setOrgAddressLine1] = useState(organization?.address_line1 || '')
  const [orgAddressLine2, setOrgAddressLine2] = useState(organization?.address_line2 || '')
  const [orgCity, setOrgCity] = useState(organization?.city || '')
  const [orgState, setOrgState] = useState(organization?.state || '')
  const [orgPostalCode, setOrgPostalCode] = useState(organization?.postal_code || '')
  const [orgCountry, setOrgCountry] = useState(organization?.country || '')
  const [orgDescription, setOrgDescription] = useState(organization?.description || '')
  const [isUpdatingOrg, setIsUpdatingOrg] = useState(false)

  // Contact persons state
  const [contacts, setContacts] = useState<OrganizationContact[]>([])
  const [isLoadingContacts, setIsLoadingContacts] = useState(false)
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<OrganizationContact | null>(null)
  const [contactName, setContactName] = useState('')
  const [contactTitle, setContactTitle] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactIsPrimary, setContactIsPrimary] = useState(false)
  const [isSavingContact, setIsSavingContact] = useState(false)

  // Sync organization data to state when it changes
  useEffect(() => {
    if (organization) {
      setOrgName(organization.name || '')
      setOrgEmail(organization.email || '')
      setOrgPhone(organization.phone || '')
      setOrgWebsite(organization.website || '')
      setOrgAddressLine1(organization.address_line1 || '')
      setOrgAddressLine2(organization.address_line2 || '')
      setOrgCity(organization.city || '')
      setOrgState(organization.state || '')
      setOrgPostalCode(organization.postal_code || '')
      setOrgCountry(organization.country || '')
      setOrgDescription(organization.description || '')
    }
  }, [organization])

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
    } catch (error) {
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
      } catch (fallbackError) {
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

  // Load organization contacts
  const loadContacts = async () => {
    if (!organization?.id) return

    setIsLoadingContacts(true)
    try {
      const contactsList = await getOrganizationContacts(organization.id)
      setContacts(contactsList)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load contacts',
        variant: 'destructive'
      })
    } finally {
      setIsLoadingContacts(false)
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
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive'
      })
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  // Update organization info
  const handleUpdateOrganization = async () => {
    if (!organization?.id || !isAdmin(userRole)) return

    setIsUpdatingOrg(true)
    try {
      await updateOrganization(organization.id, {
        name: orgName,
        email: orgEmail || undefined,
        phone: orgPhone || undefined,
        website: orgWebsite || undefined,
        address_line1: orgAddressLine1 || undefined,
        address_line2: orgAddressLine2 || undefined,
        city: orgCity || undefined,
        state: orgState || undefined,
        postal_code: orgPostalCode || undefined,
        country: orgCountry || undefined,
        description: orgDescription || undefined
      })

      await refreshOrganization()

      toast({
        title: 'Success',
        description: 'Organization updated successfully'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update organization',
        variant: 'destructive'
      })
    } finally {
      setIsUpdatingOrg(false)
    }
  }

  // Open contact dialog for add/edit
  const openContactDialog = (contact?: OrganizationContact) => {
    if (contact) {
      setEditingContact(contact)
      setContactName(contact.name)
      setContactTitle(contact.title || '')
      setContactEmail(contact.email || '')
      setContactPhone(contact.phone || '')
      setContactIsPrimary(contact.is_primary)
    } else {
      setEditingContact(null)
      setContactName('')
      setContactTitle('')
      setContactEmail('')
      setContactPhone('')
      setContactIsPrimary(contacts.length === 0) // First contact is primary by default
    }
    setIsContactDialogOpen(true)
  }

  // Save contact (add or update)
  const handleSaveContact = async () => {
    if (!organization?.id || !contactName.trim()) return

    setIsSavingContact(true)
    try {
      if (editingContact) {
        await updateOrganizationContact(editingContact.id, organization.id, {
          name: contactName,
          title: contactTitle || undefined,
          email: contactEmail || undefined,
          phone: contactPhone || undefined,
          is_primary: contactIsPrimary
        })
        toast({
          title: 'Success',
          description: 'Contact updated successfully'
        })
      } else {
        await addOrganizationContact(organization.id, {
          name: contactName,
          title: contactTitle || undefined,
          email: contactEmail || undefined,
          phone: contactPhone || undefined,
          is_primary: contactIsPrimary
        })
        toast({
          title: 'Success',
          description: 'Contact added successfully'
        })
      }

      setIsContactDialogOpen(false)
      loadContacts()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save contact',
        variant: 'destructive'
      })
    } finally {
      setIsSavingContact(false)
    }
  }

  // Delete contact
  const handleDeleteContact = async (contactId: string) => {
    try {
      await deleteOrganizationContact(contactId)
      toast({
        title: 'Success',
        description: 'Contact deleted successfully'
      })
      loadContacts()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete contact',
        variant: 'destructive'
      })
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
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to invite user',
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
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to change user role',
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
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove user',
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
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile" className="gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="organization" className="gap-2" onClick={() => { loadMembers(); loadContacts(); }}>
                  <Building2 className="h-4 w-4" />
                  Organization
                </TabsTrigger>
                <TabsTrigger value="team" className="gap-2" onClick={loadMembers}>
                  <Users className="h-4 w-4" />
                  Team
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
              <TabsContent value="organization" className="space-y-6 mt-6">
                {!isAdmin(userRole) ? (
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Only administrators can manage organization settings</p>
                  </div>
                ) : (
                  <>
                    {/* Organization Info */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Organization Information
                      </h3>
                      <p className="text-sm text-gray-500">
                        This information will be shown on shared horse links
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="orgName">Organization Name</Label>
                          <Input
                            id="orgName"
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            placeholder="Your stable or business name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="orgEmail">Email</Label>
                          <Input
                            id="orgEmail"
                            type="email"
                            value={orgEmail}
                            onChange={(e) => setOrgEmail(e.target.value)}
                            placeholder="contact@example.com"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="orgPhone">Phone</Label>
                          <Input
                            id="orgPhone"
                            type="tel"
                            value={orgPhone}
                            onChange={(e) => setOrgPhone(e.target.value)}
                            placeholder="+1 234 567 8900"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="orgWebsite">Website</Label>
                          <Input
                            id="orgWebsite"
                            type="url"
                            value={orgWebsite}
                            onChange={(e) => setOrgWebsite(e.target.value)}
                            placeholder="https://www.example.com"
                          />
                        </div>
                      </div>

                      {/* Address */}
                      <div className="space-y-4 pt-4 border-t">
                        <h4 className="font-medium flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Address
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="orgAddressLine1">Address Line 1</Label>
                            <Input
                              id="orgAddressLine1"
                              value={orgAddressLine1}
                              onChange={(e) => setOrgAddressLine1(e.target.value)}
                              placeholder="Street address"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="orgAddressLine2">Address Line 2</Label>
                            <Input
                              id="orgAddressLine2"
                              value={orgAddressLine2}
                              onChange={(e) => setOrgAddressLine2(e.target.value)}
                              placeholder="Apartment, suite, etc."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="orgCity">City</Label>
                            <Input
                              id="orgCity"
                              value={orgCity}
                              onChange={(e) => setOrgCity(e.target.value)}
                              placeholder="City"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="orgState">State / Region</Label>
                            <Input
                              id="orgState"
                              value={orgState}
                              onChange={(e) => setOrgState(e.target.value)}
                              placeholder="State or region"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="orgPostalCode">Postal Code</Label>
                            <Input
                              id="orgPostalCode"
                              value={orgPostalCode}
                              onChange={(e) => setOrgPostalCode(e.target.value)}
                              placeholder="12345"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="orgCountry">Country</Label>
                            <Input
                              id="orgCountry"
                              value={orgCountry}
                              onChange={(e) => setOrgCountry(e.target.value)}
                              placeholder="Country"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-2 pt-4 border-t">
                        <Label htmlFor="orgDescription">Description</Label>
                        <Textarea
                          id="orgDescription"
                          value={orgDescription}
                          onChange={(e) => setOrgDescription(e.target.value)}
                          placeholder="Tell potential buyers about your stable, breeding program, or business..."
                          rows={3}
                        />
                      </div>

                      <Button
                        onClick={handleUpdateOrganization}
                        disabled={isUpdatingOrg}
                        className="w-full"
                      >
                        {isUpdatingOrg ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          'Update Organization'
                        )}
                      </Button>
                    </div>

                    {/* Contact Persons */}
                    <div className="space-y-4 pt-6 border-t">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <UserCircle className="h-5 w-5" />
                            Contact Persons
                          </h3>
                          <p className="text-sm text-gray-500">
                            Add contact persons that will be shown on shared links
                          </p>
                        </div>
                        <Button onClick={() => openContactDialog()} className="gap-2">
                          <Plus className="h-4 w-4" />
                          Add Contact
                        </Button>
                      </div>

                      {/* Contacts List */}
                      <div className="space-y-2">
                        {isLoadingContacts ? (
                          <p className="text-center py-4 text-gray-500">Loading contacts...</p>
                        ) : contacts.length === 0 ? (
                          <div className="text-center py-8 text-gray-500 border rounded-lg bg-gray-50">
                            <UserCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No contact persons added yet</p>
                            <p className="text-sm">Add a contact to show on shared links</p>
                          </div>
                        ) : (
                          contacts.map((contact) => (
                            <div
                              key={contact.id}
                              className="flex items-center justify-between p-4 border rounded-lg bg-white"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                  <UserCircle className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium">{contact.name}</p>
                                    {contact.is_primary && (
                                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                        Primary
                                      </span>
                                    )}
                                  </div>
                                  {contact.title && (
                                    <p className="text-sm text-gray-500">{contact.title}</p>
                                  )}
                                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                    {contact.email && (
                                      <span className="flex items-center gap-1">
                                        <Mail className="h-3 w-3" />
                                        {contact.email}
                                      </span>
                                    )}
                                    {contact.phone && (
                                      <span className="flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        {contact.phone}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openContactDialog(contact)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteContact(contact.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Team Tab */}
              <TabsContent value="team" className="space-y-4 mt-6">
                {!isAdmin(userRole) ? (
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Only administrators can manage team members</p>
                  </div>
                ) : (
                  <div className="space-y-6">
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

            {/* Add/Edit Contact Dialog */}
            <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingContact ? 'Edit Contact' : 'Add Contact Person'}</DialogTitle>
                  <DialogDescription>
                    {editingContact ? 'Update contact information' : 'Add a new contact person to your organization'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Name *</Label>
                    <Input
                      id="contactName"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactTitle">Title / Role</Label>
                    <Input
                      id="contactTitle"
                      value={contactTitle}
                      onChange={(e) => setContactTitle(e.target.value)}
                      placeholder="e.g., Sales Manager, Owner"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Phone</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="contactIsPrimary"
                      checked={contactIsPrimary}
                      onCheckedChange={(checked) => setContactIsPrimary(checked === true)}
                    />
                    <Label htmlFor="contactIsPrimary" className="text-sm font-normal">
                      Primary contact (shown first on shared links)
                    </Label>
                  </div>
                  <Button
                    onClick={handleSaveContact}
                    disabled={isSavingContact || !contactName.trim()}
                    className="w-full"
                  >
                    {isSavingContact ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : editingContact ? (
                      'Update Contact'
                    ) : (
                      'Add Contact'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Profile
