import type { NextConfig } from 'next'

const ASAHI_ACCESS_TOKEN_COOKIE_NAME =
  process.env.ASAHI_ACCESS_TOKEN_COOKIE_NAME || 'ah_access_token'

const FRONTEND_HOSTNAME = process.env.NEXT_PUBLIC_FRONTEND_BASE_URL
  ? new URL(process.env.NEXT_PUBLIC_FRONTEND_BASE_URL).hostname
  : '127.0.0.1'

const config: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'github.com',
      },
    ],
  },
  redirects: () => [
    {
      source: '/',
      destination: '/links',
      has: [
        {
          type: 'cookie',
          key: ASAHI_ACCESS_TOKEN_COOKIE_NAME,
        },
        {
          type: 'host',
          value: FRONTEND_HOSTNAME,
        },
      ],
      permanent: false,
    },
  ],
}

export default config
