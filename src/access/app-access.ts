import type { Access, PayloadRequest, Where } from 'payload'

type AppIdentity = {
  id: string
  collection?: string
  role?: 'producer' | 'retailer' | 'platform-admin'
  organization?: string | { id: string }
}

export const getIdentity = (req: PayloadRequest) => req.user as AppIdentity | null

export const isCmsAdmin = (req: PayloadRequest) => req.user?.collection === 'admins'

export const isPlatformAdmin = (req: PayloadRequest) => {
  const user = getIdentity(req)
  return isCmsAdmin(req) || (user?.collection === 'app-users' && user.role === 'platform-admin')
}

export const organizationID = (req: PayloadRequest) => {
  const organization = getIdentity(req)?.organization
  return typeof organization === 'object' ? organization.id : organization
}

export const staffOnly: Access = ({ req }) => isPlatformAdmin(req)

export const signedInAppUser: Access = ({ req }) =>
  req.user?.collection === 'app-users' || isCmsAdmin(req)

export const ownProfile: Access = ({ req }) => {
  if (isPlatformAdmin(req)) return true
  if (req.user?.collection !== 'app-users') return false
  return { id: { equals: req.user.id } }
}

export const ownOrganization: Access = ({ req }) => {
  if (isPlatformAdmin(req)) return true
  const id = organizationID(req)
  return id ? { id: { equals: id } } : false
}

export const organizationOwned =
  (field = 'organization'): Access =>
  ({ req }) => {
    if (isPlatformAdmin(req)) return true
    const id = organizationID(req)
    return id ? ({ [field]: { equals: id } } as Where) : false
  }

export const orderParticipant: Access = ({ req }) => {
  if (isPlatformAdmin(req)) return true
  const id = organizationID(req)
  if (!id) return false
  return {
    or: [{ buyerOrganization: { equals: id } }, { producerOrganization: { equals: id } }],
  } as Where
}

export const orderParticipantViaOrder: Access = ({ req }) => {
  if (isPlatformAdmin(req)) return true
  const id = organizationID(req)
  if (!id) return false
  return {
    or: [
      { 'order.buyerOrganization': { equals: id } },
      { 'order.producerOrganization': { equals: id } },
    ],
  } as Where
}
