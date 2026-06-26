import { headers } from 'next/headers'
import { cache } from 'react'
import type { schemas } from '@/generated/server'

async function _resolveAuthenticatedUser(): Promise<
  schemas['UserSchema'] | null
> {
  const _headers = await headers()
  const data = _headers.get('x-aoi-user')

  const user = data && JSON.parse(Buffer.from(data, 'base64').toString('utf-8'))

  return user
}

export const resolveAuthenticatedUser = cache(_resolveAuthenticatedUser)
