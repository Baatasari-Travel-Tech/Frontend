import { FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa"
import type { SiteConfig } from "@/types/api"

export function FooterSocialLinks({ config }: { config: SiteConfig }) {
  return (
    <div className="flex items-center gap-4">
      {config.instagram !== "#" && (
        <a
          href={config.instagram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="rounded-full border border-slate-600 p-2.5 hover:bg-slate-800 transition"
        >
          <FaInstagram className="h-5 w-5" />
        </a>
      )}
      {config.linkedin !== "#" && (
        <a
          href={config.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          className="rounded-full border border-slate-600 p-2.5 hover:bg-slate-800 transition"
        >
          <FaLinkedin className="h-5 w-5" />
        </a>
      )}
      {config.twitter !== "#" && (
        <a
          href={config.twitter}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Twitter / X"
          className="rounded-full border border-slate-600 p-2.5 hover:bg-slate-800 transition"
        >
          <FaTwitter className="h-5 w-5" />
        </a>
      )}
    </div>
  )
}
