import { useState, useEffect, useRef } from 'react'

const PHASES = [
  { nameEn: 'Inhale', color: 'text-inhale', bg: 'bg-inhale', glow: 'rgba(100, 255, 180, 0.4)' },
  { nameEn: 'Hold (Full)', color: 'text-hold', bg: 'bg-hold', glow: 'rgba(255, 220, 150, 0.4)' },
  { nameEn: 'Exhale', color: 'text-exhale', bg: 'bg-exhale', glow: 'rgba(150, 220, 255, 0.4)' },
  { nameEn: 'Hold (Empty)', color: 'text-hold', bg: 'bg-hold', glow: 'rgba(255, 220, 150, 0.4)' },
]

type AppView = 'MENU' | 'BREATHING' | 'EYE_GYM'

const EYE_GYM_MODES = {
  ACCOMMODATION: {
    title: 'Accommodation',
    subtitle: 'Dynamic Focus',
    desc: 'Focus on the dot as it changes size. This forces your ciliary muscles to contract and relax, preventing computer vision syndrome.',
    benefit: 'Strengthens the lens-focusing mechanism and reduces near-point strain.',
    icon: <svg viewBox="0 0 24 24" className="w-full h-full fill-current"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" /></svg>
  },
  PURSUIT: {
    title: 'Smoothing',
    subtitle: 'Infinity Tracking',
    desc: 'Follow the dot as it traces a precise Lemniscate of Bernoulli (Infinity path). Keep your head still and follow only with your eyes.',
    benefit: 'Improves coordination of all six extraocular muscles.',
    icon: <svg viewBox="0 0 24 24" className="w-full h-full fill-current"><path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z" /></svg>
  },
  SACCADES: {
    title: 'Saccades',
    subtitle: 'Rapid Jump Training',
    desc: 'Follow the dot as it instantly jumps between random positions. This trains the brain to acquisition targets faster.',
    benefit: 'Increases reading speed and visual reaction time.',
    icon: <svg viewBox="0 0 24 24" className="w-full h-full fill-current"><path d="M7 2v10h3l-4 4-4-4h3V2h2zm14 10h-3V2h-2v10h-3l4 4 4-4z" /></svg>
  },
  CONVERGENCE: {
    title: 'Bilateral',
    subtitle: 'Vergence Training',
    desc: 'Two dots move toward and away from each other. Focus as they merge and separate to train binocular vision.',
    benefit: 'Corrects double vision and improves 3D depth perception.',
    icon: <svg viewBox="0 0 24 24" className="w-full h-full fill-current"><path d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z" /></svg>
  }
}

