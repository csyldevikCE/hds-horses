import { useEffect, useRef, useState, useMemo } from 'react'
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
  format?: 'dicom' | 'jpeg' | 'png'
  className?: string
}

// Global flag to ensure Cornerstone is only initialized once
let cornerstoneInitPromise: Promise<void> | null = null

export const DicomViewer = ({ fileUrl, format = 'dicom', className = '' }: DicomViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [currentTool, setCurrentTool] = useState('Zoom')
  const [cornerstoneReady, setCornerstoneReady] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderingEngineRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toolGroupRef = useRef<any>(null)

  // Use useMemo to ensure these IDs are only created once per component instance
  const viewportId = useMemo(() => `DICOM_VIEWPORT_${Math.random().toString(36).substr(2, 9)}`, [])
  const renderingEngineId = useMemo(() => `renderingEngine-${Math.random().toString(36).substr(2, 9)}`, [])
  const toolGroupId = useMemo(() => `DICOM_TOOL_GROUP_${Math.random().toString(36).substr(2, 9)}`, [])

  // Initialize Cornerstone once globally
  useEffect(() => {
    const initializeCornerstone = async () => {
      // If already initialized or initializing, wait for it
      if (cornerstoneInitPromise) {
        await cornerstoneInitPromise
        setCornerstoneReady(true)
        console.log('Cornerstone already initialized, ready to use')
        return
      }

      // Create initialization promise
      cornerstoneInitPromise = (async () => {
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
            beforeSend: (xhr: XMLHttpRequest) => {
              // Don't send credentials for signed URLs
              xhr.withCredentials = false
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

                    const cornerstoneImage = {
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
                      getCanvas: () => canvas,
                      voiLUTFunction: 'LINEAR',
                      numberOfComponents: 4,
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      dataType: 'Uint8Array' as any,
                    }

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    resolve(cornerstoneImage as any)
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

          console.log('Cornerstone initialized successfully')
        } catch (err) {
          console.error('Failed to initialize Cornerstone:', err)
          setError('Failed to initialize DICOM viewer')
          setLoading(false)
          throw err
        }
      })()

      // Wait for initialization to complete
      await cornerstoneInitPromise
      setCornerstoneReady(true)
    }

    initializeCornerstone()
  }, [])

  // Load and display DICOM
  useEffect(() => {
    console.log('DicomViewer useEffect triggered')
    console.log('viewportRef.current:', !!viewportRef.current)
    console.log('cornerstoneReady:', cornerstoneReady)
    console.log('fileUrl:', fileUrl)
    console.log('format:', format)

    if (!viewportRef.current || !cornerstoneReady || !fileUrl) {
      console.log('Early return - conditions not met')
      if (!fileUrl) console.error('fileUrl is missing!')
      if (!cornerstoneReady) console.log('Waiting for Cornerstone to initialize...')
      return
    }

    let isMounted = true

    const loadDicom = async () => {
      console.log('loadDicom function started')
      try {
        setLoading(true)
        setError(null)

        // Cleanup any existing rendering engine first
        if (renderingEngineRef.current) {
          try {
            renderingEngineRef.current.destroy()
            renderingEngineRef.current = null
          } catch (e) {
            console.warn('Error destroying previous rendering engine:', e)
          }
        }

        // Cleanup any existing tool group first
        if (toolGroupRef.current) {
          try {
            ToolGroupManager.destroyToolGroup(toolGroupId)
            toolGroupRef.current = null
          } catch (e) {
            console.warn('Error destroying previous tool group:', e)
          }
        }

        if (!isMounted) return

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
        if (format === 'dicom') {
          // DICOM files use wadouri: scheme
          imageId = `wadouri:${fileUrl}`
          console.log('Loading DICOM file with wadouri scheme')
        } else {
          // Regular images (JPEG/PNG) use their URL directly
          imageId = fileUrl
          console.log('Loading regular image (JPEG/PNG)')
        }

        console.log('Loading image with ID:', imageId)
        console.log('Image format:', format)
        console.log('File URL:', fileUrl)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const viewport = renderingEngine.getViewport(viewportId) as any

        try {
          await viewport.setStack([imageId], 0)
        } catch (stackErr) {
          const message = stackErr instanceof Error ? stackErr.message : 'Unknown error'
          throw new Error(`Failed to load image: ${message}`)
        }

        if (!isMounted) return

        try {
          viewport.render()
        } catch (renderErr) {
          const message = renderErr instanceof Error ? renderErr.message : 'Unknown error'
          throw new Error(`Failed to render image: ${message}`)
        }

        setLoading(false)
        setIsReady(true)

      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Failed to load DICOM file'
          setError(message)
          setLoading(false)
        }
      }
    }

    loadDicom()

    // Cleanup
    return () => {
      isMounted = false
      setIsReady(false)

      if (renderingEngineRef.current) {
        try {
          renderingEngineRef.current.destroy()
          renderingEngineRef.current = null
        } catch (e) {
          console.warn('Error destroying rendering engine:', e)
        }
      }
      if (toolGroupRef.current) {
        try {
          ToolGroupManager.destroyToolGroup(toolGroupId)
          toolGroupRef.current = null
        } catch (e) {
          console.warn('Error destroying tool group:', e)
        }
      }
    }
  }, [fileUrl, format, renderingEngineId, toolGroupId, viewportId, cornerstoneReady])

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
