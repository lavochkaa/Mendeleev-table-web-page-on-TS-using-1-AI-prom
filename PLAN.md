# ⚗️ 3D Periodic Table — Full Architecture Plan
> Cinematic sci-fi periodic table visualization. Apple × Tesla × Awwwards quality.

---

## 1. PROJECT OVERVIEW

A single-page immersive 3D experience where all 118 chemical elements exist as
glowing holographic glass cards floating in space. Users can morph the entire
structure between 9 mathematically beautiful formations in real-time.

**Core wow-moments:**
- Opening cinematic: cards assemble from void into periodic table
- Formation morphing: 118 cards spring through 3D space simultaneously
- Hover: individual cards lift, pulse, reveal data
- Click: camera cinematic zoom + full element data modal

---

## 2. TECHNOLOGY STACK

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR opt, file routing, turbopack |
| UI Framework | React 18 | Concurrent mode, Suspense |
| Language | TypeScript 5 | Type safety, IDE support |
| 3D Rendering | Three.js + React Three Fiber | Declarative 3D, React ecosystem |
| 3D Helpers | @react-three/drei | OrbitControls, Text, Stars, etc. |
| Post-Processing | @react-three/postprocessing | Bloom, ChromaticAberration, DOF |
| UI Animations | Framer Motion | Spring-based UI transitions |
| Timeline Anims | GSAP | Complex choreographed sequences |
| State | Zustand | Simple, performant global state |
| Styling | Tailwind CSS | Utility-first, dark mode ready |
| Shaders | GLSL (inline) | Custom glass/neon card materials |
| Build | Turbopack (Next.js built-in) | Fast HMR |

---

## 3. FILE STRUCTURE

```
химия/
├── PLAN.md                          ← This file
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
└── src/
    ├── app/
    │   ├── layout.tsx               ← Root layout, metadata, fonts
    │   ├── page.tsx                 ← Main page (dynamic import scene)
    │   └── globals.css              ← Global resets + CSS variables
    ├── types/
    │   └── index.ts                 ← All TypeScript types/interfaces
    ├── data/
    │   └── elements.ts              ← All 118 elements with positions
    ├── lib/
    │   ├── formations.ts            ← 9 formation position calculators
    │   └── colors.ts                ← Category → neon color mapping
    ├── store/
    │   └── useStore.ts              ← Zustand global store
    ├── hooks/
    │   └── useAudio.ts              ← Web Audio API ambient synth
    └── components/
        ├── Scene/
        │   ├── Scene.tsx            ← R3F Canvas + scene root
        │   ├── ElementCard.tsx      ← Individual 3D element card
        │   ├── ParticleField.tsx    ← Ambient floating particles
        │   ├── Effects.tsx          ← Post-processing pipeline
        │   └── CameraController.tsx ← Smooth camera + auto-drift
        └── UI/
            ├── LoadingScreen.tsx    ← Cinematic loading overlay
            ├── HUD.tsx              ← Main UI overlay (title, info)
            ├── FormationPicker.tsx  ← Bottom formation selector
            └── ElementModal.tsx     ← Full element detail modal
```

---

## 4. DATA ARCHITECTURE

### Element Type
```typescript
interface Element {
  atomicNumber: number      // 1-118
  symbol: string            // 'H', 'He', 'Li' ...
  name: string              // 'Hydrogen', 'Helium' ...
  atomicMass: number        // 1.008, 4.0026 ...
  category: ElementCategory // 12 categories
  period: number            // 1-7
  group: number | null      // 1-18, null for f-block
  tableRow: number          // 1-9 (8=lanthanides, 9=actinides)
  tableCol: number          // 1-18
  electronegativity: number | null
  electronConfig: string
  color: string             // hex, derived from category
}
```

### Category Colors (neon palette)
```
alkali-metal:          #ff6600  (orange)
alkaline-earth-metal:  #ffaa00  (amber)
transition-metal:      #4488ff  (electric blue)
post-transition-metal: #44ccff  (sky blue)
metalloid:             #aa44ff  (violet)
polyatomic-nonmetal:   #00ffcc  (teal)
diatomic-nonmetal:     #00ff88  (green)
halogen:               #ff0088  (hot pink)
noble-gas:             #00ccff  (cyan)
lanthanide:            #ff44cc  (magenta)
actinide:              #ffaa44  (gold)
unknown:               #666688  (grey-blue)
```

