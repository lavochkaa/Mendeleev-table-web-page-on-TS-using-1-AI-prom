'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/store/useStore'
import { CATEGORY_LABELS } from '@/lib/colors'
import AtomViewer from '@/components/UI/AtomViewer'

// ─── Property row ─────────────────────────────────────────────────────────────

function PropertyRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
      <span className="font-mono text-xs text-text-muted tracking-wider">{label}</span>
      <span className="font-mono text-xs font-medium" style={{ color: color ?? '#e0e0f0' }}>
        {value}
      </span>
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export default function ElementModal() {
  const selectedElement = useStore(s => s.selectedElement)
  const setSelected     = useStore(s => s.setSelectedElement)
  const [isExpanded, setIsExpanded] = useState(false)

  // Collapse automatically when the user switches to a different element
  useEffect(() => { setIsExpanded(false) }, [selectedElement?.atomicNumber])

  const expand   = () => setIsExpanded(true)
  const collapse = () => setIsExpanded(false)
  const close    = () => { setIsExpanded(false); setSelected(null) }

  return (
    <AnimatePresence>
      {selectedElement && (
        <>
          {/* ── Backdrop — click collapses if expanded, closes if collapsed ── */}
          <motion.div
            className="fixed inset-0 z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isExpanded ? collapse : close}
          />

          {/*
            ── Main panel ──────────────────────────────────────────────────────
            Always anchored to the right edge.
            CSS transition on max-width handles the expand/collapse animation.
            Framer Motion handles the initial slide-in from right + exit.

            Layout (flex-row):
              [left: atom canvas — flex-1, only visible when expanded]
              [right: info panel — w-80, always visible]
          */}
          <motion.div
            key={selectedElement.atomicNumber}
            className="fixed top-0 right-0 z-40 h-full flex flex-row overflow-hidden"
            style={{
              // CSS transition for the width expansion — independent of FM spring
              maxWidth: isExpanded ? '100vw' : '320px',
              width: '100vw',
              transition: 'max-width 0.50s cubic-bezier(0.16, 1, 0.3, 1)',
              background: 'rgba(5, 8, 20, 0.94)',
              backdropFilter: 'blur(24px)',
            }}
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 35 }}
            onClick={e => e.stopPropagation()}
          >
            {/* ── Header colour stripe (spans full width) ── */}
            <div
              className="absolute top-0 left-0 right-0 h-0.5 z-10 pointer-events-none"
              style={{
                background: `linear-gradient(90deg, transparent, ${selectedElement.color}, transparent)`,
                boxShadow: `0 0 18px ${selectedElement.color}88`,
              }}
            />

            {/* ══════════════════════════════════════════════════════════════
                LEFT COLUMN — large 3-D atom canvas, visible only when expanded
                ══════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  className="flex-1 relative min-w-0 overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Full-height atom canvas */}
                  <AtomViewer
                    atomicNumber={selectedElement.atomicNumber}
                    elementColor={selectedElement.color}
                    elementName={selectedElement.name}
                    electronConfigStr={selectedElement.electronConfig}
                    isExpanded
                    onExpand={expand}
                  />

                  {/* Element name floating at bottom-left of canvas */}
                  <motion.div
                    className="absolute bottom-10 left-8 pointer-events-none"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    <p
                      className="font-mono text-[9px] tracking-[0.24em] mb-1"
                      style={{ color: `${selectedElement.color}66` }}
                    >
                      ATOMIC STRUCTURE
                    </p>
                    <p className="font-body text-4xl font-bold text-white leading-none">
                      {selectedElement.name}
                    </p>
                    <p
                      className="font-mono text-[12px] mt-2"
                      style={{ color: `${selectedElement.color}bb` }}
                    >
                      {selectedElement.electronConfig}
                    </p>
                  </motion.div>

                  {/* Controls hint */}
                  <motion.div
                    className="absolute bottom-4 left-0 right-0 flex justify-center gap-6 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    {['ТЯНУТЬ ДЛЯ ВРАЩЕНИЯ', 'ПРОКРУТИТЬ ДЛЯ ЗУМА'].map(h => (
                      <span key={h} className="font-mono text-[9px] tracking-widest"
                        style={{ color: 'rgba(255,255,255,0.18)' }}>
                        {h}
                      </span>
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ══════════════════════════════════════════════════════════════
                RIGHT COLUMN — element info, always 320 px wide
                ══════════════════════════════════════════════════════════════ */}
            <div
              className="w-80 flex-shrink-0 flex flex-col h-full"
              style={{
                borderLeft: isExpanded ? `1px solid ${selectedElement.color}22` : 'none',
              }}
            >
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 pt-7">

                {/* ── Header row ── */}
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs tracking-widest" style={{ color: selectedElement.color }}>
                    ELEMENT #{String(selectedElement.atomicNumber).padStart(3, '0')}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Collapse button — only in expanded mode */}
                    {isExpanded && (
                      <button
                        onClick={collapse}
                        className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center
                                   hover:border-white/30 transition-colors text-white/40 hover:text-white/70"
                        title="Свернуть"
                      >
                        {/* Chevron pointing right (→ collapse toward right) */}
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <polyline points="3,2 7,5 3,8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    )}
                    {/* Close button */}
                    <button
                      onClick={close}
                      className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center
                                 hover:border-white/30 transition-colors text-white/40 hover:text-white/70"
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10">
                        <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* ── Symbol block ── */}
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
                    <motion.div
                      className="absolute inset-0 rounded-xl"
                      style={{ border: `1px solid ${selectedElement.color}66` }}
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span
                      className="font-body text-5xl font-bold relative z-10"
                      style={{ color: 'white', textShadow: `0 0 20px ${selectedElement.color}` }}
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

                {/* ── Compact atom viewer — hidden in expanded mode ── */}
                {!isExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.18 }}
                  >
                    <AtomViewer
                      atomicNumber={selectedElement.atomicNumber}
                      elementColor={selectedElement.color}
                      elementName={selectedElement.name}
                      electronConfigStr={selectedElement.electronConfig}
                      isExpanded={false}
                      onExpand={expand}
                    />
                    <p
                      className="font-mono text-[10px] text-center mt-1 px-2"
                      style={{ color: `${selectedElement.color}aa` }}
                    >
                      {selectedElement.electronConfig}
                    </p>
                  </motion.div>
                )}

                {/* ── Properties ── */}
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
                  <p className="font-mono text-[9px] tracking-widest text-text-muted mb-3">PROPERTIES</p>
                  <PropertyRow
                    label="ATOMIC MASS"
                    value={`${selectedElement.atomicMass} u`}
                    color={selectedElement.color}
                  />
                  <PropertyRow label="PERIOD" value={String(selectedElement.period)} />
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

                {/* ── Category description ── */}
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

              {/* Bottom gradient */}
              <div className="h-8 bg-gradient-to-t from-[rgba(5,8,20,0.95)] to-transparent pointer-events-none flex-shrink-0" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Category descriptions ────────────────────────────────────────────────────

