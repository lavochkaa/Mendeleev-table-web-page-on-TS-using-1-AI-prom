'use client'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PARTICLE_VERT = /* glsl */`
  attribute float aSize;
  attribute float aPhase;
  uniform float uTime;
  varying float vAlpha;
  void main() {
    vAlpha = 0.3 + 0.5 * sin(uTime * 0.8 + aPhase);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (300.0 / -mvPos.z);
    gl_Position = projectionMatrix * mvPos;
  }
`

const PARTICLE_FRAG = /* glsl */`
  varying float vAlpha;
  void main() {
    // Soft circle
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float alpha = smoothstep(0.5, 0.1, d) * vAlpha;
    gl_FragColor = vec4(0.6, 0.75, 1.0, alpha);
  }
`

interface Props {
  count?: number
  radius?: number
}

export default function ParticleField({ count = 2500, radius = 45 }: Props) {
  const matRef = useRef<THREE.ShaderMaterial>(null!)

  const { positions, sizes, phases } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const sizes     = new Float32Array(count)
    const phases    = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // Random point inside a sphere (volume-uniform)
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(Math.random() * 2 - 1)
      const r     = Math.pow(Math.random(), 0.4) * radius

      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)

      sizes[i]  = 0.8 + Math.random() * 1.8
      phases[i] = Math.random() * Math.PI * 2
    }

    return { positions, sizes, phases }
  }, [count, radius])

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
  }), [])

  useFrame(state => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={count}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aSize"
          array={sizes}
          count={count}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aPhase"
          array={phases}
          count={count}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={PARTICLE_VERT}
        fragmentShader={PARTICLE_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
