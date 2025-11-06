import { useEffect, useRef, useState } from 'react'
import { App as DwvApp } from 'dwv'
import { Button } from '@/components/ui/button'
import { Loader2, Maximize2, Hand, ZoomIn as ZoomInIcon, Activity } from 'lucide-react'

interface DicomViewerProps {
  fileUrl: string
  className?: string
}

export const DicomViewer = ({ fileUrl, className = '' }: DicomViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dwvApp, setDwvApp] = useState<DwvApp | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentTool, setCurrentTool] = useState<string>('ZoomAndPan')

  useEffect(() => {
    if (!containerRef.current) return

    console.log('Initializing DWV app...')

    // Initialize DWV app
    const app = new DwvApp()

    // Configure the app with tools
    try {
      app.init({
        dataViewConfigs: { '*': [{ divId: 'dwv-layer' }] },
        tools: {
          Scroll: {},
          ZoomAndPan: {},
          WindowLevel: {}
        }
      })

      console.log('DWV app initialized')

      // Set default tool to ZoomAndPan after load
      app.addEventListener('load', () => {
        console.log('DWV file loaded, setting up tools...')

        try {
          // Set the tool after load (events are bound automatically in v0.35+)
          app.setTool('ZoomAndPan')
          console.log('Tool set to ZoomAndPan')
          console.log('Events are automatically bound in DWV v0.35+')

          setLoading(false)
          setIsInitialized(true)
        } catch (err) {
          console.error('Error in load handler:', err)
          setError('Failed to initialize viewer controls')
          setLoading(false)
        }
      })

      // Handle load error
      app.addEventListener('error', (event) => {
        console.error('DWV load error:', event)
        setError('Failed to load DICOM file')
        setLoading(false)
      })

      setDwvApp(app)
    } catch (err) {
      console.error('Error initializing DWV:', err)
      setError('Failed to initialize DICOM viewer')
      setLoading(false)
    }

    return () => {
      if (app) {
        app.reset()
      }
    }
  }, [])

  useEffect(() => {
    if (!dwvApp || !fileUrl) return

    setLoading(true)
    setError(null)

    // Load the DICOM file
    dwvApp.loadURLs([fileUrl])
  }, [dwvApp, fileUrl])

  const handleToolChange = (tool: string) => {
    if (dwvApp) {
      dwvApp.setTool(tool)
      setCurrentTool(tool)
    }
  }

  const handleReset = () => {
    if (dwvApp) {
      dwvApp.resetDisplay()
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Loading state */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-white/5 rounded-lg z-10">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Loading DICOM image...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-white/5 rounded-lg z-10">
          <div className="text-center text-destructive">
            <p className="font-medium">{error}</p>
            <p className="text-sm mt-1">Please try downloading the file instead</p>
          </div>
        </div>
      )}

      {/* Viewer controls */}
      {isInitialized && !error && (
        <div className="absolute top-4 right-4 z-20 flex gap-2 bg-background/80 backdrop-blur-sm rounded-lg p-2 shadow-lg">
          <Button
            variant={currentTool === 'ZoomAndPan' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => handleToolChange('ZoomAndPan')}
            title="Zoom & Pan (Mouse wheel + drag)"
          >
            <ZoomInIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={currentTool === 'Scroll' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => handleToolChange('Scroll')}
            title="Scroll through slices"
          >
            <Hand className="h-4 w-4" />
          </Button>
          <Button
            variant={currentTool === 'WindowLevel' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => handleToolChange('WindowLevel')}
            title="Adjust brightness/contrast"
          >
            <Activity className="h-4 w-4" />
          </Button>
          <div className="w-px bg-border" />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            title="Reset View"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* DWV container */}
      <div
        ref={containerRef}
        className="bg-black rounded-lg overflow-hidden"
        style={{ minHeight: '500px', height: '500px' }}
      >
        <div id="dwv-layer" className="w-full h-full" />
      </div>

      {/* Instructions */}
      {isInitialized && !error && (
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium mb-2">Tools:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li><strong>Zoom & Pan:</strong> Mouse wheel to zoom • Click and drag to pan</li>
            <li><strong>Scroll:</strong> Mouse wheel or drag to scroll through image slices</li>
            <li><strong>Window/Level:</strong> Click and drag to adjust brightness and contrast</li>
          </ul>
        </div>
      )}
    </div>
  )
}
