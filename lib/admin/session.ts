export const ADMIN_TOKEN_KEY = "admin_token"

export const getAdminToken = () => {
  if (typeof window === "undefined") return null
  return localStorage.getItem(ADMIN_TOKEN_KEY)
}

export const setAdminToken = (token: string) => {
  if (typeof window === "undefined") return
  localStorage.setItem(ADMIN_TOKEN_KEY, token)
}

export const clearAdminToken = () => {
  if (typeof window === "undefined") return
  localStorage.removeItem(ADMIN_TOKEN_KEY)
}