---

## 5. FORMATION SYSTEM

### Architecture
```
FormationPicker (UI) 
  → setFormation(store) 
    → Scene reads formation
      → calculatePositions(formation, elements)
        → targetPositions[118] updated
          → each ElementCard springs to new position
```

### Formation Algorithms

#### 1. Classic Table
```
x = (element.tableCol - 9.5) * SPACING
y = -(element.tableRow) * SPACING + yOffset(row)
z = 0
// Lanthanides/actinides get y-offset gap
```

#### 2. Sphere (Fibonacci Lattice)
```
φ = π(3 − √5)  ← golden angle
for i in 0..N:
  y = 1 − 2i/(N−1)
  r = √(1−y²) × R
  θ = φ × i
  pos = [r·cos(θ), y·R, r·sin(θ)]
// Even distribution, no poles clustering
```

#### 3. Helix
```
for i in 0..N:
  t = (i/N) × turns × 2π
  pos = [R·cos(t), i/N × height − height/2, R·sin(t)]
// Single helix, 4 turns, 20 units tall
```

#### 4. 3D Grid
```
cols = ceil(N^(1/3))
x = (i%cols − cols/2) × spacing
y = (floor(i/cols)%cols − cols/2) × spacing
z = (floor(i/cols²) − cols/2) × spacing
```

#### 5. Galaxy (Logarithmic Spiral)
```
3 arms, 118/3 elements per arm
for each element:
  arm = i % 3
  progress = floor(i/3) / floor(N/3)
  θ = progress × 4π + arm × 2π/3
  r = progress × 14 + 2
  scatter = noise × 1.5
  pos = [r·cos(θ)+scatter, noise×2, r·sin(θ)+scatter]
```

#### 6. DNA Double Helix
```
strand1 (elements 0..58):  [3·cos(t), height, 3·sin(t)]
strand2 (elements 59..117): [3·cos(t+π), height, 3·sin(t+π)]
where t = i/59 × 6π (3 full rotations)
```

#### 7. Atom Orbits
```
shells = [2, 8, 18, 32, 32, 18, 8]  ← electron shell sizes
for each shell:
  radius = (shellIndex+1) × 3.5
  distribute elements evenly on spherical orbit
  multiple inclined orbits per shell
```

#### 8. Neural Network
```
Random spherical distribution
pos = [r·sin(φ)·cos(θ), r·cos(φ), r·sin(φ)·sin(θ)]
where r = random^0.33 × 14  ← volume-uniform distribution
```

#### 9. Wave Surface
```
cols = ceil(√N)
x = (i%cols − cols/2) × 1.5
z = (floor(i/cols) − cols/2) × 1.5
dist = √(x²+z²)
y = sin(dist × 0.7 + time) × 2.5  ← animated ripple
```

---

## 6. ANIMATION SYSTEM

### Spring Physics (per-card)
Each ElementCard maintains:
```typescript
position: Vector3     // current position (mutable)
velocity: Vector3     // current velocity
targetPos: Vector3    // from formation system
staggerDelay: number  // ms, based on element index
```

Spring update (in useFrame):
```typescript
const STIFFNESS = 0.06   // spring pull strength
const DAMPING = 0.88     // velocity decay (0-1)

// Per-axis:
vel += (target - pos) * STIFFNESS
vel *= DAMPING
pos += vel
```

Why these values:
- STIFFNESS 0.06: gentle, organic feel (not snappy)
- DAMPING 0.88: slight overshoot, beautiful settle

### Stagger System
```typescript
staggerDelay = (index * 8) % 500  // ms
// Creates a 0-500ms wave across all 118 elements
// Elements near index 0 start first
// Creates "ripple through space" visual
```

### Hover Animation
```typescript
// Scale spring: 1.0 → 1.15 on hover
// Y-offset spring: 0 → 0.1 on hover  
// Glow intensity: 0.5 → 1.5 on hover
// All driven by uniform lerp, ~8x speed
```

