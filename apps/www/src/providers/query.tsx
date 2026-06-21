'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { getQueryClient } from '@/utils/query'

interface AsahiQueryClientProviderProps {
  children: ReactNode
}

export function AsahiQueryClientProvider({
  children,
}: AsahiQueryClientProviderProps) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
