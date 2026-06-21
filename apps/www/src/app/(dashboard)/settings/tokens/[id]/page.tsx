import { PersonalAccessTokenDetails } from '@/components/personal-access-token-details'
import { createSSRClient } from '@/utils/client/serverside'
import { retrievePersonalAccessToken } from '@/utils/personal-access-token'

interface PersonalAccessTokenProps {
  params: Promise<{ id: string }>
}

export default async function PersonalAccessToken({
  params,
}: PersonalAccessTokenProps) {
  const { id } = await params

  const client = await createSSRClient()
  const token = await retrievePersonalAccessToken(client, id)

  return <PersonalAccessTokenDetails token={token} />
}
