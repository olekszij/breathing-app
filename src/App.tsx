import { useState, useEffect, useRef } from 'react'

const PHASES = [
  {
    nameEn: 'Inhale',
    color: 'text-inhale',
    bg: 'bg-inhale',
    full: 'var(--color-inhale)',
    icon: <svg viewBox="0 0 24 24" className="w-12 h-12 md:w-16 md:h-16 mb-2 fill-current"><path d="M12 4l-8 8h5v8h6v-8h5z" /></svg>
  },
  {
    nameEn: 'Hold (Full)',
    color: 'text-hold',
    bg: 'bg-hold',
    full: 'var(--color-hold)',
    icon: <svg viewBox="0 0 24 24" className="w-10 h-10 md:w-14 md:h-14 mb-2 fill-current"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
  },
  {
    nameEn: 'Exhale',
    color: 'text-exhale',
    bg: 'bg-exhale',
    full: 'var(--color-exhale)',
    icon: <svg viewBox="0 0 24 24" className="w-12 h-12 md:w-16 md:h-16 mb-2 fill-current"><path d="M12 20l8-8h-5V4h-6v8H4z" /></svg>
  },
  {
    nameEn: 'Hold (Empty)',
    color: 'text-hold',
    bg: 'bg-hold',
    full: 'var(--color-hold)',
    icon: <svg viewBox="0 0 24 24" className="w-10 h-10 md:w-14 md:h-14 mb-2 fill-current"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
  },
]

type AppView = 'MENU' | 'BREATHING' | 'EYE_GYM'

const EXERCISES = [
  {
    id: 'BREATHING',
    type: 'BREATHING' as const,
    title: 'Square Breath',
    subtitle: 'CO2 Tolerance',
    desc: 'Square breathing technique to regulate nervous system and build CO2 tolerance.',
    icon: <div className="w-8 h-8 sm:w-12 sm:h-12 border-2 sm:border-4 border-primary rounded-lg rotate-12 opacity-80" />,
    color: 'text-primary',
    bg: 'bg-primary/10'
  },
  {
    id: 'ACCOMMODATION',
    type: 'EYE_GYM' as const,
    title: 'Accommodation',
    subtitle: 'Dynamic Focus',
    desc: 'Focus on the dot as it changes size to train lens muscles and reduce strain.',
    icon: <svg viewBox="0 0 24 24" className="w-full h-full fill-current"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" /></svg>,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10'
  },
  {
    id: 'PURSUIT',
    type: 'EYE_GYM' as const,
    title: 'Smoothing',
    subtitle: 'Infinity Tracking',
    desc: 'Follow the dot as it traces an infinity path to improve muscle coordination.',
    icon: <svg viewBox="0 0 24 24" className="w-full h-full fill-current"><path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z" /></svg>,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10'
  },
  {
    id: 'SACCADES',
    type: 'EYE_GYM' as const,
    title: 'Saccades',
    subtitle: 'Rapid Jump',
    desc: 'Follow the dot as it jumps between random positions to increase acquisition speed.',
    icon: <svg viewBox="0 0 24 24" className="w-full h-full fill-current"><path d="M7 2v10h3l-4 4-4-4h3V2h2zm14 10h-3V2h-2v10h-3l4 4 4-4z" /></svg>,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10'
  },
  {
    id: 'CONVERGENCE',
    type: 'EYE_GYM' as const,
    title: 'Bilateral',
    subtitle: 'Vergence Training',
    desc: 'Focus as two dots merge and separate to train binocular vision and depth.',
    icon: <svg viewBox="0 0 24 24" className="w-full h-full fill-current"><path d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z" /></svg>,
    color: 'text-indigo-400',
    bg: 'bg-indigo-400/10'
  }
]

