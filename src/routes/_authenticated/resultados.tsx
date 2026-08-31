import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { AppShell, Painel } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { FormDialog } from "@/components/FormDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { registrarAuditoria, statusDoResultado, useIndicadores, useResultados, useTabela } from "@/lib/dados";
import { MESES, anosDisponiveis, calcularPercentual, num, statusPorPercentual } from "@/lib/perf";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/resultados")({
  head: () => ({
    meta: [
      { title: "Resultados · Ritmo" },
      { name: "description", content: "Lançamento mensal de resultados por indicador com cálculo automático de percentual e status." },
      { property: "og:title", content: "Resultados · Ritmo" },
      { property: "og:description", content: "Lançamento e acompanhamento de resultados mensais." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Resultados,
});

type Opcao = { id: string; nome: string };
interface Fechamento {
  id: string;
  ano: number;
  mes: number;
  status: string;
}

function Resultados() {
  const qc = useQueryClient();
  const hoje = new Date();
  const { podeLancar } = useAuth();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1);

  const { data: resultados = [], isLoading } = useResultados(ano);
  const { data: indicadores = [] } = useIndicadores();
  const { data: equipes = [] } = useTabela<Opcao>("teams", "id, nome", "nome");
  const { data: fechamentos = [] } = useTabela<Fechamento>("period_closures", "id, ano, mes, status");

  const periodoFechado = fechamentos.some((f) => f.ano === ano && f.mes === mes && f.status === "fechado");
  const lista = useMemo(() => resultados.filter((r) => r.mes === mes), [resultados, mes]);

  const lancar = (
    <FormDialog
      titulo="Lançar resultado"
      descricao="O percentual de atingimento e o status são calculados automaticamente."
      gatilho={
        <Button size="sm" disabled={!podeLancar || periodoFechado}>
          <Plus className="size-4" /> Lançar resultado
        </Button>
      }
      valoresIniciais={{ ano: String(ano), mes: String(mes) }}
      campos={[
        {
          name: "indicator_id",
          label: "Indicador",
          tipo: "select",
          obrigatorio: true,
          colSpan: 2,
          opcoes: indicadores.map((i) => ({ value: i.id, label: i.nome })),
        },
        { name: "ano", label: "Ano", tipo: "select", obrigatorio: true, opcoes: anosDisponiveis().map((a) => ({ value: String(a), label: String(a) })) },
        { name: "mes", label: "Mês", tipo: "select", obrigatorio: true, opcoes: MESES.map((m, i) => ({ value: String(i + 1), label: m })) },
        { name: "valor_meta", label: "Valor da meta", tipo: "numero", obrigatorio: true },
        { name: "valor_realizado", label: "Valor realizado", tipo: "numero", obrigatorio: true },
        { name: "team_id", label: "Equipe", tipo: "select", opcoes: equipes.map((e) => ({ value: e.id, label: e.nome })) },
        { name: "observacao", label: "Observação", tipo: "textarea" },
        { name: "justificativa", label: "Justificativa (obrigatória quando abaixo da meta)", tipo: "textarea" },
      ]}
      onSubmit={async (v) => {
        const indicatorId = v.req("indicator_id");
        const indicador = indicadores.find((i) => i.id === indicatorId);
        const meta = v.num("valor_meta", 0);
        const realizado = v.num("valor_realizado", 0);
        const percentual = calcularPercentual(indicador?.direcao ?? "maior_melhor", realizado, meta);
        const status = statusPorPercentual(percentual);
        if (status === "nao_atingida" && !v.txt("justificativa")) {
          throw new Error("Resultados abaixo da meta exigem justificativa.");
        }
        const { error } = await supabase.from("results").insert({
          indicator_id: indicatorId,
          ano: v.num("ano", ano),
          mes: v.num("mes", mes),
          valor_meta: meta,
          valor_realizado: realizado,
          percentual,
          status_performance: status as never,
          team_id: v.txt("team_id") ?? indicador?.team_id ?? null,
          department_id: indicador?.department_id ?? null,
          observacao: v.txt("observacao"),
          justificativa: v.txt("justificativa"),
        });
        if (error) throw error;
        await registrarAuditoria({
          operacao: "criar",
          tabela: "results",
          descricao: `Resultado lançado para ${indicador?.nome ?? "indicador"} (${v.txt("mes")}/${v.txt("ano")})`,
        });
        await qc.invalidateQueries({ queryKey: ["resultados"] });
        toast.success("Resultado lançado.");
      }}
    />
  );

  return (
    <AppShell
      titulo="Resultados"
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
          <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
            <SelectTrigger className="h-9 w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MESES.map((m, i) => (
                <SelectItem key={m} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {lancar}
        </>
      }
    >
      {periodoFechado && (
        <div className="border-l-2 border-warning bg-warning/10 p-3 text-sm">
          Competência <strong>{MESES[mes - 1]}/{ano}</strong> encerrada — novos lançamentos estão bloqueados.
        </div>
      )}

      <Painel titulo={`Lançamentos de ${MESES[mes - 1]}/${ano}`} descricao={`${lista.length} registros`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5 pr-3 font-medium">Indicador</th>
                <th className="px-3 py-2.5 font-medium">Equipe</th>
                <th className="px-3 py-2.5 text-right font-medium">Meta</th>
                <th className="px-3 py-2.5 text-right font-medium">Realizado</th>
                <th className="px-3 py-2.5 text-right font-medium">%</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="py-2.5 pl-3 font-medium">Justificativa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-muted-foreground">
                    Carregando...
                  </td>
                </tr>
              )}
              {!isLoading && lista.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-muted-foreground">
                    Nenhum lançamento nesta competência.
                  </td>
                </tr>
              )}
              {lista.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-sand/40">
                  <td className="py-3 pr-3 font-medium">{r.indicators?.nome}</td>
                  <td className="px-3 py-3 text-muted-foreground">{r.teams?.nome ?? "—"}</td>
                  <td className="px-3 py-3 text-right font-mono text-[13px]">{num(r.valor_meta)}</td>
                  <td className="px-3 py-3 text-right font-mono text-[13px]">{num(r.valor_realizado)}</td>
                  <td className="px-3 py-3 text-right font-mono text-[12px]">{num(r.percentual)}%</td>
                  <td className="px-3 py-3">
                    <StatusBadge status={statusDoResultado(r)} />
                  </td>
                  <td className="max-w-xs py-3 pl-3 text-[12px] text-muted-foreground">{r.justificativa ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Painel>
    </AppShell>
  );
}
