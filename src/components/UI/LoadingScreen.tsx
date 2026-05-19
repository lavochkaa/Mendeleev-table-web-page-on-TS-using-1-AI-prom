'use client'
import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/store/useStore'

const TITLE_CHARS = 'ELEMENT LABORATORY'.split('')

export default function LoadingScreen() {
  const isLoading = useStore(s => s.isLoading)
  const [count, setCount] = useState(0)
  const [scanY, setScanY] = useState(0)
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Count elements up to 118
  useEffect(() => {
    if (!isLoading) return
    let n = 0
    animRef.current = setInterval(() => {
      n = Math.min(n + 3, 118)
      setCount(n)
      if (n >= 118 && animRef.current) clearInterval(animRef.current)
    }, 35)
    return () => { if (animRef.current) clearInterval(animRef.current) }
  }, [isLoading])

  // Scan line animation
  useEffect(() => {
    if (!isLoading) return
    let y = 0
    const raf = setInterval(() => {
      y = (y + 0.8) % 100
      setScanY(y)
    }, 16)
    return () => clearInterval(raf)
  }, [isLoading])

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(20px)' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Scanning line */}
          <div
            className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-40"
            style={{ top: `${scanY}%`, transition: 'none' }}
          />

          {/* Background grid pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,200,255,0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,200,255,0.3) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }}
          />

          {/* Corner decorations */}
          {['top-4 left-4', 'top-4 right-4', 'bottom-4 left-4', 'bottom-4 right-4'].map((pos, i) => (
            <div key={i} className={`absolute ${pos} w-6 h-6`}>
              <div className="absolute top-0 left-0 w-full h-px bg-cyan-400 opacity-60" />
              <div className="absolute top-0 left-0 w-px h-full bg-cyan-400 opacity-60" />
            </div>
          ))}

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center gap-8">
            {/* Animated atom icon */}
            <motion.div
              className="relative w-20 h-20"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            >
              <div className="absolute inset-0 rounded-full border border-cyan-400/30" />
              <div className="absolute inset-2 rounded-full border border-cyan-400/20" style={{ transform: 'rotateX(60deg)' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_#00ccff]" />
              </div>
            </motion.div>

            {/* Title with character stagger */}
            <div className="flex gap-1">
              {TITLE_CHARS.map((char, i) => (
                <motion.span
                  key={i}
                  className={`font-display text-2xl tracking-widest ${
                    char === ' ' ? 'w-4' : 'text-white'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: i * 0.04,
                    duration: 0.4,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  style={{ textShadow: '0 0 20px rgba(0,200,255,0.6)' }}
                >
                  {char}
                </motion.span>
              ))}
            </div>

            {/* Element counter */}
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <span className="font-mono text-text-muted text-sm">LOADING ELEMENTS</span>
              <span
                className="font-mono text-accent-cyan text-xl tabular-nums"
                style={{ textShadow: '0 0 10px #00ccff' }}
              >
                {String(count).padStart(3, '0')}
              </span>
              <span className="font-mono text-text-muted text-sm">/ 118</span>
            </motion.div>

            {/* Progress bar */}
            <motion.div
              className="relative w-64 h-px bg-white/10 overflow-visible"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 to-blue-500"
                style={{ width: `${(count / 118) * 100}%` }}
                transition={{ duration: 0.05 }}
              />
              {/* Glow on progress bar tip */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400"
                style={{
                  left: `${(count / 118) * 100}%`,
                  boxShadow: '0 0 8px 2px #00ccff',
                }}
              />
            </motion.div>

            {/* Status text */}
            <motion.p
              className="font-mono text-xs text-text-muted tracking-widest"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ delay: 1, duration: 1.5, repeat: Infinity }}
            >
              INITIALIZING 3D ENVIRONMENT
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
