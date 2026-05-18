"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/app/providers"
import { uploadUserAvatarImage } from "@/lib/api/uploads"
import { DEFAULT_AVATAR_IMAGE, getAvatarImageUrl } from "@/lib/avatar"
import { AvatarCropDialog, useAvatarCrop } from "./_components/avatar-crop-dialog"
import { ProfileSidebar, type AccountSection } from "./_components/profile-sidebar"
import { HelpSection } from "./_components/sections/help-section"
import { IdentitySection } from "./_components/sections/identity-section"
import { PreferencesSection } from "./_components/sections/preferences-section"
import { SecuritySection } from "./_components/sections/security-section"

export default function ProfilePage() {
  const { profile, session, user, refreshProfile } = useAuth()
  const [activeSection, setActiveSection] = useState<AccountSection>("profile")
  // Mobile-only: "menu" shows the sidebar, "section" shows the chosen section content full-width.
  // On lg+ this state is ignored — both panels are always visible.
  const [mobileView, setMobileView] = useState<"menu" | "section">("menu")

  // Identity form state — lives here because the sidebar reads it for the identity strip
  // (name/email/profession/location) and the IdentitySection mutates it.
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [dob, setDob] = useState("")
  const [location, setLocation] = useState("")
  const [gender, setGender] = useState("")
  const [profession, setProfession] = useState("")

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  const previewUrlRef = useRef<string | null>(null)
  const avatarFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEmail(session?.user?.email ?? profile?.email ?? "")
    setName(profile?.full_name ?? "")
    setPhone((profile?.phone ?? "").replace(/^\+91/, ""))
    setDob(profile?.dob ?? "")
    setLocation(profile?.location ?? "")
    setGender(profile?.gender ?? "")
    setProfession(profile?.profession ?? "")
    setAvatarPreview(profile?.avatar_url ?? DEFAULT_AVATAR_IMAGE)
  }, [profile, session?.user?.email])

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  const crop = useAvatarCrop({
    onError: setAvatarError,
    onCropped: async (croppedFile) => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
      const previewUrl = URL.createObjectURL(croppedFile)
      previewUrlRef.current = previewUrl
      setAvatarPreview(previewUrl)

      setAvatarError(null)
      setAvatarUploading(true)
      try {
        const upload = await uploadUserAvatarImage(croppedFile)
        const fallback = user?.id ? getAvatarImageUrl("users", user.id, upload.version) : null
        const nextUrl = upload.publicUrl ?? fallback
        if (nextUrl) setAvatarPreview(nextUrl)
        // Refresh global auth profile so the navbar/dropdown avatar picks up the new image.
        try {
          await refreshProfile()
        } catch {
          // non-fatal — local preview still updates immediately
        }
      } catch (uploadError) {
        setAvatarError(uploadError instanceof Error ? uploadError.message : "Could not upload photo.")
      } finally {
        setAvatarUploading(false)
      }
    },
  })

  const goToSection = (id: AccountSection) => {
    setActiveSection(id)
    setMobileView("section")
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const identityState = { name, email, phone, dob, location, gender, profession }
  const identitySetters = { setName, setPhone, setDob, setLocation, setGender, setProfession }

  const sectionContent = (
    <>
      {activeSection === "profile" ? (
        <IdentitySection state={identityState} setters={identitySetters} />
      ) : null}
      {activeSection === "preferences" ? <PreferencesSection /> : null}
      {activeSection === "security" ? (
        <SecuritySection email={email} phone={phone} emailVerified={!!user?.emailVerified} />
      ) : null}
      {activeSection === "help" ? <HelpSection /> : null}
    </>
  )

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen bg-slate-50">
        {/* Subtle ambient backdrop */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-32 -left-20 h-[28rem] w-[28rem] rounded-full bg-(--blue-100)/40 blur-3xl" />
          <div className="absolute -top-16 right-0 h-[24rem] w-[24rem] rounded-full bg-(--blue-50) blur-3xl" />
        </div>

        <div className="mx-auto w-full max-w-[1400px] px-4 pt-8 pb-16 md:px-8 md:pt-12 lg:px-10">
          {avatarError ? (
            <div className="mx-auto mb-4 max-w-2xl rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700">
              {avatarError}
            </div>
          ) : null}

          <div className="mx-auto grid w-full grid-cols-1 gap-6 lg:grid-cols-[20rem_minmax(0,1fr)] xl:gap-8">
            <ProfileSidebar
              name={name}
              email={email}
              profession={profession}
              location={location}
              avatarPreview={avatarPreview}
              avatarUploading={avatarUploading}
              onAvatarClick={() => avatarFileInputRef.current?.click()}
              onAvatarFileChange={crop.handleAvatarChange}
              avatarFileInputRef={avatarFileInputRef}
              activeSection={activeSection}
              mobileView={mobileView}
              onSectionChange={goToSection}
              onMobileBackToMenu={() => setMobileView("menu")}
              mobileSectionContent={sectionContent}
            />

            {/* RIGHT — section content (desktop only; mobile renders it inside the sidebar's Account container) */}
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="hidden space-y-5 lg:block"
            >
              {sectionContent}
            </motion.div>
          </div>
        </div>

        <AvatarCropDialog crop={crop} />
      </div>
    </ProtectedRoute>
  )
}
