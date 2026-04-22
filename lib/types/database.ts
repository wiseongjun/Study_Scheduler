export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          user_id: string;
          start_date: string;
          current_phase_override: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          start_date: string;
          current_phase_override?: string | null;
          created_at?: string;
        };
        Update: {
          start_date?: string;
          current_phase_override?: string | null;
        };
        Relationships: [];
      };
      plan_templates: {
        Row: {
          id: number;
          applicable_phases: string[];
          day_of_week: number;
          time_block_start: string;
          time_block_end: string;
          default_task_label: string;
          routine_type: string;
          sort_order: number;
        };
        Insert: {
          applicable_phases: string[];
          day_of_week: number;
          time_block_start: string;
          time_block_end: string;
          default_task_label: string;
          routine_type: string;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["plan_templates"]["Insert"]>;
        Relationships: [];
      };
      daily_checks: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          plan_template_id: number;
          custom_label: string | null;
          is_done: boolean;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          plan_template_id: number;
          custom_label?: string | null;
          is_done?: boolean;
          completed_at?: string | null;
        };
        Update: {
          is_done?: boolean;
          completed_at?: string | null;
          custom_label?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "daily_checks_plan_template_id_fkey";
            columns: ["plan_template_id"];
            isOneToOne: false;
            referencedRelation: "plan_templates";
            referencedColumns: ["id"];
          }
        ];
      };
      weekly_retrospectives: {
        Row: {
          id: string;
          user_id: string;
          week_start_date: string;
          done_this_week: Json;
          plan_vs_actual: Json;
          learned: string[];
          blocked: string | null;
          next_goals: string[];
          condition: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          week_start_date: string;
          done_this_week: Json;
          plan_vs_actual: Json;
          learned: string[];
          blocked?: string | null;
          next_goals: string[];
          condition: Json;
          created_at?: string;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["weekly_retrospectives"]["Insert"], "id" | "user_id">>;
        Relationships: [];
      };
      monthly_checklists: {
        Row: {
          id: string;
          user_id: string;
          month_start_date: string;
          phase_id: string;
          checks_json: Json;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          month_start_date: string;
          phase_id: string;
          checks_json: Json;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["monthly_checklists"]["Insert"], "id" | "user_id">>;
        Relationships: [];
      };
      metric_events: {
        Row: {
          id: string;
          user_id: string;
          metric_type: string;
          date: string;
          delta: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          metric_type: string;
          date: string;
          delta?: number;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: {
      v_retro_rate: {
        Row: {
          user_id: string;
          written_weeks: number;
          elapsed_weeks: number;
          rate_pct: number;
        };
        Relationships: [];
      };
      v_daily_completion: {
        Row: {
          user_id: string;
          date: string;
          done_count: number;
          total_count: number;
          rate_pct: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      current_phase: {
        Args: { p_user_id: string };
        Returns: string | null;
      };
    };
  };
}
