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

export const Route = createFileRoute("/_authenticated/departamentos")({
  head: () => ({
    meta: [
      { title: "Departamentos · Ritmo" },
      { name: "description", content: "Departamentos da organização, cargos, funções e escalas de trabalho cadastradas." },
      { property: "og:title", content: "Departamentos · Ritmo" },
      { property: "og:description", content: "Estrutura organizacional e tabelas auxiliares." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Departamentos,
});

interface DepRow {
  id: string;
  nome: string;
  descricao: string | null;
  status: string;
}
type Simples = { id: string; nome: string; descricao?: string | null };

function Departamentos() {
  const qc = useQueryClient();
  const { can } = useAuth();
  const podeGerenciar = can("settings.edit");
  const { data: departamentos = [] } = useTabela<DepRow>("departments", "id, nome, descricao, status", "nome");
  const { data: cargos = [] } = useTabela<Simples>("positions", "id, nome, descricao", "nome");
  const { data: funcoes = [] } = useTabela<Simples>("job_functions", "id, nome, descricao", "nome");
  const { data: escalas = [] } = useTabela<Simples>("work_schedules", "id, nome, descricao", "nome");
  const { data: categorias = [] } = useTabela<Simples>("indicator_categories", "id, nome, descricao", "nome");
  const { data: unidades = [] } = useTabela<Simples>("measure_units", "id, nome", "nome");

  const criarSimples = (tabela: "positions" | "job_functions" | "work_schedules" | "indicator_categories" | "measure_units", rotulo: string) => (
    <FormDialog
      titulo={`Novo registro · ${rotulo}`}
      gatilho={
        <Button size="sm" variant="outline" disabled={!podeGerenciar}>
          <Plus className="size-4" /> {rotulo}
        </Button>
      }
      campos={[
        { name: "nome", label: "Nome", obrigatorio: true, colSpan: 2 },
        { name: "descricao", label: "Descrição", tipo: "textarea" },
      ]}
      onSubmit={async (v) => {
        const registro =
          tabela === "measure_units" ? { nome: v.req("nome") } : { nome: v.req("nome"), descricao: v.txt("descricao") };
        const { error } = await supabase.from(tabela).insert(registro as never);
        if (error) throw error;
        await qc.invalidateQueries({ queryKey: ["tabela", tabela] });
        toast.success(`${rotulo} cadastrado.`);
      }}
    />
  );

  return (
    <AppShell
      titulo="Departamentos"
      breadcrumb="03 · Pessoas"
      acoes={
        <FormDialog
          titulo="Novo departamento"
          gatilho={
            <Button size="sm" disabled={!podeGerenciar}>
              <Plus className="size-4" /> Novo departamento
            </Button>
          }
          campos={[
            { name: "nome", label: "Nome do departamento", obrigatorio: true, colSpan: 2 },
            { name: "descricao", label: "Descrição", tipo: "textarea" },
          ]}
          onSubmit={async (v) => {
            const nome = v.req("nome");
            const { error } = await supabase.from("departments").insert({ nome, descricao: v.txt("descricao") });
            if (error) throw error;
            await registrarAuditoria({ operacao: "criar", tabela: "departments", descricao: `Departamento criado: ${nome}` });
            await qc.invalidateQueries({ queryKey: ["tabela", "departments"] });
            toast.success("Departamento criado.");
          }}
        />
      }
    >
      <Painel titulo="Departamentos" descricao={`${departamentos.length} registros`}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {departamentos.map((d) => (
            <div key={d.id} className="bg-sand/40 p-4 ring-1 ring-border">
              <div className="flex items-start justify-between gap-2">
                <p className="font-display text-base font-bold tracking-tight">{d.nome}</p>
                <Pill tone={d.status === "ativo" ? "success" : "warning"}>{d.status}</Pill>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{d.descricao ?? "Sem descrição."}</p>
            </div>
          ))}
          {departamentos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum departamento cadastrado.</p>}
        </div>
      </Painel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Painel titulo="Cargos" descricao={`${cargos.length} cargos`} acoes={criarSimples("positions", "Cargo")}>
          <Lista itens={cargos} />
        </Painel>
        <Painel titulo="Funções" descricao={`${funcoes.length} funções`} acoes={criarSimples("job_functions", "Função")}>
          <Lista itens={funcoes} />
        </Painel>
        <Painel titulo="Escalas de trabalho" descricao={`${escalas.length} escalas`} acoes={criarSimples("work_schedules", "Escala")}>
          <Lista itens={escalas} />
        </Painel>
        <Painel
          titulo="Categorias e unidades"
          descricao={`${categorias.length} categorias · ${unidades.length} unidades`}
          acoes={
            <div className="flex gap-2">
              {criarSimples("indicator_categories", "Categoria")}
              {criarSimples("measure_units", "Unidade")}
            </div>
          }
        >
          <Lista itens={[...categorias, ...unidades]} />
        </Painel>
      </div>
    </AppShell>
  );
}

function Lista({ itens }: { itens: Simples[] }) {
  if (!itens.length) return <p className="text-sm text-muted-foreground">Nenhum registro.</p>;
  return (
    <ul className="divide-y divide-border text-sm">
      {itens.map((i) => (
        <li key={i.id} className="flex items-center justify-between gap-3 py-2.5">
          <span className="font-medium">{i.nome}</span>
          <span className="font-mono text-[11px] text-muted-foreground">{i.descricao ?? ""}</span>
        </li>
      ))}
    </ul>
  );
}
