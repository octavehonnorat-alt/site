import { useEffect, useMemo, useRef, useState } from 'react'

// Layer 1 (Deepest Background): Space Revealed
const STARFIELD_BG =
  'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=2070&auto=format&fit=cover'

// Layer 2 (Middle Layer): Independent Sliding Doors
const DOOR_LEFT =
  'https://drive.google.com/file/d/1wGfl0hbrob7XVL9mNyyPxaplnFsQQwYf/view?usp=drivesdk'
const DOOR_RIGHT =
  'https://drive.google.com/file/d/1MGTiapVf5HtR1vnwUeg4eBTPNsSJvWPj/view?usp=drivesdk'

// Layer 3 (Foreground Wall): Fixed Elevator Frame (PNG with transparent door cutout)
const ELEVATOR_FRAME =
  'https://drive.google.com/file/d/1VadTtbMIgo3sVyRmv__XY4kjLB3Bxnxd/view?usp=drivesdk'

// Rotoscoped Floor Indicator Videos
const VIDEO_FLOOR_1_TO_2 =
  'https://drive.google.com/file/d/1Ez7AoXND5hhEuy34Or_b0oGGVh7W-ICo/view?usp=drivesdk'
const VIDEO_FLOOR_2_TO_3 =
  'https://drive.google.com/file/d/1iPnJVulUmExGIJIZu-2R9OwjvQy7xihc/view?usp=drivesdk'

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function driveDirectUrl(url: string) {
  // Developer Note: Google Drive "file/d/ID/view" links often need conversion for native <img>/<video> sources.
  // This converts them into a direct download/stream URL that tends to work better with native elements.
  const match = url.match(/\/file\/d\/([^/]+)\//)
  if (!match) return url
  const id = match[1]
  return `https://drive.google.com/uc?export=download&id=${id}`
}

function App() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const video12Ref = useRef<HTMLVideoElement | null>(null)
  const video23Ref = useRef<HTMLVideoElement | null>(null)

  const [progress, setProgress] = useState(0)
  const [parallax, setParallax] = useState({ x: 0, y: 0 })

  const isFinePointer = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia?.('(pointer:fine)').matches ?? false
  }, [])

  useEffect(() => {
    const update = () => {
      const el = containerRef.current
      if (!el) return
      const maxScroll = Math.max(1, el.scrollHeight - window.innerHeight)
      setProgress(clamp01(window.scrollY / maxScroll))
    }

    let raf = 0
    const onScrollOrResize = () => {
      cancelAnimationFrame(raf)
      raf = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [])

  useEffect(() => {
    if (!isFinePointer) return

    const state = {
      x: 0,
      y: 0,
      tx: 0,
      ty: 0,
    }

    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1
      const ny = (e.clientY / window.innerHeight) * 2 - 1
      state.tx = Math.max(-1, Math.min(1, nx))
      state.ty = Math.max(-1, Math.min(1, ny))
    }

    const LERP = 0.07
    let raf = 0
    const tick = () => {
      state.x += (state.tx - state.x) * LERP
      state.y += (state.ty - state.y) * LERP
      setParallax({ x: state.x, y: state.y })
      raf = window.requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    raf = window.requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [isFinePointer])

  useEffect(() => {
    const v12 = video12Ref.current
    const v23 = video23Ref.current
    if (!v12 || !v23) return

    const scrub = (video: HTMLVideoElement, t: number) => {
      const duration = video.duration
      if (!Number.isFinite(duration) || duration <= 0) return
      try {
        video.currentTime = clamp01(t) * duration
      } catch {
        // Some browsers throw if metadata isn't fully ready; safe to ignore.
      }
    }

    if (progress <= 0.17) {
      v23.pause()
      scrub(v12, progress / 0.17)
    } else if (progress <= 0.35) {
      v12.pause()
      scrub(v23, (progress - 0.17) / (0.35 - 0.17))
    } else {
      v12.pause()
      v23.pause()
    }
  }, [progress])

  const doorOpenT = clamp01((progress - 0.35) / (0.65 - 0.35))
  const doorsT = progress < 0.35 ? 0 : progress < 0.65 ? doorOpenT : 1

  const exitT = clamp01((progress - 0.65) / (1 - 0.65))
  const elevatorScale = progress < 0.65 ? 1 : lerp(1, 2.5, exitT)
  const elevatorOpacity =
    progress < 0.65 ? 1 : 1 - clamp01((progress - 0.65) / (0.75 - 0.65))

  const titleOpacity = clamp01((progress - 0.65) / (0.85 - 0.65))

  const cabinSwayMag = progress < 0.35 ? 4 : 0
  const cabinX = parallax.x * cabinSwayMag
  const cabinY = parallax.y * cabinSwayMag

  const bgMag = progress < 0.35 ? 0 : 16
  const bgX = -parallax.x * bgMag
  const bgY = -parallax.y * (bgMag * 0.75)

  const titleX = -parallax.x * (bgMag * 0.55)
  const titleY = -parallax.y * (bgMag * 0.45)

  const frameSrc = driveDirectUrl(ELEVATOR_FRAME)
  const leftDoorSrc = driveDirectUrl(DOOR_LEFT)
  const rightDoorSrc = driveDirectUrl(DOOR_RIGHT)
  const video12Src = driveDirectUrl(VIDEO_FLOOR_1_TO_2)
  const video23Src = driveDirectUrl(VIDEO_FLOOR_2_TO_3)

  const showVideos = progress < 0.35
  const showV12 = progress <= 0.17
  const showV23 = progress > 0.17 && progress <= 0.35

  const elevatorTransform = `translate3d(${cabinX}px, ${cabinY}px, 0) scale(${elevatorScale})`

  return (
    <div ref={containerRef} className="relative h-[450vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Layer 1: Starfield + Slogan */}
        <div className="absolute inset-0 z-[5]">
          <img
            src={STARFIELD_BG}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              transform: `translate3d(${bgX}px, ${bgY}px, 0)`,
            }}
            draggable={false}
          />

          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="px-6 text-center"
              style={{
                opacity: titleOpacity,
                transform: `translate3d(${titleX}px, ${titleY}px, 0)`,
              }}
            >
              <h1
                className="select-none leading-[1.05] tracking-[0.08em] text-white"
                style={{
                  fontFamily: '"Viaoda Libre", serif',
                  fontSize: 'clamp(34px, 6vw, 76px)',
                  textShadow: '0 0 25px rgba(255,255,255,0.45)',
                }}
              >
                On a eu une idée.
              </h1>
              <p
                className="mx-auto mt-3 max-w-[46ch] select-none text-[13px] tracking-[0.16em] text-white/70 xl:text-[14px]"
                style={{ fontFamily: '"Imprima", sans-serif' }}
              >
                Scroll to ascend. Let the cabin open. Step into the vacuum.
              </p>
            </div>
          </div>
        </div>

        {/* Layer 2: Sliding doors */}
        <div
          className="absolute inset-0 z-[10] pointer-events-none"
          style={{
            opacity: elevatorOpacity,
            transform: elevatorTransform,
            transformOrigin: '50% 50%',
            willChange: 'transform, opacity',
          }}
        >
          <img
            src={leftDoorSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-contain"
            style={{
              transform: `translate3d(${-100 * doorsT}%, 0, 0)`,
              willChange: 'transform',
            }}
            draggable={false}
          />
          <img
            src={rightDoorSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-contain"
            style={{
              transform: `translate3d(${100 * doorsT}%, 0, 0)`,
              willChange: 'transform',
            }}
            draggable={false}
          />
        </div>

        {/* Layer 3: Elevator frame + overhead screen */}
        <div
          className="absolute inset-0 z-[15] pointer-events-none"
          style={{
            opacity: elevatorOpacity,
            transform: elevatorTransform,
            transformOrigin: '50% 50%',
            willChange: 'transform, opacity',
          }}
        >
          <img
            src={frameSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-contain"
            draggable={false}
          />

          {/* Overhead digital display (mapped via percentages over the frame image) */}
          <div
            className="absolute overflow-hidden rounded-[10px] border border-amber-200/20 bg-black/70"
            style={{
              left: '50%',
              top: '8.6%',
              width: '22%',
              height: '10.8%',
              transform: 'translateX(-50%)',
              boxShadow: '0 0 22px rgba(245,158,11,0.25)',
            }}
          >
            {showVideos ? (
              <>
                <video
                  ref={video12Ref}
                  className="absolute inset-0 h-full w-full object-cover"
                  src={video12Src}
                  preload="auto"
                  muted
                  playsInline
                  onLoadedMetadata={() => {
                    // Force a scrub once duration becomes known
                    const v = video12Ref.current
                    if (v && Number.isFinite(v.duration) && v.duration > 0) {
                      try {
                        v.currentTime = 0
                      } catch {
                        // ignore
                      }
                    }
                  }}
                  style={{ opacity: showV12 ? 1 : 0 }}
                />
                <video
                  ref={video23Ref}
                  className="absolute inset-0 h-full w-full object-cover"
                  src={video23Src}
                  preload="auto"
                  muted
                  playsInline
                  onLoadedMetadata={() => {
                    const v = video23Ref.current
                    if (v && Number.isFinite(v.duration) && v.duration > 0) {
                      try {
                        v.currentTime = 0
                      } catch {
                        // ignore
                      }
                    }
                  }}
                  style={{ opacity: showV23 ? 1 : 0 }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-amber-500/5" />
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="select-none text-center"
                  style={{
                    filter: 'drop-shadow(0 0 18px rgba(245,158,11,0.55))',
                  }}
                >
                  <div
                    className="leading-none text-amber-300"
                    style={{
                      fontFamily: '"Imprima", sans-serif',
                      fontSize: 'clamp(18px, 2.2vw, 30px)',
                      letterSpacing: '0.18em',
                    }}
                  >
                    3
                  </div>
                  <div className="mt-1 text-[10px] tracking-[0.28em] text-amber-200/70">
                    FLOOR
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/15 via-transparent to-amber-500/5" />
              </div>
            )}
          </div>
        </div>

        {/* Subtle vignette for immersion */}
        <div
          className="absolute inset-0 z-[30]"
          style={{
            background:
              'radial-gradient(1200px 700px at 50% 45%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.7) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  )
}

export default App
