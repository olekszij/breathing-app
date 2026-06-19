import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { GiLips, GiNoseSide } from 'react-icons/gi'

type AppView = 'MENU' | 'BREATHING' | 'EYE_GYM'
type EyeGymMode = 'DISTANCE' | 'PURSUIT' | 'SACCADES' | 'BLINK'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform?: string }>
}

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void
  msRequestFullscreen?: () => Promise<void> | void
}

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null
  msFullscreenElement?: Element | null
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
  durationSeconds?: number
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
    id: 'DISTANCE',
    type: 'EYE_GYM',
    title: 'Distance Reset',
    subtitle: '20 sec focus',
    desc: 'One 20-second look-away reset: focus on a real distant object.',
    color: 'text-inhale',
    soft: 'bg-inhale/10',
    durationSeconds: 20,
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" aria-hidden="true">
        <path d="M3 11.5C4.9 7.6 8.2 5.5 12 5.5s7.1 2.1 9 6c-1.9 3.9-5.2 6-9 6s-7.1-2.1-9-6zm9 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
        <path d="M19 4h2v4h-2V6.9l-3.2 3.2-1.4-1.4L17.6 5H19V4z" />
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
    durationSeconds: 60,
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
    desc: 'Shift gaze between targets that jump and then stay still.',
    color: 'text-hold',
    soft: 'bg-hold/10',
    durationSeconds: 60,
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" aria-hidden="true">
        <path d="M5 5h7v2H8.4l4.3 4.3-1.4 1.4L7 8.4V12H5V5zm14 14h-7v-2h3.6l-4.3-4.3 1.4-1.4 4.3 4.3V12h2v7z" />
      </svg>
    ),
  },
  {
    id: 'BLINK',
    type: 'EYE_GYM',
    title: 'Blink Reset',
    subtitle: 'Dry-eye break',
    desc: 'Use slow, complete blinks to refresh the tear film during screen work.',
    color: 'text-primary',
    soft: 'bg-primary/10',
    durationSeconds: 60,
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" aria-hidden="true">
        <path d="M12 5.5c4.2 0 7.4 2.1 9.2 6-.7 1.4-1.7 2.6-3 3.5l-1.4-1.4c.7-.5 1.3-1.2 1.8-2.1-1.5-2.6-3.8-4-6.6-4s-5.1 1.4-6.6 4c1.5 2.6 3.8 4 6.6 4 .7 0 1.4-.1 2-.3l1.6 1.6c-1.1.5-2.3.7-3.6.7-4.2 0-7.4-2.1-9.2-6 1.8-3.9 5-6 9.2-6z" />
        <path d="m4.3 3 16.7 16.7-1.4 1.4L2.9 4.4 4.3 3z" />
      </svg>
    ),
  },
]

const HOME_CARD_STYLES = [
  'bg-[#bfe6b8]',
  'bg-[#f18873]',
  'bg-[#f5ad3f]',
  'bg-[#f4d489]',
  'bg-[#e6e1da]',
]

const formatTime = (seconds: number) => (
  `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`
)

