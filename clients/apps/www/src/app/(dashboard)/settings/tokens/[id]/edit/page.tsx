import { PersonalAccessTokenForm } from '@/components/personal-access-token-form'

interface EditPersonalAccessTokenProps {
  params: Promise<{ id: string }>
}

export default async function EditPersonalAccessToken({
  params,
}: EditPersonalAccessTokenProps) {
  const { id } = await params

  return <PersonalAccessTokenForm id={id} />
}
