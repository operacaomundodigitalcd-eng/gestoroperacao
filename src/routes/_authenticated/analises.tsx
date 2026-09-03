import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { AppShell, Painel } from "@/components/AppShell";
import { FormDialog } from "@/components/FormDialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { registrarAuditoria, useIndicadores, useTabela } from "@/lib/dados";
import { MESES, anosDisponiveis } from "@/lib/perf";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/analises")({
  head: () => ({
    meta: [
      { title: "Análises · Ritmo" },
      { name: "description", content: "Análises mensais por indicador com causa, impacto, pontos positivos e negativos e ações propostas." },
      { property: "og:title", content: "Análises · Ritmo" },
      { property: "og:description", content: "Registro estruturado de análises críticas de performance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Analises,
});

interface AnaliseRow {
  id: string;
  ano: number;
  mes: number;
  analise: string | null;
  causa: string | null;
  impacto: string | null;
  pontos_positivos: string | null;
  pontos_negativos: string | null;
  acoes: string | null;
  justificativa: string | null;
  indicators: { nome: string } | null;
}

function Analises() {
  const qc = useQueryClient();
  const hoje = new Date();
  const { can } = useAuth();
  const podeLancar = can("analyses.create");
  const { data: analises = [], isLoading } = useTabela<AnaliseRow>(
    "analyses",
    "id, ano, mes, analise, causa, impacto, pontos_positivos, pontos_negativos, acoes, justificativa, indicators(nome)",
    "created_at",
  );
  const { data: indicadores = [] } = useIndicadores();

  return (
    <AppShell
      titulo="Análises"
      breadcrumb="04 · Gestão"
      acoes={
        <FormDialog
          titulo="Nova análise"
          descricao="Estrutura orientada a causa, impacto e plano de resposta — pronta para leitura executiva."
          gatilho={
            <Button size="sm" disabled={!podeLancar}>
              <Plus className="size-4" /> Nova análise
            </Button>
          }
          valoresIniciais={{ ano: String(hoje.getFullYear()), mes: String(hoje.getMonth() + 1) }}
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
            { name: "analise", label: "Análise do resultado", tipo: "textarea" },
            { name: "causa", label: "Causa identificada", tipo: "textarea" },
            { name: "impacto", label: "Impacto no negócio", tipo: "textarea" },
            { name: "pontos_positivos", label: "Pontos positivos", tipo: "textarea" },
            { name: "pontos_negativos", label: "Pontos de atenção", tipo: "textarea" },
            { name: "acoes", label: "Ações propostas", tipo: "textarea" },
            { name: "justificativa", label: "Justificativa do desvio", tipo: "textarea" },
          ]}
          onSubmit={async (v) => {
            const { error } = await supabase.from("analyses").insert({
              indicator_id: v.req("indicator_id"),
              ano: v.num("ano", hoje.getFullYear()),
              mes: v.num("mes", hoje.getMonth() + 1),
              analise: v.txt("analise"),
              causa: v.txt("causa"),
              impacto: v.txt("impacto"),
              pontos_positivos: v.txt("pontos_positivos"),
              pontos_negativos: v.txt("pontos_negativos"),
              acoes: v.txt("acoes"),
              justificativa: v.txt("justificativa"),
            });
            if (error) throw error;
            await registrarAuditoria({ operacao: "criar", tabela: "analyses", descricao: "Análise registrada" });
            await qc.invalidateQueries({ queryKey: ["tabela", "analyses"] });
            toast.success("Análise registrada.");
          }}
        />
      }
    >
      {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
      {!isLoading && analises.length === 0 && (
        <Painel titulo="Nenhuma análise registrada" descricao="registre a leitura crítica dos resultados do mês">
          <p className="text-sm text-muted-foreground">
            As análises alimentam as apresentações executivas e os planos de ação vinculados aos indicadores.
          </p>
        </Painel>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {analises.map((a) => (
          <Painel key={a.id} titulo={a.indicators?.nome ?? "Indicador"} descricao={`${MESES[a.mes - 1]}/${a.ano}`}>
            <dl className="space-y-2.5 text-sm">
              {[
                ["Análise", a.analise],
                ["Causa", a.causa],
                ["Impacto", a.impacto],
                ["Pontos positivos", a.pontos_positivos],
                ["Pontos de atenção", a.pontos_negativos],
                ["Ações propostas", a.acoes],
              ]
                .filter(([, valor]) => valor)
                .map(([rotulo, valor]) => (
                  <div key={rotulo as string}>
                    <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{rotulo}</dt>
                    <dd>{valor}</dd>
                  </div>
                ))}
            </dl>
          </Painel>
        ))}
      </div>
    </AppShell>
  );
}
