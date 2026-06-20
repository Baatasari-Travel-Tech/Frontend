// The admin portal has moved to a dedicated app + backend (admin.baatasari.com).
// There are no admin routes on the public website anymore, so this always
// returns false. Kept as a thin shim so the public shell/providers compile
// unchanged.
export const isAdminRoutePath = (_pathname: string | null | undefined): boolean => false
