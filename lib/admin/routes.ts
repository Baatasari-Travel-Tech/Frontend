const ADMIN_ROUTE_SECRET = process.env.NEXT_PUBLIC_ADMIN

export const ADMIN_ROUTE_BASE = `/admin/${ADMIN_ROUTE_SECRET}` as const

export const ADMIN_ROUTES = {
  base: ADMIN_ROUTE_BASE,
  login: `${ADMIN_ROUTE_BASE}/login`,
  verify: `${ADMIN_ROUTE_BASE}/verify`,
  dashboard: `${ADMIN_ROUTE_BASE}/dashboard`,
  users: `${ADMIN_ROUTE_BASE}/users`,
} as const

export const isAdminRoutePath = (pathname: string | null | undefined): boolean =>
  typeof pathname === "string" && pathname.startsWith(ADMIN_ROUTE_BASE)
