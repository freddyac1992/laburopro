import { redirect } from 'next/navigation'
import AdminShell from '@/components/admin/AdminShell'
import AdminReportActions, { type AdminReport } from '@/components/admin/AdminReportActions'
import { createClient } from '@/lib/supabase/server'

export default async function AdminReportesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') redirect('/')

  const { data: reports } = await supabase
    .from('provider_reports')
    .select('id, provider_id, reason, details, reporter_name, reporter_contact, status, created_at, updated_at, provider:provider_profiles(display_name, slug, category:categories(name), city:cities(name))')
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <AdminShell title="Reportes de proveedores">
      <AdminReportActions initialReports={(reports ?? []) as unknown as AdminReport[]} />
    </AdminShell>
  )
}
