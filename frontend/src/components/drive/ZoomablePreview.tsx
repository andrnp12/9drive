import { useState, useRef, type ReactNode, type WheelEvent, type PointerEvent, type TouchEvent } from 'react'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

const MIN_SCALE = 1
const MAX_SCALE = 8

export function ZoomablePreview({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastPointer = useRef({ x: 0, y: 0 })
  const lastPinchDist = useRef<number | null>(null)

  function clamp(s: number, x: number, y: number) {
    if (!containerRef.current) return { x, y }
    const maxX = (containerRef.current.clientWidth * (s - 1)) / 2
    const maxY = (containerRef.current.clientHeight * (s - 1)) / 2
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    }
  }

  function applyScale(next: number, prevX = pos.x, prevY = pos.y) {
    const s = Math.max(MIN_SCALE, Math.min(MAX_SCALE, next))
    const { x, y } = s === 1 ? { x: 0, y: 0 } : clamp(s, prevX, prevY)
    setScale(s)
    setPos({ x, y })
  }

  function handleWheel(e: WheelEvent<HTMLDivElement>) {
    e.preventDefault()
    const factor = e.deltaY > 0 ? 0.85 : 1.15
    applyScale(scale * factor)
  }

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === 'touch' || scale <= 1) return
    setDragging(true)
    lastPointer.current = { x: e.clientX, y: e.clientY }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!dragging || scale <= 1) return
    const dx = e.clientX - lastPointer.current.x
    const dy = e.clientY - lastPointer.current.y
    lastPointer.current = { x: e.clientX, y: e.clientY }
    const { x, y } = clamp(scale, pos.x + dx, pos.y + dy)
    setPos({ x, y })
  }

  function handlePointerUp() {
    setDragging(false)
  }

  function handleDoubleClick() {
    scale > 1 ? applyScale(1) : applyScale(2.5)
  }

  function handleTouchMove(e: TouchEvent<HTMLDivElement>) {
    if (e.touches.length !== 2) return
    e.preventDefault()
    const t1 = e.touches[0]!
    const t2 = e.touches[1]!
    const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
    if (lastPinchDist.current !== null) {
      applyScale(scale * (dist / lastPinchDist.current))
    }
    lastPinchDist.current = dist
  }

  function handleTouchEnd() {
    lastPinchDist.current = null
  }

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      {/* Zoom controls */}
      <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-slate-200 bg-white/90 px-2 py-1 shadow-md backdrop-blur-sm">
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => applyScale(scale / 1.5)} disabled={scale <= MIN_SCALE} aria-label="Zoom out">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="min-w-[3.5rem] text-center text-xs font-semibold text-slate-600">
          {Math.round(scale * 100)}%
        </span>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => applyScale(scale * 1.5)} disabled={scale >= MAX_SCALE} aria-label="Zoom in">
          <ZoomIn className="h-4 w-4" />
        </Button>
        {scale > 1 && (
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => applyScale(1)} aria-label="Reset zoom">
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className={`flex h-full w-full items-center justify-center ${scale > 1 ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'}`}
        style={{ touchAction: 'none' }}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex h-full w-full items-center justify-center"
          style={{
            transform: `scale(${scale}) translate(${pos.x / scale}px, ${pos.y / scale}px)`,
            transformOrigin: 'center center',
            transition: dragging ? 'none' : 'transform 0.12s ease-out',
            willChange: 'transform',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
