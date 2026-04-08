import { useState, useMemo } from 'react'

export type SortDir = 'asc' | 'desc'

export interface SortState<K extends string> {
  key:  K
  dir:  SortDir
}

export function useSortable<T, K extends string>(
  data:        T[],
  defaultKey:  K,
  defaultDir:  SortDir = 'desc',
  getValue:    (row: T, key: K) => number | string,
) {
  const [sort, setSort] = useState<SortState<K>>({ key: defaultKey, dir: defaultDir })

  function handleSort(key: K) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' }
        : { key, dir: 'desc' },
    )
  }

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const va = getValue(a, sort.key)
      const vb = getValue(b, sort.key)
      const cmp = typeof va === 'string'
        ? va.localeCompare(vb as string, 'pt-BR')
        : (va as number) - (vb as number)
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [data, sort, getValue])

  return { sorted, sort, handleSort }
}
