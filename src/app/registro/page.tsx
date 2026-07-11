import { Suspense } from 'react'
import GoogleAuthPanel from '@/components/auth/GoogleAuthPanel'

export default function RegistroPage() {
  return (
    <div id="register-google-only" data-auth-method="google">
      <Suspense fallback={<div className="min-h-[72vh] bg-[#f1f6f4]" aria-label="Cargando registro" />}>
        <GoogleAuthPanel mode="register" />
      </Suspense>
    </div>
  )
}
