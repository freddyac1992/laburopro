import { redirect } from 'next/navigation'
import AdminShell from '@/components/admin/AdminShell'
import AdminReviewActions, { type AdminReview } from '@/components/admin/AdminReviewActions'
import { createClient } from '@/lib/supabase/server'

export default async function AdminResenasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') redirect('/')

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, provider_id, rating, comment, reviewer_name, is_approved, created_at, provider:provider_profiles(display_name, slug, category:categories(name), city:cities(name))')
    .order('is_approved', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <AdminShell title="Moderación de reseñas">
      <AdminReviewActions initialReviews={(reviews ?? []) as unknown as AdminReview[]} />
    </AdminShell>
  )
}
