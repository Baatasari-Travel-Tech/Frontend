'use client'

import { AuthModalProvider, useAuthModal } from './auth-modal-context'
import { LoginForm, RegisterForm } from './auth-forms'

function AuthModalContent() {
  const { open, mode, closeModal, setMode } = useAuthModal()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={closeModal}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-[min(92vw,28rem)] rounded-2xl border border-white/70 bg-white p-6 shadow-[0_30px_70px_rgba(15,23,42,0.25)]"
      >
        <button
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
          onClick={closeModal}
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
            <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>

        {mode === 'login' ? (
          <LoginForm onSwitchMode={() => setMode('register')} />
        ) : (
          <RegisterForm onSwitchMode={() => setMode('login')} />
        )}
      </div>
    </div>
  )
}

export function AuthModalRoot({ children }: { children: React.ReactNode }) {
  return (
    <AuthModalProvider>
      {children}
      <AuthModalContent />
    </AuthModalProvider>
  )
}
