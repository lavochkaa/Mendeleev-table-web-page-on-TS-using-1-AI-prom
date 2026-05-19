'use client'
import { motion } from 'framer-motion'
import { useStore } from '@/store/useStore'
import { FORMATION_CONFIGS } from '@/lib/formations'
import { FormationType } from '@/types'
import { useAudio } from '@/hooks/useAudio'
import { useEffect } from 'react'

export default function FormationPicker() {
  const currentFormation = useStore(s => s.currentFormation)
  const setFormation     = useStore(s => s.setFormation)
  const { playTransition } = useAudio()

  // Keyboard shortcuts 1-9
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = parseInt(e.key)
      if (n >= 1 && n <= 9) {
        const f = FORMATION_CONFIGS[n - 1]
        if (f) handleSelect(f.id as FormationType)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSelect(id: FormationType) {
    if (id === currentFormation) return
    setFormation(id)
    playTransition()
  }

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none px-1 py-1">
      {FORMATION_CONFIGS.map((cfg, i) => {
        const active = cfg.id === currentFormation
        return (
          <motion.button
            key={cfg.id}
            onClick={() => handleSelect(cfg.id as FormationType)}
            className="relative flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-lg
                       transition-colors duration-150 outline-none
                       focus-visible:ring-1 focus-visible:ring-cyan-400/60"
            style={{
              background: active
                ? 'rgba(0,200,255,0.12)'
                : 'rgba(255,255,255,0.03)',
              border: active
                ? '1px solid rgba(0,200,255,0.5)'
                : '1px solid rgba(255,255,255,0.07)',
            }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            title={`${cfg.label} — press ${i + 1}`}
          >
            {/* Glow background when active */}
            {active && (
              <motion.div
                layoutId="formationGlow"
                className="absolute inset-0 rounded-lg"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(0,200,255,0.18) 0%, transparent 70%)',
                  boxShadow: '0 0 16px rgba(0,200,255,0.25)',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              />
            )}

            {/* Icon */}
            <span
              className="relative z-10 text-base"
              style={{ filter: active ? 'drop-shadow(0 0 4px #00ccff)' : 'none' }}
            >
              {cfg.icon}
            </span>

            {/* Label */}
            <span
              className="relative z-10 font-mono text-[9px] tracking-wider whitespace-nowrap"
              style={{ color: active ? '#00ccff' : '#606080' }}
            >
              {cfg.label.toUpperCase()}
            </span>

            {/* Keyboard hint */}
            <span
              className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full
                         flex items-center justify-center font-mono text-[7px]
                         bg-black border border-white/10 text-white/30"
            >
              {i + 1}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
