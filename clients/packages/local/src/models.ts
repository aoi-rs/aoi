import { field, model } from '@/decorators'
import { Model } from '@/model'

export interface Meta {
  id: 'meta'
  last_revision: number
}

@model('user', { PATCH: '/v1/user' })
export class Profile extends Model {
  @field({ mutable: true })
  name!: string | null

  @field()
  email!: string

  @field()
  created_at!: string

  @field()
  modified_at!: string | null
}

@model('session')
export class Session extends Model {
  @field()
  user_agent!: string

  @field()
  name!: string

  @field()
  refreshed_at!: string

  @field()
  is_current_session!: boolean

  @field()
  created_at!: string

  @field()
  modified_at!: string | null
}

@model('personal_access_token')
export class PersonalAccessToken extends Model {
  @field({ mutable: true })
  name!: string

  @field({ mutable: true })
  permissions!: string[]

  @field({ mutable: true })
  expires_at!: string | null

  @field()
  created_at!: string

  @field()
  modified_at!: string | null
}