### Click / Selection
```typescript
// 1. Store sets selectedElement
// 2. Camera lerps toward element's position (+ offset)
// 3. DOF blurs background
// 4. ElementModal animates in (Framer Motion)
// 5. Card pulses at 2x glow intensity
```

---

## 7. SHADER SYSTEM

### ElementCard Glass Shader

**Vertex Shader:**
- Pass UV, normal, view-space position
- Standard MVP transform

**Fragment Shader:**
```glsl
// Inputs:
uniform vec3  uColor;       // category color
uniform float uTime;        // global time
uniform float uHover;       // 0..1 lerped
uniform float uSelected;    // 0 or 1
uniform float uTransition;  // 0..1 transition progress

// Outputs: RGBA

// 1. Compute border glow
//    minDist = min(uv.x, 1-uv.x, uv.y, 1-uv.y)
//    borderMask = 1 - smoothstep(0, 0.04, minDist)

// 2. Animated pulse
//    pulse = sin(uTime × 1.5 + uColor.r × π) × 0.15 + 0.85

// 3. Fresnel (view-angle glass effect)
//    fresnel = pow(1 - dot(normal, viewDir), 2.5)

// 4. Glass interior
//    glass = uColor × 0.08 + fresnel × uColor × 0.25

// 5. Border color with hover boost
//    border = uColor × pulse × (1 + uHover × 1.5)

// 6. Combine → mix(glass, border, borderMask)
// 7. Alpha: border=0.9, interior=0.55+fresnel×0.2
```

### Why custom shader vs standard materials:
- MeshPhysicalMaterial can approximate glass but can't do neon borders
- Custom shader gives full control over the sci-fi aesthetic
- Can animate each card independently with uniforms
- Better performance (no unnecessary PBR calculations)

---

## 8. POST-PROCESSING PIPELINE

```
Scene render
  → Bloom (makes neon colors volumetrically glow)
  → ChromaticAberration (cinematic lens fringing)
  → DepthOfField (selective focus on selected element)
  → Vignette (subtle edge darkening)
```

**Bloom settings:**
- intensity: 1.5 (strong neon glow)
- luminanceThreshold: 0.15 (only bright neon colors bloom)
- luminanceSmoothing: 0.9
- radius: 0.85

**Chromatic Aberration:**
- offset: [0.0015, 0.0015] (subtle, not distracting)
- Increases to [0.004, 0.004] during formation transitions

**Depth of Field:**
- Disabled normally
- Activates when element selected: focus on card, blur bg

---

## 9. CAMERA SYSTEM

### States
1. **Idle**: gentle sinusoidal drift
   ```
   x = sin(t × 0.05) × 2
   y = cos(t × 0.03) × 1
   z = 22 + sin(t × 0.07) × 2
   ```
2. **Interacting**: OrbitControls active, drift paused
3. **Element focused**: lerp toward element position + offset
4. **Transitioning**: zoom out slightly (z += 3) for drama

### OrbitControls
- enableDamping: true, dampingFactor: 0.05
- minDistance: 8, maxDistance: 50
- autoRotate: false (we handle this manually)
- enablePan: false (keep focus on center)

---

## 10. SCENE LIGHTING

```
AmbientLight:    intensity 0.3 (base visibility)
DirectionalLight: position [5,10,5], intensity 0.8, color #ffffff
PointLight[1]:   position [0,0,10], color #4488ff, intensity 1.5 (front blue fill)
PointLight[2]:   position [-10,5,-5], color #ff44aa, intensity 1.0 (left magenta)
PointLight[3]:   position [10,5,-5], color #44ffaa, intensity 0.8 (right teal)
```

These 3 colored point lights create the cinematic tri-color sci-fi look.

---

## 11. PARTICLE SYSTEM

### Background Particles (ParticleField)
- Count: 3000 particles
- Using BufferGeometry + Points for maximum performance
- Distribution: random sphere, radius 40 units
- Size: 0.02-0.06 units, randomized
- Animation: slow drift + twinkle (sin-based opacity)
- Color: mix of dim whites and category colors

