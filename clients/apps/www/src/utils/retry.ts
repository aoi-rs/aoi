import type { ClientResponseError } from '@/generated/server'

function defaultRetry(failures: number, error: ClientResponseError) {
  if (error.response.status === 401) {
    return false
  }

  if (error.response.status === 404) {
    return false
  }

  if (failures > 2) {
    return false
  }

  return true
}

export { defaultRetry }
