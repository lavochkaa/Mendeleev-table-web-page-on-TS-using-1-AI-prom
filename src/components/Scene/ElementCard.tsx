'use client'
import { useRef, useMemo, useCallback, useEffect, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { Element, FormationType } from '@/types'

// ─── GLSL Shaders ─────────────────────────────────────────────────────────────

const VERT = /* glsl */`
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`

const FRAG = /* glsl */`
  uniform vec3  uColor;
  uniform float uTime;
  uniform float uHover;
  uniform float uSelected;

  varying vec2  vUv;
  varying vec3  vNormal;
  varying vec3  vViewDir;

  float borderGlow(vec2 uv, float t) {
    float d = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
    return 1.0 - smoothstep(0.0, t, d);
  }

  void main() {
    float pulse   = sin(uTime * 1.8 + uColor.r * 6.28) * 0.12 + 0.88;
    float fresnel = pow(1.0 - max(0.0, dot(vNormal, vViewDir)), 2.0);

    float outerBorder = borderGlow(vUv, 0.055);
    float innerBorder = borderGlow(vUv, 0.025);
    float rimMask     = outerBorder - innerBorder;

    vec3 glassColor = uColor * 0.06 + vec3(0.01, 0.015, 0.03);
    glassColor += uColor * fresnel * 0.22;
    glassColor += uColor * 0.04 * pulse;

    float boost      = 1.0 + uHover * 1.8 + uSelected * 2.5;
    vec3 borderColor = uColor * pulse * boost;

    // Corner sparkles
    vec2 corners    = vec2(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
    float cornerDist = length(corners);
    float sparkle    = pow(1.0 - smoothstep(0.0, 0.12, cornerDist), 3.5) * 0.7;
    borderColor += uColor * sparkle * pulse;

    // Subtle scan lines
    float scan = step(0.498, fract(vUv.y * 40.0)) * 0.04;
    glassColor += vec3(scan) * uColor * 0.3;

    vec3 finalColor = mix(glassColor, borderColor, outerBorder);
    finalColor += borderColor * rimMask * 0.5;

    float alpha = mix(0.50 + fresnel * 0.2, 0.92, outerBorder);
    alpha += uHover * 0.08 + uSelected * 0.05;

    gl_FragColor = vec4(finalColor, clamp(alpha, 0.0, 1.0));
  }
`

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  element:        Element
  targetPosition: THREE.Vector3
  /** Milliseconds before this card starts its animation — creates stagger wave */
  staggerDelay:   number
  /** Current formation name — change triggers staggered lerp to new positions */
  formation:      FormationType
  isSelected:     boolean
  isHovered:      boolean
  onHover:        (el: Element | null) => void
  onClick:        (el: Element) => void
}

const CARD_W = 1.05
const CARD_H = 1.05
const CARD_D = 0.08

// ── Lerp speed constants ───────────────────────────────────────────────────────
// Frame-rate-independent exponential lerp: pos += (target-pos) * (1 - e^(-k*dt))
// LERP_MOVE: k=5 → 99% complete in ~0.9 s — smooth, no overshoot
// LERP_SCALE: k=8 → 99% in ~0.6 s — snappier pop-in
const LERP_MOVE  = 5
const LERP_SCALE = 8
const LERP_GLOW  = 10

