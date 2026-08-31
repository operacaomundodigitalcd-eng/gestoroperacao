import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { AppShell, Painel } from "@/components/AppShell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calcularScore, useIndicadores, useResultados } from "@/lib/dados";
import { MESES_CURTOS, anosDisponiveis, num } from "@/lib/perf";

export const Route = createFileRoute("/_authenticated/comparativos")({
  head: () => ({
    meta: [
      { title: "Comparativos · Ritmo" },
      { name: "description", content: "Comparativos mês a mês, ano contra ano e entre equipes com variação percentual e tendência." },
      { property: "og:title", content: "Comparativos · Ritmo" },
      { property: "og:description", content: "Análise comparativa de performance entre períodos e equipes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Comparativos,
});

function Comparativos() {
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const anoAnterior = ano - 1;
  const [indicadorId, setIndicadorId] = useState("todos");

  const { data: indicadores = [] } = useIndicadores();
  const { data: atual = [] } = useResultados(ano);
  const { data: passado = [] } = useResultados(anoAnterior);

  const filtrar = (rs: typeof atual) => (indicadorId === "todos" ? rs : rs.filter((r) => r.indicator_id === indicadorId));

  const serie = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const a = filtrar(atual).filter((r) => r.mes === i + 1);
        const b = filtrar(passado).filter((r) => r.mes === i + 1);
        return {
          mes: MESES_CURTOS[i],
          [String(ano)]: a.length ? calcularScore(a) : null,
          [String(anoAnterior)]: b.length ? calcularScore(b) : null,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [atual, passado, indicadorId, ano],
  );

  const porEquipe = useMemo(() => {
    const mapa = new Map<string, { atual: typeof atual; passado: typeof atual }>();
    filtrar(atual).forEach((r) => {
      const k = r.teams?.nome ?? "Sem equipe";
      const e = mapa.get(k) ?? { atual: [], passado: [] };
      e.atual.push(r);
      mapa.set(k, e);
    });
    filtrar(passado).forEach((r) => {
      const k = r.teams?.nome ?? "Sem equipe";
      const e = mapa.get(k) ?? { atual: [], passado: [] };
      e.passado.push(r);
      mapa.set(k, e);
    });
    return [...mapa.entries()].map(([equipe, v]) => {
      const a = calcularScore(v.atual);
      const b = calcularScore(v.passado);
      return { equipe, atual: a, passado: b, variacao: b ? Math.round((a - b) * 10) / 10 : 0 };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atual, passado, indicadorId]);

  return (
    <AppShell
      titulo="Comparativos"
      breadcrumb="02 · Performance"
      acoes={
        <>
          <Select value={indicadorId} onValueChange={setIndicadorId}>
            <SelectTrigger className="h-9 w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os indicadores</SelectItem>
              {indicadores.map((i) => (
                <SelectItem key={i.id} value={i.id}>
                  {i.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        </>
      }
    >
      <Painel titulo={`${ano} × ${anoAnterior}`} descricao="score ponderado mês a mês">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={serie} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <RTooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey={String(anoAnterior)} fill="var(--muted-foreground)" radius={[2, 2, 0, 0]} />
              <Bar dataKey={String(ano)} fill="var(--primary)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Painel>

      <Painel titulo="Comparativo entre equipes" descricao={`variação de ${anoAnterior} para ${ano}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5 pr-3 font-medium">Equipe</th>
                <th className="px-3 py-2.5 text-right font-medium">{anoAnterior}</th>
                <th className="px-3 py-2.5 text-right font-medium">{ano}</th>
                <th className="py-2.5 pl-3 text-right font-medium">Variação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {porEquipe.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted-foreground">
                    Sem dados para comparar.
                  </td>
                </tr>
              )}
              {porEquipe.map((e) => (
                <tr key={e.equipe} className="transition-colors hover:bg-sand/40">
                  <td className="py-3 pr-3 font-medium">{e.equipe}</td>
                  <td className="px-3 py-3 text-right font-mono text-[13px] text-muted-foreground">{num(e.passado)}</td>
                  <td className="px-3 py-3 text-right font-mono text-[13px]">{num(e.atual)}</td>
                  <td
                    className={`py-3 pl-3 text-right font-mono text-[13px] ${e.variacao >= 0 ? "text-success" : "text-destructive"}`}
                  >
                    {e.variacao >= 0 ? "▲" : "▼"} {num(Math.abs(e.variacao))} pts
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Painel>
    </AppShell>
  );
}