function App() {
  const [activeView, setActiveView] = useState<AppView>('MENU')
  const [isActive, setIsActive] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0)
  const currentPhaseIndexRef = useRef(0)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showLandscapeHint, setShowLandscapeHint] = useState(true)
  const [showGrid, setShowGrid] = useState(() => localStorage.getItem('showGrid') === 'true')

  useEffect(() => {
    localStorage.setItem('showGrid', showGrid.toString())
  }, [showGrid])

  // Cleanup lingered Service Workers from other projects on the same port
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
    }
  }, [])

  // Settings
  const [speed, setSpeed] = useState(1)

  const lastTimeRef = useRef<number>(0)
  const elapsedRef = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const secondDotRef = useRef<HTMLDivElement>(null)
  // Eye Gym Settings
  const [eyeGymMode, setEyeGymMode] = useState<'ACCOMMODATION' | 'PURSUIT' | 'SACCADES' | 'CONVERGENCE'>('ACCOMMODATION')
  const containerSizeRef = useRef({ width: 0, height: 0 })
  const speedRef = useRef(speed)
  const saccadeTimerRef = useRef(0)
  const saccadePosRef = useRef({ x: 0, y: 0 })

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
  }, [activeView])

  const [sessionTime, setSessionTime] = useState(120) // 2 minutes in seconds

  useEffect(() => {
    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(isIOSDevice)

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  useEffect(() => {
    let interval: any
    if (isActive && (activeView === 'EYE_GYM' || activeView === 'BREATHING')) {
      interval = setInterval(() => {
        setSessionTime(prev => {
          if (prev <= 1) {
            setIsActive(false)
            setShowCelebration(true)
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isActive, activeView])

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true)
      return
    }
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }

  useEffect(() => {
    if (!isActive) return

    let frameId: number

    const tick = (now: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = now
      }
      const delta = now - lastTimeRef.current
      lastTimeRef.current = now

      elapsedRef.current = (elapsedRef.current + delta * speedRef.current)

      if (activeView === 'BREATHING') {
        const duration = 16000
        const time = elapsedRef.current % duration

        if (dotRef.current && containerRef.current) {
          const phaseIdx = Math.floor(time / 4000)
          const phaseElapsed = time % 4000
          const progress = phaseElapsed / 4000

          if (phaseIdx !== currentPhaseIndexRef.current) {
            currentPhaseIndexRef.current = phaseIdx
            setCurrentPhaseIndex(phaseIdx)
          }

          const side = containerSizeRef.current.width || 300
          const r = 32 // radius of the corner curve in pixels

          let targetX = 0, targetY = 0
          if (phaseIdx === 0) { targetX = progress * side; targetY = 0 }
          else if (phaseIdx === 1) { targetX = side; targetY = progress * side }
          else if (phaseIdx === 2) { targetX = (1 - progress) * side; targetY = side }
          else { targetX = 0; targetY = (1 - progress) * side }

          // Clamping to curved corners using pixel math for sub-pixel smoothness
          let x = targetX, y = targetY
          if (targetX < r && targetY < r) {
            const dx = r - targetX, dy = r - targetY
            const d = Math.sqrt(dx * dx + dy * dy)
            if (d > 0) { x = r - (dx / d) * r; y = r - (dy / d) * r }
          } else if (targetX > side - r && targetY < r) {
            const dx = targetX - (side - r), dy = r - targetY
            const d = Math.sqrt(dx * dx + dy * dy)
            if (d > 0) { x = (side - r) + (dx / d) * r; y = r - (dy / d) * r }
          } else if (targetX > side - r && targetY > side - r) {
            const dx = targetX - (side - r), dy = targetY - (side - r)
            const d = Math.sqrt(dx * dx + dy * dy)
            if (d > 0) { x = (side - r) + (dx / d) * r; y = (side - r) + (dy / d) * r }
          } else if (targetX < r && targetY > side - r) {
            const dx = r - targetX, dy = targetY - (side - r)
            const d = Math.sqrt(dx * dx + dy * dy)
            if (d > 0) { x = r - (dx / d) * r; y = (side - r) + (dy / d) * r }
          }

          dotRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate3d(-50%, -50%, 0)`
        }
      } else if (activeView === 'EYE_GYM') {
        if (dotRef.current) {
          const t = elapsedRef.current / 1000
          const side = containerSizeRef.current.width || 300
          const centerX = side / 2
          const centerY = (containerSizeRef.current.height || 300) / 2

          if (eyeGymMode === 'ACCOMMODATION') {
            const scale = 0.5 + Math.abs(Math.sin(t * 0.5)) * 2
            dotRef.current.style.transform = `translate3d(${centerX}px, ${centerY}px, 0) translate3d(-50%, -50%, 0) scale(${scale})`
          } else if (eyeGymMode === 'PURSUIT') {
            const radius = Math.min(centerX, centerY) * 0.8
            const denom = 1 + Math.pow(Math.sin(t), 2)
            const x = (radius * Math.cos(t)) / denom
            const y = (radius * Math.sin(t) * Math.cos(t)) / denom
            dotRef.current.style.transform = `translate3d(${centerX + x}px, ${centerY + y}px, 0) translate3d(-50%, -50%, 0)`
          } else if (eyeGymMode === 'SACCADES') {
            saccadeTimerRef.current += delta
            if (saccadeTimerRef.current > 1000 / speedRef.current) {
              saccadeTimerRef.current = 0
              saccadePosRef.current = {
                x: (0.1 + Math.random() * 0.8) * side,
                y: (0.1 + Math.random() * 0.8) * (containerSizeRef.current.height || 300)
              }
            }
            dotRef.current.style.transform = `translate3d(${saccadePosRef.current.x}px, ${saccadePosRef.current.y}px, 0) translate3d(-50%, -50%, 0)`
          } else if (eyeGymMode === 'CONVERGENCE') {
            const dist = Math.abs(Math.sin(t * 0.5)) * (side * 0.4)
            dotRef.current.style.transform = `translate3d(${centerX - dist}px, ${centerY}px, 0) translate3d(-50%, -50%, 0)`

            if (secondDotRef.current) {
              secondDotRef.current.style.transform = `translate3d(${centerX + dist}px, ${centerY}px, 0) translate3d(-50%, -50%, 0)`
            }
          }
        }
      }
      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [isActive, activeView, eyeGymMode])

  const toggleActive = () => {
    if (!isActive) lastTimeRef.current = performance.now()
    setIsActive(!isActive)
  }

  const reset = () => {
    setIsActive(false)
    elapsedRef.current = 0
    lastTimeRef.current = 0
    currentPhaseIndexRef.current = 0
    setCurrentPhaseIndex(0)
    setSessionTime(120)
    if (dotRef.current) {
      dotRef.current.style.left = '0'
      dotRef.current.style.top = '0'
      dotRef.current.style.transform = 'translate3d(0, 0, 0) translate3d(-50%, -50%, 0) scale(1)'
    }
  }

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        const elem = document.documentElement as any
        if (elem.requestFullscreen) await elem.requestFullscreen()
        else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen()
        else if (elem.msRequestFullscreen) await elem.msRequestFullscreen()
      } else {
        if (document.exitFullscreen) await document.exitFullscreen()
        else if ((document as any).webkitExitFullscreen) await (document as any).webkitExitFullscreen()
        else if ((document as any).msExitFullscreen) await (document as any).msExitFullscreen()
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed:', err)
    }
  }

  const currentPhase = PHASES[currentPhaseIndex] || PHASES[0]

  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center justify-center p-4 relative text-foreground transition-all duration-1000 ${showGrid ? 'bg-grid' : ''}`}
      style={{ backgroundColor: (isActive && activeView === 'BREATHING') ? currentPhase.full : '#FFF9C4' }}
    >
      {/* Navigation Layer */}
      {/* Desktop & Tablet Navigation - Hidden now, using Global Hamburger */}

      {/* Global Header Bar */}
      {!isActive && (
        <div className="fixed top-0 left-0 right-0 z-[60] grid grid-cols-3 items-center p-6 pointer-events-none">
          <div /> {/* Left zone */}

          <div className="flex justify-center">
            <button
              onClick={() => { setActiveView('MENU'); setIsActive(false); }}
              className="pointer-events-auto flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-session border border-foreground/5 hover:bg-foreground/10 active:scale-95 transition-all shadow-xl shadow-black/5"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-primary"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" /></svg>
              <span className="text-[11px] font-black uppercase tracking-[0.5em] text-foreground/90 ml-1">Protocols</span>
            </button>
          </div>

          {/* Settings Group */}
          <div className="flex justify-end gap-3 pointer-events-auto">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-3 rounded-2xl transition-all border ${showGrid ? 'bg-foreground text-background border-transparent shadow-lg' : 'bg-background/20 backdrop-blur-md border-foreground/10 text-foreground hover:bg-background/40'}`}
              title="Toggle Grid"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z" /></svg>
            </button>
            {/* Fullscreen handled as simple toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-3 rounded-xl bg-session border border-foreground/10 text-foreground/40 active:scale-95 transition-all"
              title="Toggle Fullscreen"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* Global Menu Removed */}

      <div className={`z-10 flex flex-col items-center gap-10 w-full transition-all duration-700 ${isActive && activeView === 'EYE_GYM' ? 'max-w-none h-full' : 'max-w-7xl'}`}>
        {activeView === 'MENU' && (
          <div className="flex flex-col items-center gap-8 w-full max-w-5xl animate-in fade-in zoom-in duration-700 pt-20 sm:pt-0">
            <header className="text-center space-y-2">
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight uppercase text-foreground/90 leading-none">
                Protocols
              </h1>
              <p className="text-foreground/30 font-bold uppercase tracking-[0.3em] text-[10px] sm:text-xs">
                Adaptive Wellness System
              </p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full px-6">
              {EXERCISES.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => {
                    if (ex.type === 'BREATHING') {
                      setActiveView('BREATHING');
                    } else {
                      setEyeGymMode(ex.id as any);
                      setActiveView('EYE_GYM');
                    }
                    setSpeed(1);
                    reset();
                  }}
                  className="group relative flex flex-col p-6 rounded-[2rem] bg-white border border-transparent shadow-xl hover:shadow-2xl transition-all active:scale-[0.98] text-left overflow-hidden h-full"
                >
                  <div className={`w-12 h-12 mb-6 rounded-2xl flex items-center justify-center ${ex.bg}`}>
                    <div className="w-8 h-8 flex items-center justify-center p-1 text-foreground">
                      {ex.icon}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className={`text-[10px] font-black tracking-[0.2em] uppercase ${ex.color}`}>
                        {ex.subtitle}
                      </span>
                      <h2 className="text-2xl font-black tracking-tight leading-none uppercase mt-1 text-foreground/90">
                        {ex.title}
                      </h2>
                    </div>
                    <p className="text-foreground/50 text-xs font-medium leading-relaxed">
                      {ex.desc}
                    </p>
                  </div>
                  {/* Subtle Arrow */}
                  <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-40 transition-opacity">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" /></svg>
                  </div>
                </button>
              ))}
            </div>

            {(deferredPrompt || isIOS) && (
              <button
                onClick={handleInstallClick}
                className="px-8 py-3 rounded-xl bg-foreground text-background font-black uppercase tracking-widest text-[10px] hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-foreground/5"
              >
                Install App
              </button>
            )}
          </div>
        )}

        {activeView === 'BREATHING' && (
          <div className={`flex flex-col items-center gap-2 sm:gap-6 w-full animate-in fade-in duration-700 ${isActive ? 'h-screen justify-center' : 'pt-16 sm:pt-20'}`}>
            {!isActive && (
              <header className="text-center space-y-0.5 sm:space-y-1">
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight uppercase text-foreground/80 leading-none">
                  Square Breath
                </h1>
                <p className="text-foreground/30 font-bold uppercase tracking-[0.2em] text-[8px] sm:text-xs">
                  Respiration Sync Protocol
                </p>
              </header>
            )}

            <div ref={containerRef} className="relative w-[80vw] h-[80vw] max-w-[min(70vh,600px)] max-h-[min(70vh,600px)] transition-all duration-700 ease-out aspect-square">
              <div className={`absolute inset-0 rounded-[2rem] transition-all duration-500 ${isActive && activeView === 'BREATHING' ? 'bg-white shadow-2xl border-none' : 'border-2 border-foreground/5 bg-foreground/[0.01]'}`} />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center pointer-events-none">
                <div
                  className="transition-all duration-1000 flex flex-col items-center"
                  style={{ color: isActive ? currentPhase.full : '' }}
                >
                  {isActive && (
                    <div className="animate-in fade-in zoom-in duration-500">
                      {currentPhase.icon}
                    </div>
                  )}
                  <div className={`text-4xl md:text-7xl font-black tracking-tighter opacity-100 flex flex-col items-center leading-[0.9] ${isActive ? '' : 'text-foreground/20'}`}>
                    {isActive ? currentPhase.nameEn.split(' ').map((word, i) => <span key={i}>{word}</span>) : 'Ready?'}
                  </div>
                </div>
              </div>
              {isActive && (
                <div ref={dotRef} className="absolute left-0 top-0 w-6 h-6 md:w-8 md:h-8 rounded-full transition-colors duration-300 bg-black shadow-lg will-change-transform" style={{ transform: 'translate3d(-50%, -50%, 0)' }} />
              )}
            </div>

            <div className="flex w-full max-w-sm flex-col gap-6">
              {isActive && (
                <div className="px-6 py-2 rounded-full bg-session border border-foreground/10 text-session text-sm font-black tracking-widest backdrop-blur-sm mx-auto mb-2 animate-in fade-in slide-in-from-bottom duration-500">
                  {Math.floor(sessionTime / 60)}:{Math.floor(sessionTime % 60).toString().padStart(2, '0')} remaining
                </div>
              )}
              <div className="flex w-full gap-4">
                {!isActive ? (
                  <button onClick={toggleActive} className="flex-1 py-5 rounded-2xl font-black text-xl bg-foreground text-background shadow-lg transition-all active:scale-95">Start</button>
                ) : (
                  <button onClick={reset} className="flex-1 py-5 rounded-2xl bg-session border border-foreground/10 text-session font-black text-xl hover:bg-foreground/10 active:scale-95">Reset</button>
                )}
              </div>
              <div className="flex gap-6 items-center justify-center">
                {PHASES.map((phase, i) => <div key={i} className={`w-3 h-3 rounded-full transition-all duration-500 ${currentPhaseIndex === i && isActive ? `${phase.bg} scale-150 shadow-sm` : 'bg-foreground/5'}`} />)}
              </div>
            </div>
          </div>
        )}

        {activeView === 'EYE_GYM' && (
          <div className={`flex flex-col items-center gap-2 w-full animate-in fade-in duration-700 ${isActive ? 'h-screen justify-center' : 'pt-24 sm:pt-0'}`}>
            {!isActive && (
              <div className="flex flex-col items-center gap-4 w-full max-w-xl px-6 animate-in fade-in duration-700 mb-8">
                <header className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-foreground/90 leading-none uppercase">
                    {EXERCISES.find(ex => ex.id === eyeGymMode)?.title}
                  </h1>
                  <p className="text-foreground/30 font-bold uppercase tracking-[0.3em] text-[10px]">
                    Visual Performance Protocol
                  </p>
                </header>

                <div className="p-6 rounded-3xl bg-foreground/[0.02] border border-foreground/5 w-full space-y-3">
                  <p className="text-foreground/60 text-sm sm:text-base font-medium leading-relaxed text-center italic">
                    {EXERCISES.find(ex => ex.id === eyeGymMode)?.desc}
                  </p>
                </div>
              </div>
            )}

            <div ref={containerRef} className={`relative transition-all duration-700 ease-out ${isActive ? 'w-screen h-screen' : 'w-[85vw] h-[25vh] max-w-7xl'}`}>
              <div className={`absolute inset-0 border-2 border-foreground/5 bg-foreground/[0.01] transition-all duration-700 ${isActive ? 'rounded-none border-transparent' : 'rounded-3xl'}`} />
              {!isActive && (
                <div className="absolute inset-0 flex items-center justify-center -z-10 opacity-[0.02] select-none pointer-events-none overflow-hidden scale-110">
                  <div className="w-64 h-64 border-[40px] border-foreground rounded-full opacity-10" />
                </div>
              )}
              {isActive && (
                <div
                  ref={dotRef}
                  className="absolute left-0 top-0 w-8 h-8 rounded-full transition-colors duration-300 z-10 shadow-md will-change-transform bg-black"
                  style={{
                    transform: 'translate3d(-50%, -50%, 0)',
                  }}
                />
              )}
              {isActive && eyeGymMode === 'CONVERGENCE' && (
                <div
                  ref={secondDotRef}
                  className="absolute left-0 top-0 w-8 h-8 rounded-full transition-colors duration-300 z-10 shadow-md will-change-transform bg-black"
                  style={{
                    transform: 'translate3d(-50%, -50%, 0)',
                  }}
                />
              )}
            </div>

            <div className={`flex flex-col gap-4 sm:gap-6 transition-all duration-700 ${isActive ? 'absolute bottom-8 sm:bottom-12 left-1/2 -translate-x-1/2 w-full max-w-lg px-8' : 'w-full max-w-md px-6'}`}>
              {isActive && (
                <div className="flex flex-col items-center gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom duration-500">
                  <div className="px-4 py-1.5 rounded-full bg-session border border-foreground/10 text-session text-[9px] font-black tracking-widest backdrop-blur-sm sm:text-[10px] sm:px-6 sm:py-2">
                    {Math.floor(sessionTime / 60)}:{Math.floor(sessionTime % 60).toString().padStart(2, '0')} remaining
                  </div>
                </div>
              )}

              {!isActive && (
                <div className="flex w-full gap-4">
                  <button
                    onClick={toggleActive}
                    className="flex-1 py-5 rounded-2xl font-black text-xl transition-all bg-foreground text-background shadow-lg active:scale-95"
                  >
                    Start
                  </button>
                  <div className="flex flex-col justify-center gap-1 px-6 bg-foreground/5 border border-foreground/10 rounded-2xl">
                    <span className="text-[8px] font-black uppercase tracking-widest text-foreground/30">Speed {speed.toFixed(1)}x</span>
                    <input
                      type="range" min="0.5" max="3" step="0.1" value={speed}
                      onChange={(e) => setSpeed(parseFloat(e.target.value))}
                      className="w-24 accent-foreground cursor-pointer h-1"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Top-Right Exit Button during session */}
      {isActive && (
        <button
          onClick={() => setIsActive(false)}
          className="fixed top-6 right-6 z-[95] p-5 rounded-[1.5rem] bg-session border border-foreground/10 text-foreground active:scale-95 transition-all animate-in fade-in slide-in-from-top-4 duration-500 backdrop-blur-xl shadow-2xl"
          title="Exit Session"
        >
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" /></svg>
        </button>
      )}

      {/* iOS Install Prompt - Premium Redesign */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xl p-4 transition-all duration-500" onClick={() => setShowIOSInstructions(false)}>
          <div
            className="bg-card w-full max-w-sm p-8 space-y-8 rounded-[2.5rem] border border-foreground/10 animate-in slide-in-from-bottom sm:zoom-in duration-500 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="space-y-2 text-center">
              <div className="w-16 h-16 bg-foreground/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-foreground/5">
                <svg viewBox="0 0 24 24" className="w-8 h-8 fill-foreground/20"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" /></svg>
              </div>
              <h3 className="text-2xl font-black tracking-tight text-foreground/90">Install App</h3>
              <p className="text-foreground/40 text-sm font-medium">Add this tool to your home screen for quick access during work.</p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4 items-center p-4 bg-foreground/[0.03] rounded-2xl border border-foreground/5 transition-all hover:bg-foreground/[0.05]">
                <span className="w-8 h-8 shrink-0 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-black shadow-lg">1</span>
                <p className="text-sm font-bold text-foreground/70 leading-snug">
                  Tap <span className="text-blue-400">Share</span> in your Safari browser
                </p>
              </div>
              <div className="flex gap-4 items-center p-4 bg-foreground/[0.03] rounded-2xl border border-foreground/5 transition-all hover:bg-foreground/[0.05]">
                <span className="w-8 h-8 shrink-0 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-black shadow-lg">2</span>
                <p className="text-sm font-bold text-foreground/70 leading-snug">
                  Select <span className="text-blue-400">Add to Home Screen</span> from the list
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full py-5 bg-foreground text-background rounded-2xl font-black uppercase tracking-widest text-xs hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-foreground/10"
            >
              Got it
            </button>
          </div>
        </div>
      )}
      {/* Celebration Modal */}
      {showCelebration && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-2xl p-4 animate-in fade-in duration-500">
          <div className="bg-card w-full max-w-sm p-10 space-y-8 rounded-[3rem] border border-foreground/10 text-center animate-in zoom-in slide-in-from-bottom-10 duration-700 shadow-2xl shadow-primary/20">
            <div className="space-y-4">
              <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20 relative">
                <svg viewBox="0 0 24 24" className="w-12 h-12 fill-primary animate-bounce"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V19H7v2h10v-2h-4v-3.1c2.45-.39 4.31-2.4 4.89-4.7L18 9V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82c-1.13-.19-2-.84-2-1.82zm14 0c0 .98-.87 1.63-2 1.82V7h2v1z" /></svg>
                <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping opacity-20" />
              </div>
              <h3 className="text-3xl font-black tracking-tight text-foreground/90 leading-tight">Excellent Work!</h3>
              <p className="text-foreground/50 text-base font-medium leading-relaxed">
                You've successfully completed your {activeView === 'BREATHING' ? 'breathing' : 'eye gymnastics'} protocol. Your body and mind thank you.
              </p>
            </div>

            <button
              onClick={() => { setShowCelebration(false); setActiveView('MENU'); }}
              className="w-full py-5 bg-foreground text-background rounded-2xl font-black uppercase tracking-widest text-xs hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-foreground/10"
            >
              Finish Session
            </button>
          </div>
        </div>
      )}

      {/* Optional Landscape Hint for mobile */}
      {showLandscapeHint && activeView === 'EYE_GYM' && isActive && (
        <div className="fixed bottom-24 left-4 right-4 z-[90] sm:hidden animate-in slide-in-from-bottom duration-500">
          <div className="bg-foreground/90 backdrop-blur-xl text-background p-4 rounded-2xl flex items-center gap-4 shadow-2xl">
            <div className="w-10 h-10 border border-background/20 rounded-lg flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current rotate-90"><path d="M7 2h10c1.1 0 2 .9 2 2v16c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm0 4v12h10V6H7z" /></svg>
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold leading-tight uppercase tracking-widest opacity-60">Pro Tip</p>
              <p className="text-xs font-bold leading-tight">Landscape mode provides 2x more eye muscle amplitude.</p>
            </div>
            <button
              onClick={() => setShowLandscapeHint(false)}
              className="p-2 ml-2 hover:bg-background/10 rounded-full transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
