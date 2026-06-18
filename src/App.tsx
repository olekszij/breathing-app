import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { GiLips, GiNoseSide } from 'react-icons/gi'

type AppView = 'MENU' | 'BREATHING' | 'EYE_GYM'
type EyeGymMode = 'ACCOMMODATION' | 'PURSUIT' | 'SACCADES' | 'CONVERGENCE'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform?: string }>
}

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void
  msRequestFullscreen?: () => Promise<void> | void
}

type FullscreenDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void
  msExitFullscreen?: () => Promise<void> | void
}

type Phase = {
  name: string
  hint: string
  color: string
  dotClass: string
  icon: ReactNode
}

type ExerciseBase = {
  title: string
  subtitle: string
  desc: string
  color: string
  soft: string
  icon: ReactNode
}

type BreathingExercise = ExerciseBase & {
  id: 'BREATHING'
  type: 'BREATHING'
}

type EyeExercise = ExerciseBase & {
  id: EyeGymMode
  type: 'EYE_GYM'
}

type Exercise = BreathingExercise | EyeExercise

const PHASES: Phase[] = [
  {
    name: 'Inhale',
    hint: 'Inhale through nose',
    color: 'var(--color-inhale)',
    dotClass: 'bg-inhale',
    icon: <GiNoseSide className="h-24 w-24" aria-hidden="true" />,
  },
  {
    name: 'Hold',
    hint: 'Stay easy',
    color: 'var(--color-hold)',
    dotClass: 'bg-hold',
    icon: (
      <svg viewBox="0 0 96 96" className="h-24 w-24 fill-none stroke-current" strokeWidth="5" strokeLinecap="round" aria-hidden="true">
        <path d="M36 24v48" />
        <path d="M60 24v48" />
      </svg>
    ),
  },
  {
    name: 'Exhale',
    hint: 'Exhale through mouth',
    color: 'var(--color-exhale)',
    dotClass: 'bg-exhale',
    icon: <GiLips className="h-24 w-24" aria-hidden="true" />,
  },
  {
    name: 'Hold',
    hint: 'Rest empty',
    color: 'var(--color-hold)',
    dotClass: 'bg-hold',
    icon: (
      <svg viewBox="0 0 96 96" className="h-24 w-24 fill-none stroke-current" strokeWidth="5" strokeLinecap="round" aria-hidden="true">
        <path d="M36 24v48" />
        <path d="M60 24v48" />
      </svg>
    ),
  },
]

const EXERCISES: Exercise[] = [
  {
    id: 'BREATHING',
    type: 'BREATHING',
    title: 'Square Breath',
    subtitle: 'CO2 tolerance',
    desc: 'A quiet 4-4-4-4 breathing loop for settling the nervous system.',
    color: 'text-primary',
    soft: 'bg-primary/10',
    icon: <div className="h-7 w-7 rounded-lg border-2 border-current" aria-hidden="true" />,
  },
  {
    id: 'ACCOMMODATION',
    type: 'EYE_GYM',
    title: 'Accommodation',
    subtitle: 'Dynamic focus',
    desc: 'Follow one point as it gently changes size to train focus control.',
    color: 'text-inhale',
    soft: 'bg-inhale/10',
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" aria-hidden="true">
        <path d="M12 5C7 5 3.1 7.8 1.5 12 3.1 16.2 7 19 12 19s8.9-2.8 10.5-7C20.9 7.8 17 5 12 5zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0-2.3a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4z" />
      </svg>
    ),
  },
  {
    id: 'PURSUIT',
    type: 'EYE_GYM',
    title: 'Smoothing',
    subtitle: 'Infinity tracking',
    desc: 'Track a smooth infinity path for coordinated eye movement.',
    color: 'text-exhale',
    soft: 'bg-exhale/10',
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" aria-hidden="true">
        <path d="M8.2 8.2c1.3 0 2.5.7 3.8 1.9 1.3-1.2 2.5-1.9 3.8-1.9 2.5 0 4.2 1.8 4.2 3.8s-1.7 3.8-4.2 3.8c-1.3 0-2.5-.7-3.8-1.9-1.3 1.2-2.5 1.9-3.8 1.9C5.7 15.8 4 14 4 12s1.7-3.8 4.2-3.8zm0 2C6.9 10.2 6 11 6 12s.9 1.8 2.2 1.8c.8 0 1.6-.4 2.6-1.2-1-.9-1.8-2.4-2.6-2.4zm7.6 0c-.8 0-1.6.4-2.6 1.2 1 .8 1.8 2.4 2.6 2.4 1.3 0 2.2-.8 2.2-1.8s-.9-1.8-2.2-1.8z" />
      </svg>
    ),
  },
  {
    id: 'SACCADES',
    type: 'EYE_GYM',
    title: 'Saccades',
    subtitle: 'Rapid jump',
    desc: 'Move between clear targets with a short, controlled glide.',
    color: 'text-hold',
    soft: 'bg-hold/10',
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" aria-hidden="true">
        <path d="M5 5h7v2H8.4l4.3 4.3-1.4 1.4L7 8.4V12H5V5zm14 14h-7v-2h3.6l-4.3-4.3 1.4-1.4 4.3 4.3V12h2v7z" />
      </svg>
    ),
  },
  {
    id: 'CONVERGENCE',
    type: 'EYE_GYM',
    title: 'Bilateral',
    subtitle: 'Vergence training',
    desc: 'Focus as two points separate and return with an eased rhythm.',
    color: 'text-primary',
    soft: 'bg-primary/10',
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" aria-hidden="true">
        <path d="M8 4 4 8l4 4V9h8v3l4-4-4-4v3H8V4zm8 16 4-4-4-4v3H8v-3l-4 4 4 4v-3h8v3z" />
      </svg>
    ),
  },
]

