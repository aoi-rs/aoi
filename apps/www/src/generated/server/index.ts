import createOpenAPIFetchClient, {
  type FetchResponse,
  type HeadersOptions,
  type ParseAsResponse,
} from 'openapi-fetch'
import type {
  ResponseObjectMap,
  SuccessResponse,
} from 'openapi-typescript-helpers'
import type { components, paths } from '@/generated/server/schema'

function createClient(baseURL: string, headers?: HeadersOptions) {
  return {
    ...createOpenAPIFetchClient<paths>({
      baseUrl: baseURL,
      credentials: 'include',
      headers: {
        ...(headers ? headers : {}),
      },
    }),
    baseURL,
  }
}

type ClientResponseErrorBody = Record<string, unknown> & { message?: string }

class ClientResponseError extends Error {
  error: ClientResponseErrorBody
  response: Response

  constructor(error: ClientResponseErrorBody, response: Response) {
    super(error.message)

    this.name = 'ClientResponseError'
    this.error = error
    this.response = response
  }
}

const unwrap = async <
  T extends Record<string | number, unknown>,
  Options,
  Media extends `${string}/${string}`,
>(
  promise: Promise<FetchResponse<T, Options, Media>>,
  handlers?: {
    [status: number]: (response: Response) => never
  },
): Promise<
  ParseAsResponse<SuccessResponse<ResponseObjectMap<T>, Media>, Options>
> => {
  const { data, error, response } = await promise

  if (handlers) {
    const handler = handlers[response.status]
    if (handler) {
      return handler(response)
    }
  }

  if (error) {
    throw new ClientResponseError(error, response)
  }

  if (!data) {
    throw new Error('no data returned')
  }

  return data
}

export type { Middleware } from 'openapi-fetch'
export type { components, operations, paths } from '@/generated/server/schema'

export {
  ClientResponseError,
  type ClientResponseErrorBody,
  createClient,
  unwrap,
}

export type schemas = components['schemas']
export type Client = ReturnType<typeof createClient>
