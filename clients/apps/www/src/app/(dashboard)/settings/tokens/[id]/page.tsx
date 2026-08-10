import { PersonalAccessTokenDetails } from '@/components/personal-access-token-details'

interface PersonalAccessTokenProps {
  params: Promise<{ id: string }>
}

export default async function PersonalAccessToken({
  params,
}: PersonalAccessTokenProps) {
  const { id } = await params

  return <PersonalAccessTokenDetails id={id} />
}
