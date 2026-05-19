'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/store/useStore'
import { CATEGORY_LABELS } from '@/lib/colors'

// Electron shell visualization (CSS-only circles)
function ElectronShells({ config }: { config: string }) {
  // Parse simplified config like "[Xe] 4f¹⁴ 5d¹⁰ 6s²"
  // Just show decorative animated circles
  return (
    <div className="relative w-24 h-24 mx-auto my-2">
      {/* Nucleus */}
      <div
        className="absolute inset-0 m-auto w-4 h-4 rounded-full z-10"
        style={{
          background: 'radial-gradient(circle, #fff 0%, rgba(0,200,255,0.6) 60%, transparent 100%)',
          boxShadow: '0 0 10px #00ccff',
          width: 12, height: 12,
          top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
        }}
      />
      {/* Orbit rings */}
      {[28, 42, 56].map((size, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border"
          style={{
            width: size,
            height: size,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            borderColor: `rgba(0,200,255,${0.5 - i * 0.12})`,
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 3 + i * 1.2,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {/* Electron dot on orbit */}
          <div
            className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400"
            style={{
              top: -3,
              left: '50%',
              transform: 'translateX(-50%)',
              boxShadow: '0 0 4px #00ccff',
            }}
          />
        </motion.div>
      ))}
    </div>
  )
}

function PropertyRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
      <span className="font-mono text-xs text-text-muted tracking-wider">{label}</span>
      <span
        className="font-mono text-xs font-medium"
        style={{ color: color ?? '#e0e0f0' }}
      >
        {value}
      </span>
    </div>
  )
}

export default function ElementModal() {
  const selectedElement = useStore(s => s.selectedElement)
  const setSelected     = useStore(s => s.setSelectedElement)

  return (
    <AnimatePresence>
      {selectedElement && (
        <>
          {/* Backdrop blur overlay */}
          <motion.div
            className="fixed inset-0 z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          />

          {/* Modal panel — slides in from right */}
          <motion.div
            key={selectedElement.atomicNumber}
            className="fixed top-0 right-0 z-40 h-full w-full max-w-xs flex flex-col"
            style={{
              background: 'rgba(5, 8, 20, 0.92)',
              backdropFilter: 'blur(24px)',
              borderLeft: `1px solid ${selectedElement.color}33`,
              boxShadow: `-4px 0 40px ${selectedElement.color}22`,
            }}
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 35 }}
          >
            {/* Header stripe */}
            <div
              className="h-1 w-full"
              style={{
                background: `linear-gradient(90deg, ${selectedElement.color}00, ${selectedElement.color}, ${selectedElement.color}00)`,
                boxShadow: `0 0 20px ${selectedElement.color}88`,
              }}
            />

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
              {/* Close button */}
              <div className="flex items-start justify-between">
                <span
                  className="font-mono text-xs tracking-widest"
                  style={{ color: selectedElement.color }}
                >
                  ELEMENT #{String(selectedElement.atomicNumber).padStart(3, '0')}
                </span>
                <button
                  onClick={() => setSelected(null)}
                  className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center
                             hover:border-white/30 transition-colors text-white/40 hover:text-white/70"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10">
                    <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* Symbol block */}
              <motion.div
                className="flex flex-col items-center gap-1"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
              >
                <div
                  className="w-28 h-28 rounded-xl flex flex-col items-center justify-center relative overflow-hidden"
                  style={{
                    background: `${selectedElement.color}0a`,
                    border: `1px solid ${selectedElement.color}44`,
                    boxShadow: `0 0 30px ${selectedElement.color}22, inset 0 0 30px ${selectedElement.color}08`,
                  }}
                >
                  {/* Animated border glow */}
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    style={{ border: `1px solid ${selectedElement.color}66` }}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />

                  <span
                    className="font-body text-5xl font-bold relative z-10"
                    style={{
                      color: 'white',
                      textShadow: `0 0 20px ${selectedElement.color}`,
                    }}
                  >
                    {selectedElement.symbol}
                  </span>
                  <span className="font-mono text-xs relative z-10" style={{ color: selectedElement.color }}>
                    {selectedElement.atomicNumber}
                  </span>
                </div>

                <span className="font-body text-lg font-semibold text-white mt-1">
                  {selectedElement.name}
                </span>
                <span
                  className="font-mono text-xs px-2 py-0.5 rounded-full"
                  style={{
                    color: selectedElement.color,
                    background: `${selectedElement.color}18`,
                    border: `1px solid ${selectedElement.color}30`,
                  }}
                >
                  {CATEGORY_LABELS[selectedElement.category]}
                </span>
              </motion.div>

              {/* Electron shell visualization */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <ElectronShells config={selectedElement.electronConfig} />
                <p
                  className="font-mono text-[10px] text-center mt-1 px-2"
                  style={{ color: `${selectedElement.color}aa` }}
                >
                  {selectedElement.electronConfig}
                </p>
              </motion.div>

              {/* Properties grid */}
              <motion.div
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <p className="font-mono text-[9px] tracking-widest text-text-muted mb-3">
                  PROPERTIES
                </p>
                <PropertyRow
                  label="ATOMIC MASS"
                  value={`${selectedElement.atomicMass} u`}
                  color={selectedElement.color}
                />
                <PropertyRow
                  label="PERIOD"
                  value={String(selectedElement.period)}
                />
                <PropertyRow
                  label="GROUP"
                  value={selectedElement.group ? String(selectedElement.group) : '—'}
                />
                <PropertyRow
                  label="ELECTRONEGATIVITY"
                  value={selectedElement.electronegativity
                    ? `${selectedElement.electronegativity} (Pauling)`
                    : 'N/A'}
                  color={selectedElement.electronegativity ? '#00ff88' : undefined}
                />
              </motion.div>

              {/* Category description */}
              <motion.p
                className="font-mono text-[10px] leading-relaxed"
                style={{ color: 'rgba(100,100,130,0.8)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                {getCategoryDescription(selectedElement.category)}
              </motion.p>
            </div>

            {/* Bottom gradient fade */}
            <div className="h-8 bg-gradient-to-t from-[rgba(5,8,20,0.95)] to-transparent pointer-events-none" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function getCategoryDescription(cat: string): string {
  const descriptions: Record<string, string> = {
    'alkali-metal': 'Highly reactive metals. Soft, low-density, react vigorously with water to form strong bases.',
    'alkaline-earth-metal': 'Reactive metals with two valence electrons. Form basic oxides and hydroxides.',
    'transition-metal': 'D-block metals. Good conductors, form colorful compounds, variable oxidation states.',
    'post-transition-metal': 'Softer than transition metals. Lower melting points, more electronegative.',
    'metalloid': 'Intermediate properties between metals and nonmetals. Used as semiconductors.',
    'polyatomic-nonmetal': 'Form covalent bonds, poor conductors. Essential for organic chemistry.',
    'diatomic-nonmetal': 'Exist naturally as diatomic molecules. Highly electronegative.',
    'halogen': 'Reactive nonmetals that form salts with metals. Strong oxidizing agents.',
    'noble-gas': 'Chemically inert under standard conditions. Full valence electron shells.',
    'lanthanide': 'F-block metals. Very similar chemical properties due to lanthanide contraction.',
    'actinide': 'F-block metals, mostly radioactive. Used in nuclear energy and research.',
    'unknown': 'Insufficient data available for reliable property prediction.',
  }
  return descriptions[cat] ?? ''
}
