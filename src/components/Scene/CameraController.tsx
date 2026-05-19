'use client'
import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '@/store/useStore'
import { getFormationCameraZ } from '@/lib/formations'

export default function CameraController() {
  const { camera } = useThree()
  const currentFormation = useStore(s => s.currentFormation)
  const selectedElement   = useStore(s => s.selectedElement)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null)

  // Camera animation targets (mutable refs — no re-renders)
  const targetPos = useRef(new THREE.Vector3(0, 0, 22))
  const targetLook = useRef(new THREE.Vector3(0, 0, 0))
  const isDrifting = useRef(true)
  const driftPhase = useRef(Math.random() * Math.PI * 2)

  // Set initial camera position
  useEffect(() => {
    camera.position.set(0, 0, 30)
    camera.lookAt(0, 0, 0)
  }, [camera])

  // Update target Z when formation changes
  useEffect(() => {
    const z = getFormationCameraZ(currentFormation)
    if (!selectedElement) {
      targetPos.current.z = z
    }
  }, [currentFormation, selectedElement])

  // Update target when element selected
  useEffect(() => {
    if (selectedElement) {
      // Focus camera toward the table center — modal shows element details
      targetPos.current.set(0, 0, 16)
      isDrifting.current = false
    } else {
      isDrifting.current = true
      targetPos.current.z = getFormationCameraZ(currentFormation)
    }
  }, [selectedElement, currentFormation])

  useFrame(state => {
    const t = state.clock.elapsedTime

    if (isDrifting.current) {
      // Gentle sinusoidal camera drift when idle
      targetPos.current.x = Math.sin(t * 0.05 + driftPhase.current) * 1.5
      targetPos.current.y = Math.cos(t * 0.035 + driftPhase.current) * 0.8
    }

    // Smooth lerp toward target (exponential decay)
    camera.position.lerp(targetPos.current, 0.035)
    camera.lookAt(targetLook.current)
  })

  return (
    <OrbitControls
      ref={controlsRef as never}
      enableDamping
      dampingFactor={0.05}
      minDistance={8}
      maxDistance={55}
      enablePan={false}
      rotateSpeed={0.5}
      zoomSpeed={0.8}
      onStart={() => { isDrifting.current = false }}
      onEnd={() => {
        setTimeout(() => { isDrifting.current = true }, 3000)
      }}
    />
  )
}
