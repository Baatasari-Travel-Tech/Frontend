export type AppRole = 'USER' | 'EVENT_ORGANIZER' | 'VENDOR' | 'RESTAURANT' | 'TALENT'

export const ALL_ROLES: AppRole[] = [
  'USER',
  'EVENT_ORGANIZER',
  'VENDOR',
  'RESTAURANT',
  'TALENT',
]

export const ROLE_LABELS: Record<AppRole, string> = {
  USER:            'User',
  EVENT_ORGANIZER: 'Event Organizer',
  VENDOR:          'Vendor',
  RESTAURANT:      'Restaurant',
  TALENT:          'Talent',
}

export const ROLE_EMOJI: Record<AppRole, string> = {
  USER:            '👤',
  EVENT_ORGANIZER: '🎪',
  VENDOR:          '🛍️',
  RESTAURANT:      '🍽️',
  TALENT:          '🎤',
}

export const getRoleDashboard = (role: AppRole): string => {
  switch (role) {
    case 'EVENT_ORGANIZER': return '/event-organizer/dashboard'
    case 'VENDOR':          return '/vendor/dashboard'
    case 'RESTAURANT':      return '/restaurant/dashboard'
    case 'TALENT':          return '/talent/dashboard'
    default:                return '/dashboard'
  }
}

export const getRoleOnboarding = (role: AppRole): string => {
  switch (role) {
    case 'EVENT_ORGANIZER': return '/event-organizer/onboarding'
    case 'VENDOR':          return '/vendor/onboarding'
    case 'RESTAURANT':      return '/restaurant/onboarding'
    case 'TALENT':          return '/talent/onboarding'
    default:                return '/onboarding'
  }
}

export const isValidRole = (v: unknown): v is AppRole =>
  typeof v === 'string' && (ALL_ROLES as string[]).includes(v)