import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { AppShell, Painel } from "@/components/AppShell";
import { Pill } from "@/components/StatusBadge";
import { FormDialog } from "@/components/FormDialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { registrarAuditoria, useTabela } from "@/lib/dados";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/equipes")({
  head: () => ({
    meta: [
      { title: "Equipes · Ritmo" },
      { name: "description", content: "Equipes e subgrupos com gestor, supervisor e vínculo ao departamento responsável." },
      { property: "og:title", content: "Equipes · Ritmo" },
      { property: "og:description", content: "Estrutura de equipes e subgrupos da operação." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Equipes,
});

type Opcao = { id: string; nome: string };
interface EquipeRow {
  id: string;
  nome: string;
  descricao: string | null;
  status: string;
  departments: { nome: string } | null;
  gestor: { nome: string } | null;
  supervisor: { nome: string } | null;
}
interface SubgrupoRow {
  id: string;
  nome: string;
  descricao: string | null;
  status: string;
  teams: { nome: string } | null;
}

function Equipes() {
  const qc = useQueryClient();
  const { podeGerenciar } = useAuth();
  const { data: equipes = [], isLoading } = useTabela<EquipeRow>(
    "teams",
    "id, nome, descricao, status, departments(nome), gestor:employees!teams_gestor_id_fkey(nome), supervisor:employees!teams_supervisor_id_fkey(nome)",
    "nome",
  );
  const { data: subgrupos = [] } = useTabela<SubgrupoRow>("subgroups", "id, nome, descricao, status, teams(nome)", "nome");
  const { data: departamentos = [] } = useTabela<Opcao>("departments", "id, nome", "nome");
  const { data: pessoas = [] } = useTabela<Opcao>("employees", "id, nome", "nome");

  const opcoes = (arr: Opcao[]) => arr.map((o) => ({ value: o.id, label: o.nome }));

  return (
    <AppShell
      titulo="Equipes"
      breadcrumb="03 · Pessoas"
      acoes={
        <>
          <FormDialog
            titulo="Novo subgrupo"
            gatilho={
              <Button size="sm" variant="outline" disabled={!podeGerenciar}>
                <Plus className="size-4" /> Subgrupo
              </Button>
            }
            campos={[
              { name: "nome", label: "Nome do subgrupo", obrigatorio: true },
              { name: "team_id", label: "Equipe", tipo: "select", obrigatorio: true, opcoes: equipes.map((e) => ({ value: e.id, label: e.nome })) },
              { name: "descricao", label: "Descrição", tipo: "textarea" },
            ]}
            onSubmit={async (v) => {
              const { error } = await supabase.from("subgroups").insert({
                nome: v.req("nome"),
                team_id: v.req("team_id"),
                descricao: v.txt("descricao"),
              });
              if (error) throw error;
              await qc.invalidateQueries({ queryKey: ["tabela", "subgroups"] });
              toast.success("Subgrupo criado.");
            }}
          />
          <FormDialog
            titulo="Nova equipe"
            gatilho={
              <Button size="sm" disabled={!podeGerenciar}>
                <Plus className="size-4" /> Nova equipe
              </Button>
            }
            campos={[
              { name: "nome", label: "Nome da equipe", obrigatorio: true, colSpan: 2 },
              { name: "department_id", label: "Departamento", tipo: "select", opcoes: opcoes(departamentos) },
              { name: "gestor_id", label: "Gestor", tipo: "select", opcoes: opcoes(pessoas) },
              { name: "supervisor_id", label: "Supervisor", tipo: "select", opcoes: opcoes(pessoas) },
              { name: "descricao", label: "Descrição", tipo: "textarea" },
            ]}
            onSubmit={async (v) => {
              const nome = v.req("nome");
              const { error } = await supabase.from("teams").insert({
                nome,
                department_id: v.txt("department_id"),
                gestor_id: v.txt("gestor_id"),
                supervisor_id: v.txt("supervisor_id"),
                descricao: v.txt("descricao"),
              });
              if (error) throw error;
              await registrarAuditoria({ operacao: "criar", tabela: "teams", descricao: `Equipe criada: ${nome}` });
              await qc.invalidateQueries({ queryKey: ["tabela", "teams"] });
              toast.success("Equipe criada.");
            }}
          />
        </>
      }
    >
      <Painel titulo="Equipes" descricao={`${equipes.length} equipes ativas na estrutura`}>
        <div className="grid gap-3 md:grid-cols-2">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {equipes.map((e) => (
            <div key={e.id} className="border-l-2 border-primary bg-sand/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-base font-bold tracking-tight">{e.nome}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{e.departments?.nome ?? "sem departamento"}</p>
                </div>
                <Pill tone={e.status === "ativo" ? "success" : "warning"}>{e.status}</Pill>
              </div>
              {e.descricao && <p className="mt-2 text-sm text-muted-foreground">{e.descricao}</p>}
              <p className="mt-3 font-mono text-[11px] text-muted-foreground">
                Gestor: {e.gestor?.nome ?? "—"} · Supervisor: {e.supervisor?.nome ?? "—"}
              </p>
            </div>
          ))}
        </div>
      </Painel>

      <Painel titulo="Subgrupos" descricao={`${subgrupos.length} subgrupos`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5 pr-3 font-medium">Subgrupo</th>
                <th className="px-3 py-2.5 font-medium">Equipe</th>
                <th className="py-2.5 pl-3 font-medium">Descrição</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {subgrupos.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-muted-foreground">
                    Nenhum subgrupo cadastrado.
                  </td>
                </tr>
              )}
              {subgrupos.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-sand/40">
                  <td className="py-3 pr-3 font-medium">{s.nome}</td>
                  <td className="px-3 py-3 text-muted-foreground">{s.teams?.nome ?? "—"}</td>
                  <td className="py-3 pl-3 text-muted-foreground">{s.descricao ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Painel>
    </AppShell>
  );
}
