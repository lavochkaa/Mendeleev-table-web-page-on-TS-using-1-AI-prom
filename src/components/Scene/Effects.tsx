'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { useStore } from '@/store/useStore'

export default function Effects() {
  const isTransitioning = useStore(s => s.isTransitioning)
  const aberrationOffset = useRef(new THREE.Vector2(0.0012, 0.0012))

  useFrame(() => {
    // During transitions: boost chromatic aberration for cinematic feel
    const target = isTransitioning ? 0.004 : 0.0012
    aberrationOffset.current.lerp(
      new THREE.Vector2(target, target),
      0.08
    )
  })

  return (
    <EffectComposer multisampling={0}>
      {/* Bloom — makes neon colors volumetrically glow */}
      <Bloom
        intensity={1.8}
        luminanceThreshold={0.12}
        luminanceSmoothing={0.85}
        radius={0.9}
        blendFunction={BlendFunction.ADD}
      />
      {/* Chromatic aberration — cinematic lens fringing */}
      <ChromaticAberration
        offset={aberrationOffset.current}
        radialModulation={false}
        modulationOffset={0}
      />
      {/* Vignette — darkens edges, draws focus inward */}
      <Vignette
        eskil={false}
        offset={0.25}
        darkness={0.7}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  )
}
