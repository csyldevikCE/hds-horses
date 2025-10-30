import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  getInvitationByToken,
  isInvitationValid,
  acceptInvitation,
  Invitation,
} from '@/services/invitationService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    const loadInvitation = async () => {
      if (!token) {
        setError('Invalid invitation link - no token provided');
        setLoading(false);
        return;
      }

      try {
        const inv = await getInvitationByToken(token);

        if (!inv) {
          setError('This invitation link is invalid or has been cancelled');
          setLoading(false);
          return;
        }

        if (!isInvitationValid(inv)) {
          if (inv.used_at) {
            setError('This invitation has already been used');
          } else {
            setError('This invitation has expired');
          }
          setLoading(false);
          return;
        }

        setInvitation(inv);
      } catch (err) {
        setError('Failed to load invitation details');
        console.error('Error loading invitation:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInvitation();
  }, [token]);

  const handleAccept = async () => {
    if (!token || !user) return;

    setAccepting(true);
    setError(null);

    try {
      const result = await acceptInvitation(token, user.id);

      if (!result.success) {
        setError(result.error || 'Failed to accept invitation');
        setAccepting(false);
        return;
      }

      setSuccess(true);
      toast({
        title: 'Invitation accepted!',
        description: 'You have successfully joined the organization.',
      });

      // Redirect to home page after 2 seconds
      setTimeout(() => {
        navigate('/');
        window.location.reload(); // Reload to refresh organization context
      }, 2000);
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error accepting invitation:', err);
      setAccepting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="h-6 w-6 text-destructive" />
              <CardTitle>Invalid Invitation</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => navigate('/login')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <CardTitle>Success!</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You have successfully joined the organization. Redirecting...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  // User is not logged in - show sign up/login options
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-6 w-6 text-primary" />
              <CardTitle>Organization Invitation</CardTitle>
            </div>
            <CardDescription>
              You've been invited to join an organization as a {invitation.role}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <p className="font-medium">Invitation Details:</p>
              <p className="text-sm text-muted-foreground">Email: {invitation.email}</p>
              <p className="text-sm text-muted-foreground">Role: {invitation.role}</p>
              <p className="text-sm text-muted-foreground">
                Expires: {new Date(invitation.expires_at).toLocaleDateString()}
              </p>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You need to sign in or create an account with the email{' '}
                <strong>{invitation.email}</strong> to accept this invitation.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Button
                onClick={() => navigate(`/signup?invitation=${token}&email=${invitation.email}`)}
                className="w-full"
              >
                Create Account
              </Button>
              <Button
                onClick={() => navigate(`/login?invitation=${token}`)}
                variant="outline"
                className="w-full"
              >
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is logged in but with different email
  if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
              <CardTitle>Wrong Account</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                This invitation was sent to <strong>{invitation.email}</strong>, but you're currently
                signed in as <strong>{user.email}</strong>.
              </AlertDescription>
            </Alert>

            <p className="text-sm text-muted-foreground">
              Please sign out and sign in with the correct email address to accept this invitation.
            </p>

            <div className="space-y-2">
              <Button onClick={handleSignOut} className="w-full">
                Sign Out
              </Button>
              <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is logged in with correct email - show accept button
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            <CardTitle>Accept Invitation</CardTitle>
          </div>
          <CardDescription>
            You've been invited to join an organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p className="font-medium">Invitation Details:</p>
            <p className="text-sm text-muted-foreground">Role: {invitation.role}</p>
            <p className="text-sm text-muted-foreground">
              Expires: {new Date(invitation.expires_at).toLocaleDateString()}
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full"
            >
              {accepting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                'Accept Invitation'
              )}
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              disabled={accepting}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
