const defaults = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000',
  AOI_ACCESS_TOKEN_COOKIE_KEY: 'aoi_access_token',
  AOI_REFRESH_TOKEN_COOKIE_KEY: 'aoi_refresh_token',
}

export const CONFIG = { ...defaults }
