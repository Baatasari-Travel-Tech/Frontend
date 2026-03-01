export type AppRole = 'user' | 'organizer' | 'vendor' | 'restaurant'
export type DbRoleName = 'USER' | 'EVENT_ORGANIZER' | 'VENDOR' | 'RESTAURANT' | 'TALENT'

export const isRole = (value: string | null | undefined): value is AppRole => {
  return value === 'user' || value === 'organizer' || value === 'vendor' || value === 'restaurant'
}

export const getRoleHome = (role: AppRole | null | undefined) => {
  switch (role) {
    case 'organizer':
      return '/event-organizer/dashboard'
    case 'vendor':
      return '/vendor/dashboard'
    case 'restaurant':
      return '/restaurant/dashboard'
    case 'user':
    default:
      return '/dashboard'
  }
}

export const getRoleOnboarding = (role: AppRole | null | undefined) => {
  switch (role) {
    case 'organizer':
      return '/event-organizer/onboarding'
    case 'vendor':
      return '/vendor/onboarding'
    case 'restaurant':
      return '/restaurant/onboarding'
    case 'user':
    default:
      return '/onboarding'
  }
}

export const ROLE_LABELS: Record<AppRole, string> = {
  user: 'Normal User',
  organizer: 'Event Organizer',
  vendor: 'Vendor',
  restaurant: 'Restaurant',
}

export const toDbRoleName = (role: AppRole) => {
  switch (role) {
    case 'organizer':
      return 'EVENT_ORGANIZER' as const
    case 'vendor':
      return 'VENDOR' as const
    case 'restaurant':
      return 'RESTAURANT' as const
    case 'user':
    default:
      return 'USER' as const
  }
}

export const fromDbRoleName = (value: string | null | undefined): AppRole | null => {
  switch (value) {
    case 'USER':
      return 'user'
    case 'EVENT_ORGANIZER':
      return 'organizer'
    case 'VENDOR':
      return 'vendor'
    case 'RESTAURANT':
      return 'restaurant'
    case 'TALENT':
      return 'user'
    default:
      return null
  }
}