function ElementCard({
  element, targetPosition, staggerDelay, formation,
  isSelected, isHovered, onHover, onClick,
}: Props) {
  const groupRef = useRef<THREE.Group>(null!)
  const matRef   = useRef<THREE.ShaderMaterial>(null!)

  // ── Mutable animation state (all refs — zero React re-renders) ──────────────
  // Position starts right at the target (no "fly from nowhere" jump)
  const pos       = useRef(targetPosition.clone())
  const scaleVal  = useRef(0)           // starts hidden, scales in
  const glowVal   = useRef(0)
  const moveReady = useRef(false)       // gate: lerp only after stagger delay

  // ── Mount: scale-in after stagger (piece-by-piece appearance) ──────────────
  useEffect(() => {
    const t = setTimeout(() => {
      scaleVal.current = 0.001  // kick the scale spring
      moveReady.current = true  // allow position lerp from now on
    }, staggerDelay)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])  // ← only on mount

  // ── Formation change: restart staggered lerp to new target position ─────────
  const prevFormation = useRef<FormationType>(formation)

  useEffect(() => {
    if (prevFormation.current === formation) return   // skip first render
    prevFormation.current = formation

    moveReady.current = false  // pause: wait for this card's stagger slot
    const t = setTimeout(() => {
      moveReady.current = true
    }, staggerDelay)
    return () => clearTimeout(t)
  // staggerDelay is static per card, safe to omit from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formation])

  const uniforms = useMemo(() => ({
    uColor:    { value: new THREE.Color(element.color) },
    uTime:     { value: 0 },
    uHover:    { value: 0 },
    uSelected: { value: 0 },
  }), [element.color])

  useFrame((state, delta) => {
    if (!groupRef.current || !matRef.current) return
    const dt = Math.min(delta, 0.05)  // cap delta for tab-switch spikes

    // Tick shader time
    uniforms.uTime.value = state.clock.elapsedTime

    // ── Position lerp (frame-rate independent) ────────────────────────────────
    if (moveReady.current) {
      const f = 1 - Math.exp(-LERP_MOVE * dt)
      pos.current.lerp(targetPosition, f)
    }
    groupRef.current.position.copy(pos.current)

    // ── Scale lerp (0 → 1 on mount, also responds to hover/select) ───────────
    const targetScale = isSelected ? 1.12 : isHovered ? 1.16 : 1.0
    const fScale = 1 - Math.exp(-LERP_SCALE * dt)
    // scaleVal only starts climbing once moveReady fires (> 0.001)
    if (scaleVal.current > 0) {
      scaleVal.current += (targetScale - scaleVal.current) * fScale
    }
    groupRef.current.scale.setScalar(Math.max(0, scaleVal.current))

    // ── Glow lerp ─────────────────────────────────────────────────────────────
    const targetGlow = isSelected ? 1.0 : isHovered ? 0.85 : 0
    const fGlow = 1 - Math.exp(-LERP_GLOW * dt)
    glowVal.current += (targetGlow - glowVal.current) * fGlow
    uniforms.uHover.value    = glowVal.current
    uniforms.uSelected.value = isSelected ? 1 : 0

    // ── Gentle hover float ────────────────────────────────────────────────────
    if (isHovered || isSelected) {
      groupRef.current.position.y =
        pos.current.y + Math.sin(state.clock.elapsedTime * 2.2) * 0.035
    }
  })

  const handlePointerEnter = useCallback((e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    onHover(element)
    document.body.style.cursor = 'pointer'
  }, [element, onHover])

  const handlePointerLeave = useCallback(() => {
    onHover(null)
    document.body.style.cursor = 'auto'
  }, [onHover])

  const handleClick = useCallback((e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    onClick(element)
  }, [element, onClick])

  return (
    <group
      ref={groupRef}
      onPointerEnter={handlePointerEnter as never}
      onPointerLeave={handlePointerLeave as never}
      onClick={handleClick as never}
    >
      {/* Glass card body */}
      <mesh>
        <boxGeometry args={[CARD_W, CARD_H, CARD_D]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={VERT}
          fragmentShader={FRAG}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Atomic number — top left */}
      <Text
        position={[-0.36, 0.36, CARD_D / 2 + 0.01]}
        fontSize={0.14}
        color={element.color}
        anchorX="left"
        anchorY="top"
        letterSpacing={-0.02}
      >
        {String(element.atomicNumber)}
      </Text>

      {/* Symbol — center */}
      <Text
        position={[0, 0.06, CARD_D / 2 + 0.01]}
        fontSize={0.34}
        color="white"
        anchorX="center"
        anchorY="middle"
        letterSpacing={-0.02}
      >
        {element.symbol}
      </Text>

      {/* Atomic mass — bottom */}
      <Text
        position={[0, -0.3, CARD_D / 2 + 0.01]}
        fontSize={0.10}
        color={`${element.color}cc`}
        anchorX="center"
        anchorY="bottom"
      >
        {element.atomicMass.toFixed(
          element.atomicMass < 10 ? 3 : element.atomicMass < 100 ? 2 : 1
        )}
      </Text>

      {/* Category dot — top right */}
      <mesh position={[0.36, 0.38, CARD_D / 2 + 0.01]}>
        <circleGeometry args={[0.05, 16]} />
        <meshBasicMaterial color={element.color} transparent opacity={0.8} />
      </mesh>
    </group>
  )
}

export default memo(ElementCard)
