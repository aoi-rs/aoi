import { PersonalAccessTokenList } from '@/components/personal-access-token-list'
import { ProfileForm } from '@/components/profile-form'
import { SessionList } from '@/components/session-list'
import { unwrap } from '@/generated/server'
import { createSSRClient } from '@/utils/client/serverside'

export default async function Settings() {
  const service = await createSSRClient()

  const sessions = await unwrap(
    service.GET('/v1/sessions/', { params: { query: { limit: 100 } } }),
  )

  return (
    <div className="flex flex-col mt-4 mb-8 mx-5.5 sm:mx-10 sm:my-16 items-center">
      <div className="w-full max-w-160 flex flex-col gap-8">
        <h1 className="px-4 text-2xl font-medium">Profile</h1>

        <div className="flex flex-col gap-9 sm:gap-12">
          <ProfileForm />

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-0.5 px-4">
              <h2 className="text-sm font-medium">Sessions</h2>

              <p className="text-sm font-[450] text-aoi-500">
                See devices logged into your account
              </p>
            </div>

            <SessionList sessions={sessions} />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-0.5 px-4">
              <h2 className="text-sm font-medium">Personal access tokens</h2>

              <p className="text-sm font-[450] text-aoi-500">
                Use the REST API to build your own integrations
              </p>
            </div>

            <PersonalAccessTokenList />
          </div>
        </div>
      </div>
    </div>
  )
}
