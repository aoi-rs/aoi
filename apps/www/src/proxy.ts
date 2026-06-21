import { RequestCookiesAdapter } from 'next/dist/server/web/spec-extension/adapters/request-cookies'
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

  if (request.cookies.has(CONFIG.ASAHI_ACCESS_TOKEN_COOKIE_KEY)) {
    const client = await createSSRClient(
      request.headers,
      RequestCookiesAdapter.seal(request.cookies),
    )

    const { data, response } = await client.GET('/v1/user', {
      cache: 'no-cache',
    })

    if (!response.ok && response.status !== 401) {
      console.error('Failed to fetch authenticated user')

      throw new Error(
        'Unexpected response status when fetching authenticated user',
      )
    }

    user = data
  }

  const requiresAuthentication = AUTHENTICATED_ROUTES.some((route) =>
    route.test(request.nextUrl.pathname),
  )

  if (requiresAuthentication && !user) {
    return createLoginResponse(request)
  }

  const headers: Record<string, string> = {}

  if (user) {
    headers['x-asahi-user'] = Buffer.from(JSON.stringify(user)).toString(
      'base64',
    )
  }

  const response = NextResponse.next({ headers })

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
