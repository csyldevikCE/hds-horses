import { useEffect, useRef, useState } from 'react'
import * as cornerstone from '@cornerstonejs/core'
import * as cornerstoneTools from '@cornerstonejs/tools'
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader'
import dicomParser from 'dicom-parser'
import { Button } from '@/components/ui/button'
import { Loader2, Maximize2, ZoomIn, Move, Contrast } from 'lucide-react'

const { RenderingEngine, Enums: csEnums } = cornerstone
const {
  ToolGroupManager,
  ZoomTool,
  PanTool,
  WindowLevelTool,
  Enums: ToolEnums
} = cornerstoneTools

interface DicomViewerProps {
  fileUrl: string
  className?: string
}

let cornerstoneInitialized = false

export const DicomViewer = ({ fileUrl, className = '' }: DicomViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [currentTool, setCurrentTool] = useState('Zoom')
  const renderingEngineRef = useRef<any>(null)
  const toolGroupRef = useRef<any>(null)

  const viewportId = 'DICOM_VIEWPORT'
  const renderingEngineId = `renderingEngine-${Math.random().toString(36).substr(2, 9)}`
  const toolGroupId = 'DICOM_TOOL_GROUP'

  // Initialize Cornerstone once globally
  useEffect(() => {
    const initializeCornerstone = async () => {
      if (cornerstoneInitialized) return

      try {
        // Initialize Cornerstone first
        await cornerstone.init()
        cornerstoneTools.init()

        // Configure WADO image loader for DICOM files
        cornerstoneWADOImageLoader.external.cornerstone = cornerstone
        cornerstoneWADOImageLoader.external.dicomParser = dicomParser

        // Configure image loader - disable web workers for Vite compatibility
        cornerstoneWADOImageLoader.configure({
          useWebWorkers: false, // Disabled for Vite/Vercel compatibility
          decodeConfig: {
            convertFloatPixelDataToInt: false,
          },
        })

        // Register custom image loader for regular images (JPEG/PNG)
        cornerstone.imageLoader.registerImageLoader('https', (imageId: string) => {
          const url = imageId
          return {
            promise: new Promise((resolve, reject) => {
              const image = new Image()
              image.crossOrigin = 'anonymous'

              image.onload = () => {
                const canvas = document.createElement('canvas')
                canvas.width = image.width
                canvas.height = image.height
                const context = canvas.getContext('2d')
                if (context) {
                  context.drawImage(image, 0, 0)
                  const imageData = context.getImageData(0, 0, image.width, image.height)

                  resolve({
                    imageId,
                    minPixelValue: 0,
                    maxPixelValue: 255,
                    slope: 1,
                    intercept: 0,
                    windowCenter: 128,
                    windowWidth: 256,
                    rows: image.height,
                    columns: image.width,
                    height: image.height,
                    width: image.width,
                    color: true,
                    rgba: true,
                    columnPixelSpacing: 1,
                    rowPixelSpacing: 1,
                    invert: false,
                    sizeInBytes: imageData.data.length,
                    getPixelData: () => imageData.data,
                  })
                } else {
                  reject(new Error('Could not get canvas context'))
                }
              }

              image.onerror = () => reject(new Error('Failed to load image'))
              image.src = url
            }),
            cancelFn: undefined,
          }
        })

        // Add tools
        cornerstoneTools.addTool(ZoomTool)
        cornerstoneTools.addTool(PanTool)
        cornerstoneTools.addTool(WindowLevelTool)

        cornerstoneInitialized = true
        console.log('Cornerstone initialized successfully')
      } catch (err) {
        console.error('Failed to initialize Cornerstone:', err)
        setError('Failed to initialize DICOM viewer')
        setLoading(false)
      }
    }

    initializeCornerstone()
  }, [])

  // Load and display DICOM
  useEffect(() => {
    if (!viewportRef.current || !cornerstoneInitialized || !fileUrl) return

    const loadDicom = async () => {
      try {
        setLoading(true)
        setError(null)

        // Create rendering engine
        const renderingEngine = new RenderingEngine(renderingEngineId)
        renderingEngineRef.current = renderingEngine

        // Define viewport
        const viewportInput = {
          viewportId,
          type: csEnums.ViewportType.STACK,
          element: viewportRef.current,
        }

        renderingEngine.enableElement(viewportInput)

        // Create tool group
        const toolGroup = ToolGroupManager.createToolGroup(toolGroupId)
        toolGroupRef.current = toolGroup

        if (toolGroup) {
          toolGroup.addTool(ZoomTool.toolName)
          toolGroup.addTool(PanTool.toolName)
          toolGroup.addTool(WindowLevelTool.toolName)

          toolGroup.addViewport(viewportId, renderingEngineId)

          // Set initial tool active
          toolGroup.setToolActive(ZoomTool.toolName, {
            bindings: [{ mouseButton: ToolEnums.MouseBindings.Primary }],
          })
        }

        // Load image - handle both DICOM and regular images
        let imageId: string
        if (fileUrl.endsWith('.dcm') || fileUrl.toLowerCase().includes('dicom')) {
          // DICOM files use wadouri: scheme
          imageId = `wadouri:${fileUrl}`
        } else {
          // Regular images (JPEG/PNG) use their URL directly
          imageId = fileUrl
        }

        console.log('Loading image with ID:', imageId)

        const viewport = renderingEngine.getViewport(viewportId)

        await viewport.setStack([imageId])
        viewport.render()

        setLoading(false)
        setIsReady(true)
        console.log('DICOM loaded successfully')

      } catch (err: any) {
        console.error('Error loading DICOM:', err)
        setError(err.message || 'Failed to load DICOM file')
        setLoading(false)
      }
    }

    loadDicom()

    // Cleanup
    return () => {
      if (renderingEngineRef.current) {
        try {
          renderingEngineRef.current.destroy()
        } catch (e) {
          console.error('Error destroying rendering engine:', e)
        }
      }
      if (toolGroupRef.current) {
        try {
          ToolGroupManager.destroyToolGroup(toolGroupId)
        } catch (e) {
          console.error('Error destroying tool group:', e)
        }
      }
    }
  }, [fileUrl, renderingEngineId, toolGroupId])

  const handleToolChange = (toolName: string) => {
    if (!toolGroupRef.current) return

    try {
      // Deactivate all tools
      toolGroupRef.current.setToolPassive(ZoomTool.toolName)
      toolGroupRef.current.setToolPassive(PanTool.toolName)
      toolGroupRef.current.setToolPassive(WindowLevelTool.toolName)

      // Activate selected tool
      toolGroupRef.current.setToolActive(toolName, {
        bindings: [{ mouseButton: ToolEnums.MouseBindings.Primary }],
      })

      setCurrentTool(toolName)
    } catch (err) {
      console.error('Error changing tool:', err)
    }
  }

  const handleReset = () => {
    if (!renderingEngineRef.current) return

    try {
      const viewport = renderingEngineRef.current.getViewport(viewportId)
      viewport.resetCamera()
      viewport.render()
    } catch (err) {
      console.error('Error resetting viewport:', err)
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Loading state */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-white/5 rounded-lg z-10">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Loading medical image...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-white/5 rounded-lg z-10">
          <div className="text-center text-destructive p-4">
            <p className="font-medium">{error}</p>
            <p className="text-sm mt-1">Please try downloading the file instead</p>
          </div>
        </div>
      )}

      {/* Viewer controls */}
      {isReady && !error && (
        <div className="absolute top-4 right-4 z-20 flex gap-2 bg-background/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
          <Button
            variant={currentTool === ZoomTool.toolName ? 'default' : 'ghost'}
            size="icon"
            onClick={() => handleToolChange(ZoomTool.toolName)}
            title="Zoom (scroll or drag)"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant={currentTool === PanTool.toolName ? 'default' : 'ghost'}
            size="icon"
            onClick={() => handleToolChange(PanTool.toolName)}
            title="Pan (drag to move)"
          >
            <Move className="h-4 w-4" />
          </Button>
          <Button
            variant={currentTool === WindowLevelTool.toolName ? 'default' : 'ghost'}
            size="icon"
            onClick={() => handleToolChange(WindowLevelTool.toolName)}
            title="Window/Level (drag to adjust brightness/contrast)"
          >
            <Contrast className="h-4 w-4" />
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

      {/* Viewport container */}
      <div
        ref={containerRef}
        className="bg-black rounded-lg overflow-hidden"
        style={{ minHeight: '500px', height: '500px' }}
      >
        <div
          ref={viewportRef}
          className="w-full h-full"
          onContextMenu={(e) => e.preventDefault()} // Prevent right-click menu
        />
      </div>

      {/* Instructions */}
      {isReady && !error && (
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium mb-2">Tools:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li><strong>Zoom:</strong> Scroll mouse wheel or drag to zoom in/out</li>
            <li><strong>Pan:</strong> Click and drag to move the image</li>
            <li><strong>Window/Level:</strong> Drag to adjust brightness and contrast</li>
          </ul>
        </div>
      )}
    </div>
  )
}
