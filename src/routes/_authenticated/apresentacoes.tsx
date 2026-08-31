import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Printer } from "lucide-react";
import { AppShell, Painel } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { FormDialog } from "@/components/FormDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { calcularScore, statusDoResultado, useResultados, useTabela } from "@/lib/dados";
import { MESES, anosDisponiveis, num } from "@/lib/perf";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/apresentacoes")({
  head: () => ({
    meta: [
      { title: "Apresentações · Ritmo" },
      { name: "description", content: "Modo apresentação executiva com capa, painel de resultados, destaques e ações para reuniões mensais." },
      { property: "og:title", content: "Apresentações · Ritmo" },
      { property: "og:description", content: "Slides executivos gerados a partir dos resultados do período." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Apresentacoes,
});

interface ApresentacaoRow {
  id: string;
  titulo: string;
  descricao: string | null;
  ano: number | null;
  mes: number | null;
}

function Apresentacoes() {
  const qc = useQueryClient();
  const hoje = new Date();
  const { podeGerenciar } = useAuth();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const { data: resultados = [] } = useResultados(ano);
  const { data: salvas = [] } = useTabela<ApresentacaoRow>("presentations", "id, titulo, descricao, ano, mes", "created_at");

  const doMes = useMemo(() => resultados.filter((r) => r.mes === mes), [resultados, mes]);
  const score = calcularScore(doMes);
  const criticos = doMes.filter((r) => statusDoResultado(r) === "nao_atingida");
  const destaques = [...doMes].sort((a, b) => (b.percentual ?? 0) - (a.percentual ?? 0)).slice(0, 3);

  return (
    <AppShell
      titulo="Apresentações"
      breadcrumb="05 · Apresentações"
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
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="size-4" /> Exportar / imprimir
          </Button>
          <FormDialog
            titulo="Salvar apresentação"
            gatilho={
              <Button size="sm" disabled={!podeGerenciar}>
                <Plus className="size-4" /> Salvar
              </Button>
            }
            valoresIniciais={{ titulo: `Reunião de resultados · ${MESES[mes - 1]}/${ano}` }}
            campos={[
              { name: "titulo", label: "Título", obrigatorio: true, colSpan: 2 },
              { name: "descricao", label: "Descrição", tipo: "textarea" },
            ]}
            onSubmit={async (v) => {
              const { error } = await supabase.from("presentations").insert({
                titulo: v.req("titulo"),
                descricao: v.txt("descricao"),
                ano,
                mes,
                filtros: { ano, mes } as never,
              });
              if (error) throw error;
              await qc.invalidateQueries({ queryKey: ["tabela", "presentations"] });
              toast.success("Apresentação salva.");
            }}
          />
        </>
      }
    >
      <section className="flex min-h-56 flex-col justify-between bg-primary p-8 text-primary-foreground">
        <p className="font-mono text-[11px] uppercase tracking-wider opacity-70">Slide 01 · Capa</p>
        <div>
          <h2 className="font-display text-4xl font-bold tracking-tight">Reunião de Resultados</h2>
          <p className="mt-2 font-mono text-sm opacity-80">
            {MESES[mes - 1]} de {ano} · score consolidado {num(score)}%
          </p>
        </div>
      </section>

      <Painel titulo="Slide 02 · Painel de resultados" descricao={`${doMes.length} indicadores apurados`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5 pr-3 font-medium">Indicador</th>
                <th className="px-3 py-2.5 text-right font-medium">Meta</th>
                <th className="px-3 py-2.5 text-right font-medium">Realizado</th>
                <th className="px-3 py-2.5 text-right font-medium">%</th>
                <th className="py-2.5 pl-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {doMes.map((r) => (
                <tr key={r.id}>
                  <td className="py-3 pr-3 font-medium">{r.indicators?.nome}</td>
                  <td className="px-3 py-3 text-right font-mono text-[13px]">{num(r.valor_meta)}</td>
                  <td className="px-3 py-3 text-right font-mono text-[13px]">{num(r.valor_realizado)}</td>
                  <td className="px-3 py-3 text-right font-mono text-[12px]">{num(r.percentual)}%</td>
                  <td className="py-3 pl-3">
                    <StatusBadge status={statusDoResultado(r)} />
                  </td>
                </tr>
              ))}
              {doMes.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground">
                    Sem dados nesta competência.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Painel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Painel titulo="Slide 03 · Destaques" descricao="melhores resultados do período">
          <ul className="divide-y divide-border text-sm">
            {destaques.map((d) => (
              <li key={d.id} className="flex items-center justify-between py-2.5">
                <span className="font-medium">{d.indicators?.nome}</span>
                <span className="font-mono text-[12px]">{num(d.percentual)}%</span>
              </li>
            ))}
            {destaques.length === 0 && <li className="py-2.5 text-muted-foreground">Sem dados.</li>}
          </ul>
        </Painel>

        <Painel titulo="Slide 04 · Pontos de atenção" descricao={`${criticos.length} indicadores críticos`}>
          <ul className="divide-y divide-border text-sm">
            {criticos.map((c) => (
              <li key={c.id} className="py-2.5">
                <p className="font-medium">{c.indicators?.nome}</p>
                <p className="font-mono text-[11px] text-muted-foreground">{c.justificativa ?? "sem justificativa registrada"}</p>
              </li>
            ))}
            {criticos.length === 0 && <li className="py-2.5 text-muted-foreground">Nenhum indicador crítico.</li>}
          </ul>
        </Painel>
      </div>

      <Painel titulo="Apresentações salvas" descricao={`${salvas.length} registros`}>
        <ul className="divide-y divide-border text-sm">
          {salvas.map((a) => (
            <li key={a.id} className="flex items-center justify-between py-2.5">
              <span className="font-medium">{a.titulo}</span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {a.mes ? `${MESES[a.mes - 1]}/${a.ano}` : a.ano}
              </span>
            </li>
          ))}
          {salvas.length === 0 && <li className="py-2.5 text-muted-foreground">Nenhuma apresentação salva.</li>}
        </ul>
      </Painel>
    </AppShell>
  );
}
