import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell, Painel } from "@/components/AppShell";
import { StatusBadge, Pill } from "@/components/StatusBadge";
import { calcularScore, statusDoResultado, useIndicadores, useResultados, type ResultadoRow } from "@/lib/dados";
import { MESES, MESES_CURTOS, anosDisponiveis, num } from "@/lib/perf";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Visão Gerencial · Ritmo" },
      { name: "description", content: "Score geral, metas atingidas, indicadores críticos, ranking de equipes e evolução mensal da operação." },
      { property: "og:title", content: "Visão Gerencial · Ritmo" },
      { property: "og:description", content: "Painel executivo de performance da operação." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const { nome } = useAuth();
  const { data: resultados = [], isLoading } = useResultados(ano);
  const { data: indicadores = [] } = useIndicadores();

  const doMes = useMemo(() => resultados.filter((r) => r.mes === mes), [resultados, mes]);
  const doAnterior = useMemo(() => resultados.filter((r) => r.mes === mes - 1), [resultados, mes]);

  const score = calcularScore(doMes);
  const scoreAnterior = calcularScore(doAnterior);
  const delta = Math.round((score - scoreAnterior) * 10) / 10;

  const contagem = useMemo(() => {
    const c = { superou: 0, atingida: 0, atencao: 0, nao_atingida: 0 };
    doMes.forEach((r) => (c[statusDoResultado(r)] += 1));
    return c;
  }, [doMes]);

  const atingidas = contagem.superou + contagem.atingida;
  const total = doMes.length;

  const serie = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const mesResultados = resultados.filter((r) => r.mes === i + 1);
        return {
          mes: MESES_CURTOS[i],
          realizado: mesResultados.length ? calcularScore(mesResultados) : null,
          meta: 100,
        };
      }),
    [resultados],
  );

  const rankingEquipes = useMemo(() => {
    const mapa = new Map<string, ResultadoRow[]>();
    doMes.forEach((r) => {
      const chave = r.teams?.nome ?? "Sem equipe";
      mapa.set(chave, [...(mapa.get(chave) ?? []), r]);
    });
    return [...mapa.entries()]
      .map(([equipe, rs]) => ({ equipe, score: calcularScore(rs) }))
      .sort((a, b) => b.score - a.score);
  }, [doMes]);

  const destaques = useMemo(() => {
    const comparados = doMes
      .map((r) => {
        const anterior = doAnterior.find((a) => a.indicator_id === r.indicator_id);
        return {
          nome: r.indicators?.nome ?? "—",
          atual: r.percentual ?? 0,
          variacao: anterior ? (r.percentual ?? 0) - (anterior.percentual ?? 0) : 0,
        };
      })
      .sort((a, b) => b.variacao - a.variacao);
    const criticos = doMes
      .filter((r) => statusDoResultado(r) === "nao_atingida")
      .sort((a, b) => (a.percentual ?? 0) - (b.percentual ?? 0));
    return {
      evolucao: comparados[0],
      queda: comparados[comparados.length - 1],
      critico: criticos[0],
      melhor: [...doMes].sort((a, b) => (b.percentual ?? 0) - (a.percentual ?? 0))[0],
    };
  }, [doMes, doAnterior]);

  const filtros = (
    <>
      <span className="label-mono">Filtros</span>
      <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
        <SelectTrigger className="h-9 w-[104px]">
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
        <SelectTrigger className="h-9 w-[132px]">
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
    </>
  );

  return (
    <AppShell titulo={`Olá, ${(nome || "gestor").split(" ")[0]}`} breadcrumb="01 · Visão Gerencial" acoes={filtros}>
      <section className="animate-rise bg-primary p-5 text-primary-foreground">
        <div className="flex flex-wrap items-end gap-5">
          <div className="flex items-end gap-3">
            <span className="font-mono text-[11px] uppercase tracking-wider opacity-80">Score geral</span>
            <span className="font-display text-6xl font-bold leading-none tracking-tight">{num(score)}</span>
            <span className="font-display text-2xl font-bold leading-none">%</span>
          </div>
          <div className="mb-1 flex flex-col gap-1 font-mono text-[11px]">
            <span className="opacity-90">
              {delta >= 0 ? "▲" : "▼"} {num(Math.abs(delta))} pts vs. {MESES[Math.max(mes - 2, 0)]}/{ano}
            </span>
            <span className="opacity-70">
              competência {MESES[mes - 1]}/{ano} · {total} indicadores lançados
            </span>
          </div>
          <div className="ml-auto flex flex-wrap gap-2 font-mono text-[11px]">
            <span className="rounded-full bg-background px-3 py-1 text-foreground">
              {atingidas} / {total} metas
            </span>
            <span className="rounded-full bg-warning px-3 py-1 text-warning-foreground">
              {contagem.nao_atingida} críticas
            </span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { cor: "bg-success", valor: atingidas, titulo: "Metas atingidas", nota: total ? `${Math.round((atingidas / total) * 100)}% do total` : "sem lançamentos" },
          { cor: "bg-destructive", valor: contagem.nao_atingida, titulo: "Metas não atingidas", nota: "exigem justificativa" },
          { cor: "bg-warning", valor: contagem.atencao, titulo: "Em atenção", nota: "próximos da meta" },
          { cor: "bg-destructive", valor: contagem.nao_atingida, titulo: "Indicadores críticos", nota: "exigem plano de ação" },
        ].map((c, i) => (
          <div
            key={c.titulo}
            className="animate-rise flex flex-col gap-2 rounded-lg bg-card p-4 ring-1 ring-border"
            style={{ animationDelay: `${60 * (i + 1)}ms` }}
          >
            <span className={`size-2.5 shrink-0 rounded-full ${c.cor}`} />
            <p className="font-display text-3xl font-bold leading-none tracking-tight">{c.valor}</p>
            <p className="text-sm font-medium">{c.titulo}</p>
            <p className="font-mono text-[11px] text-muted-foreground">{c.nota}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Painel titulo="Meta × Realizado" descricao="score ponderado · 12 meses" className="lg:col-span-2">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={serie} margin={{ left: -20, right: 8, top: 8 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis domain={[60, 130]} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <RTooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="meta" name="Meta" stroke="var(--info)" strokeDasharray="4 4" dot={false} />
                <Line type="monotone" dataKey="realizado" name="Realizado" stroke="var(--primary)" strokeWidth={2} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Painel>

        <Painel titulo="Ranking de equipes" descricao="score ponderado · pesos aplicados">
          <div className="flex flex-col gap-3">
            {rankingEquipes.length === 0 && <p className="text-sm text-muted-foreground">Sem resultados no período.</p>}
            {rankingEquipes.map((e, i) => (
              <div key={e.equipe} className="flex items-center gap-3">
                <span className="w-4 font-mono text-[11px] text-muted-foreground">{i + 1}</span>
                <div className="flex-1">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{e.equipe}</span>
                    <span className="font-mono text-[11px]">{num(e.score)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-sand">
                    <div
                      className={`h-full rounded-full ${e.score >= 100 ? "bg-success" : e.score >= 90 ? "bg-warning" : "bg-destructive"}`}
                      style={{ width: `${Math.min(e.score, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Painel>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Painel titulo="Indicadores da competência" descricao={`${doMes.length} lançamentos`} className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-2.5 pr-3 font-medium">Indicador</th>
                  <th className="px-3 py-2.5 font-medium">Equipe</th>
                  <th className="px-3 py-2.5 text-right font-medium">Meta</th>
                  <th className="px-3 py-2.5 text-right font-medium">Realizado</th>
                  <th className="px-3 py-2.5 text-right font-medium">%</th>
                  <th className="py-2.5 pl-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-muted-foreground">
                      Carregando...
                    </td>
                  </tr>
                )}
                {!isLoading && doMes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-muted-foreground">
                      Nenhum resultado lançado nesta competência.
                    </td>
                  </tr>
                )}
                {doMes.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-sand/40">
                    <td className="py-3 pr-3 font-medium">{r.indicators?.nome}</td>
                    <td className="px-3 py-3 text-muted-foreground">{r.teams?.nome ?? "—"}</td>
                    <td className="px-3 py-3 text-right font-mono text-[13px]">{num(r.valor_meta)}</td>
                    <td className="px-3 py-3 text-right font-mono text-[13px]">{num(r.valor_realizado)}</td>
                    <td className="px-3 py-3 text-right font-mono text-[12px]">{num(r.percentual)}%</td>
                    <td className="py-3 pl-3">
                      <StatusBadge status={statusDoResultado(r)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Painel>

        <Painel titulo="Destaques automáticos" descricao="identificados a partir dos lançamentos">
          <div className="flex flex-col gap-3">
            <Destaque
              tom="success"
              rotulo="Maior evolução"
              texto={
                destaques.evolucao
                  ? `${destaques.evolucao.nome} · ${destaques.evolucao.variacao >= 0 ? "+" : ""}${num(destaques.evolucao.variacao)} pp`
                  : "sem comparativo"
              }
            />
            <Destaque
              tom="warning"
              rotulo="Maior queda"
              texto={destaques.queda ? `${destaques.queda.nome} · ${num(destaques.queda.variacao)} pp` : "sem comparativo"}
            />
            <Destaque
              tom="destructive"
              rotulo="Indicador crítico"
              texto={
                destaques.critico
                  ? `${destaques.critico.indicators?.nome} · ${num(destaques.critico.percentual)}% da meta`
                  : "nenhum indicador crítico"
              }
            />
            <Destaque
              tom="success"
              rotulo="Melhor resultado"
              texto={destaques.melhor ? `${destaques.melhor.indicators?.nome} · ${num(destaques.melhor.percentual)}%` : "—"}
            />
            <div className="pt-2">
              <Pill tone="info">{indicadores.length} indicadores cadastrados</Pill>
            </div>
          </div>
        </Painel>
      </section>
    </AppShell>
  );
}

function Destaque({ tom, rotulo, texto }: { tom: "success" | "warning" | "destructive"; rotulo: string; texto: string }) {
  const borda = { success: "border-success", warning: "border-warning", destructive: "border-destructive" }[tom];
  const icone = { success: "↑", warning: "⚠", destructive: "✕" }[tom];
  const cor = { success: "text-success", warning: "text-warning", destructive: "text-destructive" }[tom];
  return (
    <div className={`flex items-start gap-3 border-l-2 ${borda} bg-sand/40 p-3`}>
      <span className={`font-bold ${cor}`} aria-hidden>
        {icone}
      </span>
      <div>
        <p className="text-sm font-semibold">{rotulo}</p>
        <p className="font-mono text-[11px] text-muted-foreground">{texto}</p>
      </div>
    </div>
  );
}
