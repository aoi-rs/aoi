import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'
import type { NextRequest } from 'next/server'
import { type Client, createClient } from '@/generated/server'
import { CONFIG } from '@/utils/config'

export function createCSRClient(): Client {
  return createClient(CONFIG.API_BASE_URL)
}

export const service = createCSRClient()

export const createSSRClient = async (
  headers: NextRequest['headers'],
  cookies: ReadonlyRequestCookies,
): Promise<Client> => {
  let _headers = {}

  const xForwardedFor = headers.get('X-Forwarded-For')

  if (xForwardedFor) {
    _headers = {
      ..._headers,
      'X-Forwarded-For': xForwardedFor,
    }
  }

  _headers = {
    ..._headers,
    Cookie: cookies.toString(),
  }

  const client = createClient(CONFIG.API_BASE_URL, _headers)

  return client
}
