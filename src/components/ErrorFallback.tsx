import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useNavigate } from 'react-router-dom'

interface ErrorFallbackProps {
  error?: Error | null
  resetError?: () => void
  title?: string
  message?: string
  showHomeButton?: boolean
  minimal?: boolean
}

/**
 * Reusable error fallback UI component
 * Can be used as a custom fallback for ErrorBoundary or as a standalone error display
 */
export const ErrorFallback = ({
  error,
  resetError,
  title = 'Something went wrong',
  message = 'We encountered an unexpected error. Please try again.',
  showHomeButton = true,
  minimal = false,
}: ErrorFallbackProps) => {
  const navigate = useNavigate()

  if (minimal) {
    // Minimal inline error display
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
        {resetError && (
          <Button
            onClick={resetError}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            Try Again
          </Button>
        )}
      </Alert>
    )
  }

  // Full-page error display
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mb-4">
          <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600 mb-6">{message}</p>

        {error && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 font-medium">
              Show technical details
            </summary>
            <div className="mt-2 text-xs bg-gray-100 p-3 rounded border border-gray-200">
              <p className="font-semibold text-red-600 mb-1">{error.name}</p>
              <p className="text-gray-700 mb-2">{error.message}</p>
              {error.stack && (
                <pre className="text-gray-600 overflow-x-auto whitespace-pre-wrap">
                  {error.stack}
                </pre>
              )}
            </div>
          </details>
        )}

        <div className="flex flex-col gap-3">
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>

            {resetError && (
              <Button onClick={resetError} variant="outline" className="flex-1">
                Try Again
              </Button>
            )}
          </div>

          {showHomeButton && (
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Home
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
