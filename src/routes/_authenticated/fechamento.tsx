import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Lock, Unlock } from "lucide-react";
import { AppShell, Painel } from "@/components/AppShell";
import { Pill, StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { calcularScore, registrarAuditoria, statusDoResultado, useIndicadores, useResultados, useTabela } from "@/lib/dados";
import { MESES, anosDisponiveis, num } from "@/lib/perf";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/fechamento")({
  head: () => ({
    meta: [
      { title: "Fechamento Mensal · Ritmo" },
      { name: "description", content: "Checklist de fechamento do mês: pendências de lançamento, justificativas e bloqueio da competência." },
      { property: "og:title", content: "Fechamento Mensal · Ritmo" },
      { property: "og:description", content: "Encerramento formal da competência mensal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Fechamento,
});

interface Fechado {
  id: string;
  ano: number;
  mes: number;
  status: string;
  fechado_em: string;
  observacao: string | null;
}

function Fechamento() {
  const qc = useQueryClient();
  const hoje = new Date();
  const { podeGerenciar } = useAuth();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1);

  const { data: resultados = [] } = useResultados(ano);
  const { data: indicadores = [] } = useIndicadores();
  const { data: fechamentos = [] } = useTabela<Fechado>("period_closures", "id, ano, mes, status, fechado_em, observacao", "ano");

  const doMes = useMemo(() => resultados.filter((r) => r.mes === mes), [resultados, mes]);
  const registro = fechamentos.find((f) => f.ano === ano && f.mes === mes);
  const fechado = registro?.status === "fechado";

  const semLancamento = indicadores.filter((i) => !doMes.some((r) => r.indicator_id === i.id));
  const semJustificativa = doMes.filter((r) => statusDoResultado(r) === "nao_atingida" && !r.justificativa);
  const pronto = semLancamento.length === 0 && semJustificativa.length === 0;

  const alternar = async () => {
    if (!fechado && !pronto) {
      toast.error("Resolva as pendências antes de encerrar a competência.");
      return;
    }
    if (registro) {
      const { error } = await supabase
        .from("period_closures")
        .update({
          status: fechado ? "aberto" : "fechado",
          reaberto_em: fechado ? new Date().toISOString() : null,
        })
        .eq("id", registro.id);
      if (error) {
        toast.error(error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("period_closures").insert({ ano, mes, status: "fechado" });
      if (error) {
        toast.error(error.message);
        return;
      }
    }
    await registrarAuditoria({
      operacao: fechado ? "reabrir" : "fechar",
      tabela: "period_closures",
      descricao: `${fechado ? "Reabertura" : "Fechamento"} da competência ${MESES[mes - 1]}/${ano}`,
    });
    await qc.invalidateQueries({ queryKey: ["tabela", "period_closures"] });
    toast.success(fechado ? "Competência reaberta." : "Competência encerrada.");
  };

  return (
    <AppShell
      titulo="Fechamento Mensal"
      breadcrumb="04 · Gestão"
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
          <Button size="sm" disabled={!podeGerenciar} onClick={() => void alternar()}>
            {fechado ? <Unlock className="size-4" /> : <Lock className="size-4" />}
            {fechado ? "Reabrir competência" : "Encerrar competência"}
          </Button>
        </>
      }
    >
      <section className="flex flex-wrap items-center gap-4 bg-primary p-5 text-primary-foreground">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider opacity-80">Competência</p>
          <p className="font-display text-3xl font-bold tracking-tight">
            {MESES[mes - 1]}/{ano}
          </p>
        </div>
        <div className="ml-auto flex flex-wrap gap-2 font-mono text-[11px]">
          <span className="rounded-full bg-background px-3 py-1 text-foreground">Score {num(calcularScore(doMes))}%</span>
          <span className={`rounded-full px-3 py-1 ${fechado ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"}`}>
            {fechado ? "Encerrada" : "Aberta"}
          </span>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Painel titulo="Checklist de fechamento" descricao="condições obrigatórias para encerrar">
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <Pill tone={semLancamento.length ? "destructive" : "success"}>{semLancamento.length ? "Pendente" : "OK"}</Pill>
              <span>
                {semLancamento.length
                  ? `${semLancamento.length} indicadores sem lançamento`
                  : "Todos os indicadores possuem lançamento"}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Pill tone={semJustificativa.length ? "destructive" : "success"}>{semJustificativa.length ? "Pendente" : "OK"}</Pill>
              <span>
                {semJustificativa.length
                  ? `${semJustificativa.length} resultados abaixo da meta sem justificativa`
                  : "Todas as metas não atingidas estão justificadas"}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Pill tone={pronto ? "success" : "warning"}>{pronto ? "Pronto" : "Aguardando"}</Pill>
              <span>Consolidação do score e liberação para apresentação executiva</span>
            </li>
          </ul>
        </Painel>

        <Painel titulo="Indicadores sem lançamento" descricao={`${semLancamento.length} pendências`}>
          <ul className="divide-y divide-border text-sm">
            {semLancamento.map((i) => (
              <li key={i.id} className="flex items-center justify-between py-2.5">
                <span>{i.nome}</span>
                <span className="font-mono text-[11px] text-muted-foreground">{i.teams?.nome ?? "—"}</span>
              </li>
            ))}
            {semLancamento.length === 0 && <li className="py-2.5 text-muted-foreground">Nenhuma pendência.</li>}
          </ul>
        </Painel>
      </div>

      <Painel titulo="Resultados da competência" descricao={`${doMes.length} lançamentos`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5 pr-3 font-medium">Indicador</th>
                <th className="px-3 py-2.5 text-right font-medium">%</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="py-2.5 pl-3 font-medium">Justificativa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {doMes.map((r) => (
                <tr key={r.id}>
                  <td className="py-3 pr-3 font-medium">{r.indicators?.nome}</td>
                  <td className="px-3 py-3 text-right font-mono text-[12px]">{num(r.percentual)}%</td>
                  <td className="px-3 py-3">
                    <StatusBadge status={statusDoResultado(r)} />
                  </td>
                  <td className="py-3 pl-3 text-[12px] text-muted-foreground">{r.justificativa ?? "—"}</td>
                </tr>
              ))}
              {doMes.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted-foreground">
                    Nenhum lançamento nesta competência.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Painel>
    </AppShell>
  );
}
