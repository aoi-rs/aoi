import { cache } from 'react'
import { type Client, type schemas, unwrap } from '@/generated/server'

async function _retrievePersonalAccessToken(
  client: Client,
  id: string,
): Promise<schemas['PersonalAccessTokenSchema']> {
  return await unwrap(
    client.GET('/v1/personal_access_tokens/{id}', {
      params: { path: { id } },
      cache: 'no-store',
    }),
  )
}

export const retrievePersonalAccessToken = cache(_retrievePersonalAccessToken)
