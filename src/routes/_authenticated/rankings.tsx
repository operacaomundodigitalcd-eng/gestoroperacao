import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, Painel } from "@/components/AppShell";
import { Pill } from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calcularScore, useResultados, type ResultadoRow } from "@/lib/dados";
import { MESES, anosDisponiveis, num } from "@/lib/perf";

export const Route = createFileRoute("/_authenticated/rankings")({
  head: () => ({
    meta: [
      { title: "Rankings · Ritmo" },
      { name: "description", content: "Ranking de equipes e colaboradores por score ponderado, com pódio e evolução de posições." },
      { property: "og:title", content: "Rankings · Ritmo" },
      { property: "og:description", content: "Classificação de performance por equipe e colaborador." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Rankings,
});

function agrupar(resultados: ResultadoRow[], chave: (r: ResultadoRow) => string) {
  const mapa = new Map<string, ResultadoRow[]>();
  resultados.forEach((r) => {
    const k = chave(r);
    mapa.set(k, [...(mapa.get(k) ?? []), r]);
  });
  return [...mapa.entries()].map(([nome, rs]) => ({ nome, score: calcularScore(rs), itens: rs.length })).sort((a, b) => b.score - a.score);
}

function Rankings() {
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const { data: resultados = [] } = useResultados(ano);

  const doMes = useMemo(() => resultados.filter((r) => r.mes === mes), [resultados, mes]);
  const anterior = useMemo(() => resultados.filter((r) => r.mes === mes - 1), [resultados, mes]);

  const equipes = useMemo(() => agrupar(doMes, (r) => r.teams?.nome ?? "Sem equipe"), [doMes]);
  const equipesAntes = useMemo(() => agrupar(anterior, (r) => r.teams?.nome ?? "Sem equipe"), [anterior]);
  const pessoas = useMemo(() => agrupar(doMes.filter((r) => r.employees?.nome), (r) => r.employees?.nome ?? "—"), [doMes]);

  const posicaoAntes = (nome: string) => equipesAntes.findIndex((e) => e.nome === nome);

  return (
    <AppShell
      titulo="Rankings"
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
        </>
      }
    >
      <section className="grid gap-4 sm:grid-cols-3">
        {equipes.slice(0, 3).map((e, i) => (
          <div key={e.nome} className={`p-5 ${i === 0 ? "bg-primary text-primary-foreground" : "bg-card ring-1 ring-border"}`}>
            <p className="font-mono text-[11px] uppercase tracking-wider opacity-70">{i + 1}º lugar</p>
            <p className="mt-2 font-display text-xl font-bold tracking-tight">{e.nome}</p>
            <p className="mt-1 font-display text-4xl font-bold leading-none">{num(e.score)}%</p>
          </div>
        ))}
        {equipes.length === 0 && <p className="text-sm text-muted-foreground">Sem resultados no período selecionado.</p>}
      </section>

      <Tabs defaultValue="equipes">
        <TabsList>
          <TabsTrigger value="equipes">Equipes</TabsTrigger>
          <TabsTrigger value="pessoas">Colaboradores</TabsTrigger>
        </TabsList>

        <TabsContent value="equipes">
          <Painel titulo="Ranking de equipes" descricao="score ponderado pelos pesos dos indicadores">
            <ol className="divide-y divide-border">
              {equipes.map((e, i) => {
                const antes = posicaoAntes(e.nome);
                const variacao = antes < 0 ? 0 : antes - i;
                return (
                  <li key={e.nome} className="flex items-center gap-4 py-3">
                    <span className="w-6 font-display text-lg font-bold">{i + 1}</span>
                    <div className="flex-1">
                      <p className="font-medium">{e.nome}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">{e.itens} indicadores apurados</p>
                    </div>
                    <Pill tone={variacao > 0 ? "success" : variacao < 0 ? "destructive" : "info"}>
                      {variacao > 0 ? `▲ ${variacao}` : variacao < 0 ? `▼ ${Math.abs(variacao)}` : "="}
                    </Pill>
                    <span className="w-16 text-right font-mono text-sm">{num(e.score)}%</span>
                  </li>
                );
              })}
              {equipes.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">Sem dados.</li>}
            </ol>
          </Painel>
        </TabsContent>

        <TabsContent value="pessoas">
          <Painel titulo="Ranking de colaboradores" descricao="apenas indicadores com responsável individual">
            <ol className="divide-y divide-border">
              {pessoas.map((p, i) => (
                <li key={p.nome} className="flex items-center gap-4 py-3">
                  <span className="w-6 font-display text-lg font-bold">{i + 1}</span>
                  <span className="flex-1 font-medium">{p.nome}</span>
                  <span className="font-mono text-sm">{num(p.score)}%</span>
                </li>
              ))}
              {pessoas.length === 0 && (
                <li className="py-6 text-center text-sm text-muted-foreground">
                  Nenhum resultado vinculado a colaborador neste período.
                </li>
              )}
            </ol>
          </Painel>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
