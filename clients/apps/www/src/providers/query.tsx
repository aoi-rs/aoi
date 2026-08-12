'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { getQueryClient } from '@/utils/query'

interface AoiQueryClientProviderProps {
  children: ReactNode
}

export function AoiQueryClientProvider({
  children,
}: AoiQueryClientProviderProps) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
