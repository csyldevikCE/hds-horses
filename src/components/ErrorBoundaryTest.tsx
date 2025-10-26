import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorBoundary } from './ErrorBoundary'
import { ErrorFallback } from './ErrorFallback'

/**
 * Test component for Error Boundaries
 * Use this to verify error boundaries are working correctly
 *
 * Usage:
 * 1. Import this component in a route
 * 2. Click "Throw Error" to trigger error boundary
 * 3. Verify fallback UI appears
 * 4. Click "Try Again" to reset
 *
 * To use: Add route in App.tsx (dev only):
 * <Route path="/test-error" element={<ErrorBoundaryTest />} />
 */

const BrokenComponent = ({ shouldBreak }: { shouldBreak: boolean }) => {
  if (shouldBreak) {
    throw new Error('This is a test error to verify Error Boundary is working!')
  }
  return <p className="text-green-600">Component is working correctly!</p>
}

export const ErrorBoundaryTest = () => {
  const [breakComponent, setBreakComponent] = useState(false)

  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Error Boundary Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            This page tests whether Error Boundaries are catching errors properly.
          </p>

          <ErrorBoundary
            fallback={
              <ErrorFallback
                title="Test Error Caught!"
                message="The error boundary is working correctly. This error was intentionally triggered."
                minimal
              />
            }
          >
            <div className="p-4 border rounded-lg">
              <p className="text-sm font-medium mb-2">Component Status:</p>
              <BrokenComponent shouldBreak={breakComponent} />
            </div>
          </ErrorBoundary>

          <div className="flex gap-2">
            <Button
              onClick={() => setBreakComponent(true)}
              variant="destructive"
            >
              Throw Error
            </Button>
            <Button
              onClick={() => setBreakComponent(false)}
              variant="outline"
            >
              Reset
            </Button>
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <p className="font-semibold text-blue-900">What should happen:</p>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-blue-800">
              <li>Click "Throw Error" button</li>
              <li>Component should crash and error boundary catches it</li>
              <li>Fallback UI (error message) should appear</li>
              <li>Click "Reset" to restore normal state</li>
              <li>If this works, error boundaries are properly configured!</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
