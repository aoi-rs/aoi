import PersonalAccessTokenForm from '@/components/personal-access-token-form'
import { createSSRClient } from '@/utils/client/serverside'
import { retrievePersonalAccessToken } from '@/utils/personal-access-token'

interface EditPersonalAccessTokenProps {
  params: Promise<{ id: string }>
}

export default async function EditPersonalAccessToken({
  params,
}: EditPersonalAccessTokenProps) {
  const { id } = await params

  const client = await createSSRClient()
  const token = await retrievePersonalAccessToken(client, id)

  return <PersonalAccessTokenForm token={token} />
}
