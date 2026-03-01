'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/providers'

export default function RestaurantOnboardingClient() {
  const router = useRouter()
  const { session, userRoleId } = useAuth()
  const [name, setName] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [cuisine, setCuisine] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [openingHours, setOpeningHours] = useState('')
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
        .from('restaurant_logos')
        .upload(filePath, logoFile, { upsert: true })

      if (uploadError) {
        setSubmitError('Unable to upload logo. Please try again.')
        setIsSubmitting(false)
        return
      }

      const { data } = supabase.storage.from('restaurant_logos').getPublicUrl(filePath)
      logoUrl = data.publicUrl ?? null
    }

    const { data: existing } = await supabase
      .from('restaurant_profiles')
      .select('id')
      .eq('user_id', session.user.id)
      .maybeSingle()

    const payload = {
      restaurant_name: name.trim() || null,
      cuisine_type: cuisine.trim() || null,
      description: description.trim() || null,
      address: address.trim() || null,
      contact_phone: contactPhone.trim() || null,
      opening_hours: openingHours.trim() || null,
      logo_url: logoUrl,
    }

    const { error } = existing?.id
      ? await supabase.from('restaurant_profiles').update(payload).eq('id', existing.id)
      : await supabase.from('restaurant_profiles').insert({ ...payload, user_id: session.user.id })

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

    router.replace('/restaurant/dashboard')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div>
          <p className="eyebrow">Restaurant onboarding</p>
          <h2>Set up your restaurant profile</h2>
          <p>Share your details to get started.</p>
        </div>

        <div className="auth-form">
          <label>
            Restaurant name
            <input
              className="input"
              placeholder="Restaurant name"
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
            Cuisine type
            <input
              className="input"
              placeholder="Cuisine type"
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
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
          <label>
            Contact phone
            <input
              className="input"
              placeholder="Contact phone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </label>
          <label>
            Opening hours
            <input
              className="input"
              placeholder="Opening hours"
              value={openingHours}
              onChange={(e) => setOpeningHours(e.target.value)}
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
