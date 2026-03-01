'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/providers'

export default function VendorOnboardingClient() {
  const router = useRouter()
  const { session, userRoleId } = useAuth()
  const [name, setName] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [category, setCategory] = useState('')
  const [address, setAddress] = useState('')
  const [contact, setContact] = useState('')
  const [description, setDescription] = useState('')
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
        .from('vendor_logos')
        .upload(filePath, logoFile, { upsert: true })

      if (uploadError) {
        setSubmitError('Unable to upload logo. Please try again.')
        setIsSubmitting(false)
        return
      }

      const { data } = supabase.storage.from('vendor_logos').getPublicUrl(filePath)
      logoUrl = data.publicUrl ?? null
    }

    const { data: existing } = await supabase
      .from('vendor_profiles')
      .select('id')
      .eq('user_id', session.user.id)
      .maybeSingle()

    const payload = {
      business_name: name.trim() || null,
      category: category.trim() || null,
      description: description.trim() || null,
      contact_phone: contact.trim() || null,
      address: address.trim() || null,
      logo_url: logoUrl,
    }

    const { error } = existing?.id
      ? await supabase.from('vendor_profiles').update(payload).eq('id', existing.id)
      : await supabase.from('vendor_profiles').insert({ ...payload, user_id: session.user.id })

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

    router.replace('/vendor/dashboard')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div>
          <p className="eyebrow">Vendor onboarding</p>
          <h2>Set up your vendor profile</h2>
          <p>Share your business details to start listing.</p>
        </div>

        <div className="auth-form">
          <label>
            Vendor name
            <input
              className="input"
              placeholder="Vendor name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            Logo
            <input
              className="input"
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <label>
            Category
            <input
              className="input"
              placeholder="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </label>
          <label>
            Contact
            <input
              className="input"
              placeholder="Contact phone"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
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
            Description
            <input
              className="input"
              placeholder="Short description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
