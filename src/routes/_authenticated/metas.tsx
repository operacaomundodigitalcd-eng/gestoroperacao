import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { AppShell, Painel } from "@/components/AppShell";
import { Pill, StatusBadge } from "@/components/StatusBadge";
import { FormDialog } from "@/components/FormDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { registrarAuditoria, useIndicadores, useResultados, useTabela } from "@/lib/dados";
import { MESES, anosDisponiveis, calcularPercentual, num, statusPorPercentual, type Direcao } from "@/lib/perf";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/metas")({
  head: () => ({
    meta: [
      { title: "Metas · Ritmo" },
      { name: "description", content: "Definição de metas por indicador, período, equipe ou colaborador, com peso, prioridade e score de atingimento." },
      { property: "og:title", content: "Metas · Ritmo" },
      { property: "og:description", content: "Planejamento e acompanhamento das metas da operação com score mensal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Metas,
});

type Opcao = { id: string; nome: string };
interface MetaRow {
  id: string;
  titulo: string;
  valor_meta: number;
  peso: number;
  prioridade: string;
  status: string;
  periodicidade: string;
  periodo_inicio: string;
  periodo_fim: string;
  tipo_responsavel: string;
  indicator_id: string;
  team_id: string | null;
  employee_id: string | null;
  department_id: string | null;
  indicators: { nome: string } | null;
  teams: { nome: string } | null;
  employees: { nome: string } | null;
}

function Metas() {
  const qc = useQueryClient();
  const hoje = new Date();
  const { can } = useAuth();
  const podeGerenciar = can("goals.edit");
  const podeLancar = can("results.create");
  const [ano, setAno] = useState(hoje.getFullYear());

  const { data: metas = [], isLoading } = useTabela<MetaRow>(
    "goals",
    "id, titulo, valor_meta, peso, prioridade, status, periodicidade, periodo_inicio, periodo_fim, tipo_responsavel, indicator_id, team_id, employee_id, department_id, indicators(nome), teams(nome), employees(nome)",
    "periodo_inicio",
  );
  const { data: indicadores = [] } = useIndicadores();
  const { data: resultados = [] } = useResultados(ano);
  const { data: equipes = [] } = useTabela<Opcao>("teams", "id, nome", "nome");
  const { data: colaboradores = [] } = useTabela<Opcao>("employees", "id, nome", "nome");
  const { data: departamentos = [] } = useTabela<Opcao>("departments", "id, nome", "nome");

  const direcaoDe = (indicatorId: string): Direcao =>
    (indicadores.find((i) => i.id === indicatorId)?.direcao ?? "maior_melhor") as Direcao;

  /** Score de cada meta: média dos percentuais dos lançamentos do ano (limitados a 130%). */
  const scores = useMemo(() => {
    const mapa = new Map<string, { score: number; lancamentos: number; ultimoMes: number | null; ultimoPct: number | null }>();
    for (const m of metas) {
      const rs = resultados.filter((r) => r.goal_id === m.id || (!r.goal_id && r.indicator_id === m.indicator_id));
      if (!rs.length) {
        mapa.set(m.id, { score: 0, lancamentos: 0, ultimoMes: null, ultimoPct: null });
        continue;
      }
      const pcts = rs.map((r) => ({
        mes: r.mes,
        pct: r.percentual ?? calcularPercentual(direcaoDe(m.indicator_id), r.valor_realizado, r.valor_meta),
      }));
      const soma = pcts.reduce((acc, p) => acc + Math.min(p.pct, 130), 0);
      const ultimo = pcts.reduce((a, b) => (b.mes > a.mes ? b : a));
      mapa.set(m.id, {
        score: Math.round((soma / pcts.length) * 10) / 10,
        lancamentos: pcts.length,
        ultimoMes: ultimo.mes,
        ultimoPct: Math.round(ultimo.pct * 10) / 10,
      });
    }
    return mapa;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metas, resultados, indicadores]);

  const scoreGeral = useMemo(() => {
    const validas = metas.filter((m) => (scores.get(m.id)?.lancamentos ?? 0) > 0);
    if (!validas.length) return null;
    const pesos = validas.reduce((a, m) => a + (m.peso || 1), 0);
    const total = validas.reduce((a, m) => a + (scores.get(m.id)?.score ?? 0) * (m.peso || 1), 0);
    return Math.round((total / pesos) * 10) / 10;
  }, [metas, scores]);

  const nova = (
    <FormDialog
      titulo="Nova meta"
      descricao="Vincule a meta a um indicador e a um período de apuração."
      gatilho={
        <Button size="sm" disabled={!podeGerenciar}>
          <Plus className="size-4" /> Nova meta
        </Button>
      }
      campos={[
        { name: "titulo", label: "Título da meta", obrigatorio: true, colSpan: 2 },
        {
          name: "indicator_id",
          label: "Indicador",
          tipo: "select",
          obrigatorio: true,
          opcoes: indicadores.map((i) => ({ value: i.id, label: i.nome })),
        },
        { name: "valor_meta", label: "Valor da meta", tipo: "numero", obrigatorio: true },
        {
          name: "periodicidade",
          label: "Periodicidade",
          tipo: "select",
          opcoes: [
            { value: "mensal", label: "Mensal" },
            { value: "trimestral", label: "Trimestral" },
            { value: "semestral", label: "Semestral" },
            { value: "anual", label: "Anual" },
          ],
        },
        {
          name: "tipo_responsavel",
          label: "Tipo de responsável",
          tipo: "select",
          opcoes: [
            { value: "equipe", label: "Equipe" },
            { value: "individual", label: "Colaborador" },
            { value: "departamento", label: "Departamento" },
            { value: "subgrupo", label: "Subgrupo" },
          ],
        },
        { name: "team_id", label: "Equipe", tipo: "select", opcoes: equipes.map((e) => ({ value: e.id, label: e.nome })) },
        { name: "employee_id", label: "Colaborador", tipo: "select", opcoes: colaboradores.map((e) => ({ value: e.id, label: e.nome })) },
        { name: "department_id", label: "Departamento", tipo: "select", opcoes: departamentos.map((e) => ({ value: e.id, label: e.nome })) },
        { name: "periodo_inicio", label: "Início do período", tipo: "data", obrigatorio: true },
        { name: "periodo_fim", label: "Fim do período", tipo: "data", obrigatorio: true },
        { name: "peso", label: "Peso", tipo: "numero" },
        {
          name: "prioridade",
          label: "Prioridade",
          tipo: "select",
          opcoes: [
            { value: "baixa", label: "Baixa" },
            { value: "media", label: "Média" },
            { value: "alta", label: "Alta" },
          ],
        },
        { name: "descricao", label: "Descrição", tipo: "textarea" },
      ]}
      onSubmit={async (v) => {
        const titulo = v.req("titulo");
        const { error } = await supabase.from("goals").insert({
          titulo,
          indicator_id: v.req("indicator_id"),
          valor_meta: v.num("valor_meta", 0),
          periodicidade: (v.txt("periodicidade") ?? "mensal") as never,
          tipo_responsavel: (v.txt("tipo_responsavel") ?? "equipe") as never,
          team_id: v.txt("team_id"),
          employee_id: v.txt("employee_id"),
          department_id: v.txt("department_id"),
          periodo_inicio: v.req("periodo_inicio"),
          periodo_fim: v.req("periodo_fim"),
          peso: v.num("peso", 1),
          prioridade: v.txt("prioridade") ?? "media",
          descricao: v.txt("descricao"),
        });
        if (error) throw error;
        await registrarAuditoria({ operacao: "criar", tabela: "goals", descricao: `Meta criada: ${titulo}` });
        await qc.invalidateQueries({ queryKey: ["tabela", "goals"] });
        toast.success("Meta cadastrada.");
      }}
    />
  );

  const lancamento = (m: MetaRow) => (
    <FormDialog
      titulo={`Lançar resultado · ${m.titulo}`}
      descricao="O percentual de atingimento e o status são calculados automaticamente pela direção do indicador."
      gatilho={
        <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" disabled={!podeLancar}>
          Lançar
        </Button>
      }
      valoresIniciais={{ ano: String(ano), mes: String(hoje.getMonth() + 1), valor_meta: String(m.valor_meta) }}
      campos={[
        { name: "ano", label: "Ano", tipo: "select", obrigatorio: true, opcoes: anosDisponiveis().map((a) => ({ value: String(a), label: String(a) })) },
        { name: "mes", label: "Mês", tipo: "select", obrigatorio: true, opcoes: MESES.map((mm, i) => ({ value: String(i + 1), label: mm })) },
        { name: "valor_meta", label: "Valor da meta", tipo: "numero", obrigatorio: true },
        { name: "valor_realizado", label: "Valor realizado", tipo: "numero", obrigatorio: true },
        { name: "observacao", label: "Observação", tipo: "textarea" },
        { name: "justificativa", label: "Justificativa (obrigatória quando abaixo da meta)", tipo: "textarea" },
      ]}
      onSubmit={async (v) => {
        const meta = v.num("valor_meta", m.valor_meta);
        const realizado = v.num("valor_realizado", 0);
        const percentual = calcularPercentual(direcaoDe(m.indicator_id), realizado, meta);
        const status = statusPorPercentual(percentual);
        if (status === "nao_atingida" && !v.txt("justificativa")) {
          throw new Error("Resultados abaixo da meta exigem justificativa.");
        }
        const indicador = indicadores.find((i) => i.id === m.indicator_id);
        const { error } = await supabase.from("results").insert({
          indicator_id: m.indicator_id,
          goal_id: m.id,
          ano: v.num("ano", ano),
          mes: v.num("mes", hoje.getMonth() + 1),
          valor_meta: meta,
          valor_realizado: realizado,
          percentual,
          status_performance: status as never,
          team_id: m.team_id ?? indicador?.team_id ?? null,
          employee_id: m.employee_id,
          department_id: m.department_id ?? indicador?.department_id ?? null,
          observacao: v.txt("observacao"),
          justificativa: v.txt("justificativa"),
        });
        if (error) throw error;
        await registrarAuditoria({
          operacao: "criar",
          tabela: "results",
          descricao: `Resultado lançado na meta ${m.titulo} (${v.txt("mes")}/${v.txt("ano")})`,
        });
        await qc.invalidateQueries({ queryKey: ["resultados"] });
        toast.success("Resultado lançado.");
      }}
    />
  );

  return (
    <AppShell
      titulo="Metas"
      breadcrumb="02 · Performance"
      acoes={
        <>
          <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
            <SelectTrigger className="h-9 w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {anosDisponiveis().map((a) => (
                <SelectItem key={a} value={String(a)}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {nova}
        </>
      }
    >
      <Painel
        titulo="Metas cadastradas"
        descricao={`${metas.length} metas · score ponderado ${ano}: ${scoreGeral === null ? "sem lançamentos" : `${num(scoreGeral)}%`}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5 pr-3 font-medium">Meta</th>
                <th className="px-3 py-2.5 font-medium">Indicador</th>
                <th className="px-3 py-2.5 font-medium">Responsável</th>
                <th className="px-3 py-2.5 font-medium">Período</th>
                <th className="px-3 py-2.5 text-right font-medium">Valor</th>
                <th className="px-3 py-2.5 text-right font-medium">Peso</th>
                <th className="px-3 py-2.5 text-right font-medium">Score {ano}</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">Prioridade</th>
                <th className="py-2.5 pl-3 text-right font-medium">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-muted-foreground">
                    Carregando...
                  </td>
                </tr>
              )}
              {!isLoading && metas.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-muted-foreground">
                    Nenhuma meta cadastrada ainda.
                  </td>
                </tr>
              )}
              {metas.map((m) => {
                const s = scores.get(m.id);
                return (
                  <tr key={m.id} className="transition-colors hover:bg-sand/40">
                    <td className="py-3 pr-3 font-medium">{m.titulo}</td>
                    <td className="px-3 py-3 text-muted-foreground">{m.indicators?.nome ?? "—"}</td>
                    <td className="px-3 py-3 text-muted-foreground">{m.teams?.nome ?? m.employees?.nome ?? "—"}</td>
                    <td className="px-3 py-3 font-mono text-[11px] text-muted-foreground">
                      {new Date(m.periodo_inicio).toLocaleDateString("pt-BR")} — {new Date(m.periodo_fim).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-[13px]">{num(m.valor_meta)}</td>
                    <td className="px-3 py-3 text-right font-mono text-[13px]">{m.peso}</td>
                    <td className="px-3 py-3 text-right font-mono text-[13px]">
                      {s && s.lancamentos ? (
                        <>
                          {num(s.score)}%
                          <span className="ml-1 text-[10px] text-muted-foreground">({s.lancamentos})</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {s && s.lancamentos ? <StatusBadge status={statusPorPercentual(s.score)} /> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-3">
                      <Pill tone={m.prioridade === "alta" ? "destructive" : m.prioridade === "media" ? "warning" : "info"}>{m.prioridade}</Pill>
                    </td>
                    <td className="py-3 pl-3 text-right">{lancamento(m)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Painel>
    </AppShell>
  );
}