const smootherStep = (value: number) => {
  const clamped = Math.min(1, Math.max(0, value))
  return clamped * clamped * clamped * (clamped * (clamped * 6 - 15) + 10)
}
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
  const [isImmersive, setIsImmersive] = useState(false)
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [sessionTime, setSessionTime] = useState(120)
  const [eyeGymMode, setEyeGymMode] = useState<EyeGymMode>('DISTANCE')

  const currentPhaseIndexRef = useRef(0)
  const lastTimeRef = useRef<number>(0)
  const elapsedRef = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const breathPathRef = useRef<SVGPathElement>(null)
  const breathPointRef = useRef<{ x: number; y: number } | null>(null)
  const containerSizeRef = useRef({ width: 0, height: 0 })
  const speedRef = useRef(speed)
  const saccadeTimerRef = useRef(0)
  const saccadeTargetRef = useRef({ x: 0, y: 0 })

  const currentPhase = PHASES[currentPhaseIndex] || PHASES[0]
  const currentExercise = EXERCISES.find((exercise) => exercise.id === eyeGymMode)
  const currentExerciseIndex = Math.max(0, EXERCISES.findIndex((exercise) => exercise.id === eyeGymMode))
  const currentExerciseStyle = HOME_CARD_STYLES[currentExerciseIndex % HOME_CARD_STYLES.length]
  const breathingPreviewStyle = HOME_CARD_STYLES[0]
  const currentSessionDuration = activeView === 'BREATHING' ? 120 : (currentExercise?.durationSeconds ?? 60)
  const showSpeedControl = eyeGymMode === 'PURSUIT' || eyeGymMode === 'SACCADES'
  const useFullScreenEyeField = eyeGymMode === 'PURSUIT' || eyeGymMode === 'SACCADES'
  const activeEyePrompt = eyeGymMode === 'DISTANCE'
    ? 'Look at a real object 6m+ away'
    : eyeGymMode === 'BLINK'
      ? 'Slow, complete blinks'
      : null
  const fullscreenActive = isNativeFullscreen || isImmersive
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
    const updateFullscreenState = () => {
      const fullscreenDocument = document as FullscreenDocument
      setIsNativeFullscreen(Boolean(
        document.fullscreenElement ||
        fullscreenDocument.webkitFullscreenElement ||
        fullscreenDocument.msFullscreenElement
      ))
    }

    updateFullscreenState()
    document.addEventListener('fullscreenchange', updateFullscreenState)
    document.addEventListener('webkitfullscreenchange', updateFullscreenState)
    document.addEventListener('MSFullscreenChange', updateFullscreenState)

    return () => {
      document.removeEventListener('fullscreenchange', updateFullscreenState)
      document.removeEventListener('webkitfullscreenchange', updateFullscreenState)
      document.removeEventListener('MSFullscreenChange', updateFullscreenState)
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

        if (eyeGymMode === 'BLINK') {
          const cycle = (t * 0.45) % 1
          const scaleY = cycle < 0.18 ? 0.18 : 1
          const opacity = cycle < 0.18 ? 0.45 : 1
          dotRef.current.style.opacity = `${opacity}`
          dotRef.current.style.transform = `translate3d(${centerX}px, ${centerY}px, 0) translate3d(-50%, -50%, 0) scaleY(${scaleY})`
        }

        if (eyeGymMode === 'PURSUIT') {
          dotRef.current.style.opacity = '1'
          const xRadius = centerX * 0.82
          const yRadius = centerY * 0.72
          const time = t * 0.56
          const x = Math.sin(time) * xRadius
          const y = Math.sin(time * 2) * yRadius
          dotRef.current.style.transform = `translate3d(${centerX + x}px, ${centerY + y}px, 0) translate3d(-50%, -50%, 0)`
        }

        if (eyeGymMode === 'SACCADES') {
          dotRef.current.style.opacity = '1'
          if (saccadeTargetRef.current.x === 0 && saccadeTargetRef.current.y === 0) {
            saccadeTargetRef.current = { x: centerX, y: centerY }
          }

          saccadeTimerRef.current += delta
          const holdMs = 1100 / speedRef.current

          if (saccadeTimerRef.current > holdMs) {
            saccadeTimerRef.current = 0
            saccadeTargetRef.current = {
              x: (0.08 + Math.random() * 0.84) * side,
              y: (0.10 + Math.random() * 0.80) * areaHeight,
            }
          }

          dotRef.current.style.transform = `translate3d(${saccadeTargetRef.current.x}px, ${saccadeTargetRef.current.y}px, 0) translate3d(-50%, -50%, 0)`
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
    saccadeTargetRef.current = { x: 0, y: 0 }
    breathPointRef.current = null
    setCurrentPhaseIndex(0)

    if (dotRef.current) {
      dotRef.current.style.transform = 'translate3d(50%, 50%, 0) translate3d(-50%, -50%, 0) scale(1)'
      dotRef.current.style.opacity = '1'
    }
  }

  const reset = () => {
    setIsActive(false)
    setSessionTime(currentSessionDuration)
    resetMotion()
  }

  const startExercise = () => {
    resetMotion()
    setSessionTime(currentSessionDuration)
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
      setSessionTime(exercise.durationSeconds ?? 120)
      setActiveView('BREATHING')
      return
    }

    setSessionTime(exercise.durationSeconds ?? 60)
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
    const fullscreenDocument = document as FullscreenDocument
    const fullscreenElement = document.fullscreenElement || fullscreenDocument.webkitFullscreenElement || fullscreenDocument.msFullscreenElement

    try {
      if (!fullscreenElement && !isImmersive) {
        const element = document.documentElement as FullscreenElement

        if (element.requestFullscreen) await element.requestFullscreen()
        else if (element.webkitRequestFullscreen) await element.webkitRequestFullscreen()
        else if (element.msRequestFullscreen) await element.msRequestFullscreen()
        else setIsImmersive(true)
      } else if (fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen()
      } else if (fullscreenElement && fullscreenDocument.webkitExitFullscreen) {
        await fullscreenDocument.webkitExitFullscreen()
      } else if (fullscreenElement && fullscreenDocument.msExitFullscreen) {
        await fullscreenDocument.msExitFullscreen()
      } else {
        setIsImmersive(false)
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed:', err)
      setIsImmersive((value) => !value)
    }
  }

  return (
    <div
      className={`${isImmersive ? 'fixed inset-0 z-[9999] overflow-auto' : 'min-h-screen'} w-full text-foreground ${isActive && activeView === 'BREATHING' ? 'bg-white' : isActive ? 'bg-[#faf9f4]' : 'bg-[#d8b58f]'} ${showGrid && !isActive && activeView !== 'MENU' ? 'bg-grid' : ''}`}
      style={appStyle}
    >
      {!isActive && (
        <header className={`fixed left-0 right-0 top-0 z-50 grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-4 sm:px-6 ${activeView === 'MENU' ? 'pointer-events-none' : ''}`}>
          <div />
          <div />

          <div className="flex justify-end gap-2 pointer-events-auto">
            <button
              onClick={() => setShowGrid((value) => !value)}
              className={`grid h-11 w-11 place-items-center rounded-[1rem] border shadow-sm backdrop-blur transition-[background-color,border-color,color,transform] duration-200 active:scale-95 ${showGrid ? 'border-[#0b0d16] bg-[#0b0d16] text-[#faf9f4]' : 'border-[#0b0d16]/10 bg-[#faf9f4]/75 text-[#0b0d16]/55 hover:bg-[#faf9f4]'}`}
              aria-label="Toggle grid"
              title="Toggle grid"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                <path d="M4 4h7v7H4V4zm2 2v3h3V6H6zm7-2h7v7h-7V4zm2 2v3h3V6h-3zM4 13h7v7H4v-7zm2 2v3h3v-3H6zm7-2h7v7h-7v-7zm2 2v3h3v-3h-3z" />
              </svg>
            </button>

            <button
              onClick={toggleFullscreen}
              className="grid h-11 w-11 place-items-center rounded-[1rem] border border-[#0b0d16]/10 bg-[#faf9f4]/75 text-[#0b0d16]/55 shadow-sm backdrop-blur transition-[background-color,color,transform] duration-200 hover:bg-[#faf9f4] active:scale-95"
              aria-label={fullscreenActive ? 'Exit fullscreen' : 'Enter fullscreen'}
              title={fullscreenActive ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                {fullscreenActive ? (
                  <path d="M9 9H5V7h2V5h2v4zm10-2v2h-4V5h2v2h2zM7 17H5v-2h4v4H7v-2zm10-2h2v2h-2v2h-2v-4h2z" />
                ) : (
                  <path d="M5 5h6v2H7v4H5V5zm12 2h-4V5h6v6h-2V7zM7 13v4h4v2H5v-6h2zm12 0v6h-6v-2h4v-4h2z" />
                )}
              </svg>
            </button>

            {activeView !== 'MENU' && (
              <button
                onClick={() => {
                  reset()
                  setActiveView('MENU')
                }}
                className="grid h-11 w-11 place-items-center rounded-[1rem] border border-[#0b0d16]/10 bg-[#faf9f4]/80 text-[#0b0d16]/76 shadow-sm backdrop-blur transition-[background-color,border-color,transform] duration-200 hover:bg-[#faf9f4] active:scale-[0.98]"
                aria-label="Open protocols menu"
                title="Open protocols menu"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true">
                  <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" />
                </svg>
              </button>
            )}
          </div>
        </header>
      )}

      <main className={`relative z-10 flex min-h-screen w-full flex-col items-center ${activeView === 'MENU' && !isActive ? 'justify-start px-4 py-6 sm:justify-center sm:py-10' : isActive && activeView === 'EYE_GYM' ? 'justify-center' : 'justify-center px-4 py-16 sm:py-20'}`}>
        {activeView === 'MENU' && (
          <section className="relative w-full max-w-[460px] overflow-hidden rounded-[2rem] bg-[#faf9f4] p-5 text-[#0b0d16] shadow-[0_28px_90px_hsl(24_30%_18%/0.24)] sm:max-w-[520px] sm:p-7">
            <div className="mb-6 space-y-2">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0b0d16]/38">Daily protocols</p>
              <h1 className="max-w-sm break-words text-[clamp(3rem,14vw,5.4rem)] font-black leading-[0.86] tracking-normal text-[#0b0d16]">
                Pick your reset
              </h1>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] bg-[#e6e1da]">
              {EXERCISES.map((exercise, index) => (
                <button
                  key={exercise.id}
                  onClick={() => selectExercise(exercise)}
                  className={`group flex min-h-[112px] w-full items-center justify-between gap-4 px-7 py-6 text-left text-[#0b0d16] transition-[filter,transform] duration-200 hover:brightness-[1.03] active:scale-[0.995] sm:min-h-[124px] sm:px-8 ${HOME_CARD_STYLES[index % HOME_CARD_STYLES.length]}`}
                >
                  <span className="min-w-0">
                    <span className="block max-w-full break-words text-[clamp(1.9rem,7vw,2.8rem)] font-black leading-[0.92] tracking-normal">
                      {exercise.title}
                    </span>
                    <span className="mt-2 block text-sm font-semibold text-[#0b0d16]/72 sm:text-base">
                      {exercise.subtitle}
                    </span>
                  </span>
                  <span className="grid h-10 w-10 shrink-0 place-items-center text-[#0b0d16] transition-transform duration-200 group-hover:translate-x-1">
                    <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" aria-hidden="true">
                      <path d="M8.5 5.7 10 4.2 17.8 12 10 19.8l-1.5-1.5 5.3-5.3H4v-2h9.8L8.5 5.7z" />
                    </svg>
                  </span>
                </button>
              ))}
            </div>

            {(deferredPrompt || isIOS) && (
              <button
                onClick={handleInstallClick}
                className="mt-6 w-full rounded-[1rem] bg-[#0b0d16] px-6 py-4 text-sm font-black text-[#faf9f4] transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-[0.98]"
              >
                Install app
              </button>
            )}
          </section>
        )}

        {activeView === 'BREATHING' && (
          <section className={`flex w-full flex-col items-center ${isActive ? 'gap-7' : 'max-w-[460px] gap-5 sm:max-w-[520px]'}`}>
            {!isActive ? (
              <div className="w-full overflow-hidden rounded-[2rem] bg-[#faf9f4] p-5 text-[#0b0d16] shadow-[0_28px_90px_hsl(24_30%_18%/0.24)] sm:p-6">
                <div className="mb-5 space-y-2">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0b0d16]/38">Nervous system</p>
                  <h1 className="max-w-full break-words text-[clamp(2.75rem,11vw,5rem)] font-black leading-[0.86] tracking-normal text-[#0b0d16]">
                    Square Breath
                  </h1>
                </div>

                <div
                  ref={containerRef}
                  className={`relative aspect-square w-full overflow-hidden rounded-[1.5rem] ${breathingPreviewStyle} text-[#0b0d16]`}
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

                  <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-7 sm:p-8">
                    <div className="flex items-start justify-between gap-4">
                      <div className="grid h-20 w-20 place-items-center rounded-full bg-[#0b0d16]/10 text-[#0b0d16] sm:h-24 sm:w-24">
                        <GiNoseSide className="h-14 w-14 sm:h-16 sm:w-16" aria-hidden="true" />
                      </div>
                      <div className="grid h-16 w-16 place-items-center rounded-full bg-[#0b0d16]/10 text-[#0b0d16] sm:h-20 sm:w-20">
                        <GiLips className="h-12 w-12 sm:h-14 sm:w-14" aria-hidden="true" />
                      </div>
                    </div>

                    <div className="max-w-[14rem]">
                      <p className="max-w-full break-words text-[clamp(2.2rem,9vw,4.1rem)] font-black leading-[0.88] tracking-normal">
                        calm loop
                      </p>
                      <p className="mt-3 text-sm font-semibold leading-5 text-[#0b0d16]/68">
                        Inhale nose, pause, exhale mouth, pause.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <button
                    onClick={toggleActive}
                    className="w-full rounded-[1rem] bg-[#0b0d16] px-6 py-5 text-lg font-black text-[#faf9f4] transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-[0.98]"
                  >
                    Start
                  </button>

                  <div className="flex items-center justify-center gap-3">
                    {PHASES.map((phase, index) => (
                      <span
                        key={`${phase.name}-${phase.hint}`}
                        className={`h-2 rounded-full bg-[#0b0d16]/20 ${index === 0 ? 'w-8' : 'w-2'}`}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div
                  ref={containerRef}
                  className="relative aspect-square w-[min(84vw,64vh,560px)] overflow-visible bg-white text-[#0b0d16] transition-[width,height,transform] duration-500 ease-out"
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

                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center">
                    <div
                      className="grid h-28 w-28 place-items-center rounded-full bg-[#faf9f4]/35 text-[#0b0d16] transition-[color,opacity,transform] duration-500 sm:h-32 sm:w-32"
                      style={{ color: currentPhase.color }}
                      aria-hidden="true"
                    >
                      {currentPhase.icon}
                    </div>
                    <div className="space-y-2">
                      <p className="max-w-full break-words text-[clamp(2.75rem,10vw,5rem)] font-black leading-[0.88] tracking-normal text-[#0b0d16]">
                        {currentPhase.name}
                      </p>
                      <p className="text-sm font-bold text-[#0b0d16]/58">
                        {currentPhase.hint}
                      </p>
                    </div>
                  </div>

                  <div
                    ref={dotRef}
                    className={`absolute left-0 top-0 h-4 w-4 rounded-full ${currentPhase.dotClass} will-change-transform transition-[background-color] duration-300 sm:h-5 sm:w-5`}
                    style={{ transform: 'translate3d(-50%, -50%, 0)' }}
                  />
                </div>

                <div className="flex w-full max-w-sm flex-col items-center gap-4">
                  <div className="rounded-full bg-[#0b0d16] px-6 py-3 font-mono text-sm font-bold text-[#faf9f4]">
                    {formatTime(sessionTime)} remaining
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    {PHASES.map((phase, index) => (
                      <span
                        key={`${phase.name}-${phase.hint}`}
                        className={`h-2 rounded-full transition-[background-color,width,opacity] duration-500 ${currentPhaseIndex === index ? 'w-9 opacity-100' : 'w-2 bg-[#0b0d16]/16 opacity-70'}`}
                        style={{ backgroundColor: currentPhaseIndex === index ? phase.color : undefined }}
                        aria-hidden="true"
                      />
                    ))}
                  </div>

                  <button
                    onClick={reset}
                    className="rounded-[1rem] border border-[#0b0d16]/12 bg-[#faf9f4]/80 px-6 py-3 text-sm font-black text-[#0b0d16]/70 shadow-sm backdrop-blur transition-[background-color,transform] duration-200 hover:bg-[#faf9f4] active:scale-[0.98]"
                  >
                    Reset
                  </button>
                </div>
              </>
            )}
          </section>
        )}

        {activeView === 'EYE_GYM' && (
          <section className={`flex w-full flex-col items-center ${isActive ? 'min-h-screen justify-center' : 'max-w-[460px] gap-5 sm:max-w-[520px]'}`}>
            {!isActive ? (
              <div className="w-full overflow-hidden rounded-[2rem] bg-[#faf9f4] p-5 text-[#0b0d16] shadow-[0_28px_90px_hsl(24_30%_18%/0.24)] sm:p-6">
                <div className="mb-5 space-y-3">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0b0d16]/38">Eye reset</p>
                  <h1 className="max-w-full break-words text-[clamp(2.75rem,11vw,5rem)] font-black leading-[0.86] tracking-normal text-[#0b0d16]">
                    {currentExercise?.title}
                  </h1>
                  <p className="max-w-[25rem] text-sm font-semibold leading-5 text-[#0b0d16]/62">
                    {currentExercise?.desc}
                  </p>
                </div>

                <div
                  ref={containerRef}
                  className={`relative h-[clamp(180px,28svh,300px)] overflow-hidden rounded-[1.5rem] ${currentExerciseStyle} text-[#0b0d16]`}
                >
                  <div className="absolute left-1/2 top-1/2 h-px w-4/5 -translate-x-1/2 bg-[#0b0d16]/10" />
                  <div className="absolute left-1/2 top-1/2 h-4/5 w-px -translate-y-1/2 bg-[#0b0d16]/10" />
                  <div className="absolute right-6 top-6 text-[#0b0d16]/16 [&_div]:h-20 [&_div]:w-20 [&_svg]:h-20 [&_svg]:w-20">
                    {currentExercise?.icon}
                  </div>
                  <div className="absolute bottom-5 left-6 right-20 sm:bottom-6 sm:left-7 sm:right-24">
                    <p className="max-w-full break-words text-[clamp(1.55rem,5vw,2.65rem)] font-black leading-[0.94] tracking-normal">
                      {currentExercise?.subtitle}
                    </p>
                  </div>
                  <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0b0d16]" />
                </div>

                <div className="mt-4 rounded-[1rem] bg-[#e6e1da] px-4 py-3 text-xs font-semibold leading-5 text-[#0b0d16]/62">
                  Stop if you feel pain, dizziness, nausea, or double vision.
                </div>

                <div className="mt-5 space-y-3">
                  <button
                    onClick={startExercise}
                    className="w-full rounded-[1rem] bg-[#0b0d16] px-6 py-5 text-lg font-black text-[#faf9f4] transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-[0.98]"
                  >
                    Start
                  </button>

                  {showSpeedControl && (
                    <label className="flex min-h-20 flex-col justify-center gap-3 rounded-[1rem] bg-[#e6e1da] px-5">
                      <span className="text-xs font-black uppercase tracking-[0.12em] text-[#0b0d16]/48">
                        Speed {speed.toFixed(1)}x
                      </span>
                      <input
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.1"
                        value={speed}
                        onChange={(event) => setSpeed(parseFloat(event.target.value))}
                        className="h-1 w-full cursor-pointer accent-[#0b0d16]"
                      />
                    </label>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div
                  ref={containerRef}
                  className={useFullScreenEyeField
                    ? 'fixed inset-0 overflow-hidden bg-[#faf9f4] text-[#0b0d16] transition-[background-color] duration-500 ease-out'
                    : `relative h-[min(72vh,660px)] min-h-[340px] w-[min(92vw,1060px)] overflow-hidden rounded-[2rem] ${currentExerciseStyle} text-[#0b0d16] shadow-[0_28px_90px_hsl(24_30%_18%/0.16)] transition-[width,height,border-radius,background-color] duration-500 ease-out`}
                >
                  <div className="absolute left-6 right-6 top-6 z-10 flex items-start justify-between gap-4 sm:left-8 sm:right-8 sm:top-8">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0b0d16]/45">Eye reset</p>
                      <p className="mt-1 text-2xl font-black leading-none tracking-normal text-[#0b0d16] sm:text-3xl">
                        {currentExercise?.title}
                      </p>
                    </div>
                    {!useFullScreenEyeField && (
                      <span className="rounded-full bg-[#faf9f4]/52 px-4 py-2 font-mono text-xs font-black text-[#0b0d16]/62">
                        {formatTime(sessionTime)}
                      </span>
                    )}
                  </div>

                  {!useFullScreenEyeField && (
                    <>
                      <div className="absolute left-1/2 top-1/2 h-px w-4/5 -translate-x-1/2 bg-[#0b0d16]/10" />
                      <div className="absolute left-1/2 top-1/2 h-4/5 w-px -translate-y-1/2 bg-[#0b0d16]/10" />
                    </>
                  )}

                  {eyeGymMode === 'DISTANCE' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
                      <p className="text-[clamp(3.25rem,12vw,7rem)] font-black leading-[0.84] tracking-normal text-[#0b0d16]">
                        Look far
                      </p>
                      <p className="max-w-sm text-sm font-bold leading-6 text-[#0b0d16]/58">
                        Focus on a real object across the room or outside.
                      </p>
                    </div>
                  )}

                  {eyeGymMode !== 'DISTANCE' && (
                    <div
                      ref={dotRef}
                      className={`absolute left-0 top-0 z-20 bg-[#0b0d16] shadow-[0_0_0_9px_hsl(230_14%_8%/0.10)] will-change-transform ${eyeGymMode === 'BLINK' ? 'h-10 w-28 rounded-full' : 'h-8 w-8 rounded-full'}`}
                      style={{ transform: 'translate3d(-50%, -50%, 0)' }}
                    />
                  )}
                </div>

                <div className="pointer-events-none fixed bottom-8 left-1/2 z-40 flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4 text-center sm:bottom-10">
                  {activeEyePrompt && (
                    <p className="text-xs font-black text-[#0b0d16]/45">{activeEyePrompt}</p>
                  )}
                  <div className="rounded-full bg-[#0b0d16] px-6 py-3 text-sm font-black text-[#faf9f4] shadow-sm">
                    {formatTime(sessionTime)} remaining
                  </div>
                </div>
              </>
            )}
          </section>
        )}
      </main>

      {isActive && (
        <div className="fixed right-4 top-4 z-[95] flex gap-2 sm:right-6 sm:top-6">
          <button
            onClick={toggleFullscreen}
            className="grid h-12 w-12 place-items-center rounded-[1rem] border border-[#0b0d16]/10 bg-[#faf9f4]/78 text-[#0b0d16]/70 shadow-sm backdrop-blur transition-[background-color,color,transform] duration-200 hover:bg-[#faf9f4] hover:text-[#0b0d16] active:scale-95"
            aria-label={fullscreenActive ? 'Exit fullscreen' : 'Enter fullscreen'}
            title={fullscreenActive ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
              {fullscreenActive ? (
                <path d="M9 9H5V7h2V5h2v4zm10-2v2h-4V5h2v2h2zM7 17H5v-2h4v4H7v-2zm10-2h2v2h-2v2h-2v-4h2z" />
              ) : (
                <path d="M5 5h6v2H7v4H5V5zm12 2h-4V5h6v6h-2V7zM7 13v4h4v2H5v-6h2zm12 0v6h-6v-2h4v-4h2z" />
              )}
            </svg>
          </button>

          <button
            onClick={() => setIsActive(false)}
            className="grid h-12 w-12 place-items-center rounded-[1rem] border border-[#0b0d16]/10 bg-[#faf9f4]/78 text-[#0b0d16]/70 shadow-sm backdrop-blur transition-[background-color,color,transform] duration-200 hover:bg-[#faf9f4] hover:text-[#0b0d16] active:scale-95"
            aria-label="Exit session"
            title="Exit session"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
              <path d="m18.3 6.7-1-1L12 11 6.7 5.7l-1 1L11 12l-5.3 5.3 1 1L12 13l5.3 5.3 1-1L13 12l5.3-5.3z" />
            </svg>
          </button>
        </div>
      )}

      {showIOSInstructions && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#0b0d16]/35 p-4 backdrop-blur-sm sm:items-center" onClick={() => setShowIOSInstructions(false)}>
          <div
            className="w-full max-w-sm space-y-6 rounded-[2rem] bg-[#faf9f4] p-6 text-[#0b0d16] shadow-[0_28px_90px_hsl(24_30%_18%/0.24)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="space-y-2 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-[1rem] bg-[#bfe6b8] text-[#0b0d16]">
                <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true">
                  <path d="M12 3 7 8h3v7h4V8h3l-5-5zM5 18h14v2H5v-2z" />
                </svg>
              </div>
              <h3 className="text-3xl font-black leading-none tracking-normal text-[#0b0d16]">Install app</h3>
              <p className="text-sm font-semibold leading-6 text-[#0b0d16]/58">Add this tool to your home screen for quick access.</p>
            </div>

            <div className="space-y-3">
              {['Tap Share in Safari', 'Select Add to Home Screen'].map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-[1rem] bg-[#e6e1da] p-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#0b0d16] text-sm font-black text-[#faf9f4]">
                    {index + 1}
                  </span>
                  <p className="text-sm font-bold text-[#0b0d16]/70">{step}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full rounded-[1rem] bg-[#0b0d16] px-5 py-4 font-black text-[#faf9f4] transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-[0.98]"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {showCelebration && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#0b0d16]/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm space-y-6 rounded-[2rem] bg-[#faf9f4] p-7 text-center text-[#0b0d16] shadow-[0_28px_90px_hsl(24_30%_18%/0.24)]">
            <div className="space-y-3">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#f5ad3f] text-[#0b0d16]">
                <svg viewBox="0 0 24 24" className="h-8 w-8 fill-current" aria-hidden="true">
                  <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.5 1.9 4.6 4.4 4.9.7 1.4 2 2.5 3.6 2.9V19H7v2h10v-2h-4v-3.2c1.6-.4 2.9-1.5 3.6-2.9C19.1 12.6 21 10.5 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.7C5.8 10.3 5 9.3 5 8zm14 0c0 1.3-.8 2.3-2 2.7V7h2v1z" />
                </svg>
              </div>
              <h3 className="text-4xl font-black leading-none tracking-normal text-[#0b0d16]">Excellent work</h3>
              <p className="text-sm font-semibold leading-6 text-[#0b0d16]/58">
                You completed the {activeView === 'BREATHING' ? 'breathing' : 'eye gymnastics'} protocol.
              </p>
            </div>

            <button
              onClick={() => {
                setShowCelebration(false)
                setActiveView('MENU')
              }}
              className="w-full rounded-[1rem] bg-[#0b0d16] px-5 py-4 font-black text-[#faf9f4] transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-[0.98]"
            >
              Finish session
            </button>
          </div>
        </div>
      )}

      {showLandscapeHint && activeView === 'EYE_GYM' && isActive && (
        <div className="fixed bottom-20 left-4 right-4 z-[90] sm:hidden">
          <div className="flex items-center gap-3 rounded-[1rem] bg-[#faf9f4]/82 p-3 text-[#0b0d16]/72 shadow-sm backdrop-blur">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[0.8rem] bg-[#0b0d16] text-[#faf9f4]">
              <svg viewBox="0 0 24 24" className="h-5 w-5 rotate-90 fill-current" aria-hidden="true">
                <path d="M7 2h10c1.1 0 2 .9 2 2v16c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm0 4v12h10V6H7z" />
              </svg>
            </div>
            <p className="flex-1 text-xs font-bold leading-5">Landscape mode gives the eyes more room to move.</p>
            <button
              onClick={() => setShowLandscapeHint(false)}
              className="grid h-8 w-8 place-items-center rounded-[0.8rem] text-[#0b0d16]/70 transition-[background-color] duration-200 hover:bg-[#0b0d16]/10"
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
