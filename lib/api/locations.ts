import { apiRequest } from "./client"

export type LocationResult = {
  id: string
  area: string
  city: string | null
  district: string | null
  state: string | null
  pincode: string | null
  lat: number | null
  lng: number | null
  // "Area, City, State - Pincode"
  label: string
}

export const searchLocations = (q: string) =>
  apiRequest<{ data: { locations: LocationResult[] } }>(
    `/locations/search?q=${encodeURIComponent(q)}`,
  ).then((r) => r.data.locations)
