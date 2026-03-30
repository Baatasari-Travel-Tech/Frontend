'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { useAuth } from '@/app/providers'

import {
  type PreferenceCategory,
  type Preferences,
  PREFERENCE_CARDS,
  PREFERENCE_OPTIONS,
  TAB_TITLES,
  CATEGORY_ORDER,
  MIN_REQUIRED,
} from '@/lib/preferences-data'

const emptyPreferences: Preferences = {
  travel: [],
  interests: [],
  food: [],
  emotional: [],
  logistics: [],
}

export default function PreferencesPage() {
  const { userPreferences, updateUserPreferences, isLoadingPreferences } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<PreferenceCategory>('travel')
  const [preferences, setPreferences] = useState<Preferences>(emptyPreferences)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!userPreferences) return
    setPreferences({
      travel: userPreferences.travel ?? [],
      interests: userPreferences.interests ?? [],
      food: userPreferences.food ?? [],
      emotional: userPreferences.emotional ?? [],
      logistics: userPreferences.logistics ?? [],
    })
  }, [userPreferences])

  const handleCardClick = (category: PreferenceCategory) => {
    setActiveTab(category)
    setIsModalOpen(true)
  }

  const togglePreference = (category: PreferenceCategory, option: string) => {
    setPreferences(prev => {
      const current = prev[category]
      return {
        ...prev,
        [category]: current.includes(option)
          ? current.filter(i => i !== option)
          : [...current, option],
      }
    })
  }

  const categoryOrder = CATEGORY_ORDER
  const isReadyToSave = Object.values(preferences).every(
    arr => arr.length >= MIN_REQUIRED
  )
  const isCurrentCategoryComplete = preferences[activeTab].length >= MIN_REQUIRED

  const handleSave = async () => {
    if (!isCurrentCategoryComplete) {
      setError(`Please select at least ${MIN_REQUIRED} options in this category.`)
      return
    }

    setError(null)
    setSuccess(null)

    const currentIdx = categoryOrder.indexOf(activeTab)
    let nextIdx = currentIdx + 1
    while (nextIdx < categoryOrder.length && preferences[categoryOrder[nextIdx]].length >= MIN_REQUIRED) {
      nextIdx++
    }

    if (nextIdx < categoryOrder.length) {
      setActiveTab(categoryOrder[nextIdx])
      return
    }

    setSaving(true)
    try {
      await updateUserPreferences(preferences)
      setIsModalOpen(false)
      setSuccess('Preferences saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save preferences.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProtectedRoute>
      <main className="mx-auto max-w-7xl px-2 py-8 sm:px-4 md:px-6 md:py-12">
      <div className="mb-8 md:mb-12">
        <h1 className="text-center text-2xl font-bold text-(--brand-blue) sm:text-3xl md:text-left md:text-4xl">
          My Preferences
        </h1>
        {isLoadingPreferences && (
          <p className="mt-3 text-sm text-slate-500">Loading your preferences...</p>
        )}
        {success && (
          <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
            {success}
          </p>
        )}
        {error && (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600">
            {error}
          </p>
        )}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mb-10 md:gap-8">
        {PREFERENCE_CARDS.slice(0, 2).map((card, index) => (
          <div
            key={index}
            onClick={() => handleCardClick(card.category)}
            className="cursor-pointer rounded-2xl border border-(--gray-200) bg-(--white) p-6 shadow-sm transition hover:border-(--gray-300) md:rounded-[28px] md:p-12"
          >
            <div className="flex flex-col items-center">
              <div className="relative mb-6 h-[120px] w-full sm:h-[180px] md:mb-10 md:h-[220px]">
                <Image src={card.image} alt={card.title} fill className="rounded-xl object-contain" />
              </div>
              <h2 className="text-center text-lg font-medium text-(--gray-900) sm:text-xl md:text-2xl">
                {card.title}
              </h2>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-8">
        {PREFERENCE_CARDS.slice(2).map((card, index) => (
          <div
            key={index}
            onClick={() => handleCardClick(card.category)}
            className="cursor-pointer rounded-2xl border border-(--gray-200) bg-(--white) p-4 shadow-sm transition hover:border-(--gray-300) md:rounded-[28px] md:p-8"
          >
            <div className="flex flex-col items-center">
              <div className="relative mb-4 h-[90px] w-full sm:h-[120px] md:mb-6 md:h-[180px]">
                <Image src={card.image} alt={card.title} fill className="rounded-xl object-contain" />
              </div>
              <h2 className="text-center text-base font-medium text-(--gray-900) sm:text-lg md:text-xl">
                {card.title}
              </h2>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-(--black)/10 p-2 backdrop-blur-[2px] sm:p-4">
          <div className="flex h-[90vh] w-full max-w-full flex-col overflow-hidden rounded-2xl bg-(--pref-bg) shadow-2xl sm:max-w-2xl md:max-h-[700px] md:max-w-3xl md:rounded-[32px] lg:max-w-[1100px]">
            <div className="flex flex-wrap justify-between gap-2 px-2 pt-6 sm:px-6 md:px-12 md:pt-10">
              {(Object.keys(TAB_TITLES) as PreferenceCategory[]).map(category => (
                <Button
                  key={category}
                  variant="ghost"
                  onClick={() => setActiveTab(category)}
                  className={`h-auto min-w-[120px] max-w-[180px] flex-1 rounded-full px-3 py-2 text-xs font-bold sm:px-4 sm:text-sm md:px-6 md:py-3 md:text-[13px] ${activeTab === category
                    ? 'bg-(--pref-dark) text-(--white) shadow-lg hover:bg-(--pref-dark)/90 hover:text-(--white)'
                    : 'text-(--pref-tag) hover:bg-transparent hover:text-(--pref-dark)'
                  }`}
                >
                  {TAB_TITLES[category]}
                </Button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-4 sm:px-6 md:px-12 md:py-10">
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {PREFERENCE_OPTIONS[activeTab].map(option => {
                  const selected = preferences[activeTab].includes(option)
                  return (
                    <Button
                      key={option}
                      variant="outline"
                      onClick={() => togglePreference(activeTab, option)}
                      className={`h-auto rounded-lg border-0 px-3 py-2 text-xs font-medium sm:px-4 sm:py-2.5 sm:text-sm md:rounded-xl md:px-5 md:text-[15px] ${selected
                        ? 'bg-(--blue-soft) text-(--white) hover:bg-(--blue-soft)/90 hover:text-(--white)'
                        : 'bg-(--slate-200) text-(--pref-muted-text) hover:bg-(--slate-200)/80'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {option}
                        <X className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${selected ? 'opacity-100' : 'opacity-0'}`} />
                      </span>
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col items-center justify-between gap-4 px-2 pb-6 sm:flex-row sm:px-6 md:px-12 md:pb-10">
              <div className="text-xs text-(--pref-muted-text)">
                Minimum required: {MIN_REQUIRED} per section
              </div>

              <div className="flex w-full gap-2 sm:w-auto sm:gap-4">
                <Button
                  onClick={() => setIsModalOpen(false)}
                  variant="outline"
                  className="h-auto flex-1 rounded-full border-2 border-(--pref-border) bg-(--stroke-back) px-6 py-2.5 font-bold text-(--pref-text) sm:flex-none sm:px-10 sm:py-3.5"
                  disabled={saving}
                >
                  Back
                </Button>

                <Button
                  onClick={handleSave}
                  className="h-auto flex-1 rounded-full bg-(--brand-navy) px-6 py-3 font-bold text-(--white) hover:bg-(--brand-navy)/90 sm:flex-none sm:px-8 sm:py-4"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : activeTab === 'logistics' && isReadyToSave ? 'Finish' : 'Save & Continue'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      </main>
    </ProtectedRoute>
  )
}
