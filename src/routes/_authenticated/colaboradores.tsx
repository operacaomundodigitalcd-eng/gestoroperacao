import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { AppShell, Painel } from "@/components/AppShell";
import { Pill } from "@/components/StatusBadge";
import { FormDialog } from "@/components/FormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { registrarAuditoria, useTabela } from "@/lib/dados";
import { EMPLOYEE_STATUS_LABEL, cpfValido, formatarCpf, formatarTelefone, mascararCpf } from "@/lib/perf";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/colaboradores")({
  head: () => ({
    meta: [
      { title: "Colaboradores · Ritmo" },
      { name: "description", content: "Cadastro completo de colaboradores com cargo, função, equipe, escala e vínculo hierárquico." },
      { property: "og:title", content: "Colaboradores · Ritmo" },
      { property: "og:description", content: "Gestão do quadro de colaboradores da operação." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Colaboradores,
});

type Opcao = { id: string; nome: string };
interface Colaborador {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string | null;
  matricula: string | null;
  status: string;
  data_admissao: string | null;
  unidade: string | null;
  teams: { nome: string } | null;
  departments: { nome: string } | null;
  positions: { nome: string } | null;
  job_functions: { nome: string } | null;
}

function Colaboradores() {
  const qc = useQueryClient();
  const { can, ehSuperAdmin } = useAuth();
  const podeGerenciar = can("employees.edit");
  const ehAdmin = ehSuperAdmin;
  const [busca, setBusca] = useState("");

  const { data: pessoas = [], isLoading } = useTabela<Colaborador>(
    "employees",
    "id, nome, cpf, email, telefone, matricula, status, data_admissao, unidade, teams!employees_team_id_fkey(nome), departments!employees_department_id_fkey(nome), positions(nome), job_functions(nome)",
    "nome",
  );
  const { data: equipes = [] } = useTabela<Opcao>("teams", "id, nome", "nome");
  const { data: departamentos = [] } = useTabela<Opcao>("departments", "id, nome", "nome");
  const { data: cargos = [] } = useTabela<Opcao>("positions", "id, nome", "nome");
  const { data: funcoes = [] } = useTabela<Opcao>("job_functions", "id, nome", "nome");
  const { data: escalas = [] } = useTabela<Opcao>("work_schedules", "id, nome", "nome");

  const lista = useMemo(
    () => pessoas.filter((p) => `${p.nome} ${p.email} ${p.matricula ?? ""}`.toLowerCase().includes(busca.toLowerCase())),
    [pessoas, busca],
  );

  const opcoes = (arr: Opcao[]) => arr.map((o) => ({ value: o.id, label: o.nome }));

  const novo = (
    <FormDialog
      titulo="Novo colaborador"
      descricao="Dados pessoais, vínculo organizacional e escala de trabalho."
      gatilho={
        <Button size="sm" disabled={!podeGerenciar}>
          <Plus className="size-4" /> Novo colaborador
        </Button>
      }
      campos={[
        { name: "nome", label: "Nome completo", obrigatorio: true, colSpan: 2 },
        { name: "cpf", label: "CPF", obrigatorio: true, mascara: formatarCpf, placeholder: "000.000.000-00" },
        { name: "matricula", label: "Matrícula" },
        { name: "email", label: "E-mail corporativo", obrigatorio: true },
        { name: "telefone", label: "Telefone", mascara: formatarTelefone, placeholder: "(00) 00000-0000" },
        { name: "department_id", label: "Departamento", tipo: "select", opcoes: opcoes(departamentos) },
        { name: "team_id", label: "Equipe", tipo: "select", opcoes: opcoes(equipes) },
        { name: "position_id", label: "Cargo", tipo: "select", opcoes: opcoes(cargos) },
        { name: "function_id", label: "Função", tipo: "select", opcoes: opcoes(funcoes) },
        { name: "work_schedule_id", label: "Escala", tipo: "select", opcoes: opcoes(escalas) },
        { name: "unidade", label: "Unidade / local" },
        { name: "data_admissao", label: "Data de admissão", tipo: "data" },
        {
          name: "status",
          label: "Status",
          tipo: "select",
          opcoes: Object.entries(EMPLOYEE_STATUS_LABEL).map(([value, label]) => ({ value, label })),
        },
        { name: "observacoes", label: "Observações", tipo: "textarea" },
      ]}
      onSubmit={async (v) => {
        const cpf = v.req("cpf");
        if (!cpfValido(cpf)) throw new Error("CPF inválido.");
        const nome = v.req("nome");
        const { error } = await supabase.from("employees").insert({
          nome,
          cpf,
          email: v.req("email"),
          telefone: v.txt("telefone"),
          matricula: v.txt("matricula"),
          department_id: v.txt("department_id"),
          team_id: v.txt("team_id"),
          position_id: v.txt("position_id"),
          function_id: v.txt("function_id"),
          work_schedule_id: v.txt("work_schedule_id"),
          unidade: v.txt("unidade"),
          data_admissao: v.txt("data_admissao"),
          status: (v.txt("status") ?? "ativo") as never,
          observacoes: v.txt("observacoes"),
        });
        if (error) throw error;
        await registrarAuditoria({ operacao: "criar", tabela: "employees", descricao: `Colaborador cadastrado: ${nome}` });
        await qc.invalidateQueries({ queryKey: ["tabela", "employees"] });
        toast.success("Colaborador cadastrado.");
      }}
    />
  );

  return (
    <AppShell titulo="Colaboradores" breadcrumb="03 · Pessoas" acoes={novo}>
      <Painel
        titulo="Quadro de colaboradores"
        descricao={`${lista.length} de ${pessoas.length} registros`}
        acoes={
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar" className="h-9 w-52 pl-8" />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5 pr-3 font-medium">Colaborador</th>
                <th className="px-3 py-2.5 font-medium">CPF</th>
                <th className="px-3 py-2.5 font-medium">Cargo / Função</th>
                <th className="px-3 py-2.5 font-medium">Equipe</th>
                <th className="px-3 py-2.5 font-medium">Admissão</th>
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
              {!isLoading && lista.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground">
                    Nenhum colaborador encontrado.
                  </td>
                </tr>
              )}
              {lista.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-sand/40">
                  <td className="py-3 pr-3">
                    <p className="font-medium">{p.nome}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{p.email}</p>
                  </td>
                  <td className="px-3 py-3 font-mono text-[12px] text-muted-foreground">
                    {ehAdmin ? p.cpf : mascararCpf(p.cpf)}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {p.positions?.nome ?? "—"}
                    {p.job_functions?.nome ? ` · ${p.job_functions.nome}` : ""}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{p.teams?.nome ?? p.departments?.nome ?? "—"}</td>
                  <td className="px-3 py-3 font-mono text-[11px] text-muted-foreground">
                    {p.data_admissao ? new Date(p.data_admissao).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className="py-3 pl-3">
                    <Pill tone={p.status === "ativo" ? "success" : p.status === "afastado" ? "warning" : "destructive"}>
                      {EMPLOYEE_STATUS_LABEL[p.status] ?? p.status}
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
