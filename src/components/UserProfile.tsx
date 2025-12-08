import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, User, Settings } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ProfileDialog } from '@/components/ProfileDialog'
import { supabase } from '@/lib/supabase'

const UserProfile = () => {
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<{ first_name: string | null; last_name: string | null } | null>(null)

  // Load user profile
  const loadProfile = useCallback(async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single()

      if (!error && data) {
        setProfile(data)
      }
    } catch {
      // Silently fail - will use email fallback
    }
  }, [user?.id])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  // Refresh profile when it's updated
  useEffect(() => {
    const handleProfileUpdate = () => {
      loadProfile()
    }

    window.addEventListener('profile-updated', handleProfileUpdate)
    return () => window.removeEventListener('profile-updated', handleProfileUpdate)
  }, [loadProfile])

  const handleSignOut = async () => {
    try {
      await signOut()
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getInitials = () => {
    // Try to use first name and last name
    if (profile?.first_name && profile?.last_name) {
      return (profile.first_name.charAt(0) + profile.last_name.charAt(0)).toUpperCase()
    }

    // Try first name only
    if (profile?.first_name) {
      return profile.first_name.substring(0, 2).toUpperCase()
    }

    // Try last name only
    if (profile?.last_name) {
      return profile.last_name.substring(0, 2).toUpperCase()
    }

    // Fallback to email
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase()
    }

    return 'U'
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {profile?.first_name && profile?.last_name
                  ? `${profile.first_name} ${profile.last_name}`
                  : user?.email}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <ProfileDialog>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
          </ProfileDialog>
          <ProfileDialog>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
          </ProfileDialog>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

export default UserProfile 