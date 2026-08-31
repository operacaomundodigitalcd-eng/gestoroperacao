import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { AppShell, Painel } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { statusDoResultado, useResultados } from "@/lib/dados";
import { MESES, STATUS_INFO, anosDisponiveis, num } from "@/lib/perf";

export const Route = createFileRoute("/_authenticated/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios · Ritmo" },
      { name: "description", content: "Exportação de resultados em CSV com filtros por ano e mês para relatórios gerenciais." },
      { property: "og:title", content: "Relatórios · Ritmo" },
      { property: "og:description", content: "Relatórios e exportações da base de resultados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Relatorios,
});

function Relatorios() {
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(0);
  const { data: resultados = [] } = useResultados(ano);

  const lista = useMemo(() => (mes === 0 ? resultados : resultados.filter((r) => r.mes === mes)), [resultados, mes]);

  const exportar = () => {
    const linhas = [
      ["Ano", "Mes", "Indicador", "Equipe", "Meta", "Realizado", "Percentual", "Status", "Justificativa"],
      ...lista.map((r) => [
        r.ano,
        r.mes,
        r.indicators?.nome ?? "",
        r.teams?.nome ?? "",
        r.valor_meta,
        r.valor_realizado,
        r.percentual ?? "",
        STATUS_INFO[statusDoResultado(r)].label,
        (r.justificativa ?? "").replace(/[\n;]/g, " "),
      ]),
    ];
    const csv = linhas.map((l) => l.join(";")).join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `resultados-${ano}${mes ? `-${mes}` : ""}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell
      titulo="Relatórios"
      breadcrumb="06 · Relatórios"
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
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Ano completo</SelectItem>
              {MESES.map((m, i) => (
                <SelectItem key={m} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={exportar}>
            <Download className="size-4" /> Exportar CSV
          </Button>
        </>
      }
    >
      <Painel titulo="Base de resultados" descricao={`${lista.length} registros no filtro atual`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5 pr-3 font-medium">Competência</th>
                <th className="px-3 py-2.5 font-medium">Indicador</th>
                <th className="px-3 py-2.5 font-medium">Equipe</th>
                <th className="px-3 py-2.5 text-right font-medium">Meta</th>
                <th className="px-3 py-2.5 text-right font-medium">Realizado</th>
                <th className="py-2.5 pl-3 text-right font-medium">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lista.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-sand/40">
                  <td className="py-3 pr-3 font-mono text-[11px]">
                    {MESES[r.mes - 1]}/{r.ano}
                  </td>
                  <td className="px-3 py-3 font-medium">{r.indicators?.nome}</td>
                  <td className="px-3 py-3 text-muted-foreground">{r.teams?.nome ?? "—"}</td>
                  <td className="px-3 py-3 text-right font-mono text-[13px]">{num(r.valor_meta)}</td>
                  <td className="px-3 py-3 text-right font-mono text-[13px]">{num(r.valor_realizado)}</td>
                  <td className="py-3 pl-3 text-right font-mono text-[12px]">{num(r.percentual)}%</td>
                </tr>
              ))}
              {lista.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground">
                    Nenhum resultado no filtro selecionado.
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
