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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      action_plans: {
        Row: {
          comentario: string | null
          como: string | null
          created_at: string
          created_by: string | null
          data_conclusao: string | null
          evidencia: string | null
          id: string
          indicator_id: string | null
          o_que: string
          por_que: string | null
          prazo: string | null
          prioridade: string
          quem: string | null
          status: Database["public"]["Enums"]["action_status"]
          team_id: string | null
          updated_at: string
        }
        Insert: {
          comentario?: string | null
          como?: string | null
          created_at?: string
          created_by?: string | null
          data_conclusao?: string | null
          evidencia?: string | null
          id?: string
          indicator_id?: string | null
          o_que: string
          por_que?: string | null
          prazo?: string | null
          prioridade?: string
          quem?: string | null
          status?: Database["public"]["Enums"]["action_status"]
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          comentario?: string | null
          como?: string | null
          created_at?: string
          created_by?: string | null
          data_conclusao?: string | null
          evidencia?: string | null
          id?: string
          indicator_id?: string | null
          o_que?: string
          por_que?: string | null
          prazo?: string | null
          prioridade?: string
          quem?: string | null
          status?: Database["public"]["Enums"]["action_status"]
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_plans_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_plans_quem_fkey"
            columns: ["quem"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_plans_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      analyses: {
        Row: {
          acoes: string | null
          analise: string | null
          ano: number
          causa: string | null
          created_at: string
          created_by: string | null
          id: string
          impacto: string | null
          indicator_id: string
          justificativa: string | null
          mes: number
          pontos_negativos: string | null
          pontos_positivos: string | null
          result_id: string | null
          updated_at: string
        }
        Insert: {
          acoes?: string | null
          analise?: string | null
          ano: number
          causa?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          impacto?: string | null
          indicator_id: string
          justificativa?: string | null
          mes: number
          pontos_negativos?: string | null
          pontos_positivos?: string | null
          result_id?: string | null
          updated_at?: string
        }
        Update: {
          acoes?: string | null
          analise?: string | null
          ano?: number
          causa?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          impacto?: string | null
          indicator_id?: string
          justificativa?: string | null
          mes?: number
          pontos_negativos?: string | null
          pontos_positivos?: string | null
          result_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analyses_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analyses_result_id_fkey"
            columns: ["result_id"]
            isOneToOne: false
            referencedRelation: "results"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          operacao: string
          registro_id: string | null
          tabela: string
          user_email: string | null
          user_id: string | null
          valor_anterior: Json | null
          valor_novo: Json | null
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          operacao: string
          registro_id?: string | null
          tabela: string
          user_email?: string | null
          user_id?: string | null
          valor_anterior?: Json | null
          valor_novo?: Json | null
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          operacao?: string
          registro_id?: string | null
          tabela?: string
          user_email?: string | null
          user_id?: string | null
          valor_anterior?: Json | null
          valor_novo?: Json | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          chefia_id: string | null
          cpf: string
          created_at: string
          data_admissao: string | null
          data_desligamento: string | null
          department_id: string | null
          email: string
          function_id: string | null
          id: string
          matricula: string | null
          nome: string
          observacoes: string | null
          position_id: string | null
          status: Database["public"]["Enums"]["employee_status"]
          subgroup_id: string | null
          supervisor_id: string | null
          team_id: string | null
          telefone: string | null
          unidade: string | null
          updated_at: string
          user_id: string | null
          work_schedule_id: string | null
        }
        Insert: {
          chefia_id?: string | null
          cpf: string
          created_at?: string
          data_admissao?: string | null
          data_desligamento?: string | null
          department_id?: string | null
          email: string
          function_id?: string | null
          id?: string
          matricula?: string | null
          nome: string
          observacoes?: string | null
          position_id?: string | null
          status?: Database["public"]["Enums"]["employee_status"]
          subgroup_id?: string | null
          supervisor_id?: string | null
          team_id?: string | null
          telefone?: string | null
          unidade?: string | null
          updated_at?: string
          user_id?: string | null
          work_schedule_id?: string | null
        }
        Update: {
          chefia_id?: string | null
          cpf?: string
          created_at?: string
          data_admissao?: string | null
          data_desligamento?: string | null
          department_id?: string | null
          email?: string
          function_id?: string | null
          id?: string
          matricula?: string | null
          nome?: string
          observacoes?: string | null
          position_id?: string | null
          status?: Database["public"]["Enums"]["employee_status"]
          subgroup_id?: string | null
          supervisor_id?: string | null
          team_id?: string | null
          telefone?: string | null
          unidade?: string | null
          updated_at?: string
          user_id?: string | null
          work_schedule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_chefia_id_fkey"
            columns: ["chefia_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_function_id_fkey"
            columns: ["function_id"]
            isOneToOne: false
            referencedRelation: "job_functions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_subgroup_id_fkey"
            columns: ["subgroup_id"]
            isOneToOne: false
            referencedRelation: "subgroups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_work_schedule_id_fkey"
            columns: ["work_schedule_id"]
            isOneToOne: false
            referencedRelation: "work_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          indicator_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          indicator_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          indicator_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "indicators"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_history: {
        Row: {
          changed_by: string | null
          created_at: string
          goal_id: string
          id: string
          justificativa: string | null
          valor_anterior: number | null
          valor_novo: number | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          goal_id: string
          id?: string
          justificativa?: string | null
          valor_anterior?: number | null
          valor_novo?: number | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          goal_id?: string
          id?: string
          justificativa?: string | null
          valor_anterior?: number | null
          valor_novo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_history_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string | null
          descricao: string | null
          employee_id: string | null
          id: string
          indicator_id: string
          observacao: string | null
          periodicidade: Database["public"]["Enums"]["periodicity"]
          periodo_fim: string
          periodo_inicio: string
          peso: number
          prioridade: string
          status: string
          subgroup_id: string | null
          team_id: string | null
          tipo_responsavel: Database["public"]["Enums"]["responsible_type"]
          titulo: string
          updated_at: string
          valor_meta: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          descricao?: string | null
          employee_id?: string | null
          id?: string
          indicator_id: string
          observacao?: string | null
          periodicidade?: Database["public"]["Enums"]["periodicity"]
          periodo_fim: string
          periodo_inicio: string
          peso?: number
          prioridade?: string
          status?: string
          subgroup_id?: string | null
          team_id?: string | null
          tipo_responsavel?: Database["public"]["Enums"]["responsible_type"]
          titulo: string
          updated_at?: string
          valor_meta: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          descricao?: string | null
          employee_id?: string | null
          id?: string
          indicator_id?: string
          observacao?: string | null
          periodicidade?: Database["public"]["Enums"]["periodicity"]
          periodo_fim?: string
          periodo_inicio?: string
          peso?: number
          prioridade?: string
          status?: string
          subgroup_id?: string | null
          team_id?: string | null
          tipo_responsavel?: Database["public"]["Enums"]["responsible_type"]
          titulo?: string
          updated_at?: string
          valor_meta?: number
        }
        Relationships: [
          {
            foreignKeyName: "goals_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_subgroup_id_fkey"
            columns: ["subgroup_id"]
            isOneToOne: false
            referencedRelation: "subgroups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      indicator_categories: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      indicators: {
        Row: {
          category_id: string | null
          codigo: string | null
          created_at: string
          department_id: string | null
          descricao: string | null
          direcao: Database["public"]["Enums"]["goal_direction"]
          fonte_dados: string | null
          formula: string | null
          id: string
          meta_max: number | null
          meta_min: number | null
          meta_padrao: number | null
          nome: string
          observacoes: string | null
          periodicidade: Database["public"]["Enums"]["periodicity"]
          peso: number
          ranking_ativo: boolean
          responsavel_id: string | null
          status: string
          subgroup_id: string | null
          team_id: string | null
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          codigo?: string | null
          created_at?: string
          department_id?: string | null
          descricao?: string | null
          direcao?: Database["public"]["Enums"]["goal_direction"]
          fonte_dados?: string | null
          formula?: string | null
          id?: string
          meta_max?: number | null
          meta_min?: number | null
          meta_padrao?: number | null
          nome: string
          observacoes?: string | null
          periodicidade?: Database["public"]["Enums"]["periodicity"]
          peso?: number
          ranking_ativo?: boolean
          responsavel_id?: string | null
          status?: string
          subgroup_id?: string | null
          team_id?: string | null
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          codigo?: string | null
          created_at?: string
          department_id?: string | null
          descricao?: string | null
          direcao?: Database["public"]["Enums"]["goal_direction"]
          fonte_dados?: string | null
          formula?: string | null
          id?: string
          meta_max?: number | null
          meta_min?: number | null
          meta_padrao?: number | null
          nome?: string
          observacoes?: string | null
          periodicidade?: Database["public"]["Enums"]["periodicity"]
          peso?: number
          ranking_ativo?: boolean
          responsavel_id?: string | null
          status?: string
          subgroup_id?: string | null
          team_id?: string | null
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "indicators_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "indicator_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicators_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicators_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicators_subgroup_id_fkey"
            columns: ["subgroup_id"]
            isOneToOne: false
            referencedRelation: "subgroups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicators_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicators_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "measure_units"
            referencedColumns: ["id"]
          },
        ]
      }
      job_functions: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      measure_units: {
        Row: {
          created_at: string
          id: string
          nome: string
          simbolo: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          simbolo?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          simbolo?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          lida: boolean
          mensagem: string | null
          tipo: string
          titulo: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lida?: boolean
          mensagem?: string | null
          tipo?: string
          titulo: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lida?: boolean
          mensagem?: string | null
          tipo?: string
          titulo?: string
          user_id?: string | null
        }
        Relationships: []
      }
      period_closures: {
        Row: {
          ano: number
          fechado_em: string
          fechado_por: string | null
          id: string
          mes: number
          observacao: string | null
          reaberto_em: string | null
          reaberto_por: string | null
          status: string
        }
        Insert: {
          ano: number
          fechado_em?: string
          fechado_por?: string | null
          id?: string
          mes: number
          observacao?: string | null
          reaberto_em?: string | null
          reaberto_por?: string | null
          status?: string
        }
        Update: {
          ano?: number
          fechado_em?: string
          fechado_por?: string | null
          id?: string
          mes?: number
          observacao?: string | null
          reaberto_em?: string | null
          reaberto_por?: string | null
          status?: string
        }
        Relationships: []
      }
      positions: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      presentation_slides: {
        Row: {
          config: Json
          conteudo: string | null
          created_at: string
          id: string
          ordem: number
          presentation_id: string
          tipo: string
          titulo: string
        }
        Insert: {
          config?: Json
          conteudo?: string | null
          created_at?: string
          id?: string
          ordem?: number
          presentation_id: string
          tipo?: string
          titulo: string
        }
        Update: {
          config?: Json
          conteudo?: string | null
          created_at?: string
          id?: string
          ordem?: number
          presentation_id?: string
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "presentation_slides_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: false
            referencedRelation: "presentations"
            referencedColumns: ["id"]
          },
        ]
      }
      presentations: {
        Row: {
          ano: number | null
          created_at: string
          created_by: string | null
          descricao: string | null
          filtros: Json
          id: string
          mes: number | null
          titulo: string
          updated_at: string
        }
        Insert: {
          ano?: number | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          filtros?: Json
          id?: string
          mes?: number | null
          titulo: string
          updated_at?: string
        }
        Update: {
          ano?: number | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          filtros?: Json
          id?: string
          mes?: number | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cpf: string | null
          created_at: string
          email: string
          id: string
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          email?: string
          id: string
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cpf?: string | null
          created_at?: string
          email?: string
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      results: {
        Row: {
          ano: number
          created_at: string
          created_by: string | null
          department_id: string | null
          employee_id: string | null
          goal_id: string | null
          id: string
          indicator_id: string
          justificativa: string | null
          mes: number
          observacao: string | null
          percentual: number | null
          status_performance: Database["public"]["Enums"]["perf_status"] | null
          team_id: string | null
          updated_at: string
          valor_meta: number
          valor_realizado: number
        }
        Insert: {
          ano: number
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          employee_id?: string | null
          goal_id?: string | null
          id?: string
          indicator_id: string
          justificativa?: string | null
          mes: number
          observacao?: string | null
          percentual?: number | null
          status_performance?: Database["public"]["Enums"]["perf_status"] | null
          team_id?: string | null
          updated_at?: string
          valor_meta: number
          valor_realizado: number
        }
        Update: {
          ano?: number
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          employee_id?: string | null
          goal_id?: string | null
          id?: string
          indicator_id?: string
          justificativa?: string | null
          mes?: number
          observacao?: string | null
          percentual?: number | null
          status_performance?: Database["public"]["Enums"]["perf_status"] | null
          team_id?: string | null
          updated_at?: string
          valor_meta?: number
          valor_realizado?: number
        }
        Relationships: [
          {
            foreignKeyName: "results_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_views: {
        Row: {
          created_at: string
          filtros: Json
          id: string
          nome: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filtros?: Json
          id?: string
          nome: string
          user_id: string
        }
        Update: {
          created_at?: string
          filtros?: Json
          id?: string
          nome?: string
          user_id?: string
        }
        Relationships: []
      }
      subgroups: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          status: string
          team_id: string | null
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          status?: string
          team_id?: string | null
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          status?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subgroups_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          department_id: string | null
          descricao: string | null
          gestor_id: string | null
          id: string
          nome: string
          status: string
          supervisor_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          descricao?: string | null
          gestor_id?: string | null
          id?: string
          nome: string
          status?: string
          supervisor_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          descricao?: string | null
          gestor_id?: string | null
          id?: string
          nome?: string
          status?: string
          supervisor_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_gestor_fk"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_supervisor_fk"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      work_schedules: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_launch: { Args: { _user_id: string }; Returns: boolean }
      can_manage: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      action_status:
        | "nao_iniciado"
        | "em_andamento"
        | "concluido"
        | "atrasado"
        | "cancelado"
      app_role:
        | "admin"
        | "gestor"
        | "supervisor"
        | "colaborador"
        | "visualizador"
      employee_status: "ativo" | "inativo" | "afastado" | "ferias" | "desligado"
      goal_direction: "maior_melhor" | "menor_melhor" | "igual" | "intervalo"
      perf_status: "superou" | "atingida" | "atencao" | "nao_atingida"
      periodicity:
        | "diaria"
        | "semanal"
        | "mensal"
        | "trimestral"
        | "semestral"
        | "anual"
        | "personalizada"
      responsible_type:
        | "individual"
        | "equipe"
        | "subgrupo"
        | "departamento"
        | "corporativa"
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
      action_status: [
        "nao_iniciado",
        "em_andamento",
        "concluido",
        "atrasado",
        "cancelado",
      ],
      app_role: [
        "admin",
        "gestor",
        "supervisor",
        "colaborador",
        "visualizador",
      ],
      employee_status: ["ativo", "inativo", "afastado", "ferias", "desligado"],
      goal_direction: ["maior_melhor", "menor_melhor", "igual", "intervalo"],
      perf_status: ["superou", "atingida", "atencao", "nao_atingida"],
      periodicity: [
        "diaria",
        "semanal",
        "mensal",
        "trimestral",
        "semestral",
        "anual",
        "personalizada",
      ],
      responsible_type: [
        "individual",
        "equipe",
        "subgrupo",
        "departamento",
        "corporativa",
      ],
    },
  },
} as const
