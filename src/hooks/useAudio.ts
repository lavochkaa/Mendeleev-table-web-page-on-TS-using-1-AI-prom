'use client'
import { useRef, useEffect, useCallback } from 'react'
import { useStore } from '@/store/useStore'

/**
 * Procedural ambient audio via Web Audio API.
 * No audio files needed — everything is synthesized.
 */
export function useAudio() {
  const audioEnabled = useStore(s => s.audioEnabled)
  const ctxRef = useRef<AudioContext | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const oscRefs = useRef<OscillatorNode[]>([])
  const started = useRef(false)

  const start = useCallback(() => {
    if (started.current) return
    started.current = true

    const ctx = new AudioContext()
    ctxRef.current = ctx

    const master = ctx.createGain()
    master.gain.setValueAtTime(0, ctx.currentTime)
    master.connect(ctx.destination)
    gainRef.current = master

    // Three detuned oscillators for lush pad texture
    const freqs = [48, 72, 96]
    const detunes = [0, 5, -3]
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.detune.value = detunes[i]

      const oscGain = ctx.createGain()
      oscGain.gain.value = 0.08

      // LFO for slow volume modulation (breathing effect)
      const lfo = ctx.createOscillator()
      lfo.frequency.value = 0.15 + i * 0.07
      const lfoGain = ctx.createGain()
      lfoGain.gain.value = 0.03
      lfo.connect(lfoGain)
      lfoGain.connect(oscGain.gain)
      lfo.start()

      osc.connect(oscGain)
      oscGain.connect(master)
      osc.start()
      oscRefs.current.push(osc)
    })
  }, [])

  // Play a subtle "formation change" swoosh
  const playTransition = useCallback(() => {
    const ctx = ctxRef.current
    if (!ctx || !audioEnabled) return

    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2)
    }

    const source = ctx.createBufferSource()
    source.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(800, ctx.currentTime)
    filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.5)
    filter.Q.value = 1.5

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)

    source.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    source.start()
  }, [audioEnabled])

  // Play a soft hover ping
  const playHover = useCallback(() => {
    const ctx = ctxRef.current
    if (!ctx || !audioEnabled) return
    const osc = ctx.createOscillator()
    osc.frequency.value = 880
    osc.type = 'sine'
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.04, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.4)
  }, [audioEnabled])

  // Fade master gain in/out based on enabled state
  useEffect(() => {
    if (audioEnabled) {
      start()
      gainRef.current?.gain.linearRampToValueAtTime(1, (ctxRef.current?.currentTime ?? 0) + 1.5)
    } else {
      gainRef.current?.gain.linearRampToValueAtTime(0, (ctxRef.current?.currentTime ?? 0) + 1.0)
    }
  }, [audioEnabled, start])

  return { playTransition, playHover }
}
