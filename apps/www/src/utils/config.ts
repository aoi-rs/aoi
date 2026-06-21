const defaults = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000',
  ASAHI_ACCESS_TOKEN_COOKIE_KEY: 'ah_access_token',
  ASAHI_REFRESH_TOKEN_COOKIE_KEY: 'ah_refresh_token',
}

export const CONFIG = { ...defaults }