function getCategoryDescription(cat: string): string {
  const descriptions: Record<string, string> = {
    'alkali-metal':          'Highly reactive metals. Soft, low-density, react vigorously with water to form strong bases.',
    'alkaline-earth-metal':  'Reactive metals with two valence electrons. Form basic oxides and hydroxides.',
    'transition-metal':      'D-block metals. Good conductors, form colourful compounds, variable oxidation states.',
    'post-transition-metal': 'Softer than transition metals. Lower melting points, more electronegative.',
    'metalloid':             'Intermediate properties between metals and nonmetals. Used as semiconductors.',
    'polyatomic-nonmetal':   'Form covalent bonds, poor conductors. Essential for organic chemistry.',
    'diatomic-nonmetal':     'Exist naturally as diatomic molecules. Highly electronegative.',
    'halogen':               'Reactive nonmetals that form salts with metals. Strong oxidising agents.',
    'noble-gas':             'Chemically inert under standard conditions. Full valence electron shells.',
    'lanthanide':            'F-block metals. Very similar chemical properties due to lanthanide contraction.',
    'actinide':              'F-block metals, mostly radioactive. Used in nuclear energy and research.',
    'unknown':               'Insufficient data available for reliable property prediction.',
  }
  return descriptions[cat] ?? ''
}
