/**
 * Scientifically accurate electron shell data for elements 1–21 (H → Sc).
 * For elements 22+ a generalised Bohr-model fallback is provided.
 *
 * Each ShellInfo carries:
 *   - Principal quantum number n, IUPAC letter label (K / L / M / N)
 *   - Total electrons in that shell
 *   - Readable subshell occupancy string for the tooltip
 *   - isValence flag so the renderer can highlight the outer shell
 */

export interface ShellInfo {
  n: number          // 1 = K, 2 = L, …
  label: string      // 'K' | 'L' | 'M' | 'N'
  electrons: number  // total electrons in this shell
  subshells: string  // e.g. '2s² 2p⁶'
  isValence: boolean // true for the outermost occupied shell
}

export interface AtomicConfig {
  atomicNumber: number
  symbol: string
  shells: ShellInfo[]
  valenceElectrons: number
}

// ─── Raw table: [atomicNumber, symbol, electrons-per-shell[], subshell-strings[]] ──

const SHELL_LABELS = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'] as const

type RawRow = [number, string, number[], string[]]

const RAW: RawRow[] = [
  // ── Period 1 ──────────────────────────────────────────────────────────────
  [1,  'H',  [1],       ['1s¹']],
  [2,  'He', [2],       ['1s²']],
  // ── Period 2 ──────────────────────────────────────────────────────────────
  [3,  'Li', [2, 1],    ['1s²', '2s¹']],
  [4,  'Be', [2, 2],    ['1s²', '2s²']],
  [5,  'B',  [2, 3],    ['1s²', '2s² 2p¹']],
  [6,  'C',  [2, 4],    ['1s²', '2s² 2p²']],
  [7,  'N',  [2, 5],    ['1s²', '2s² 2p³']],
  [8,  'O',  [2, 6],    ['1s²', '2s² 2p⁴']],
  [9,  'F',  [2, 7],    ['1s²', '2s² 2p⁵']],
  [10, 'Ne', [2, 8],    ['1s²', '2s² 2p⁶']],
  // ── Period 3 ──────────────────────────────────────────────────────────────
  [11, 'Na', [2, 8, 1],        ['1s²', '2s² 2p⁶', '3s¹']],
  [12, 'Mg', [2, 8, 2],        ['1s²', '2s² 2p⁶', '3s²']],
  [13, 'Al', [2, 8, 3],        ['1s²', '2s² 2p⁶', '3s² 3p¹']],
  [14, 'Si', [2, 8, 4],        ['1s²', '2s² 2p⁶', '3s² 3p²']],
  [15, 'P',  [2, 8, 5],        ['1s²', '2s² 2p⁶', '3s² 3p³']],
  [16, 'S',  [2, 8, 6],        ['1s²', '2s² 2p⁶', '3s² 3p⁴']],
  [17, 'Cl', [2, 8, 7],        ['1s²', '2s² 2p⁶', '3s² 3p⁵']],
  [18, 'Ar', [2, 8, 8],        ['1s²', '2s² 2p⁶', '3s² 3p⁶']],
  // ── Period 4 ──────────────────────────────────────────────────────────────
  [19, 'K',  [2, 8, 8, 1],     ['1s²', '2s² 2p⁶', '3s² 3p⁶', '4s¹']],
  [20, 'Ca', [2, 8, 8, 2],     ['1s²', '2s² 2p⁶', '3s² 3p⁶', '4s²']],
  // Sc: M shell = 9 (includes 3d¹); N shell = 2
  [21, 'Sc', [2, 8, 9, 2],     ['1s²', '2s² 2p⁶', '3s² 3p⁶ 3d¹', '4s²']],
]

function buildConfig([atomicNumber, symbol, shellCounts, subshells]: RawRow): AtomicConfig {
  const lastIdx = shellCounts.length - 1
  return {
    atomicNumber,
    symbol,
    shells: shellCounts.map((electrons, i) => ({
      n: i + 1,
      label: SHELL_LABELS[i],
      electrons,
      subshells: subshells[i],
      isValence: i === lastIdx,
    })),
    valenceElectrons: shellCounts[lastIdx],
  }
}

export const ATOMIC_CONFIGS: Map<number, AtomicConfig> = new Map(
  RAW.map(row => [row[0], buildConfig(row)])
)

/** Returns the precise config for H–Sc, or null for elements 22+. */
export function getAtomicConfig(atomicNumber: number): AtomicConfig | null {
  return ATOMIC_CONFIGS.get(atomicNumber) ?? null
}

/**
 * Bohr-model fallback for elements 22+.
 * Uses classical shell capacities: K=2, L=8, M=18, N=32, O=32, P=18, Q=8.
 */
export function buildGenericShells(totalElectrons: number): ShellInfo[] {
  const capacities = [2, 8, 18, 32, 32, 18, 8]
  const shells: ShellInfo[] = []
  let remaining = totalElectrons
  for (let i = 0; i < capacities.length && remaining > 0; i++) {
    const count = Math.min(remaining, capacities[i])
    shells.push({
      n: i + 1,
      label: SHELL_LABELS[i],
      electrons: count,
      subshells: `n = ${i + 1}`,
      isValence: false,
    })
    remaining -= count
  }
  if (shells.length > 0) shells[shells.length - 1].isValence = true
  return shells
}
