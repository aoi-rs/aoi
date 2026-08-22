import { cache } from 'react'
import { type Client, type schemas, unwrap } from '@/generated/server'

async function _listLinks(client: Client): Promise<schemas['LinkSchema'][]> {
  return await unwrap(
    client.GET('/v1/links/', { params: { query: { first: 100 } } }),
  )
}

export const listLinks = cache(_listLinks)

async function _retrieveLink(
  client: Client,
  id: string,
): Promise<schemas['LinkSchema']> {
  return unwrap(client.GET('/v1/links/{id}', { params: { path: { id } } }))
}

export const retrieveLink = cache(_retrieveLink)
