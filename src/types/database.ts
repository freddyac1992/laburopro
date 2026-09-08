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
  profile_photo_path: string | null
  work_photo_path: string | null
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
  status: LeadStatus
  created_at: string
  updated_at: string
}

export type LeadStatus = 'new' | 'contacted' | 'converted' | 'lost'

export type LeadInsert = Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'status' | 'page_url' | 'referrer' | 'user_agent' | 'metadata'> &
  Partial<Pick<Lead, 'page_url' | 'referrer' | 'user_agent' | 'metadata'>>

export type ProfileView = {
  id: string
  provider_id: string
  visitor_id: string | null
  page_url: string | null
  referrer: string | null
  user_agent: string | null
  created_at: string
}

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

export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'revoked'
export type VerificationDocumentType = 'ci' | 'passport'

export type VerificationRequest = {
  id: string
  provider_id: string
  user_id: string
  legal_name: string
  document_type: VerificationDocumentType
  document_front_path: string | null
  document_back_path: string | null
  status: VerificationStatus
  review_note: string | null
  submitted_at: string
  consented_at: string
  reviewed_at: string | null
  reviewed_by: string | null
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
        Relationships: [
          {
            foreignKeyName: 'provider_profiles_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'provider_profiles_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'provider_profiles_city_id_fkey'
            columns: ['city_id']
            isOneToOne: false
            referencedRelation: 'cities'
            referencedColumns: ['id']
          },
        ]
      }
      leads: {
        Row: Lead
        Insert: LeadInsert
        Update: Partial<Pick<Lead, 'status' | 'updated_at'>>
        Relationships: [
          {
            foreignKeyName: 'leads_provider_id_fkey'
            columns: ['provider_id']
            isOneToOne: false
            referencedRelation: 'provider_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profile_views: {
        Row: ProfileView
        Insert: Omit<ProfileView, 'id' | 'created_at'>
        Update: never
        Relationships: [
          {
            foreignKeyName: 'profile_views_provider_id_fkey'
            columns: ['provider_id']
            isOneToOne: false
            referencedRelation: 'provider_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      reviews: {
        Row: Review
        Insert: Omit<Review, 'id' | 'created_at' | 'is_approved'>
        Update: Partial<Omit<Review, 'id' | 'created_at'>>
        Relationships: [
          {
            foreignKeyName: 'reviews_provider_id_fkey'
            columns: ['provider_id']
            isOneToOne: false
            referencedRelation: 'provider_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      provider_reports: {
        Row: ProviderReport
        Insert: Omit<ProviderReport, 'id' | 'created_at' | 'updated_at' | 'status'>
        Update: Partial<Omit<ProviderReport, 'id' | 'created_at'>>
        Relationships: [
          {
            foreignKeyName: 'provider_reports_provider_id_fkey'
            columns: ['provider_id']
            isOneToOne: false
            referencedRelation: 'provider_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      verification_requests: {
        Row: VerificationRequest
        Insert: Omit<VerificationRequest, 'id' | 'created_at' | 'updated_at' | 'submitted_at' | 'consented_at' | 'reviewed_at' | 'reviewed_by' | 'review_note'> &
          Partial<Pick<VerificationRequest, 'id' | 'status' | 'review_note' | 'submitted_at' | 'consented_at' | 'reviewed_at' | 'reviewed_by'>>
        Update: Partial<Omit<VerificationRequest, 'id' | 'provider_id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      check_rate_limit: {
        Args: {
          p_action: string
          p_identifier_hash: string
        }
        Returns: boolean
      }
      review_verification_request: {
        Args: {
          p_request_id: string
          p_reviewer_id: string
          p_decision: 'approved' | 'rejected' | 'revoked'
          p_review_note?: string | null
        }
        Returns: { front_path: string | null; back_path: string | null }[]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
