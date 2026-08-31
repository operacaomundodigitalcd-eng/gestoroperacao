import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { AppShell, Painel } from "@/components/AppShell";
import { Pill } from "@/components/StatusBadge";
import { FormDialog } from "@/components/FormDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { registrarAuditoria, useIndicadores, useTabela } from "@/lib/dados";
import { ACTION_STATUS_LABEL } from "@/lib/perf";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/planos-de-acao")({
  head: () => ({
    meta: [
      { title: "Planos de Ação · Ritmo" },
      { name: "description", content: "Planos de ação 5W2H com responsável, prazo, prioridade, evidência e acompanhamento de status." },
      { property: "og:title", content: "Planos de Ação · Ritmo" },
      { property: "og:description", content: "Acompanhamento das ações corretivas por indicador." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Planos,
});

interface PlanoRow {
  id: string;
  o_que: string;
  por_que: string | null;
  quem: string | null;
  como: string | null;
  prazo: string | null;
  prioridade: string;
  status: string;
  comentario: string | null;
  indicators: { nome: string } | null;
  teams: { nome: string } | null;
}

const COLUNAS = ["pendente", "em_andamento", "concluida", "atrasada"] as const;

function Planos() {
  const qc = useQueryClient();
  const { podeLancar } = useAuth();
  const [filtro, setFiltro] = useState("todos");
  const { data: planos = [], isLoading } = useTabela<PlanoRow>(
    "action_plans",
    "id, o_que, por_que, quem, como, prazo, prioridade, status, comentario, indicators(nome), teams(nome)",
    "prazo",
  );
  const { data: indicadores = [] } = useIndicadores();
  const { data: equipes = [] } = useTabela<{ id: string; nome: string }>("teams", "id, nome", "nome");

  const lista = useMemo(() => (filtro === "todos" ? planos : planos.filter((p) => p.status === filtro)), [planos, filtro]);

  const atualizarStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("action_plans")
      .update({ status: status as never, data_conclusao: status === "concluida" ? new Date().toISOString().slice(0, 10) : null })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }

    await registrarAuditoria({ operacao: "atualizar", tabela: "action_plans", registro_id: id, descricao: `Status alterado para ${status}` });
    await qc.invalidateQueries({ queryKey: ["tabela", "action_plans"] });
    toast.success("Status atualizado.");
  };

  return (
    <AppShell
      titulo="Planos de Ação"
      breadcrumb="04 · Gestão"
      acoes={
        <>
          <Select value={filtro} onValueChange={setFiltro}>
            <SelectTrigger className="h-9 w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {COLUNAS.map((c) => (
                <SelectItem key={c} value={c}>
                  {ACTION_STATUS_LABEL[c] ?? c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDialog
            titulo="Novo plano de ação"
            descricao="Estrutura 5W2H: o que, por que, quem, quando e como."
            gatilho={
              <Button size="sm" disabled={!podeLancar}>
                <Plus className="size-4" /> Novo plano
              </Button>
            }
            campos={[
              { name: "o_que", label: "O que será feito", obrigatorio: true, colSpan: 2 },
              { name: "por_que", label: "Por que", tipo: "textarea" },
              { name: "como", label: "Como", tipo: "textarea" },
              { name: "quem", label: "Responsável" },
              { name: "prazo", label: "Prazo", tipo: "data" },
              { name: "indicator_id", label: "Indicador", tipo: "select", opcoes: indicadores.map((i) => ({ value: i.id, label: i.nome })) },
              { name: "team_id", label: "Equipe", tipo: "select", opcoes: equipes.map((e) => ({ value: e.id, label: e.nome })) },
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
              { name: "evidencia", label: "Evidência / link", colSpan: 2 },
            ]}
            onSubmit={async (v) => {
              const oQue = v.req("o_que");
              const { error } = await supabase.from("action_plans").insert({
                o_que: oQue,
                por_que: v.txt("por_que"),
                como: v.txt("como"),
                quem: v.txt("quem"),
                prazo: v.txt("prazo"),
                indicator_id: v.txt("indicator_id"),
                team_id: v.txt("team_id"),
                prioridade: v.txt("prioridade") ?? "media",
                evidencia: v.txt("evidencia"),
              });
              if (error) throw error;
              await registrarAuditoria({ operacao: "criar", tabela: "action_plans", descricao: `Plano criado: ${oQue}` });
              await qc.invalidateQueries({ queryKey: ["tabela", "action_plans"] });
              toast.success("Plano de ação criado.");
            }}
          />
        </>
      }
    >
      {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        {lista.map((p) => {
          const atrasado = p.prazo && p.status !== "concluida" && new Date(p.prazo) < new Date();
          return (
            <Painel
              key={p.id}
              titulo={p.o_que}
              descricao={`${p.indicators?.nome ?? "sem indicador"} · ${p.teams?.nome ?? "sem equipe"}`}
              acoes={
                <Pill tone={p.status === "concluida" ? "success" : atrasado ? "destructive" : "warning"}>
                  {atrasado && p.status !== "concluida" ? "Atrasada" : (ACTION_STATUS_LABEL[p.status] ?? p.status)}
                </Pill>
              }
            >
              <div className="space-y-2 text-sm">
                {p.por_que && (
                  <p>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Por que · </span>
                    {p.por_que}
                  </p>
                )}
                {p.como && (
                  <p>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Como · </span>
                    {p.como}
                  </p>
                )}
                <p className="font-mono text-[11px] text-muted-foreground">
                  Responsável: {p.quem ?? "—"} · Prazo: {p.prazo ? new Date(p.prazo).toLocaleDateString("pt-BR") : "—"} ·
                  Prioridade: {p.prioridade}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {COLUNAS.filter((c) => c !== p.status).map((c) => (
                  <Button key={c} size="sm" variant="outline" disabled={!podeLancar} onClick={() => void atualizarStatus(p.id, c)}>
                    {ACTION_STATUS_LABEL[c] ?? c}
                  </Button>
                ))}
              </div>
            </Painel>
          );
        })}
        {!isLoading && lista.length === 0 && (
          <Painel titulo="Nenhum plano de ação" descricao="crie planos para indicadores fora da meta">
            <p className="text-sm text-muted-foreground">Indicadores não atingidos devem ter plano de ação vinculado.</p>
          </Painel>
        )}
      </div>
    </AppShell>
  );
}
