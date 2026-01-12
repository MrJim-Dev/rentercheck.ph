export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          last_action_at: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          last_action_at?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_action_at?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      incident_reports: {
        Row: {
          admin_notes: string | null
          amount_involved: number | null
          confirmed_consequences: boolean | null
          confirmed_truthful: boolean | null
          created_at: string | null
          credibility_score: number | null
          dispute_reason: string | null
          id: string
          incident_city: string | null
          incident_date: string
          incident_end_date: string | null
          incident_place: string | null
          incident_region: string | null
          incident_type: Database["public"]["Enums"]["incident_type"]
          match_confidence:
            | Database["public"]["Enums"]["match_confidence"]
            | null
          matched_at: string | null
          matched_by: string | null
          published_at: string | null
          rejection_reason: string | null
          renter_id: string | null
          reported_address: string | null
          reported_city: string | null
          reported_date_of_birth: string | null
          reported_email: string | null
          reported_facebook: string | null
          reported_full_name: string
          reported_phone: string | null
          reporter_email: string | null
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          search_vector: unknown
          status: Database["public"]["Enums"]["report_status"] | null
          status_changed_at: string | null
          status_changed_by: string | null
          submitted_at: string | null
          submitted_ip: unknown
          summary: string
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount_involved?: number | null
          confirmed_consequences?: boolean | null
          confirmed_truthful?: boolean | null
          created_at?: string | null
          credibility_score?: number | null
          dispute_reason?: string | null
          id?: string
          incident_city?: string | null
          incident_date: string
          incident_end_date?: string | null
          incident_place?: string | null
          incident_region?: string | null
          incident_type: Database["public"]["Enums"]["incident_type"]
          match_confidence?:
            | Database["public"]["Enums"]["match_confidence"]
            | null
          matched_at?: string | null
          matched_by?: string | null
          published_at?: string | null
          rejection_reason?: string | null
          renter_id?: string | null
          reported_address?: string | null
          reported_city?: string | null
          reported_date_of_birth?: string | null
          reported_email?: string | null
          reported_facebook?: string | null
          reported_full_name: string
          reported_phone?: string | null
          reporter_email?: string | null
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          search_vector?: unknown
          status?: Database["public"]["Enums"]["report_status"] | null
          status_changed_at?: string | null
          status_changed_by?: string | null
          submitted_at?: string | null
          submitted_ip?: unknown
          summary: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount_involved?: number | null
          confirmed_consequences?: boolean | null
          confirmed_truthful?: boolean | null
          created_at?: string | null
          credibility_score?: number | null
          dispute_reason?: string | null
          id?: string
          incident_city?: string | null
          incident_date?: string
          incident_end_date?: string | null
          incident_place?: string | null
          incident_region?: string | null
          incident_type?: Database["public"]["Enums"]["incident_type"]
          match_confidence?:
            | Database["public"]["Enums"]["match_confidence"]
            | null
          matched_at?: string | null
          matched_by?: string | null
          published_at?: string | null
          rejection_reason?: string | null
          renter_id?: string | null
          reported_address?: string | null
          reported_city?: string | null
          reported_date_of_birth?: string | null
          reported_email?: string | null
          reported_facebook?: string | null
          reported_full_name?: string
          reported_phone?: string | null
          reporter_email?: string | null
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          search_vector?: unknown
          status?: Database["public"]["Enums"]["report_status"] | null
          status_changed_at?: string | null
          status_changed_by?: string | null
          submitted_at?: string | null
          submitted_ip?: unknown
          summary?: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_reports_renter_id_fkey"
            columns: ["renter_id"]
            isOneToOne: false
            referencedRelation: "public_renter_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_reports_renter_id_fkey"
            columns: ["renter_id"]
            isOneToOne: false
            referencedRelation: "renters"
            referencedColumns: ["id"]
          },
        ]
      }
      renter_identifiers: {
        Row: {
          created_at: string | null
          first_reported_at: string | null
          id: string
          identifier_normalized: string
          identifier_type: Database["public"]["Enums"]["identifier_type"]
          identifier_value: string
          is_verified: boolean | null
          last_reported_at: string | null
          renter_id: string | null
          report_count: number | null
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          first_reported_at?: string | null
          id?: string
          identifier_normalized: string
          identifier_type: Database["public"]["Enums"]["identifier_type"]
          identifier_value: string
          is_verified?: boolean | null
          last_reported_at?: string | null
          renter_id?: string | null
          report_count?: number | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          first_reported_at?: string | null
          id?: string
          identifier_normalized?: string
          identifier_type?: Database["public"]["Enums"]["identifier_type"]
          identifier_value?: string
          is_verified?: boolean | null
          last_reported_at?: string | null
          renter_id?: string | null
          report_count?: number | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "renter_identifiers_renter_id_fkey"
            columns: ["renter_id"]
            isOneToOne: false
            referencedRelation: "public_renter_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renter_identifiers_renter_id_fkey"
            columns: ["renter_id"]
            isOneToOne: false
            referencedRelation: "renters"
            referencedColumns: ["id"]
          },
        ]
      }
      renters: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          created_from_report_id: string | null
          date_of_birth: string | null
          fingerprint: string
          full_name: string
          full_name_normalized: string | null
          id: string
          last_incident_date: string | null
          region: string | null
          search_vector: unknown
          total_incidents: number | null
          updated_at: string | null
          verification_status: string | null
          verified_incidents: number | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          created_from_report_id?: string | null
          date_of_birth?: string | null
          fingerprint: string
          full_name: string
          full_name_normalized?: string | null
          id?: string
          last_incident_date?: string | null
          region?: string | null
          search_vector?: unknown
          total_incidents?: number | null
          updated_at?: string | null
          verification_status?: string | null
          verified_incidents?: number | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          created_from_report_id?: string | null
          date_of_birth?: string | null
          fingerprint?: string
          full_name?: string
          full_name_normalized?: string | null
          id?: string
          last_incident_date?: string | null
          region?: string | null
          search_vector?: unknown
          total_incidents?: number | null
          updated_at?: string | null
          verification_status?: string | null
          verified_incidents?: number | null
        }
        Relationships: []
      }
      report_admin_actions: {
        Row: {
          action_details: Json | null
          action_type: Database["public"]["Enums"]["admin_action_type"]
          admin_id: string
          created_at: string | null
          id: string
          ip_address: unknown
          new_status: Database["public"]["Enums"]["report_status"] | null
          notes: string | null
          previous_status: Database["public"]["Enums"]["report_status"] | null
          report_id: string
        }
        Insert: {
          action_details?: Json | null
          action_type: Database["public"]["Enums"]["admin_action_type"]
          admin_id: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_status?: Database["public"]["Enums"]["report_status"] | null
          notes?: string | null
          previous_status?: Database["public"]["Enums"]["report_status"] | null
          report_id: string
        }
        Update: {
          action_details?: Json | null
          action_type?: Database["public"]["Enums"]["admin_action_type"]
          admin_id?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_status?: Database["public"]["Enums"]["report_status"] | null
          notes?: string | null
          previous_status?: Database["public"]["Enums"]["report_status"] | null
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_admin_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_admin_actions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_admin_actions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "incident_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_admin_actions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "my_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_admin_actions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "public_incident_summaries"
            referencedColumns: ["id"]
          },
        ]
      }
      report_evidence: {
        Row: {
          contains_pii: boolean | null
          display_order: number | null
          evidence_type: Database["public"]["Enums"]["evidence_type"]
          file_name: string
          file_size: number
          id: string
          is_redacted: boolean | null
          is_reviewed: boolean | null
          mime_type: string
          public_url: string | null
          report_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          storage_bucket: string | null
          storage_path: string
          thumbnail_path: string | null
          uploaded_at: string | null
          uploaded_by: string
        }
        Insert: {
          contains_pii?: boolean | null
          display_order?: number | null
          evidence_type: Database["public"]["Enums"]["evidence_type"]
          file_name: string
          file_size: number
          id?: string
          is_redacted?: boolean | null
          is_reviewed?: boolean | null
          mime_type: string
          public_url?: string | null
          report_id: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          storage_bucket?: string | null
          storage_path: string
          thumbnail_path?: string | null
          uploaded_at?: string | null
          uploaded_by: string
        }
        Update: {
          contains_pii?: boolean | null
          display_order?: number | null
          evidence_type?: Database["public"]["Enums"]["evidence_type"]
          file_name?: string
          file_size?: number
          id?: string
          is_redacted?: boolean | null
          is_reviewed?: boolean | null
          mime_type?: string
          public_url?: string | null
          report_id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          storage_bucket?: string | null
          storage_path?: string
          thumbnail_path?: string | null
          uploaded_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_evidence_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_evidence_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "incident_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_evidence_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "my_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_evidence_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "public_incident_summaries"
            referencedColumns: ["id"]
          },
        ]
      }
      report_identifiers: {
        Row: {
          created_at: string | null
          id: string
          identifier_id: string | null
          identifier_normalized: string
          identifier_type: Database["public"]["Enums"]["identifier_type"]
          identifier_value: string
          is_matched: boolean | null
          match_confidence:
            | Database["public"]["Enums"]["match_confidence"]
            | null
          matched_at: string | null
          report_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          identifier_id?: string | null
          identifier_normalized: string
          identifier_type: Database["public"]["Enums"]["identifier_type"]
          identifier_value: string
          is_matched?: boolean | null
          match_confidence?:
            | Database["public"]["Enums"]["match_confidence"]
            | null
          matched_at?: string | null
          report_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          identifier_id?: string | null
          identifier_normalized?: string
          identifier_type?: Database["public"]["Enums"]["identifier_type"]
          identifier_value?: string
          is_matched?: boolean | null
          match_confidence?:
            | Database["public"]["Enums"]["match_confidence"]
            | null
          matched_at?: string | null
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_identifiers_identifier_id_fkey"
            columns: ["identifier_id"]
            isOneToOne: false
            referencedRelation: "renter_identifiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_identifiers_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_identifiers_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "incident_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_identifiers_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "my_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_identifiers_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "public_incident_summaries"
            referencedColumns: ["id"]
          },
        ]
      }
      report_info_requests: {
        Row: {
          created_at: string | null
          id: string
          is_resolved: boolean | null
          report_id: string
          request_message: string
          requested_by: string
          resolved_at: string | null
          responded_at: string | null
          response_message: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          report_id: string
          request_message: string
          requested_by: string
          resolved_at?: string | null
          responded_at?: string | null
          response_message?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          report_id?: string
          request_message?: string
          requested_by?: string
          resolved_at?: string | null
          responded_at?: string | null
          response_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_info_requests_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_info_requests_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "incident_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_info_requests_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "my_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_info_requests_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "public_incident_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_info_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_pending_reports: {
        Row: {
          admin_notes: string | null
          amount_involved: number | null
          confirmed_consequences: boolean | null
          confirmed_truthful: boolean | null
          created_at: string | null
          credibility_score: number | null
          dispute_reason: string | null
          evidence_count: number | null
          id: string | null
          identifier_count: number | null
          incident_city: string | null
          incident_date: string | null
          incident_end_date: string | null
          incident_place: string | null
          incident_region: string | null
          incident_type: Database["public"]["Enums"]["incident_type"] | null
          match_confidence:
            | Database["public"]["Enums"]["match_confidence"]
            | null
          matched_at: string | null
          matched_by: string | null
          potential_matches: number | null
          rejection_reason: string | null
          renter_id: string | null
          reported_address: string | null
          reported_city: string | null
          reported_date_of_birth: string | null
          reported_email: string | null
          reported_facebook: string | null
          reported_full_name: string | null
          reported_phone: string | null
          reporter_email: string | null
          reporter_id: string | null
          search_vector: unknown
          status: Database["public"]["Enums"]["report_status"] | null
          status_changed_at: string | null
          status_changed_by: string | null
          submitted_at: string | null
          submitted_ip: unknown
          summary: string | null
          updated_at: string | null
          user_agent: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_reports_renter_id_fkey"
            columns: ["renter_id"]
            isOneToOne: false
            referencedRelation: "public_renter_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_reports_renter_id_fkey"
            columns: ["renter_id"]
            isOneToOne: false
            referencedRelation: "renters"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_stats: {
        Row: {
          approved_count: number | null
          pending_count: number | null
          rejected_count: number | null
          reports_last_24h: number | null
          reports_last_7d: number | null
          under_review_count: number | null
          unique_reporters: number | null
          verified_renters: number | null
        }
        Relationships: []
      }
      my_reports: {
        Row: {
          admin_notes: string | null
          amount_involved: number | null
          confirmed_consequences: boolean | null
          confirmed_truthful: boolean | null
          created_at: string | null
          credibility_score: number | null
          dispute_reason: string | null
          evidence_count: number | null
          id: string | null
          incident_city: string | null
          incident_date: string | null
          incident_end_date: string | null
          incident_place: string | null
          incident_region: string | null
          incident_type: Database["public"]["Enums"]["incident_type"] | null
          match_confidence:
            | Database["public"]["Enums"]["match_confidence"]
            | null
          matched_at: string | null
          matched_by: string | null
          pending_requests: number | null
          rejection_reason: string | null
          renter_fingerprint: string | null
          renter_id: string | null
          renter_name: string | null
          reported_address: string | null
          reported_city: string | null
          reported_date_of_birth: string | null
          reported_email: string | null
          reported_facebook: string | null
          reported_full_name: string | null
          reported_phone: string | null
          reporter_email: string | null
          reporter_id: string | null
          search_vector: unknown
          status: Database["public"]["Enums"]["report_status"] | null
          status_changed_at: string | null
          status_changed_by: string | null
          submitted_at: string | null
          submitted_ip: unknown
          summary: string | null
          updated_at: string | null
          user_agent: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_reports_renter_id_fkey"
            columns: ["renter_id"]
            isOneToOne: false
            referencedRelation: "public_renter_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_reports_renter_id_fkey"
            columns: ["renter_id"]
            isOneToOne: false
            referencedRelation: "renters"
            referencedColumns: ["id"]
          },
        ]
      }
      public_incident_summaries: {
        Row: {
          amount_involved: number | null
          created_at: string | null
          evidence_count: number | null
          id: string | null
          incident_city: string | null
          incident_date: string | null
          incident_region: string | null
          incident_type: Database["public"]["Enums"]["incident_type"] | null
          renter_id: string | null
          status: Database["public"]["Enums"]["report_status"] | null
          summary_truncated: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_reports_renter_id_fkey"
            columns: ["renter_id"]
            isOneToOne: false
            referencedRelation: "public_renter_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_reports_renter_id_fkey"
            columns: ["renter_id"]
            isOneToOne: false
            referencedRelation: "renters"
            referencedColumns: ["id"]
          },
        ]
      }
      public_renter_profiles: {
        Row: {
          city: string | null
          created_at: string | null
          fingerprint: string | null
          id: string | null
          last_incident_date: string | null
          name_masked: string | null
          region: string | null
          total_incidents: number | null
          verification_status: string | null
          verified_incidents: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      find_renter_matches: {
        Args: {
          p_email?: string
          p_facebook?: string
          p_name?: string
          p_phone?: string
        }
        Returns: {
          confidence: Database["public"]["Enums"]["match_confidence"]
          match_type: string
          renter_id: string
        }[]
      }
      generate_renter_fingerprint: {
        Args: { p_identifiers: Json; p_name: string }
        Returns: string
      }
      get_admin_role: { Args: { user_id: string }; Returns: string }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      normalize_identifier: {
        Args: {
          p_type: Database["public"]["Enums"]["identifier_type"]
          p_value: string
        }
        Returns: string
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      admin_action_type:
        | "STATUS_CHANGE"
        | "NOTE_ADDED"
        | "EVIDENCE_REVIEWED"
        | "RENTER_LINKED"
        | "REPORT_MERGED"
        | "REPORTER_CONTACTED"
      evidence_type:
        | "RENTAL_AGREEMENT"
        | "PROOF_OF_PAYMENT"
        | "CONVERSATION"
        | "ITEM_PHOTO"
        | "RENTER_ID"
        | "RENTER_PHOTO"
        | "OTHER"
      identifier_type: "PHONE" | "EMAIL" | "FACEBOOK" | "GOVT_ID"
      incident_type:
        | "NON_RETURN"
        | "UNPAID_BALANCE"
        | "DAMAGE_DISPUTE"
        | "FAKE_INFO"
        | "THREATS_HARASSMENT"
        | "OTHER"
      match_confidence: "LOW" | "MEDIUM" | "HIGH" | "EXACT"
      report_status:
        | "DRAFT"
        | "PENDING"
        | "UNDER_REVIEW"
        | "APPROVED"
        | "REJECTED"
        | "DISPUTED"
        | "RESOLVED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

// Helper type to access Views
export type Views<ViewName extends keyof DefaultSchema["Views"]> = 
  DefaultSchema["Views"][ViewName]["Row"]

export const Constants = {
  public: {
    Enums: {
      admin_action_type: [
        "STATUS_CHANGE",
        "NOTE_ADDED",
        "EVIDENCE_REVIEWED",
        "RENTER_LINKED",
        "REPORT_MERGED",
        "REPORTER_CONTACTED",
      ],
      evidence_type: [
        "RENTAL_AGREEMENT",
        "PROOF_OF_PAYMENT",
        "CONVERSATION",
        "ITEM_PHOTO",
        "RENTER_ID",
        "RENTER_PHOTO",
        "OTHER",
      ],
      identifier_type: ["PHONE", "EMAIL", "FACEBOOK", "GOVT_ID"],
      incident_type: [
        "NON_RETURN",
        "UNPAID_BALANCE",
        "DAMAGE_DISPUTE",
        "FAKE_INFO",
        "THREATS_HARASSMENT",
        "OTHER",
      ],
      match_confidence: ["LOW", "MEDIUM", "HIGH", "EXACT"],
      report_status: [
        "DRAFT",
        "PENDING",
        "UNDER_REVIEW",
        "APPROVED",
        "REJECTED",
        "DISPUTED",
        "RESOLVED",
      ],
    },
  },
} as const
