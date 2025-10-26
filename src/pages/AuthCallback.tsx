import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import logo from '@/assets/logo.png'

const AuthCallback = () => {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verifying your email...')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash from the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')

        if (!accessToken) {
          setStatus('error')
          setMessage('Invalid confirmation link. Please try signing up again.')
          setTimeout(() => navigate('/signup'), 3000)
          return
        }

        // Set the session with the tokens
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        })

        if (error) {
          console.error('Session error:', error)
          setStatus('error')
          setMessage('Failed to verify email. Please try again.')
          setTimeout(() => navigate('/login'), 3000)
          return
        }

        if (data.session) {
          setStatus('success')

          if (type === 'signup') {
            setMessage('Email verified successfully! Redirecting to your dashboard...')
            // Wait a moment then redirect to dashboard
            setTimeout(() => navigate('/'), 2000)
          } else {
            setMessage('Authentication successful! Redirecting...')
            setTimeout(() => navigate('/'), 2000)
          }
        } else {
          setStatus('error')
          setMessage('Could not establish session. Please log in.')
          setTimeout(() => navigate('/login'), 3000)
        }
      } catch (err) {
        console.error('Auth callback error:', err)
        setStatus('error')
        setMessage('An unexpected error occurred. Please try logging in.')
        setTimeout(() => navigate('/login'), 3000)
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <img
              src={logo}
              alt="Stable Story Hub Logo"
              className="w-32 h-auto"
            />
          </div>

          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {status === 'loading' && 'Verifying Email'}
              {status === 'success' && 'Email Verified!'}
              {status === 'error' && 'Verification Failed'}
            </CardTitle>
            <CardDescription className="text-center">
              {message}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === 'loading' && (
            <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
          )}
          {status === 'success' && (
            <CheckCircle2 className="h-16 w-16 text-green-600" />
          )}
          {status === 'error' && (
            <XCircle className="h-16 w-16 text-red-600" />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AuthCallback