const formatTime = (seconds: number) => (
  `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`
)

const smootherStep = (value: number) => {
  const clamped = Math.min(1, Math.max(0, value))
  return clamped * clamped * clamped * (clamped * (clamped * 6 - 15) + 10)
}
const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3)
const lerp = (start: number, end: number, amount: number) => start + (end - start) * amount

const getStoredGridPreference = () => {
  try {
    return localStorage.getItem('showGrid') === 'true'
  } catch {
    return false
  }
}

const isAppleMobile = () => {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window)
}

function App() {
  const [activeView, setActiveView] = useState<AppView>('MENU')
  const [isActive, setIsActive] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS] = useState(isAppleMobile)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showLandscapeHint, setShowLandscapeHint] = useState(true)
  const [showGrid, setShowGrid] = useState(getStoredGridPreference)
  const [speed, setSpeed] = useState(1)
  const [sessionTime, setSessionTime] = useState(120)
  const [eyeGymMode, setEyeGymMode] = useState<EyeGymMode>('ACCOMMODATION')

  const currentPhaseIndexRef = useRef(0)
  const lastTimeRef = useRef<number>(0)
  const elapsedRef = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const secondDotRef = useRef<HTMLDivElement>(null)
  const breathPathRef = useRef<SVGPathElement>(null)
  const breathPointRef = useRef<{ x: number; y: number } | null>(null)
  const containerSizeRef = useRef({ width: 0, height: 0 })
  const speedRef = useRef(speed)
  const saccadeTimerRef = useRef(0)
  const saccadeFromRef = useRef({ x: 0, y: 0 })
  const saccadeTargetRef = useRef({ x: 0, y: 0 })
  const saccadeCurrentRef = useRef({ x: 0, y: 0 })
  const saccadeTravelRef = useRef(1)

  const currentPhase = PHASES[currentPhaseIndex] || PHASES[0]
  const currentExercise = EXERCISES.find((exercise) => exercise.id === eyeGymMode)
  const appStyle = {
    '--phase-color': currentPhase.color,
  } as CSSProperties & Record<'--phase-color', string>

  useEffect(() => {
    localStorage.setItem('showGrid', showGrid.toString())
  }, [showGrid])

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister()
        }
      })
    }
  }, [])

  useEffect(() => {
    speedRef.current = speed
  }, [speed])

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === containerRef.current) {
          const { width, height } = entry.contentRect
          containerSizeRef.current = { width, height }
        }
      }
    })

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [activeView, isActive])

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined

    if (isActive && (activeView === 'EYE_GYM' || activeView === 'BREATHING')) {
      interval = setInterval(() => {
        setSessionTime((prev) => {
          if (prev <= 1) {
            setIsActive(false)
            setShowCelebration(true)
            return 0
          }

          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, activeView])

  useEffect(() => {
    if (!isActive) return

    let frameId: number

    const tick = (now: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = now
      }

      const delta = now - lastTimeRef.current
      lastTimeRef.current = now
      elapsedRef.current += delta * speedRef.current

      if (activeView === 'BREATHING') {
        const duration = 16000
        const phaseDuration = duration / PHASES.length
        const time = elapsedRef.current % duration
        const phaseIdx = Math.floor(time / phaseDuration)

        if (phaseIdx !== currentPhaseIndexRef.current) {
          currentPhaseIndexRef.current = phaseIdx
          setCurrentPhaseIndex(phaseIdx)
        }

        const path = breathPathRef.current
        const dot = dotRef.current
        const { width, height } = containerSizeRef.current

        if (path && dot && width > 0 && height > 0) {
          const phaseElapsed = time % phaseDuration
          const easedPhaseProgress = smootherStep(phaseElapsed / phaseDuration)
          const pathLength = path.getTotalLength()
          const pathPosition = ((phaseIdx + easedPhaseProgress) / PHASES.length) * pathLength
          const point = path.getPointAtLength(pathPosition)
          const x = (point.x / 100) * width
          const y = (point.y / 100) * height
          const previous = breathPointRef.current ?? { x, y }
          const damping = 1 - Math.exp(-delta / 120)
          const smoothed = {
            x: lerp(previous.x, x, damping),
            y: lerp(previous.y, y, damping),
          }

          breathPointRef.current = smoothed
          dot.style.transform = `translate3d(${smoothed.x}px, ${smoothed.y}px, 0) translate3d(-50%, -50%, 0)`
        }
      }

      if (activeView === 'EYE_GYM' && dotRef.current) {
        const t = elapsedRef.current / 1000
        const { width, height } = containerSizeRef.current
        const side = width || 300
        const areaHeight = height || 300
        const centerX = side / 2
        const centerY = areaHeight / 2

        if (eyeGymMode === 'ACCOMMODATION') {
          const scale = 0.7 + (0.5 - Math.cos(t * 0.72) / 2) * 1.15
          dotRef.current.style.transform = `translate3d(${centerX}px, ${centerY}px, 0) translate3d(-50%, -50%, 0) scale(${scale})`
        }

        if (eyeGymMode === 'PURSUIT') {
          const radius = Math.min(centerX, centerY) * 0.72
          const time = t * 0.74
          const denom = 1 + Math.pow(Math.sin(time), 2)
          const x = (radius * Math.cos(time)) / denom
          const y = (radius * Math.sin(time) * Math.cos(time)) / denom
          dotRef.current.style.transform = `translate3d(${centerX + x}px, ${centerY + y}px, 0) translate3d(-50%, -50%, 0)`
        }

        if (eyeGymMode === 'SACCADES') {
          if (saccadeTargetRef.current.x === 0 && saccadeTargetRef.current.y === 0) {
            saccadeFromRef.current = { x: centerX, y: centerY }
            saccadeTargetRef.current = { x: centerX, y: centerY }
            saccadeCurrentRef.current = { x: centerX, y: centerY }
          }

          saccadeTimerRef.current += delta
          const holdMs = 900 / speedRef.current
          const travelMs = 220 / speedRef.current

          if (saccadeTimerRef.current > holdMs + travelMs) {
            saccadeTimerRef.current = 0
            saccadeFromRef.current = saccadeCurrentRef.current
            saccadeTargetRef.current = {
              x: (0.14 + Math.random() * 0.72) * side,
              y: (0.16 + Math.random() * 0.68) * areaHeight,
            }
          }

          saccadeTravelRef.current = Math.min(1, saccadeTimerRef.current / travelMs)
          const eased = easeOutCubic(saccadeTravelRef.current)
          const x = lerp(saccadeFromRef.current.x, saccadeTargetRef.current.x, eased)
          const y = lerp(saccadeFromRef.current.y, saccadeTargetRef.current.y, eased)
          saccadeCurrentRef.current = { x, y }
          dotRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate3d(-50%, -50%, 0)`
        }

        if (eyeGymMode === 'CONVERGENCE') {
          const distance = (0.5 - Math.cos(t * 0.7) / 2) * Math.min(side, areaHeight) * 0.34
          dotRef.current.style.transform = `translate3d(${centerX - distance}px, ${centerY}px, 0) translate3d(-50%, -50%, 0)`

          if (secondDotRef.current) {
            secondDotRef.current.style.transform = `translate3d(${centerX + distance}px, ${centerY}px, 0) translate3d(-50%, -50%, 0)`
          }
        }
      }

      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [isActive, activeView, eyeGymMode])

  const resetMotion = () => {
    elapsedRef.current = 0
    lastTimeRef.current = 0
    currentPhaseIndexRef.current = 0
    saccadeTimerRef.current = 0
    saccadeFromRef.current = { x: 0, y: 0 }
    saccadeTargetRef.current = { x: 0, y: 0 }
    saccadeCurrentRef.current = { x: 0, y: 0 }
    breathPointRef.current = null
    setCurrentPhaseIndex(0)

    if (dotRef.current) {
      dotRef.current.style.transform = 'translate3d(50%, 50%, 0) translate3d(-50%, -50%, 0) scale(1)'
    }

    if (secondDotRef.current) {
      secondDotRef.current.style.transform = 'translate3d(50%, 50%, 0) translate3d(-50%, -50%, 0)'
    }
  }

  const reset = () => {
    setIsActive(false)
    setSessionTime(120)
    resetMotion()
  }

  const startExercise = () => {
    resetMotion()
    setIsActive(true)
  }

  const toggleActive = () => {
    if (isActive) {
      setIsActive(false)
      return
    }

    startExercise()
  }

  const selectExercise = (exercise: Exercise) => {
    reset()
    setSpeed(1)

    if (exercise.type === 'BREATHING') {
      setActiveView('BREATHING')
      return
    }

    setEyeGymMode(exercise.id)
    setActiveView('EYE_GYM')
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true)
      return
    }

    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }

  const toggleFullscreen = async () => {
    try {
      const fullscreenDocument = document as FullscreenDocument

      if (!document.fullscreenElement) {
        const element = document.documentElement as FullscreenElement

        if (element.requestFullscreen) await element.requestFullscreen()
        else if (element.webkitRequestFullscreen) await element.webkitRequestFullscreen()
        else if (element.msRequestFullscreen) await element.msRequestFullscreen()
      } else if (document.exitFullscreen) {
        await document.exitFullscreen()
      } else if (fullscreenDocument.webkitExitFullscreen) {
        await fullscreenDocument.webkitExitFullscreen()
      } else if (fullscreenDocument.msExitFullscreen) {
        await fullscreenDocument.msExitFullscreen()
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed:', err)
    }
  }

  return (
    <div
      className={`min-h-screen w-full bg-background text-foreground ${showGrid && !isActive ? 'bg-grid' : ''}`}
      style={appStyle}
    >
      {!isActive && (
        <header className="fixed left-0 right-0 top-0 z-50 grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-4 sm:px-6">
          <div />

          <button
            onClick={() => {
              reset()
              setActiveView('MENU')
            }}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-foreground/10 bg-card/80 px-4 text-sm font-semibold text-foreground/80 shadow-sm backdrop-blur transition-[background-color,border-color,transform] duration-200 hover:bg-card active:scale-[0.98]"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
            Protocols
          </button>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowGrid((value) => !value)}
              className={`grid h-11 w-11 place-items-center rounded-lg border transition-[background-color,border-color,color,transform] duration-200 active:scale-95 ${showGrid ? 'border-primary bg-primary text-primary-foreground' : 'border-foreground/10 bg-card/75 text-foreground/55 hover:bg-card'}`}
              aria-label="Toggle grid"
              title="Toggle grid"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                <path d="M4 4h7v7H4V4zm2 2v3h3V6H6zm7-2h7v7h-7V4zm2 2v3h3V6h-3zM4 13h7v7H4v-7zm2 2v3h3v-3H6zm7-2h7v7h-7v-7zm2 2v3h3v-3h-3z" />
              </svg>
            </button>

            <button
              onClick={toggleFullscreen}
              className="grid h-11 w-11 place-items-center rounded-lg border border-foreground/10 bg-card/75 text-foreground/55 transition-[background-color,color,transform] duration-200 hover:bg-card active:scale-95"
              aria-label="Toggle fullscreen"
              title="Toggle fullscreen"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                <path d="M5 5h6v2H7v4H5V5zm12 2h-4V5h6v6h-2V7zM7 13v4h4v2H5v-6h2zm12 0v6h-6v-2h4v-4h2z" />
              </svg>
            </button>
          </div>
        </header>
      )}

      <main className={`relative z-10 flex min-h-screen w-full flex-col items-center ${isActive && activeView === 'EYE_GYM' ? 'justify-center' : 'justify-center px-4 py-24'}`}>
        {activeView === 'MENU' && (
          <section className="flex w-full max-w-5xl flex-col items-center gap-8">
            <div className="space-y-2 text-center">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground/45">Adaptive wellness system</p>
              <h1 className="text-4xl font-semibold tracking-normal text-foreground sm:text-5xl">Protocols</h1>
            </div>

            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {EXERCISES.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => selectExercise(exercise)}
                  className="group flex min-h-48 flex-col justify-between rounded-lg border border-foreground/10 bg-card p-5 text-left shadow-sm transition-[border-color,background-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md active:translate-y-0"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className={`grid h-12 w-12 place-items-center rounded-lg ${exercise.soft} ${exercise.color}`}>
                      {exercise.icon}
                    </span>
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current text-foreground/25 transition-[opacity,transform] duration-200 group-hover:translate-x-0.5 group-hover:text-foreground/45" aria-hidden="true">
                      <path d="m13 5-1.4 1.4 4.6 4.6H5v2h11.2l-4.6 4.6L13 19l7-7-7-7z" />
                    </svg>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className={`text-xs font-semibold ${exercise.color}`}>{exercise.subtitle}</p>
                      <h2 className="text-2xl font-semibold tracking-normal text-foreground">{exercise.title}</h2>
                    </div>
                    <p className="max-w-sm text-sm leading-6 text-foreground/58">{exercise.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {(deferredPrompt || isIOS) && (
              <button
                onClick={handleInstallClick}
                className="rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-background shadow-sm transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-[0.98]"
              >
                Install app
              </button>
            )}
          </section>
        )}

        {activeView === 'BREATHING' && (
          <section className={`flex w-full flex-col items-center gap-8 ${isActive ? 'min-h-screen justify-center px-4 py-14' : 'max-w-3xl'}`}>
            {!isActive && (
              <div className="space-y-3 text-center">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground/40">4 · 4 · 4 · 4</p>
                <h1 className="text-4xl font-medium tracking-normal text-foreground sm:text-5xl">Square Breath</h1>
              </div>
            )}

            <div
              ref={containerRef}
              className="relative aspect-square w-[min(76vw,64vh,520px)] rounded-lg transition-[width,height,transform] duration-500 ease-out"
            >
              <svg className="pointer-events-none absolute inset-0 h-0 w-0 overflow-hidden" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <path
                  ref={breathPathRef}
                  d="M 8 2 H 92 Q 98 2 98 8 V 92 Q 98 98 92 98 H 8 Q 2 98 2 92 V 8 Q 2 2 8 2"
                  fill="none"
                  stroke="transparent"
                  strokeWidth="0"
                  pathLength="100"
                />
              </svg>

              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 p-8 text-center">
                <div
                  className="grid h-24 w-24 place-items-center text-foreground/22 transition-[color,opacity,transform] duration-500"
                  style={{ color: isActive ? currentPhase.color : undefined }}
                  aria-hidden="true"
                >
                  {isActive ? currentPhase.icon : <span className="h-1 w-10 rounded-full bg-current" />}
                </div>
                <div className="space-y-2">
                  <p className="text-[clamp(2.25rem,7vw,4rem)] font-light tracking-normal text-foreground">
                    {isActive ? currentPhase.name : 'Ready'}
                  </p>
                  <p className="text-sm font-normal text-foreground/42">
                    {isActive ? currentPhase.hint : 'Quiet, even, unforced.'}
                  </p>
                </div>
              </div>

              {isActive && (
                <div
                  ref={dotRef}
                  className={`absolute left-0 top-0 h-4 w-4 rounded-full ${currentPhase.dotClass} shadow-[0_0_0_5px_color-mix(in_srgb,var(--phase-color)_12%,transparent)] will-change-transform transition-[background-color] duration-300 sm:h-5 sm:w-5`}
                  style={{ transform: 'translate3d(-50%, -50%, 0)' }}
                />
              )}
            </div>

            <div className="flex w-full max-w-xs flex-col gap-5">
              {isActive && (
                <div className="mx-auto font-mono text-sm text-foreground/45">
                  {formatTime(sessionTime)} remaining
                </div>
              )}

              <div className="flex w-full gap-3">
                {!isActive ? (
                  <button onClick={toggleActive} className="flex-1 rounded-lg border border-foreground/14 bg-transparent px-5 py-4 text-base font-medium text-foreground transition-[background-color,border-color,transform] duration-200 hover:border-foreground/28 hover:bg-card/45 active:scale-[0.98]">
                    Start
                  </button>
                ) : (
                  <button onClick={reset} className="flex-1 rounded-lg border border-foreground/12 bg-transparent px-5 py-4 text-base font-medium text-foreground/62 transition-[background-color,border-color,transform] duration-200 hover:border-foreground/22 hover:bg-card/40 active:scale-[0.98]">
                    Reset
                  </button>
                )}
              </div>

              <div className="flex items-center justify-center gap-3">
                {PHASES.map((phase, index) => (
                  <span
                    key={`${phase.name}-${phase.hint}`}
                    className={`h-1.5 rounded-full transition-[background-color,width,opacity] duration-500 ${currentPhaseIndex === index && isActive ? 'w-7 opacity-90' : 'w-1.5 bg-foreground/14 opacity-70'}`}
                    style={{ backgroundColor: currentPhaseIndex === index && isActive ? phase.color : undefined }}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {activeView === 'EYE_GYM' && (
          <section className={`flex w-full flex-col items-center ${isActive ? 'min-h-screen justify-center' : 'max-w-4xl gap-6'}`}>
            {!isActive && (
              <div className="flex w-full max-w-xl flex-col items-center gap-4 text-center">
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground/45">Visual performance</p>
                  <h1 className="text-4xl font-semibold tracking-normal text-foreground sm:text-5xl">
                    {currentExercise?.title}
                  </h1>
                </div>
                <p className="max-w-lg text-sm leading-6 text-foreground/58">{currentExercise?.desc}</p>
              </div>
            )}

            <div
              ref={containerRef}
              className={`relative overflow-hidden transition-[width,height,border-radius,background-color] duration-500 ease-out ${isActive ? 'h-screen w-screen bg-background' : 'h-[28vh] min-h-48 w-[min(92vw,960px)] rounded-lg border border-foreground/10 bg-card shadow-sm'}`}
            >
              {!isActive && (
                <>
                  <div className="absolute left-1/2 top-1/2 h-px w-4/5 -translate-x-1/2 bg-foreground/8" />
                  <div className="absolute left-1/2 top-1/2 h-4/5 w-px -translate-y-1/2 bg-foreground/8" />
                  <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/18" />
                </>
              )}

              {isActive && (
                <div
                  ref={dotRef}
                  className="absolute left-0 top-0 z-10 h-7 w-7 rounded-full bg-foreground shadow-[0_0_0_8px_hsl(var(--foreground)/0.08)] will-change-transform"
                  style={{ transform: 'translate3d(-50%, -50%, 0)' }}
                />
              )}

              {isActive && eyeGymMode === 'CONVERGENCE' && (
                <div
                  ref={secondDotRef}
                  className="absolute left-0 top-0 z-10 h-7 w-7 rounded-full bg-primary shadow-[0_0_0_8px_hsl(var(--primary)/0.13)] will-change-transform"
                  style={{ transform: 'translate3d(-50%, -50%, 0)' }}
                />
              )}
            </div>

            <div className={`flex w-full flex-col gap-4 transition-[opacity,transform] duration-500 ${isActive ? 'pointer-events-none fixed bottom-8 left-1/2 z-40 max-w-sm -translate-x-1/2 items-center px-4 sm:bottom-10' : 'max-w-md px-4'}`}>
              {isActive && (
                <div className="rounded-full border border-foreground/10 bg-session px-5 py-2 text-sm font-medium text-session backdrop-blur">
                  {formatTime(sessionTime)} remaining
                </div>
              )}

              {!isActive && (
                <div className="flex w-full gap-3">
                  <button
                    onClick={startExercise}
                    className="flex-1 rounded-lg bg-foreground px-5 py-4 text-lg font-semibold text-background shadow-sm transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-[0.98]"
                  >
                    Start
                  </button>

                  <label className="flex min-w-36 flex-col justify-center gap-2 rounded-lg border border-foreground/10 bg-card px-4">
                    <span className="text-xs font-medium text-foreground/45">Speed {speed.toFixed(1)}x</span>
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.1"
                      value={speed}
                      onChange={(event) => setSpeed(parseFloat(event.target.value))}
                      className="h-1 w-full cursor-pointer accent-primary"
                    />
                  </label>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {isActive && (
        <button
          onClick={() => setIsActive(false)}
          className="fixed right-4 top-4 z-[95] grid h-12 w-12 place-items-center rounded-lg border border-foreground/10 bg-session text-foreground/70 shadow-sm backdrop-blur transition-[background-color,color,transform] duration-200 hover:bg-card hover:text-foreground active:scale-95 sm:right-6 sm:top-6"
          aria-label="Exit session"
          title="Exit session"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
            <path d="m18.3 6.7-1-1L12 11 6.7 5.7l-1 1L11 12l-5.3 5.3 1 1L12 13l5.3 5.3 1-1L13 12l5.3-5.3z" />
          </svg>
        </button>
      )}

      {showIOSInstructions && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-foreground/30 p-4 backdrop-blur-sm sm:items-center" onClick={() => setShowIOSInstructions(false)}>
          <div
            className="w-full max-w-sm space-y-6 rounded-lg border border-foreground/10 bg-card p-6 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="space-y-2 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary">
                <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true">
                  <path d="M12 3 7 8h3v7h4V8h3l-5-5zM5 18h14v2H5v-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-foreground">Install app</h3>
              <p className="text-sm leading-6 text-foreground/58">Add this tool to your home screen for quick access.</p>
            </div>

            <div className="space-y-3">
              {['Tap Share in Safari', 'Select Add to Home Screen'].map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-lg border border-foreground/10 bg-muted/45 p-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-foreground text-sm font-semibold text-background">
                    {index + 1}
                  </span>
                  <p className="text-sm font-medium text-foreground/70">{step}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full rounded-lg bg-foreground px-5 py-4 font-semibold text-background transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-[0.98]"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {showCelebration && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-foreground/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm space-y-6 rounded-lg border border-foreground/10 bg-card p-7 text-center shadow-lg">
            <div className="space-y-3">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
                <svg viewBox="0 0 24 24" className="h-8 w-8 fill-current" aria-hidden="true">
                  <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.5 1.9 4.6 4.4 4.9.7 1.4 2 2.5 3.6 2.9V19H7v2h10v-2h-4v-3.2c1.6-.4 2.9-1.5 3.6-2.9C19.1 12.6 21 10.5 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.7C5.8 10.3 5 9.3 5 8zm14 0c0 1.3-.8 2.3-2 2.7V7h2v1z" />
                </svg>
              </div>
              <h3 className="text-3xl font-semibold text-foreground">Excellent work</h3>
              <p className="text-sm leading-6 text-foreground/58">
                You completed the {activeView === 'BREATHING' ? 'breathing' : 'eye gymnastics'} protocol.
              </p>
            </div>

            <button
              onClick={() => {
                setShowCelebration(false)
                setActiveView('MENU')
              }}
              className="w-full rounded-lg bg-foreground px-5 py-4 font-semibold text-background transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-[0.98]"
            >
              Finish session
            </button>
          </div>
        </div>
      )}

      {showLandscapeHint && activeView === 'EYE_GYM' && isActive && (
        <div className="fixed bottom-20 left-4 right-4 z-[90] sm:hidden">
          <div className="flex items-center gap-3 rounded-lg border border-foreground/10 bg-session p-3 text-session shadow-sm backdrop-blur">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-foreground/10">
              <svg viewBox="0 0 24 24" className="h-5 w-5 rotate-90 fill-current" aria-hidden="true">
                <path d="M7 2h10c1.1 0 2 .9 2 2v16c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm0 4v12h10V6H7z" />
              </svg>
            </div>
            <p className="flex-1 text-xs font-medium leading-5">Landscape mode gives the eyes more room to move.</p>
            <button
              onClick={() => setShowLandscapeHint(false)}
              className="grid h-8 w-8 place-items-center rounded-lg text-session transition-[background-color] duration-200 hover:bg-foreground/10"
              aria-label="Dismiss landscape hint"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                <path d="m18.3 6.7-1-1L12 11 6.7 5.7l-1 1L11 12l-5.3 5.3 1 1L12 13l5.3 5.3 1-1L13 12l5.3-5.3z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
