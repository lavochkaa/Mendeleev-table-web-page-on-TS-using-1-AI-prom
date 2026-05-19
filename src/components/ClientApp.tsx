'use client'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import LoadingScreen from '@/components/UI/LoadingScreen'
import HUD from '@/components/UI/HUD'
import ElementModal from '@/components/UI/ElementModal'

// Three.js / WebGL — must be client-side only (no SSR)
const Scene = dynamic(() => import('@/components/Scene/Scene'), {
  ssr: false,
})

export default function ClientApp() {
  return (
    <main className="fixed inset-0 w-full h-full overflow-hidden bg-black">
      {/* 3D Scene fills entire viewport */}
      <div className="absolute inset-0">
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </div>

      {/* UI overlays */}
      <LoadingScreen />
      <HUD />
      <ElementModal />
    </main>
  )
}
