export type Role = 'provider' | 'admin'

export type Profile = {
  id: string
  email: string | null
  full_name: string | null
  role: Role
  created_at: string
  updated_at: string
}

export type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  created_at: string
}

export type City = {
  id: string
  name: string
  slug: string
  department: string | null
  created_at: string
}

export type ProviderProfile = {
  id: string
  user_id: string
  category_id: string | null
  city_id: string | null
  display_name: string
  slug: string
  zone: string | null
  description: string | null
  services: string[] | null
  years_experience: number | null
  price_reference: string | null
  whatsapp: string | null
  availability: string | null
  is_approved: boolean
  is_verified: boolean
  is_active: boolean
  rating: number
  review_count: number
  created_at: string
  updated_at: string
  // joined fields
  category?: Category
  city?: City
}

export type Lead = {
  id: string
  provider_id: string | null
  customer_name: string | null
  customer_phone: string | null
  message: string | null
  source: string
  page_url: string | null
  referrer: string | null
  user_agent: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export type LeadInsert = Omit<Lead, 'id' | 'created_at' | 'page_url' | 'referrer' | 'user_agent' | 'metadata'> &
  Partial<Pick<Lead, 'page_url' | 'referrer' | 'user_agent' | 'metadata'>>

export type Review = {
  id: string
  provider_id: string | null
  rating: number
  comment: string | null
  reviewer_name: string | null
  is_approved: boolean
  created_at: string
}

export type ProviderReportStatus = 'pending' | 'reviewed' | 'resolved'

export type ProviderReport = {
  id: string
  provider_id: string | null
  reason: string
  details: string | null
  reporter_name: string | null
  reporter_contact: string | null
  status: ProviderReportStatus
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
        Relationships: []
      }
      categories: {
        Row: Category
        Insert: Omit<Category, 'id' | 'created_at'>
        Update: Partial<Omit<Category, 'id' | 'created_at'>>
        Relationships: []
      }
      cities: {
        Row: City
        Insert: Omit<City, 'id' | 'created_at'>
        Update: Partial<Omit<City, 'id' | 'created_at'>>
        Relationships: []
      }
      provider_profiles: {
        Row: ProviderProfile
        Insert: Omit<ProviderProfile, 'id' | 'created_at' | 'updated_at' | 'rating' | 'review_count' | 'is_approved' | 'is_verified' | 'is_active' | 'category' | 'city'>
        Update: Partial<Omit<ProviderProfile, 'id' | 'user_id' | 'created_at' | 'category' | 'city'>>
        Relationships: []
      }
      leads: {
        Row: Lead
        Insert: LeadInsert
        Update: Partial<Omit<Lead, 'id' | 'created_at'>>
        Relationships: []
      }
      reviews: {
        Row: Review
        Insert: Omit<Review, 'id' | 'created_at' | 'is_approved'>
        Update: Partial<Omit<Review, 'id' | 'created_at'>>
        Relationships: []
      }
      provider_reports: {
        Row: ProviderReport
        Insert: Omit<ProviderReport, 'id' | 'created_at' | 'updated_at' | 'status'>
        Update: Partial<Omit<ProviderReport, 'id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
