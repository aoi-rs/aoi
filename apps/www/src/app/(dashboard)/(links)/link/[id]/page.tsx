import { createSSRClient } from '@/utils/client/serverside'
import { retrieveLink } from '@/utils/link'
import { LinkDetails } from './_components/link-details'

interface LinkProps {
  params: Promise<{ id: string }>
}

export default async function _Link({ params }: LinkProps) {
  const { id } = await params

  const client = await createSSRClient()
  const link = await retrieveLink(client, id)

  return <LinkDetails link={link} />
}
