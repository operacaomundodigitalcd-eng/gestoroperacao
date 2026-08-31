import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calcularPercentual, statusPorPercentual, type Direcao, type PerfStatus } from "@/lib/perf";

const sel = (s: string): string => s;

export interface IndicadorRow {
  id: string;
  nome: string;
  codigo: string | null;
  descricao: string | null;
  direcao: Direcao;
  peso: number;
  meta_padrao: number | null;
  periodicidade: string;
  status: string;
  ranking_ativo: boolean;
  team_id: string | null;
  department_id: string | null;
  teams: { nome: string } | null;
  departments: { nome: string } | null;
  indicator_categories: { nome: string } | null;
  measure_units: { nome: string; simbolo: string | null } | null;
  responsavel: { nome: string } | null;
}

export interface ResultadoRow {
  id: string;
  ano: number;
  mes: number;
  valor_realizado: number;
  valor_meta: number;
  percentual: number | null;
  status_performance: PerfStatus | null;
  observacao: string | null;
  justificativa: string | null;
  indicator_id: string;
  team_id: string | null;
  department_id: string | null;
  indicators: { nome: string; codigo: string | null; direcao: Direcao; peso: number } | null;
  teams: { nome: string } | null;
  employees: { nome: string } | null;
}

export function useIndicadores() {
  return useQuery({
    queryKey: ["indicadores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("indicators")
        .select(
          sel(
            "id, nome, codigo, descricao, direcao, peso, meta_padrao, periodicidade, status, ranking_ativo, team_id, department_id, teams(nome), departments(nome), indicator_categories(nome), measure_units(nome, simbolo), responsavel:employees(nome)",
          ),
        )
        .order("nome")
        .returns<IndicadorRow[]>();
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useResultados(ano?: number) {
  return useQuery({
    queryKey: ["resultados", ano ?? "todos"],
    queryFn: async () => {
      let q = supabase
        .from("results")
        .select(
          sel(
            "id, ano, mes, valor_realizado, valor_meta, percentual, status_performance, observacao, justificativa, indicator_id, team_id, department_id, indicators(nome, codigo, direcao, peso), teams(nome), employees(nome)",
          ),
        );
      if (ano) q = q.eq("ano", ano);
      const { data, error } = await q.order("mes").returns<ResultadoRow[]>();
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTabela<T = Record<string, unknown>>(
  tabela:
    | "departments"
    | "teams"
    | "subgroups"
    | "employees"
    | "goals"
    | "action_plans"
    | "analyses"
    | "indicator_categories"
    | "measure_units"
    | "positions"
    | "job_functions"
    | "work_schedules"
    | "audit_logs"
    | "period_closures"
    | "presentations"
    | "user_roles"
    | "profiles",
  select = "*",
  ordenar?: string,
) {
  return useQuery({
    queryKey: ["tabela", tabela, select, ordenar ?? ""],
    queryFn: async () => {
      let q = supabase.from(tabela).select(sel(select));
      if (ordenar) q = q.order(ordenar);
      const { data, error } = await q.returns<T[]>();
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Score ponderado de um conjunto de resultados (0-100+, limitado a 130). */
export function calcularScore(resultados: ResultadoRow[]): number {
  if (!resultados.length) return 0;
  const somaPesos = resultados.reduce((acc, r) => acc + (r.indicators?.peso ?? 1), 0);
  if (!somaPesos) return 0;
  const total = resultados.reduce((acc, r) => {
    const p = r.percentual ?? calcularPercentual(r.indicators?.direcao ?? "maior_melhor", r.valor_realizado, r.valor_meta);
    return acc + Math.min(p, 130) * (r.indicators?.peso ?? 1);
  }, 0);
  return Math.round((total / somaPesos) * 10) / 10;
}

export function statusDoResultado(r: ResultadoRow): PerfStatus {
  if (r.status_performance) return r.status_performance;
  return statusPorPercentual(r.percentual ?? calcularPercentual(r.indicators?.direcao ?? "maior_melhor", r.valor_realizado, r.valor_meta));
}

export async function registrarAuditoria(params: {
  operacao: string;
  tabela: string;
  registro_id?: string;
  descricao: string;
  valor_anterior?: unknown;
  valor_novo?: unknown;
}) {
  const { data: userData } = await supabase.auth.getUser();
  await supabase.from("audit_logs").insert({
    user_id: userData.user?.id ?? null,
    user_email: userData.user?.email ?? null,
    operacao: params.operacao,
    tabela: params.tabela,
    registro_id: params.registro_id ?? null,
    descricao: params.descricao,
    valor_anterior: (params.valor_anterior ?? null) as never,
    valor_novo: (params.valor_novo ?? null) as never,
  });
}
