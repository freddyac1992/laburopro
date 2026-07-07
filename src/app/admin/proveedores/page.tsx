import { redirect } from 'next/navigation'
import AdminShell from '@/components/admin/AdminShell'
import AdminProviderActions from '@/components/admin/AdminProviderActions'
import { createClient } from '@/lib/supabase/server'

export default async function AdminProveedoresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = (await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle())

  if (profile?.role !== 'admin') redirect('/')

  const { data: providers } = await supabase
    .from('provider_profiles')
    .select('*, category:categories(name), city:cities(name), profile:profiles(email, full_name)')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <AdminShell title="Gestión de proveedores">
      <AdminProviderActions initialProviders={providers ?? []} />
    </AdminShell>
  )
}
