import { useEffect, useRef, useState } from 'react'
import { App as DwvApp } from 'dwv'
import { Button } from '@/components/ui/button'
import { Loader2, ZoomIn, ZoomOut, RotateCw, Maximize2 } from 'lucide-react'

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

  useEffect(() => {
    if (!containerRef.current) return

    // Initialize DWV app
    const app = new DwvApp()

    // Configure the app
    app.init({
      dataViewConfigs: { '*': [{ divId: 'dwv' }] },
      tools: {
        Scroll: {},
        ZoomAndPan: {},
        WindowLevel: {},
        Draw: {}
      }
    })

    // Handle load end
    app.addEventListener('load', () => {
      setLoading(false)
      setIsInitialized(true)
    })

    // Handle load error
    app.addEventListener('error', (event) => {
      console.error('DWV load error:', event)
      setError('Failed to load DICOM file')
      setLoading(false)
    })

    setDwvApp(app)

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

  const handleZoomIn = () => {
    if (dwvApp) {
      const viewLayer = dwvApp.getActiveLayerGroup()?.getActiveViewLayer()
      if (viewLayer) {
        const currentZoom = viewLayer.getViewController().getCurrentScrollPosition()
        // DWV zoom implementation
      }
    }
  }

  const handleZoomOut = () => {
    if (dwvApp) {
      const viewLayer = dwvApp.getActiveLayerGroup()?.getActiveViewLayer()
      if (viewLayer) {
        // DWV zoom out implementation
      }
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
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleZoomIn}
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={handleZoomOut}
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
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
        id="dwv"
        className="bg-black/90 rounded-lg overflow-hidden"
        style={{ minHeight: '400px' }}
      >
        <canvas className="w-full h-full" />
      </div>

      {/* Instructions */}
      {isInitialized && !error && (
        <div className="mt-4 text-xs text-muted-foreground text-center">
          <p>Use mouse wheel to scroll through slices • Click and drag to pan • Right-click and drag to adjust window/level</p>
        </div>
      )}
    </div>
  )
}
