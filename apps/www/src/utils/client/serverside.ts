import { cookies, headers } from 'next/headers'
import { cache } from 'react'
import type { Client } from '@/generated/server'
import { createSSRClient as factory } from '.'

async function _createSSRClient(): Promise<Client> {
  return factory(await headers(), await cookies())
}

// This memoizes the client instance for the duration of the request
export const createSSRClient = cache(_createSSRClient)