### Element Hover Particles
- On hover: 20 tiny particles orbit the card
- Implemented as instanced mesh
- Spring outward on hover, collapse on unhover

---

## 12. PERFORMANCE OPTIMIZATIONS

### GPU
- Single draw call for background particles (Points)
- Element cards: 118 individual meshes (acceptable for this count)
- Frustum culling: auto-handled by Three.js
- No shadow maps (too expensive, not needed)

### React
- `React.memo` on ElementCard (no unnecessary re-renders)
- `useCallback` for event handlers
- `useMemo` for formation position arrays
- `useRef` for mutable animation state (not state)
- `dynamic()` with `ssr: false` for the entire 3D scene

### Shader
- Uniforms updated via `ref.current.uniforms.x.value = y` (no re-creation)
- Shader compiled once, shared via ShaderMaterial class

### Memory
- `Vector3` objects pooled (not created per frame)
- Formation positions memoized in store

---

## 13. STATE MANAGEMENT (Zustand)

```typescript
interface AppState {
  // Element interaction
  selectedElement: Element | null
  hoveredElement: Element | null
  
  // Formation
  currentFormation: FormationType
  isTransitioning: boolean
  
  // UI
  isLoading: boolean
  audioEnabled: boolean
  showInfo: boolean
  
  // Camera
  cameraTarget: [number, number, number]
  
  // Actions
  setSelectedElement: (el: Element | null) => void
  setHoveredElement: (el: Element | null) => void
  setFormation: (f: FormationType) => void
  setLoading: (b: boolean) => void
  toggleAudio: () => void
}
```

Why Zustand over Context:
- No provider wrapping needed
- No re-render bubbling issues
- Works seamlessly inside R3F (no React tree issues)
- Tiny bundle size

---

## 14. LOADING SEQUENCE

1. **Frame 0**: Black screen, site loads
2. **Frame 1-2s**: Loading screen visible
   - Animated logo/title
   - Progress bar (fake, 2s)
   - Particle burst animation
3. **Frame 2s**: Scene mounts under loading screen
4. **Frame 2.5s**: Loading screen fades out (Framer Motion)
5. **Frame 2.5-4s**: Intro animation
   - All 118 elements start far away (z: -100 to -200)
   - Spring toward table positions with 0-800ms stagger
   - Camera slowly pulls back to reveal full table
6. **Frame 4s+**: Normal interaction mode

---

## 15. INTERACTION SYSTEM

### Mouse Events
- `onPointerEnter`: set hovered, trigger hover animation
- `onPointerLeave`: clear hovered
- `onClick`: set selected, camera focus
- `onPointerMissed` (Canvas level): deselect

### Keyboard
- `Escape`: deselect / close modal
- `1-9`: switch formations
- `F`: fullscreen toggle
- `M`: mute/unmute audio
- `Arrow keys`: navigate elements

### Touch / Mobile
- OrbitControls handles pinch/pan
- Formation picker scrollable horizontally
- Larger hit targets on mobile

---

## 16. RESPONSIVE DESIGN

```
Desktop (>1200px):  Full 3D experience, all effects
Tablet (768-1200px): Reduced particles (1500), moderate effects
Mobile (<768px):    Minimal particles (500), no DOF, smaller cards
```

Camera z-distance adjusts to viewport width:
```typescript
z = window.innerWidth < 768 ? 30 : 22
```

---

## 17. UI COMPONENT BREAKDOWN

### HUD (heads-up display)
- Top-left: Element symbol (large, neon) + name when hovered
- Top-right: Category badge + atomic number
- Bottom: Formation picker strip
- Bottom-left: Audio toggle + fullscreen
- Center: Subtle crosshair (when no element hovered)

### FormationPicker
- Horizontal scrolling list of 9 formations
- Each: small icon + name
- Active: neon highlight + glow
- Transition: Framer Motion spring

### ElementModal
- Slides in from right (Framer Motion)
- Frosted glass background (backdrop-filter: blur)
- Electron shell diagram (CSS + canvas)
- Property grid: mass, period, group, electronegativity
- Close button: X in corner

