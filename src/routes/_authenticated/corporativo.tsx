import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { AppShell, Painel } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calcularScore, useIndicadores, useResultados } from "@/lib/dados";
import { MESES, anosDisponiveis, calcularPercentual, num, statusPorPercentual } from "@/lib/perf";

export const Route = createFileRoute("/_authenticated/corporativo")({
  head: () => ({
    meta: [
      { title: "Indicadores Corporativos · Ritmo" },
      { name: "description", content: "Painel corporativo com gráfico de meta versus realizado por indicador e score ponderado da empresa." },
      { property: "og:title", content: "Indicadores Corporativos · Ritmo" },
      { property: "og:description", content: "Meta x realizado por indicador e score ponderado consolidado da empresa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Corporativo,
});

function Corporativo() {
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState<string>("todos");

  const { data: indicadores = [] } = useIndicadores();
  const { data: resultados = [] } = useResultados(ano);

  const filtrados = useMemo(
    () => (mes === "todos" ? resultados : resultados.filter((r) => r.mes === Number(mes))),
    [resultados, mes],
  );

  const linhas = useMemo(
    () =>
      indicadores
        .map((i) => {
          const rs = filtrados.filter((r) => r.indicator_id === i.id);
          const meta = rs.length ? rs.reduce((a, r) => a + r.valor_meta, 0) / rs.length : (i.meta_padrao ?? 0);
          const realizado = rs.length ? rs.reduce((a, r) => a + r.valor_realizado, 0) / rs.length : 0;
          const percentual = rs.length ? calcularPercentual(i.direcao, realizado, meta) : null;
          return {
            id: i.id,
            nome: i.nome,
            codigo: i.codigo,
            equipe: i.teams?.nome ?? i.departments?.nome ?? "Corporativo",
            unidade: i.measure_units?.simbolo ?? "",
            peso: i.peso,
            lancamentos: rs.length,
            meta,
            realizado,
            percentual,
          };
        })
        .sort((a, b) => (b.percentual ?? -1) - (a.percentual ?? -1)),
    [indicadores, filtrados],
  );

  const comDados = linhas.filter((l) => l.lancamentos > 0);
  const scorePonderado = calcularScore(filtrados);
  const somaPesos = comDados.reduce((a, l) => a + l.peso, 0);
  const acima = comDados.filter((l) => (l.percentual ?? 0) >= 100).length;

  const dadosGrafico = comDados.map((l) => ({
    nome: l.codigo ?? l.nome.slice(0, 14),
    Meta: Math.round(l.meta * 100) / 100,
    Realizado: Math.round(l.realizado * 100) / 100,
  }));

  return (
    <AppShell
      titulo="Indicadores Corporativos"
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
          <Select value={mes} onValueChange={setMes}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Ano completo</SelectItem>
              {MESES.map((m, i) => (
                <SelectItem key={m} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      }
    >
      <section className="flex flex-wrap items-center gap-4 bg-primary p-5 text-primary-foreground">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider opacity-80">
            Score ponderado da empresa · {mes === "todos" ? `Ano ${ano}` : `${MESES[Number(mes) - 1]}/${ano}`}
          </p>
          <p className="font-display text-4xl font-bold tracking-tight">{num(scorePonderado)}%</p>
        </div>
        <div className="ml-auto flex flex-wrap gap-2 font-mono text-[11px]">
          <span className="rounded-full bg-background px-3 py-1 text-foreground">{comDados.length} indicadores medidos</span>
          <span className="rounded-full bg-background px-3 py-1 text-foreground">Soma de pesos {num(somaPesos)}</span>
          <span className="rounded-full bg-background px-3 py-1 text-foreground">{acima} acima da meta</span>
          <span className="rounded-full bg-background px-3 py-1 text-foreground">{filtrados.length} lançamentos</span>
        </div>
      </section>

      <Painel titulo="Meta x Realizado por indicador" descricao="média do período selecionado, em unidade do indicador">
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosGrafico} margin={{ bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="nome" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <RTooltip />
              <Legend />
              <Bar dataKey="Meta" fill="hsl(var(--muted-foreground))" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Realizado" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {dadosGrafico.length === 0 && <p className="text-sm text-muted-foreground">Nenhum lançamento no período selecionado.</p>}
      </Painel>

      <Painel titulo="Composição do score" descricao={`${linhas.length} indicadores · contribuição ponderada`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5 pr-3 font-medium">Indicador</th>
                <th className="px-3 py-2.5 font-medium">Responsável</th>
                <th className="px-3 py-2.5 text-right font-medium">Meta</th>
                <th className="px-3 py-2.5 text-right font-medium">Realizado</th>
                <th className="px-3 py-2.5 text-right font-medium">%</th>
                <th className="px-3 py-2.5 text-right font-medium">Peso</th>
                <th className="py-2.5 pl-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {linhas.map((l) => (
                <tr key={l.id} className="transition-colors hover:bg-sand/40">
                  <td className="py-3 pr-3 font-medium">
                    {l.nome}
                    {l.codigo && <span className="ml-2 font-mono text-[10px] text-muted-foreground">{l.codigo}</span>}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{l.equipe}</td>
                  <td className="px-3 py-3 text-right font-mono text-[12px]">
                    {num(l.meta)} {l.unidade}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-[12px]">
                    {l.lancamentos ? `${num(l.realizado)} ${l.unidade}` : "—"}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-[12px]">{l.percentual === null ? "—" : `${num(l.percentual)}%`}</td>
                  <td className="px-3 py-3 text-right font-mono text-[12px]">{num(l.peso)}</td>
                  <td className="py-3 pl-3">
                    {l.percentual === null ? (
                      <span className="font-mono text-[11px] text-muted-foreground">Sem lançamento</span>
                    ) : (
                      <StatusBadge status={statusPorPercentual(l.percentual)} />
                    )}
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
