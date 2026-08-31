import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { AppShell, Painel } from "@/components/AppShell";
import { Pill } from "@/components/StatusBadge";
import { FormDialog } from "@/components/FormDialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { registrarAuditoria, useIndicadores, useTabela } from "@/lib/dados";
import { num } from "@/lib/perf";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/metas")({
  head: () => ({
    meta: [
      { title: "Metas · Ritmo" },
      { name: "description", content: "Definição de metas por indicador, período, equipe ou colaborador, com peso e prioridade." },
      { property: "og:title", content: "Metas · Ritmo" },
      { property: "og:description", content: "Planejamento e acompanhamento das metas da operação." },
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
  indicators: { nome: string } | null;
  teams: { nome: string } | null;
  employees: { nome: string } | null;
}

function Metas() {
  const qc = useQueryClient();
  const { podeGerenciar } = useAuth();
  const { data: metas = [], isLoading } = useTabela<MetaRow>(
    "goals",
    "id, titulo, valor_meta, peso, prioridade, status, periodicidade, periodo_inicio, periodo_fim, tipo_responsavel, indicators(nome), teams(nome), employees(nome)",
    "periodo_inicio",
  );
  const { data: indicadores = [] } = useIndicadores();
  const { data: equipes = [] } = useTabela<Opcao>("teams", "id, nome", "nome");
  const { data: colaboradores = [] } = useTabela<Opcao>("employees", "id, nome", "nome");
  const { data: departamentos = [] } = useTabela<Opcao>("departments", "id, nome", "nome");

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
            { value: "colaborador", label: "Colaborador" },
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

  return (
    <AppShell titulo="Metas" breadcrumb="02 · Performance" acoes={nova}>
      <Painel titulo="Metas cadastradas" descricao={`${metas.length} metas`}>
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
                <th className="py-2.5 pl-3 font-medium">Prioridade</th>
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
              {!isLoading && metas.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-muted-foreground">
                    Nenhuma meta cadastrada ainda.
                  </td>
                </tr>
              )}
              {metas.map((m) => (
                <tr key={m.id} className="transition-colors hover:bg-sand/40">
                  <td className="py-3 pr-3 font-medium">{m.titulo}</td>
                  <td className="px-3 py-3 text-muted-foreground">{m.indicators?.nome ?? "—"}</td>
                  <td className="px-3 py-3 text-muted-foreground">{m.teams?.nome ?? m.employees?.nome ?? "—"}</td>
                  <td className="px-3 py-3 font-mono text-[11px] text-muted-foreground">
                    {new Date(m.periodo_inicio).toLocaleDateString("pt-BR")} — {new Date(m.periodo_fim).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-[13px]">{num(m.valor_meta)}</td>
                  <td className="px-3 py-3 text-right font-mono text-[13px]">{m.peso}</td>
                  <td className="py-3 pl-3">
                    <Pill tone={m.prioridade === "alta" ? "destructive" : m.prioridade === "media" ? "warning" : "info"}>
                      {m.prioridade}
                    </Pill>
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
