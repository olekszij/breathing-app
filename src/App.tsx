import { useState, useEffect, useRef } from 'react'

const PHASES = [
  { nameEn: 'INHALE', color: 'text-inhale', bg: 'bg-inhale', glow: 'rgba(0, 255, 100, 0.8)' },
  { nameEn: 'HOLD (FULL)', color: 'text-hold', bg: 'bg-hold', glow: 'rgba(255, 200, 0, 0.8)' },
  { nameEn: 'EXHALE', color: 'text-exhale', bg: 'bg-exhale', glow: 'rgba(0, 255, 255, 0.8)' },
  { nameEn: 'HOLD (EMPTY)', color: 'text-hold', bg: 'bg-hold', glow: 'rgba(255, 200, 0, 0.8)' },
]

function App() {
  const [isActive, setIsActive] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  const lastTimeRef = useRef<number>(0)
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
        setElapsed((prev) => (prev + delta) % totalDuration)
      }
      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [isActive])

  const toggleActive = () => {
    if (!isActive) lastTimeRef.current = performance.now()
    setIsActive(!isActive)
  }

  const reset = () => {
    setIsActive(false)
    setElapsed(0)
    lastTimeRef.current = 0
  }

  const phaseIndex = Math.floor(elapsed / 4000)
  const phaseElapsed = elapsed % 4000
  const progress = phaseElapsed / 4000
  const currentPhase = PHASES[phaseIndex]

  // Square Dot Position (Clockwise from Top-Left)
  const getDotStyle = () => {
    if (phaseIndex === 0) return { top: '0%', left: `${progress * 100}%` } // Top: L -> R
    if (phaseIndex === 1) return { top: `${progress * 100}%`, left: '100%' } // Right: T -> B
    if (phaseIndex === 2) return { top: '100%', left: `${(1 - progress) * 100}%` } // Bottom: R -> L
    return { top: `${(1 - progress) * 100}%`, left: '0%' } // Left: B -> T
  }

  const dotPosition = getDotStyle()

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative bg-black text-white selection:bg-white/20 transition-colors duration-1000 overflow-hidden">
      {/* Background Ambient Glow - High Intensity */}
      <div
        className="absolute inset-0 opacity-40 transition-colors duration-1000 blur-[130px]"
        style={{
          background: `radial-gradient(circle at center, ${currentPhase.glow} 0%, transparent 80%)`
        }}
      />

      {/* Background Wash */}
      <div
        className="absolute inset-0 opacity-10 transition-colors duration-1000"
        style={{ backgroundColor: currentPhase.glow }}
      />

      <div className="z-10 flex flex-col items-center gap-12 max-w-lg w-full">
        <header className="text-center space-y-1 relative w-full">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter italic uppercase text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            Square Breath
          </h1>
          <p className="text-white/30 font-bold uppercase tracking-[0.2em] text-xs md:text-sm">
            Strict 4-4-4-4 Protocol
          </p>
        </header>

        {/* Literal Square Visualization */}
        <div className="relative w-72 h-72 md:w-96 md:h-96">
          {/* Main Frame */}
          <div className="absolute inset-0 border-2 border-white/5 bg-white/[0.02]" />

          {/* Edge Glows (Active edge lighting up) */}
          <div className={`absolute top-0 left-0 h-0.5 transition-all duration-300 ${phaseIndex === 0 ? currentPhase.bg + ' shadow-[0_0_15px_currentcolor] w-full' : 'bg-transparent w-0'}`} />
          <div className={`absolute top-0 right-0 w-0.5 transition-all duration-300 ${phaseIndex === 1 ? currentPhase.bg + ' shadow-[0_0_15px_currentcolor] h-full' : 'bg-transparent h-0'}`} />
          <div className={`absolute bottom-0 right-0 h-0.5 transition-all duration-300 ${phaseIndex === 2 ? currentPhase.bg + ' shadow-[0_0_15px_currentcolor] w-full' : 'bg-transparent w-0'}`} />
          <div className={`absolute bottom-0 left-0 w-0.5 transition-all duration-300 ${phaseIndex === 3 ? currentPhase.bg + ' shadow-[0_0_15px_currentcolor] h-full' : 'bg-transparent h-0'}`} />

          {/* Core Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <div className={`text-4xl md:text-6xl font-black italic tracking-tighter transition-all duration-500 scale-110 ${currentPhase.color} drop-shadow-[0_0_10px_currentcolor] flex flex-col items-center leading-none`}>
              {isActive ? (
                currentPhase.nameEn.split(' ').map((word, i) => (
                  <span key={i}>{word}</span>
                ))
              ) : (
                'READY?'
              )}
            </div>
          </div>

          {/* Traveling Comet / Dot */}
          {isActive && (
            <div
              className={`absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-none transition-colors duration-300 ${currentPhase.bg}`}
              style={{
                ...dotPosition,
                boxShadow: `0 0 30px 10px ${currentPhase.glow}`
              }}
            />
          )}
        </div>

        {/* Primary Controls */}
        <div className="flex w-full flex-col gap-4">
          <div className="flex w-full gap-4">
            <button
              onClick={toggleActive}
              className={`flex-1 py-5 rounded-none font-black text-xl md:text-2xl uppercase italic tracking-tighter transition-all active:scale-95 ${isActive
                ? 'bg-white/5 text-white border-2 border-white/20'
                : 'bg-white text-black hover:bg-white/90 shadow-[0_0_30px_rgba(255,255,255,0.2)]'
                }`}
            >
              {isActive ? 'PAUSE' : 'START'}
            </button>
            <button
              onClick={reset}
              className="px-8 py-5 rounded-none bg-transparent border-2 border-white/10 text-white font-black text-xl italic tracking-tighter hover:bg-white/5 active:scale-95"
            >
              RESET
            </button>
          </div>

          {/* Persistent Install Button - Mobile Only */}
          {(deferredPrompt || isIOS) && (
            <button
              onClick={handleInstallClick}
              className="md:hidden fixed top-6 right-6 p-3 rounded-none border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-white/50 hover:text-white group active:scale-95"
              aria-label="Add to home screen"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 fill-none stroke-current stroke-2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M12 8v8m-4-4h8" />
              </svg>
            </button>
          )}
        </div>

        {/* Status Indicators */}
        <div className="flex gap-4 items-center">
          {PHASES.map((phase, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-none transition-all duration-500 ${phaseIndex === i && isActive ? `${phase.bg} shadow-[0_0_10px_currentcolor] scale-125` : 'bg-white/10'}`} />
            </div>
          ))}
        </div>
      </div>

      {/* iOS Modal Mockup / Overlay */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowIOSInstructions(false)}>
          <div className="bg-zinc-900 w-full max-w-sm p-8 space-y-6 border-t-2 border-white/20 animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
            <div className="space-y-2 text-center">
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Install on iOS</h3>
              <p className="text-white/50 text-sm">Follow these steps to add to your home screen:</p>
            </div>
            <ol className="space-y-4 text-sm font-bold uppercase tracking-tight">
              <li className="flex gap-4 items-center">
                <span className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center text-xs">1</span>
                <span>Tap the <span className="text-blue-400">Share</span> button in Safari</span>
              </li>
              <li className="flex gap-4 items-center">
                <span className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center text-xs">2</span>
                <span>Scroll down and tap <span className="text-blue-400">Add to Home Screen</span></span>
              </li>
            </ol>
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-sm"
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
