"use client"

import { useState } from "react"
import { FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa"
import { getFooterConfig, saveFooterConfig, type FooterConfig } from "@/lib/footer-config"

export function FooterSocialLinks() {
  const [config, setConfig] = useState<FooterConfig>(getFooterConfig)
  const [editOpen, setEditOpen] = useState(false)
  const [draft, setDraft] = useState<FooterConfig>(config)

  const openEdit = () => {
    setDraft(config)
    setEditOpen(true)
  }

  const handleSave = () => {
    saveFooterConfig(draft)
    setConfig(draft)
    setEditOpen(false)
  }

  return (
    <>
      <div className="mt-4 flex items-center gap-4">
        <a
          href={config.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-slate-600 p-2.5 hover:bg-slate-800 transition"
        >
          <FaInstagram className="h-5 w-5" />
        </a>
        <a
          href={config.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-slate-600 p-2.5 hover:bg-slate-800 transition"
        >
          <FaLinkedin className="h-5 w-5" />
        </a>
        <a
          href={config.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-slate-600 p-2.5 hover:bg-slate-800 transition"
        >
          <FaTwitter className="h-5 w-5" />
        </a>
      </div>

      <button
        type="button"
        onClick={openEdit}
        className="mt-2 text-xs text-slate-500 hover:text-slate-300 underline underline-offset-2 transition"
      >
        Edit links
      </button>

      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Edit footer links"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setEditOpen(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-5">Edit Footer Links</h3>

            {(["instagram", "linkedin", "twitter"] as const).map((platform) => (
              <div key={platform} className="mb-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 capitalize">
                  {platform}
                </label>
                <input
                  type="url"
                  value={draft[platform]}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, [platform]: e.target.value }))
                  }
                  placeholder={`https://${platform}.com/baatasari`}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>
            ))}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
