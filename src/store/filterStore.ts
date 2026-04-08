import { create } from 'zustand'

interface FilterStore {
  mes:    number[]
  ano:    number[]
  filial: string[]
  uf:     string[]
  grupo:  string[]
  cliente: string[]

  setFiltro:          (key: 'mes' | 'ano' | 'filial' | 'uf' | 'grupo' | 'cliente', value: (string | number)[]) => void
  // mantidos para compatibilidade com TabNav/Sidebar
  setFiltroGlobal:    (key: 'ano' | 'mes' | 'filial', value: (string | number)[]) => void
  setFiltroLocal:     (key: 'uf' | 'grupo' | 'cliente', value: string[]) => void
  resetFiltrosLocais: () => void
}

export const useFilterStore = create<FilterStore>((set) => ({
  mes:     [],
  ano:     [new Date().getFullYear()],
  filial:  [],
  uf:      [],
  grupo:   [],
  cliente: [],

  setFiltro:       (key, value) => set((s) => ({ ...s, [key]: value })),
  setFiltroGlobal: (key, value) => set((s) => ({ ...s, [key]: value })),
  setFiltroLocal:  (key, value) => set((s) => ({ ...s, [key]: value })),
  resetFiltrosLocais: () => set((s) => ({ ...s, uf: [], grupo: [], cliente: [] })),
}))
