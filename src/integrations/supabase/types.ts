export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      cancellation_flows: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cancellation_flows_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_policies: {
        Row: {
          client_id: string
          created_at: string
          has_active_claim: boolean
          has_cfar_benefit: boolean
          id: string
          policy_number: string
          product_id: string
          renewal_date: string
          start_date: string
          status: Database["public"]["Enums"]["policy_status"]
        }
        Insert: {
          client_id: string
          created_at?: string
          has_active_claim?: boolean
          has_cfar_benefit?: boolean
          id?: string
          policy_number: string
          product_id: string
          renewal_date: string
          start_date: string
          status?: Database["public"]["Enums"]["policy_status"]
        }
        Update: {
          client_id?: string
          created_at?: string
          has_active_claim?: boolean
          has_cfar_benefit?: boolean
          id?: string
          policy_number?: string
          product_id?: string
          renewal_date?: string
          start_date?: string
          status?: Database["public"]["Enums"]["policy_status"]
        }
        Relationships: [
          {
            foreignKeyName: "client_policies_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_policies_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_sessions: {
        Row: {
          client_id: string
          created_at: string
          end_time: string | null
          flow_variant_id: string
          id: string
          outcome: Database["public"]["Enums"]["session_outcome"] | null
          policy_id: string
          start_time: string
        }
        Insert: {
          client_id: string
          created_at?: string
          end_time?: string | null
          flow_variant_id: string
          id?: string
          outcome?: Database["public"]["Enums"]["session_outcome"] | null
          policy_id: string
          start_time?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          end_time?: string | null
          flow_variant_id?: string
          id?: string
          outcome?: Database["public"]["Enums"]["session_outcome"] | null
          policy_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "flow_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_sessions_flow_variant_id_fkey"
            columns: ["flow_variant_id"]
            isOneToOne: false
            referencedRelation: "flow_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_sessions_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "client_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_steps: {
        Row: {
          component_name: string
          condition: Json | null
          configuration: Json
          created_at: string
          id: string
          step_order: number
          variant_id: string
        }
        Insert: {
          component_name: string
          condition?: Json | null
          configuration?: Json
          created_at?: string
          id?: string
          step_order: number
          variant_id: string
        }
        Update: {
          component_name?: string
          condition?: Json | null
          configuration?: Json
          created_at?: string
          id?: string
          step_order?: number
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flow_steps_component_name_fkey"
            columns: ["component_name"]
            isOneToOne: false
            referencedRelation: "step_components"
            referencedColumns: ["component_name"]
          },
          {
            foreignKeyName: "flow_steps_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "flow_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_variants: {
        Row: {
          created_at: string
          flow_id: string
          id: string
          is_control: boolean
          name: string
          traffic_allocation: number
        }
        Insert: {
          created_at?: string
          flow_id: string
          id?: string
          is_control?: boolean
          name: string
          traffic_allocation?: number
        }
        Update: {
          created_at?: string
          flow_id?: string
          id?: string
          is_control?: boolean
          name?: string
          traffic_allocation?: number
        }
        Relationships: [
          {
            foreignKeyName: "flow_variants_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "cancellation_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      interaction_events: {
        Row: {
          event_data: Json | null
          event_type: string
          id: string
          session_id: string
          step_id: string
          timestamp: string
        }
        Insert: {
          event_data?: Json | null
          event_type: string
          id?: string
          session_id: string
          step_id: string
          timestamp?: string
        }
        Update: {
          event_data?: Json | null
          event_type?: string
          id?: string
          session_id?: string
          step_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "interaction_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "flow_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interaction_events_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "flow_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      step_components: {
        Row: {
          component_name: string
          default_config_schema: Json
          description: string
        }
        Insert: {
          component_name: string
          default_config_schema: Json
          description: string
        }
        Update: {
          component_name?: string
          default_config_schema?: Json
          description?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_organization_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "client"
      policy_status: "active" | "pending_cancellation" | "cancelled"
      session_outcome: "retained" | "cancelled"
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

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "client"],
      policy_status: ["active", "pending_cancellation", "cancelled"],
      session_outcome: ["retained", "cancelled"],
    },
  },
} as const
