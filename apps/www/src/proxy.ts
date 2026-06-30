import { RequestCookiesAdapter } from 'next/dist/server/web/spec-extension/adapters/request-cookies'
import { ResponseCookies } from 'next/dist/server/web/spec-extension/cookies'
import { type NextRequest, NextResponse } from 'next/server'
import type { schemas } from '@/generated/server'
import { createSSRClient } from '@/utils/client'
import { CONFIG } from '@/utils/config'

const AUTHENTICATED_ROUTES = [
  /^\/links(\/.*)?/,
  /^\/link(\/.*)?/,
  /^\/settings(\/.*)?/,
]

function createLoginResponse(request: NextRequest) {
  const redirectURL = request.nextUrl.clone()

  redirectURL.pathname = '/login'
  redirectURL.search = ''

  const returnTo = request.nextUrl.pathname + request.nextUrl.search
  redirectURL.searchParams.set('return_to', returnTo)

  return NextResponse.redirect(redirectURL)
}

export async function proxy(request: NextRequest) {
  let user: schemas['UserSchema'] | undefined
  let cookies: ResponseCookies | undefined

  if (
    request.cookies.has(CONFIG.AOI_ACCESS_TOKEN_COOKIE_KEY) ||
    request.cookies.has(CONFIG.AOI_REFRESH_TOKEN_COOKIE_KEY)
  ) {
    let client = await createSSRClient(
      request.headers,
      RequestCookiesAdapter.seal(request.cookies),
    )

    if (request.cookies.has(CONFIG.AOI_REFRESH_TOKEN_COOKIE_KEY)) {
      const { response } = await client.POST('/v1/sessions/refresh')

      if (response.ok) {
        cookies = new ResponseCookies(response.headers)

        for (const cookie of cookies.getAll()) {
          request.cookies.set(cookie)
        }

        client = await createSSRClient(
          request.headers,
          RequestCookiesAdapter.seal(request.cookies),
        )
      }
    }

    if (request.cookies.has(CONFIG.AOI_ACCESS_TOKEN_COOKIE_KEY)) {
      const { data, response } = await client.GET('/v1/user', {
        cache: 'no-cache',
      })

      if (!response.ok && response.status !== 401) {
        throw new Error('Failed to fetch authenticated user')
      }

      user = data
    }
  }

  const requiresAuthentication = AUTHENTICATED_ROUTES.some((route) =>
    route.test(request.nextUrl.pathname),
  )

  if (requiresAuthentication && !user) {
    return createLoginResponse(request)
  }

  const headers: Record<string, string> = {}

  if (user) {
    headers['x-aoi-user'] = Buffer.from(JSON.stringify(user)).toString('base64')
  }

  const response = NextResponse.next({ headers })

  if (cookies) {
    for (const cookie of cookies.getAll()) {
      response.cookies.set(cookie)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - docs, _mintlify, mintlify-assets (Mintlify)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|docs|_mintlify|mintlify-assets|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