function App() {
  const [activeView, setActiveView] = useState<AppView>('MENU')
  const [isActive, setIsActive] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showLandscapeHint, setShowLandscapeHint] = useState(true)
  const [isDarkMode] = useState(true)

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

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
  const [showGrid, setShowGrid] = useState(false)
  const [speed, setSpeed] = useState(1)

  const lastTimeRef = useRef<number>(0)
  const elapsedRef = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const secondDotRef = useRef<HTMLDivElement>(null)
  // Eye Gym Settings
  const [eyeGymMode, setEyeGymMode] = useState<'ACCOMMODATION' | 'PURSUIT' | 'SACCADES' | 'CONVERGENCE'>('ACCOMMODATION')
  const [eyeGymTheme, _setEyeGymTheme] = useState<'BLUE' | 'GREEN' | 'AMBER'>('GREEN')
  const [sessionTime, setSessionTime] = useState(120) // 2 minutes in seconds
  const saccadeTimerRef = useRef<number>(0)
  const saccadePosRef = useRef({ x: 50, y: 50 })
  const containerSizeRef = useRef({ width: 0, height: 0 })
  const speedRef = useRef(speed)

  useEffect(() => {
    speedRef.current = speed
  }, [speed])

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        containerSizeRef.current = { width: rect.width, height: rect.height }
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [activeView]) // Re-run when view changes as container might change size or exist/not exist

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

          if (phaseIdx !== currentPhaseIndex) {
            setCurrentPhaseIndex(phaseIdx)
          }

          const side = containerSizeRef.current.width || 300
          const r = 32
          const p = (r / side) * 100

          let sx = 0, sy = 0
          if (phaseIdx === 0) { sx = progress * 100; sy = 0 }
          else if (phaseIdx === 1) { sx = 100; sy = progress * 100 }
          else if (phaseIdx === 2) { sx = (1 - progress) * 100; sy = 100 }
          else { sx = 0; sy = (1 - progress) * 100 }

          let x = sx, y = sy
          if (sx < p && sy < p) {
            const dx = p - sx, dy = p - sy
            const d = Math.sqrt(dx * dx + dy * dy)
            if (d > 0) { x = p - (dx / d) * p; y = p - (dy / d) * p }
          } else if (sx > 100 - p && sy < p) {
            const dx = sx - (100 - p), dy = p - sy
            const d = Math.sqrt(dx * dx + dy * dy)
            if (d > 0) { x = (100 - p) + (dx / d) * p; y = p - (dy / d) * p }
          } else if (sx > 100 - p && sy > 100 - p) {
            const dx = sx - (100 - p), dy = sy - (100 - p)
            const d = Math.sqrt(dx * dx + dy * dy)
            if (d > 0) { x = (100 - p) + (dx / d) * p; y = (100 - p) + (dy / d) * p }
          } else if (sx < p && sy > 100 - p) {
            const dx = p - sx, dy = sy - (100 - p)
            const d = Math.sqrt(dx * dx + dy * dy)
            if (d > 0) { x = p - (dx / d) * p; y = (100 - p) + (dy / d) * p }
          }

          dotRef.current.style.left = `${x}%`
          dotRef.current.style.top = `${y}%`
          dotRef.current.style.transform = 'translate3d(-50%, -50%, 0)'
        }
      } else if (activeView === 'EYE_GYM') {
        if (dotRef.current) {
          const t = elapsedRef.current / 1000

          if (eyeGymMode === 'ACCOMMODATION') {
            const scale = 0.5 + Math.abs(Math.sin(t * 0.5)) * 2
            dotRef.current.style.left = '50%'
            dotRef.current.style.top = '50%'
            dotRef.current.style.transform = `translate3d(-50%, -50%, 0) scale(${scale})`
          } else if (eyeGymMode === 'PURSUIT') {
            const scale = 40
            const denom = 1 + Math.pow(Math.sin(t), 2)
            const x = (scale * Math.cos(t)) / denom
            const y = (scale * Math.sin(t) * Math.cos(t)) / denom
            dotRef.current.style.left = `${50 + x}%`
            dotRef.current.style.top = `${50 + y}%`
            dotRef.current.style.transform = 'translate3d(-50%, -50%, 0) scale(1)'
          } else if (eyeGymMode === 'SACCADES') {
            saccadeTimerRef.current += delta
            if (saccadeTimerRef.current > 1000 / speedRef.current) {
              saccadeTimerRef.current = 0
              saccadePosRef.current = {
                x: 10 + Math.random() * 80,
                y: 10 + Math.random() * 80
              }
            }
            dotRef.current.style.left = `${saccadePosRef.current.x}%`
            dotRef.current.style.top = `${saccadePosRef.current.y}%`
            dotRef.current.style.transform = 'translate3d(-50%, -50%, 0) scale(1)'
          } else if (eyeGymMode === 'CONVERGENCE') {
            const dist = Math.abs(Math.sin(t * 0.5)) * 40
            dotRef.current.style.left = `${50 - dist}%`
            dotRef.current.style.top = '50%'
            dotRef.current.style.transform = 'translate3d(-50%, -50%, 0) scale(1)'

            if (secondDotRef.current) {
              secondDotRef.current.style.left = `${50 + dist}%`
              secondDotRef.current.style.top = '50%'
              secondDotRef.current.style.transform = 'translate3d(-50%, -50%, 0) scale(1)'
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
    setCurrentPhaseIndex(0)
    setSessionTime(120)
    if (dotRef.current) {
      dotRef.current.style.left = '50%'
      dotRef.current.style.top = '50%'
      dotRef.current.style.transform = 'translate3d(-50%, -50%, 0) scale(1)'
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
    <div className={`min-h-screen w-full flex flex-col items-center justify-center p-4 relative bg-background text-foreground transition-colors duration-500 ${isDarkMode ? 'dark' : ''} ${showGrid ? 'bg-grid' : ''}`}>
      {/* Background Ambient Glow */}
      <div
        className="absolute inset-0 opacity-20 transition-colors duration-1000 blur-[150px]"
        style={{
          background: activeView === 'BREATHING'
            ? `radial-gradient(circle at center, ${currentPhase.glow} 0%, transparent 80%)`
            : eyeGymTheme === 'GREEN'
              ? 'radial-gradient(circle at center, rgba(52, 211, 153, 0.2) 0%, transparent 80%)'
              : eyeGymTheme === 'AMBER'
                ? 'radial-gradient(circle at center, rgba(251, 191, 36, 0.2) 0%, transparent 80%)'
                : 'radial-gradient(circle at center, rgba(59, 130, 246, 0.2) 0%, transparent 80%)'
        }}
      />

      {/* Navigation Layer */}
      {/* Desktop & Tablet Navigation - Hidden now, using Global Hamburger */}
      {!isActive && activeView !== 'MENU' && (
        <div className="absolute top-6 left-6 right-6 z-50 hidden sm:flex justify-between items-center animate-in fade-in slide-in-from-top duration-500">
          <button
            onClick={() => { setActiveView('MENU'); setIsActive(false); }}
            className="px-6 py-3 rounded-xl bg-session border border-foreground/10 text-session font-bold text-xs uppercase tracking-widest hover:bg-foreground/10 active:scale-95 transition-all"
          >
            ← Home
          </button>
        </div>
      )}

      {/* Global Header Bar */}
      {!isActive && (
        <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between p-6 bg-gradient-to-b from-background to-transparent pointer-events-none">
          {/* Logo / Home Button */}
          <button
            onClick={() => { setActiveView('MENU'); setIsActive(false); }}
            className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-session border border-foreground/10 hover:bg-foreground/5 active:scale-95 transition-all"
          >
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/80">Protocols</span>
          </button>

          {/* Settings Group */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-3 rounded-xl bg-session border border-foreground/10 transition-all active:scale-95 ${showGrid ? 'text-primary' : 'text-foreground/40'}`}
              title="Toggle Grid"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8 20H4v-4h4v4zm0-6H4v-4h4v4zm0-6H4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4z" /></svg>
            </button>
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
          <div className="flex flex-col items-center gap-4 sm:gap-8 w-full max-w-2xl animate-in fade-in zoom-in duration-700 pt-16 sm:pt-0">
            <header className="text-center space-y-1 sm:space-y-2 px-4">
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight uppercase text-foreground/90 leading-none">
                Protocols
              </h1>
              <p className="text-foreground/30 font-bold uppercase tracking-[0.3em] text-[8px] sm:text-[10px]">
                Adaptive Wellness System
              </p>
            </header>

            <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3 sm:gap-4 w-full px-6 sm:px-4 max-w-lg sm:max-w-none">
              <button
                onClick={() => { setActiveView('BREATHING'); setSpeed(1); reset(); }}
                className="group relative flex items-center gap-4 sm:flex-col sm:items-start p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] bg-foreground/[0.02] border border-foreground/10 hover:border-foreground/20 transition-all active:scale-[0.98] text-left overflow-hidden w-full"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 bg-primary/10 rounded-2xl flex items-center justify-center sm:absolute sm:top-6 sm:right-6 sm:bg-transparent">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 border-2 sm:border-4 border-primary rounded-lg rotate-12 opacity-40 sm:opacity-5 group-hover:opacity-20" />
                </div>
                <div className="space-y-1 sm:space-y-1">
                  <span className="text-[10px] font-black tracking-[0.2em] text-primary/60 uppercase">01 Breathe</span>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-none uppercase">Square Breath</h2>
                  <p className="text-foreground/40 text-[11px] sm:text-xs font-medium leading-tight">Focus & CO2 tolerance protocol.</p>
                </div>
              </button>

              <button
                onClick={() => { setActiveView('EYE_GYM'); setSpeed(1); reset(); }}
                className="group relative flex items-center gap-4 sm:flex-col sm:items-start p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] bg-foreground/[0.02] border border-foreground/10 hover:border-foreground/20 transition-all active:scale-[0.98] text-left overflow-hidden w-full"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 bg-secondary/10 rounded-2xl flex items-center justify-center sm:absolute sm:top-6 sm:right-6 sm:bg-transparent">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 border-2 sm:border-4 border-secondary rounded-full opacity-40 sm:opacity-5 group-hover:opacity-20" />
                </div>
                <div className="space-y-1 sm:space-y-1">
                  <span className="text-[10px] font-black tracking-[0.2em] text-secondary/60 uppercase">02 Vision</span>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-none uppercase">Eye Gym</h2>
                  <p className="text-foreground/40 text-xs sm:text-sm font-medium leading-tight">Dynamic muscle tension release.</p>
                </div>
              </button>
            </div>

            {(deferredPrompt || isIOS) && (
              <div className="flex gap-3">
                <button
                  onClick={handleInstallClick}
                  className="px-8 py-3 rounded-xl bg-foreground text-background font-black uppercase tracking-widest text-[10px] hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-foreground/5"
                >
                  Install App
                </button>
              </div>
            )}
          </div>
        )}

        {activeView === 'BREATHING' && (
          <div className={`flex flex-col items-center gap-6 sm:gap-10 w-full animate-in fade-in duration-700 ${isActive ? 'h-screen justify-center' : 'pt-20 sm:pt-0'}`}>
            {!isActive && (
              <header className="text-center space-y-1 sm:space-y-2">
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight uppercase text-foreground/80 leading-none">
                  Square Breath
                </h1>
                <p className="text-foreground/30 font-bold uppercase tracking-[0.2em] text-[8px] sm:text-xs">
                  Respiration Sync Protocol
                </p>
              </header>
            )}

            <div ref={containerRef} className="relative w-[80vw] h-[80vw] max-w-[min(65vh,800px)] max-h-[min(65vh,800px)] transition-all duration-700 ease-out">
              <div className="absolute inset-0 border-2 border-foreground/5 bg-foreground/[0.01] rounded-[2rem]" />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center pointer-events-none">
                <div className={`text-5xl md:text-8xl font-black tracking-tighter transition-all duration-500 scale-105 ${currentPhase.color} opacity-80 flex flex-col items-center leading-[0.9]`}>
                  {isActive ? currentPhase.nameEn.split(' ').map((word, i) => <span key={i}>{word}</span>) : 'Ready?'}
                </div>
              </div>
              {isActive && (
                <div ref={dotRef} className={`absolute w-6 h-6 md:w-8 md:h-8 rounded-full transition-colors duration-300 ${currentPhase.bg} shadow-md`} style={{ transform: 'translate3d(-50%, -50%, 0)', boxShadow: `0 0 40px 10px ${currentPhase.glow}, inset 0 0 10px rgba(255,255,255,0.4)` }} />
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
          <div className={`flex flex-col items-center gap-2 w-full animate-in fade-in duration-700 ${isActive ? 'h-screen justify-center' : 'pt-16 sm:pt-0'}`}>
            {!isActive && (
              <div className="flex flex-col items-center gap-4 sm:gap-8 w-full max-w-xl px-6 animate-in fade-in duration-700">
                <header className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-foreground/90 leading-none uppercase px-4">
                    Eye Gymnastics
                  </h1>
                  <p className="text-foreground/30 font-bold uppercase tracking-[0.3em] text-[10px]">
                    Visual Performance Protocol
                  </p>
                </header>

                <div className="w-full space-y-4">
                  <div className="flex items-center gap-4 px-2">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground/40">Eye Gym Modes</span>
                    <div className="h-px bg-foreground/5 flex-1" />
                  </div>

                  <div className="flex justify-center gap-4 w-full">
                    {(['ACCOMMODATION', 'PURSUIT', 'SACCADES', 'CONVERGENCE'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => { setEyeGymMode(mode); reset(); }}
                        className={`w-14 h-14 sm:w-20 sm:h-20 rounded-[1.25rem] sm:rounded-[2rem] flex items-center justify-center transition-all border-4 ${eyeGymMode === mode
                          ? 'bg-foreground text-background border-foreground shadow-[0_15px_30px_rgba(0,0,0,0.3)] scale-[1.15] z-10'
                          : 'bg-foreground/[0.03] text-foreground/20 border-transparent hover:bg-foreground/[0.05] hover:text-foreground/40'
                          }`}
                        title={EYE_GYM_MODES[mode].title}
                      >
                        <div className="w-8 h-8 sm:w-12 sm:h-12 p-1">{EYE_GYM_MODES[mode].icon}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-foreground/[0.02] border border-foreground/5 w-full space-y-2">
                  <div className="text-center">
                    <span className="text-xs font-black uppercase tracking-widest text-foreground/80">{EYE_GYM_MODES[eyeGymMode].title}</span>
                    <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-foreground/30">{EYE_GYM_MODES[eyeGymMode].subtitle}</p>
                  </div>
                  <p className="text-foreground/40 text-[10px] sm:text-xs font-medium leading-relaxed text-center italic">
                    {EYE_GYM_MODES[eyeGymMode].desc}
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
              <div
                ref={dotRef}
                className={`absolute w-8 h-8 rounded-full transition-colors duration-300 z-10 shadow-md ${eyeGymTheme === 'GREEN' ? 'bg-emerald-400' :
                  eyeGymTheme === 'AMBER' ? 'bg-amber-400' : 'bg-blue-500'
                  }`}
                style={{
                  left: '50%',
                  top: '50%',
                  transform: 'translate3d(-50%, -50%, 0)',
                  boxShadow: `0 0 40px 10px ${eyeGymTheme === 'GREEN' ? 'rgba(52, 211, 153, 0.4)' :
                    eyeGymTheme === 'AMBER' ? 'rgba(251, 191, 36, 0.4)' : 'rgba(59, 130, 246, 0.4)'
                    }, inset 0 0 10px rgba(255,255,255,0.4)`
                }}
              />
              {eyeGymMode === 'CONVERGENCE' && (
                <div
                  ref={secondDotRef}
                  className={`absolute w-8 h-8 rounded-full transition-colors duration-300 z-10 shadow-md ${eyeGymTheme === 'GREEN' ? 'bg-emerald-400' :
                    eyeGymTheme === 'AMBER' ? 'bg-amber-400' : 'bg-blue-500'
                    }`}
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: 'translate3d(-50%, -50%, 0)',
                    boxShadow: `0 0 40px 10px ${eyeGymTheme === 'GREEN' ? 'rgba(52, 211, 153, 0.4)' :
                      eyeGymTheme === 'AMBER' ? 'rgba(251, 191, 36, 0.4)' : 'rgba(59, 130, 246, 0.4)'
                      }, inset 0 0 10px rgba(255,255,255,0.4)`
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
