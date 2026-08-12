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
    <div className="mx-5.5 mt-4 mb-8 flex flex-col items-center sm:mx-10 sm:my-16">
      <div className="flex w-full max-w-160 flex-col gap-8">
        <h1 className="px-4 font-medium text-2xl text-white">Profile</h1>

        <div className="flex flex-col gap-9 sm:gap-12">
          <ProfileForm />

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-0.5 px-4">
              <h2 className="font-medium text-sm text-white">Sessions</h2>

              <span className="font-[450] text-[oklch(0.6674_0.003_271.37)] text-sm">
                See devices logged into your account
              </span>
            </div>

            <SessionList sessions={sessions} />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-0.5 px-4">
              <h2 className="font-medium text-sm text-white">
                Personal access tokens
              </h2>

              <p className="font-[450] text-[oklch(0.6674_0.003_271.37)] text-sm">
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
