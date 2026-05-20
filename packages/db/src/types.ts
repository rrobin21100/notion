export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          timezone: string
          created_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          timezone?: string
          created_at?: string
        }
        Update: {
          display_name?: string | null
          avatar_url?: string | null
          timezone?: string
        }
      }
      water_logs: {
        Row: {
          id: string
          user_id: string
          amount_oz: number
          logged_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount_oz: number
          logged_at?: string
        }
        Update: {
          amount_oz?: number
          logged_at?: string
        }
      }
      medications: {
        Row: {
          id: string
          user_id: string
          name: string
          dosage: string | null
          frequency: string | null
          start_date: string | null
          end_date: string | null
          notes: string | null
          active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          dosage?: string | null
          frequency?: string | null
          start_date?: string | null
          end_date?: string | null
          notes?: string | null
          active?: boolean
        }
        Update: {
          name?: string
          dosage?: string | null
          frequency?: string | null
          start_date?: string | null
          end_date?: string | null
          notes?: string | null
          active?: boolean
        }
      }
      medication_logs: {
        Row: {
          id: string
          medication_id: string
          user_id: string
          taken_at: string
          skipped: boolean
        }
        Insert: {
          id?: string
          medication_id: string
          user_id: string
          taken_at?: string
          skipped?: boolean
        }
        Update: {
          taken_at?: string
          skipped?: boolean
        }
      }
      supplements: {
        Row: {
          id: string
          user_id: string
          name: string
          dosage: string | null
          frequency: string | null
          active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          dosage?: string | null
          frequency?: string | null
          active?: boolean
        }
        Update: {
          name?: string
          dosage?: string | null
          frequency?: string | null
          active?: boolean
        }
      }
      supplement_logs: {
        Row: {
          id: string
          supplement_id: string
          user_id: string
          taken_at: string
        }
        Insert: {
          id?: string
          supplement_id: string
          user_id: string
          taken_at?: string
        }
        Update: {
          taken_at?: string
        }
      }
      lab_results: {
        Row: {
          id: string
          user_id: string
          test_name: string
          value: number | null
          unit: string | null
          reference_min: number | null
          reference_max: number | null
          tested_at: string
          notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          test_name: string
          value?: number | null
          unit?: string | null
          reference_min?: number | null
          reference_max?: number | null
          tested_at: string
          notes?: string | null
        }
        Update: {
          test_name?: string
          value?: number | null
          unit?: string | null
          reference_min?: number | null
          reference_max?: number | null
          tested_at?: string
          notes?: string | null
        }
      }
      workouts: {
        Row: {
          id: string
          user_id: string
          name: string
          type: string | null
          duration_minutes: number | null
          calories_burned: number | null
          notes: string | null
          performed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type?: string | null
          duration_minutes?: number | null
          calories_burned?: number | null
          notes?: string | null
          performed_at?: string
        }
        Update: {
          name?: string
          type?: string | null
          duration_minutes?: number | null
          calories_burned?: number | null
          notes?: string | null
          performed_at?: string
        }
      }
      workout_exercises: {
        Row: {
          id: string
          workout_id: string
          exercise_name: string
          sets: number | null
          reps: number | null
          weight_lbs: number | null
          duration_seconds: number | null
          notes: string | null
        }
        Insert: {
          id?: string
          workout_id: string
          exercise_name: string
          sets?: number | null
          reps?: number | null
          weight_lbs?: number | null
          duration_seconds?: number | null
          notes?: string | null
        }
        Update: {
          exercise_name?: string
          sets?: number | null
          reps?: number | null
          weight_lbs?: number | null
          duration_seconds?: number | null
          notes?: string | null
        }
      }
      events: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          event_type: string | null
          start_at: string
          end_at: string | null
          location: string | null
          all_day: boolean
          recurrence: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          event_type?: string | null
          start_at: string
          end_at?: string | null
          location?: string | null
          all_day?: boolean
          recurrence?: string | null
        }
        Update: {
          title?: string
          description?: string | null
          event_type?: string | null
          start_at?: string
          end_at?: string | null
          location?: string | null
          all_day?: boolean
          recurrence?: string | null
        }
      }
      shopping_lists: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
        }
        Update: {
          name?: string
        }
      }
      shopping_items: {
        Row: {
          id: string
          list_id: string
          name: string
          quantity: string | null
          category: string | null
          checked: boolean
          added_at: string
        }
        Insert: {
          id?: string
          list_id: string
          name: string
          quantity?: string | null
          category?: string | null
          checked?: boolean
          added_at?: string
        }
        Update: {
          name?: string
          quantity?: string | null
          category?: string | null
          checked?: boolean
        }
      }
      pantry_items: {
        Row: {
          id: string
          user_id: string
          name: string
          quantity: number | null
          unit: string | null
          low_threshold: number | null
          expiry_date: string | null
          category: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          quantity?: number | null
          unit?: string | null
          low_threshold?: number | null
          expiry_date?: string | null
          category?: string | null
        }
        Update: {
          name?: string
          quantity?: number | null
          unit?: string | null
          low_threshold?: number | null
          expiry_date?: string | null
          category?: string | null
        }
      }
      habits: {
        Row: {
          id: string
          user_id: string
          name: string
          icon: string | null
          color: string | null
          frequency: string
          target_count: number
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          icon?: string | null
          color?: string | null
          frequency?: string
          target_count?: number
          active?: boolean
          created_at?: string
        }
        Update: {
          name?: string
          icon?: string | null
          color?: string | null
          frequency?: string
          target_count?: number
          active?: boolean
        }
      }
      habit_logs: {
        Row: {
          id: string
          habit_id: string
          user_id: string
          logged_date: string
          count: number
        }
        Insert: {
          id?: string
          habit_id: string
          user_id: string
          logged_date: string
          count?: number
        }
        Update: {
          count?: number
        }
      }
      meal_plans: {
        Row: {
          id: string
          user_id: string
          week_start: string
        }
        Insert: {
          id?: string
          user_id: string
          week_start: string
        }
        Update: {
          week_start?: string
        }
      }
      meal_plan_entries: {
        Row: {
          id: string
          plan_id: string
          day_of_week: number
          meal_type: string
          recipe_name: string
          calories: number | null
          protein_g: number | null
          carbs_g: number | null
          fat_g: number | null
        }
        Insert: {
          id?: string
          plan_id: string
          day_of_week: number
          meal_type: string
          recipe_name: string
          calories?: number | null
          protein_g?: number | null
          carbs_g?: number | null
          fat_g?: number | null
        }
        Update: {
          recipe_name?: string
          calories?: number | null
          protein_g?: number | null
          carbs_g?: number | null
          fat_g?: number | null
        }
      }
      nutrition_logs: {
        Row: {
          id: string
          user_id: string
          food_name: string
          calories: number | null
          protein_g: number | null
          carbs_g: number | null
          fat_g: number | null
          meal_type: string | null
          logged_at: string
        }
        Insert: {
          id?: string
          user_id: string
          food_name: string
          calories?: number | null
          protein_g?: number | null
          carbs_g?: number | null
          fat_g?: number | null
          meal_type?: string | null
          logged_at?: string
        }
        Update: {
          food_name?: string
          calories?: number | null
          protein_g?: number | null
          carbs_g?: number | null
          fat_g?: number | null
          meal_type?: string | null
          logged_at?: string
        }
      }
      budget_categories: {
        Row: {
          id: string
          user_id: string
          name: string
          monthly_budget: number
          color: string | null
          icon: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          monthly_budget: number
          color?: string | null
          icon?: string | null
        }
        Update: {
          name?: string
          monthly_budget?: number
          color?: string | null
          icon?: string | null
        }
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          category_id: string | null
          amount: number
          description: string | null
          merchant: string | null
          spent_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id?: string | null
          amount: number
          description?: string | null
          merchant?: string | null
          spent_at?: string
        }
        Update: {
          category_id?: string | null
          amount?: number
          description?: string | null
          merchant?: string | null
          spent_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          category: string | null
          target_date: string | null
          progress_percent: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          category?: string | null
          target_date?: string | null
          progress_percent?: number
          status?: string
          created_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          category?: string | null
          target_date?: string | null
          progress_percent?: number
          status?: string
        }
      }
      goal_milestones: {
        Row: {
          id: string
          goal_id: string
          title: string
          completed: boolean
          completed_at: string | null
        }
        Insert: {
          id?: string
          goal_id: string
          title: string
          completed?: boolean
          completed_at?: string | null
        }
        Update: {
          title?: string
          completed?: boolean
          completed_at?: string | null
        }
      }
      medical_records: {
        Row: {
          id: string
          user_id: string
          record_type: string
          name: string
          details: string | null
          date_recorded: string | null
          provider: string | null
        }
        Insert: {
          id?: string
          user_id: string
          record_type: string
          name: string
          details?: string | null
          date_recorded?: string | null
          provider?: string | null
        }
        Update: {
          record_type?: string
          name?: string
          details?: string | null
          date_recorded?: string | null
          provider?: string | null
        }
      }
      emergency_contacts: {
        Row: {
          id: string
          user_id: string
          name: string
          relationship: string | null
          phone: string | null
          email: string | null
          is_primary: boolean
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          relationship?: string | null
          phone?: string | null
          email?: string | null
          is_primary?: boolean
        }
        Update: {
          name?: string
          relationship?: string | null
          phone?: string | null
          email?: string | null
          is_primary?: boolean
        }
      }
      insurance_info: {
        Row: {
          id: string
          user_id: string
          provider: string
          plan_name: string | null
          member_id: string | null
          group_number: string | null
          effective_date: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          provider: string
          plan_name?: string | null
          member_id?: string | null
          group_number?: string | null
          effective_date?: string | null
          notes?: string | null
        }
        Update: {
          provider?: string
          plan_name?: string | null
          member_id?: string | null
          group_number?: string | null
          effective_date?: string | null
          notes?: string | null
        }
      }
      home_items: {
        Row: {
          id: string
          user_id: string
          name: string
          category: string | null
          brand: string | null
          model: string | null
          purchase_date: string | null
          warranty_expires: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          category?: string | null
          brand?: string | null
          model?: string | null
          purchase_date?: string | null
          warranty_expires?: string | null
          notes?: string | null
        }
        Update: {
          name?: string
          category?: string | null
          brand?: string | null
          model?: string | null
          purchase_date?: string | null
          warranty_expires?: string | null
          notes?: string | null
        }
      }
      maintenance_logs: {
        Row: {
          id: string
          item_id: string | null
          user_id: string
          description: string
          cost: number | null
          provider: string | null
          performed_at: string
          next_service_date: string | null
        }
        Insert: {
          id?: string
          item_id?: string | null
          user_id: string
          description: string
          cost?: number | null
          provider?: string | null
          performed_at: string
          next_service_date?: string | null
        }
        Update: {
          description?: string
          cost?: number | null
          provider?: string | null
          performed_at?: string
          next_service_date?: string | null
        }
      }
      whoop_metrics: {
        Row: {
          id: string
          user_id: string
          metric_date: string
          recovery_score: number | null
          strain_score: number | null
          hrv_ms: number | null
          resting_hr: number | null
          sleep_quality: number | null
          sleep_hours: number | null
        }
        Insert: {
          id?: string
          user_id: string
          metric_date: string
          recovery_score?: number | null
          strain_score?: number | null
          hrv_ms?: number | null
          resting_hr?: number | null
          sleep_quality?: number | null
          sleep_hours?: number | null
        }
        Update: {
          recovery_score?: number | null
          strain_score?: number | null
          hrv_ms?: number | null
          resting_hr?: number | null
          sleep_quality?: number | null
          sleep_hours?: number | null
        }
      }
      whoop_connections: {
        Row: {
          user_id: string
          access_token: string | null
          refresh_token: string | null
          token_expires_at: string | null
          whoop_user_id: string | null
          connected_at: string
        }
        Insert: {
          user_id: string
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          whoop_user_id?: string | null
          connected_at?: string
        }
        Update: {
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          whoop_user_id?: string | null
        }
      }
      plaid_items: {
        Row: {
          id: string
          user_id: string
          access_token: string
          item_id: string
          institution_name: string | null
          last_synced_at: string | null
          connected_at: string
        }
        Insert: {
          id?: string
          user_id: string
          access_token: string
          item_id: string
          institution_name?: string | null
          last_synced_at?: string | null
          connected_at?: string
        }
        Update: {
          access_token?: string
          institution_name?: string | null
          last_synced_at?: string | null
        }
      }
      plaid_accounts: {
        Row: {
          id: string
          item_id: string
          account_id: string
          name: string | null
          type: string | null
          subtype: string | null
          mask: string | null
        }
        Insert: {
          id?: string
          item_id: string
          account_id: string
          name?: string | null
          type?: string | null
          subtype?: string | null
          mask?: string | null
        }
        Update: {
          name?: string | null
          type?: string | null
          subtype?: string | null
          mask?: string | null
        }
      }
      briefing_settings: {
        Row: {
          user_id: string
          phone_number: string
          send_time: string
          enabled: boolean
          sections: Json
        }
        Insert: {
          user_id: string
          phone_number: string
          send_time?: string
          enabled?: boolean
          sections?: Json
        }
        Update: {
          phone_number?: string
          send_time?: string
          enabled?: boolean
          sections?: Json
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
