import { Link, useLocation } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, CheckCircle, ArrowRight } from 'lucide-react'
import logo from '@/assets/logo.png'

const ConfirmEmail = () => {
  const location = useLocation()
  const email = location.state?.email || 'your email'
  const isInvite = location.state?.isInvite || false

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          {/* Logo */}
          <div className="flex justify-center">
            <img
              src={logo}
              alt="HDS Horses Logo"
              className="w-32 h-auto"
            />
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
            <CardDescription className="mt-2">
              {isInvite
                ? 'We sent you a confirmation link to complete your account setup'
                : 'We sent you a confirmation link to verify your account'
              }
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-blue-900">
                    Confirmation email sent to:
                  </p>
                  <p className="text-blue-700 font-mono">
                    {email}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-sm text-gray-600">
              <p className="font-medium text-gray-900">What's next?</p>
              <ol className="space-y-2 list-decimal list-inside">
                <li>Check your inbox for an email from <span className="font-medium">HDS Horses</span></li>
                <li>Click the confirmation link in the email</li>
                <li>You'll be redirected back here to sign in</li>
              </ol>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500 text-center">
                Didn't receive the email? Check your spam folder or{' '}
                <Link to="/signup" className="text-blue-600 hover:text-blue-800 hover:underline">
                  try signing up again
                </Link>
              </p>
            </div>
          </div>

          <Link to="/login" className="block">
            <Button className="w-full gap-2">
              Continue to Sign In
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

export default ConfirmEmail
