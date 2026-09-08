export default defineNuxtRouteMiddleware(async (to) => {
  const requiredRole = to.meta.requiredRole
  if (typeof requiredRole !== 'string')
    return

  const { ensureSession } = useAuth()
  const session = await ensureSession()
  if (!session)
    return navigateTo('/')

  const roles = new Set(
    session.roles.map(role => role.trim().toLowerCase().replace(/^role[._:-]?/, '')),
  )

  if (!roles.has(requiredRole))
    return navigateTo('/')
})
