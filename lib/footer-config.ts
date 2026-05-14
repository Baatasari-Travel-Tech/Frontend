export type FooterConfig = {
  instagram: string
  linkedin: string
  twitter: string
}

export const FOOTER_CONFIG_STORAGE_KEY = "baatasari-footer-config"

export const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  instagram: "#",
  linkedin: "#",
  twitter: "#",
}

export function getFooterConfig(): FooterConfig {
  if (typeof window === "undefined") return DEFAULT_FOOTER_CONFIG
  try {
    const raw = window.localStorage.getItem(FOOTER_CONFIG_STORAGE_KEY)
    if (!raw) return DEFAULT_FOOTER_CONFIG
    const parsed = JSON.parse(raw) as Partial<FooterConfig>
    return { ...DEFAULT_FOOTER_CONFIG, ...parsed }
  } catch {
    return DEFAULT_FOOTER_CONFIG
  }
}

export function saveFooterConfig(config: FooterConfig): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(FOOTER_CONFIG_STORAGE_KEY, JSON.stringify(config))
  } catch {
    // ignore write failures (e.g. private browsing storage quota)
  }
}
