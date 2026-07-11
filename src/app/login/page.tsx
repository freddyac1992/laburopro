import { Suspense } from 'react'
import GoogleAuthPanel from '@/components/auth/GoogleAuthPanel'

export default function LoginPage() {
  return (
    <div id="login-google-only" data-auth-method="google">
      <Suspense fallback={<div className="min-h-[72vh] bg-[#f1f6f4]" aria-label="Cargando acceso" />}>
        <GoogleAuthPanel mode="login" />
      </Suspense>
    </div>
  )
}
