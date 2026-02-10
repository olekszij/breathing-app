import { useState, useEffect, useRef } from 'react'

const PHASES = [
  { nameEn: 'INHALE', color: 'text-inhale', bg: 'bg-inhale', glow: 'rgba(100, 255, 180, 0.4)' },
  { nameEn: 'HOLD (FULL)', color: 'text-hold', bg: 'bg-hold', glow: 'rgba(255, 220, 150, 0.4)' },
  { nameEn: 'EXHALE', color: 'text-exhale', bg: 'bg-exhale', glow: 'rgba(150, 220, 255, 0.4)' },
  { nameEn: 'HOLD (EMPTY)', color: 'text-hold', bg: 'bg-hold', glow: 'rgba(255, 220, 150, 0.4)' },
]

function App() {
  const [isActive, setIsActive] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0)

  const lastTimeRef = useRef<number>(0)
  const elapsedRef = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const totalDuration = 16000 // 4s * 4 phases

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
    let frameId: number

    const tick = (now: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = now
      }
      const delta = now - lastTimeRef.current
      lastTimeRef.current = now

      if (isActive) {
        elapsedRef.current = (elapsedRef.current + delta) % totalDuration

        // Update DOM directly for smoothness
        if (dotRef.current && containerRef.current) {
          const phaseIdx = Math.floor(elapsedRef.current / 4000)
          const phaseElapsed = elapsedRef.current % 4000
          const progress = phaseElapsed / 4000

          // Sync React state only when phase changes
          if (phaseIdx !== currentPhaseIndex) {
            setCurrentPhaseIndex(phaseIdx)
          }

          const rect = containerRef.current.getBoundingClientRect()
          const side = rect.width
          const r = 32 // 2rem = 32px
          const p = (r / side) * 100

          let sx = 0, sy = 0
          if (phaseIdx === 0) { sx = progress * 100; sy = 0 }
          else if (phaseIdx === 1) { sx = 100; sy = progress * 100 }
          else if (phaseIdx === 2) { sx = (1 - progress) * 100; sy = 100 }
          else { sx = 0; sy = (1 - progress) * 100 }

          // Map to rounded path
          let x = sx, y = sy
          if (sx < p && sy < p) { // TL
            const dx = p - sx, dy = p - sy
            const d = Math.sqrt(dx * dx + dy * dy)
            if (d > 0) { x = p - (dx / d) * p; y = p - (dy / d) * p }
          } else if (sx > 100 - p && sy < p) { // TR
            const dx = sx - (100 - p), dy = p - sy
            const d = Math.sqrt(dx * dx + dy * dy)
            if (d > 0) { x = (100 - p) + (dx / d) * p; y = p - (dy / d) * p }
          } else if (sx > 100 - p && sy > 100 - p) { // BR
            const dx = sx - (100 - p), dy = sy - (100 - p)
            const d = Math.sqrt(dx * dx + dy * dy)
            if (d > 0) { x = (100 - p) + (dx / d) * p; y = (100 - p) + (dy / d) * p }
          } else if (sx < p && sy > 100 - p) { // BL
            const dx = p - sx, dy = sy - (100 - p)
            const d = Math.sqrt(dx * dx + dy * dy)
            if (d > 0) { x = p - (dx / d) * p; y = (100 - p) + (dy / d) * p }
          }

          dotRef.current.style.left = `${x}%`
          dotRef.current.style.top = `${y}%`
        }
      }
      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [isActive, currentPhaseIndex])

  const toggleActive = () => {
    if (!isActive) lastTimeRef.current = performance.now()
    setIsActive(!isActive)
  }

  const reset = () => {
    setIsActive(false)
    elapsedRef.current = 0
    lastTimeRef.current = 0
    setCurrentPhaseIndex(0)
    // Reset dot position
    if (dotRef.current) {
      dotRef.current.style.left = '0%'
      dotRef.current.style.top = '0%'
    }
  }

  const currentPhase = PHASES[currentPhaseIndex] || PHASES[0]

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative bg-background text-foreground selection:bg-black/5 transition-colors duration-1000 overflow-hidden">
      {/* Background Ambient Glow - Soft Pastel */}
      <div
        className="absolute inset-0 opacity-20 transition-colors duration-1000 blur-[150px]"
        style={{
          background: `radial-gradient(circle at center, ${currentPhase.glow} 0%, transparent 80%)`
        }}
      />

      <div className="z-10 flex flex-col items-center gap-10 max-w-7xl w-full transition-all duration-700">
        <header className="text-center space-y-2 relative w-full">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight uppercase text-foreground/80">
            Square Breath
          </h1>
          <p className="text-foreground/30 font-bold uppercase tracking-[0.2em] text-xs md:text-sm">
            Eye Gymnastics Protocol
          </p>
        </header>

        {/* Literal Square Visualization - Large and Refined */}
        <div ref={containerRef} className="relative w-[80vw] h-[80vw] max-w-[min(80vh,900px)] max-h-[min(80vh,900px)] transition-all duration-700 ease-out">
          {/* Main Frame */}
          <div className="absolute inset-0 border-2 border-foreground/5 bg-foreground/[0.01] rounded-[2rem]" />


          {/* Core Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center pointer-events-none">
            <div className={`text-4xl md:text-8xl font-black uppercase tracking-tighter transition-all duration-500 scale-105 ${currentPhase.color} opacity-80 flex flex-col items-center leading-none`}>
              {isActive ? (
                currentPhase.nameEn.split(' ').map((word, i) => (
                  <span key={i}>{word}</span>
                ))
              ) : (
                'READY?'
              )}
            </div>
          </div>

          {/* Traveling Smooth Dot - Precise and Calm */}
          {isActive && (
            <div
              ref={dotRef}
              className={`absolute w-6 h-6 md:w-8 md:h-8 rounded-full transition-colors duration-300 ${currentPhase.bg} shadow-md`}
              style={{
                transform: 'translate3d(-50%, -50%, 0)',
                boxShadow: `0 0 40px 10px ${currentPhase.glow}, inset 0 0 10px rgba(255,255,255,0.4)`
              }}
            />
          )}
        </div>

        <div className="flex w-full max-w-sm flex-col gap-4">
          <div className="flex w-full gap-4">
            <button
              onClick={toggleActive}
              className={`flex-1 py-5 rounded-2xl font-black text-xl md:text-2xl uppercase tracking-tight transition-all active:scale-95 ${isActive
                ? 'bg-foreground/5 text-foreground/40 border border-foreground/10'
                : 'bg-foreground text-background hover:opacity-90 shadow-lg shadow-foreground/5'
                }`}
            >
              {isActive ? 'PAUSE' : 'START'}
            </button>
            <button
              onClick={reset}
              className="px-8 py-5 rounded-2xl bg-foreground/5 border border-foreground/10 text-foreground/40 font-black text-xl tracking-tight hover:bg-foreground/10 active:scale-95"
            >
              RESET
            </button>
          </div>

          {(deferredPrompt || isIOS) && (
            <button
              onClick={handleInstallClick}
              className="w-full py-3 rounded-xl bg-foreground/5 border border-foreground/5 text-foreground/20 font-bold text-xs uppercase tracking-widest hover:bg-foreground/10 transition-all active:scale-95"
            >
              Install App
            </button>
          )}
        </div>

        {/* Status Indicators */}
        <div className="flex gap-6 items-center">
          {PHASES.map((phase, i) => (
            <div key={i} className={`w-3 h-3 rounded-full transition-all duration-500 ${currentPhaseIndex === i && isActive ? `${phase.bg} scale-150 shadow-sm` : 'bg-foreground/5'}`} />
          ))}
        </div>
      </div>

      {/* iOS Install Prompt */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/10 backdrop-blur-md p-4" onClick={() => setShowIOSInstructions(false)}>
          <div className="bg-background w-full max-w-sm p-8 space-y-6 rounded-[2.5rem] border border-foreground/5 animate-in slide-in-from-bottom duration-300 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="space-y-1 text-center">
              <h3 className="text-xl font-black uppercase tracking-tight">Install App</h3>
              <p className="text-foreground/40 text-sm">Follow these steps to add to your home screen:</p>
            </div>
            <ol className="space-y-4 text-sm font-bold uppercase tracking-tight text-foreground/70">
              <li className="flex gap-4 items-center">
                <span className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-[10px]">1</span>
                <span>Tap <span className="text-blue-500">Share</span> in Safari</span>
              </li>
              <li className="flex gap-4 items-center">
                <span className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-[10px]">2</span>
                <span>Tap <span className="text-blue-500">Add to Home Screen</span></span>
              </li>
            </ol>
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full py-4 bg-foreground text-background rounded-2xl font-black uppercase tracking-widest text-xs"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