### LoadingScreen
- Full viewport overlay
- "ELEMENT LABORATORY" title with letter stagger
- Animated scanning line
- Particle count display (0 → 118)
- Fade out with blur when done

---

## 18. AUDIO SYSTEM

Web Audio API procedural synth (no audio files needed):
```typescript
// Ambient pad: 3 detuned oscillators at ~50-80Hz
// Subtly modulated volume and filter
// Formation change: swoosh sound (filtered noise burst)
// Hover: soft ping (sine wave, 800ms decay)
// Click: deeper thud (sine wave 120Hz, 500ms)
```

---

## 19. VISUAL DESIGN SYSTEM

### Typography
```
Primary font: 'Space Grotesk' (Google Fonts) — clean sci-fi feel
Mono font: 'JetBrains Mono' — for numbers, data
Display font: 'Orbitron' — for titles and labels
```

### Color System
```
Background:    #000000 (pure black)
Surface:       #0a0a0f (near-black with blue tint)
Border:        #1a1a2e
Accent 1:      #00ccff (primary cyan)
Accent 2:      #ff0088 (secondary magenta)
Accent 3:      #00ff88 (tertiary green)
Text:          #e0e0f0
Text muted:    #606080
```

### Glassmorphism (CSS)
```css
background: rgba(255,255,255,0.03)
backdrop-filter: blur(20px) saturate(180%)
border: 1px solid rgba(255,255,255,0.08)
box-shadow: 0 0 20px rgba(0,200,255,0.1)
```

---

## 20. MOTION PRINCIPLES

**Formation transitions:**
- Duration: ~1-2s total (staggered over 0-500ms)
- Easing: Spring (stiffness 0.06, damping 0.88)
- Feeling: Elements feel like they have mass and momentum

**UI elements:**
- Duration: 200-400ms
- Easing: cubic-bezier(0.16, 1, 0.3, 1) (fast out)
- Feeling: Instant, precise, premium

**Camera:**
- Duration: 800ms to new target
- Easing: exponential out
- Feeling: Cinematic, weighty

---

## 21. MAJOR TECHNICAL DECISIONS

### Decision 1: R3F vs vanilla Three.js
**Choice: R3F**
Reason: React reconciliation handles mesh lifecycle. Declarative scene
description matches component architecture. Drei provides battle-tested
helpers (Text, OrbitControls). Easier state integration.

### Decision 2: Individual meshes vs InstancedMesh
**Choice: Individual meshes for elements**
Reason: 118 elements are within comfortable WebGL limits. Individual meshes
allow per-element shaders, independent animation, pointer events. InstancedMesh
would require custom picking logic and uniform arrays.

### Decision 3: Spring in useFrame vs react-spring
**Choice: Custom spring in useFrame**
Reason: Full control over spring constants. No React state updates per frame
(using refs). Stagger system easier to implement. Same visual result with
less abstraction overhead.

### Decision 4: Custom shader vs MeshPhysicalMaterial
**Choice: Custom ShaderMaterial**
Reason: MeshPhysicalMaterial cannot produce neon border glow with transparent
interior. Custom GLSL gives exact control. Can animate border independently
of glass interior. Better performance (no PBR overhead for unlit dark cards).

### Decision 5: Zustand vs Context vs Jotai
**Choice: Zustand**
Reason: Works outside React tree (needed for R3F hooks). No provider wrapping.
Minimal boilerplate. Selector-based subscriptions prevent unnecessary renders.

---

## 22. IMPLEMENTATION ORDER

1. ✅ package.json + config files
2. ✅ Types (index.ts)
3. ✅ Elements data (elements.ts)
4. ✅ Formation algorithms (formations.ts)
5. ✅ Colors (colors.ts)
6. ✅ Zustand store (useStore.ts)
7. ✅ ElementCard 3D component
8. ✅ ParticleField
9. ✅ Effects (postprocessing)
10. ✅ CameraController
11. ✅ Scene (root R3F canvas)
12. ✅ LoadingScreen
13. ✅ FormationPicker
14. ✅ ElementModal
15. ✅ HUD
16. ✅ Page + Layout
17. ✅ Global CSS

---

*Plan complete. Implementation follows.*
