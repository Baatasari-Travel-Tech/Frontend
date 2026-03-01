'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/providers'

export default function OrganizerOnboardingClient() {
  const router = useRouter()
  const { session, userRoleId } = useAuth()
  const [name, setName] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [description, setDescription] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [pincode, setPincode] = useState('')
  const [verificationFile, setVerificationFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleComplete = async () => {
    if (!session?.user) return
    setIsSubmitting(true)
    setSubmitError(null)

    if (!userRoleId) {
      setSubmitError('Role not found. Please try again.')
      setIsSubmitting(false)
      return
    }

    let logoUrl: string | null = null
    if (logoFile) {
      const fileExt = logoFile.name.split('.').pop() ?? 'png'
      const filePath = `${session.user.id}/logo-${crypto.randomUUID()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('organizer_logos')
        .upload(filePath, logoFile, { upsert: true })

      if (uploadError) {
        setSubmitError('Unable to upload logo. Please try again.')
        setIsSubmitting(false)
        return
      }

      const { data } = supabase.storage.from('organizer_logos').getPublicUrl(filePath)
      logoUrl = data.publicUrl ?? null
    }

    let docUrl: string | null = null
    if (verificationFile) {
      const fileExt = verificationFile.name.split('.').pop() ?? 'pdf'
      const filePath = `${session.user.id}/doc-${crypto.randomUUID()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('organizer_docs')
        .upload(filePath, verificationFile, { upsert: true })

      if (uploadError) {
        setSubmitError('Unable to upload verification docs. Please try again.')
        setIsSubmitting(false)
        return
      }

      docUrl = filePath
    }

    const { data: existing } = await supabase
      .from('event_organizer_profiles')
      .select('id')
      .eq('user_id', session.user.id)
      .maybeSingle()

    const payload = {
      org_name: name.trim() || null,
      description: description.trim() || null,
      contact_email: contactEmail.trim() || null,
      contact_phone: phone.trim() || null,
      address: address.trim() || null,
      city: city.trim() || null,
      state: state.trim() || null,
      pincode: pincode.trim() || null,
      logo_url: logoUrl,
      kyc_doc_url: docUrl,
    }

    const { error } = existing?.id
      ? await supabase
          .from('event_organizer_profiles')
          .update(payload)
          .eq('id', existing.id)
      : await supabase
          .from('event_organizer_profiles')
          .insert({ ...payload, user_id: session.user.id })

    if (error) {
      setSubmitError('Unable to finish onboarding. Please try again.')
      setIsSubmitting(false)
      return
    }

    await supabase.from('user_roles').update({ onboarding_completed: true }).eq('id', userRoleId)
    await supabase
      .from('profiles')
      .update({ global_onboarding_completed: true })
      .eq('id', session.user.id)

    router.replace('/event-organizer/dashboard')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div>
          <p className="eyebrow">Organizer onboarding</p>
          <h2>Set up your organizer profile</h2>
          <p>Tell us about your organization to manage events.</p>
        </div>

        <div className="auth-form">
          <label>
            Organizer name
            <input
              className="input"
              placeholder="Organizer name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            Organizer logo
            <input
              className="input"
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <label>
            Description
            <input
              className="input"
              placeholder="Short description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label>
            Contact email
            <input
              className="input"
              placeholder="Contact email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </label>
          <label>
            Contact phone
            <input
              className="input"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <label>
            Address
            <input
              className="input"
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </label>
          <label>
            City
            <input
              className="input"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </label>
          <label>
            State
            <input
              className="input"
              placeholder="State"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
          </label>
          <label>
            Pincode
            <input
              className="input"
              placeholder="Pincode"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
            />
          </label>
          <label>
            Verification docs
            <input
              className="input"
              type="file"
              onChange={(e) => setVerificationFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        {submitError && <p>{submitError}</p>}

        <div className="auth-actions">
          <button className="btn" type="button" onClick={handleComplete} disabled={isSubmitting}>
            {isSubmitting ? 'Finishing...' : 'Finish onboarding'}
          </button>
        </div>
      </div>
    </div>
  )
}
