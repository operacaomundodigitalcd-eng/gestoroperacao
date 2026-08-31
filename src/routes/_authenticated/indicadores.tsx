import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { AppShell, Painel } from "@/components/AppShell";
import { Pill } from "@/components/StatusBadge";
import { FormDialog } from "@/components/FormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIndicadores, useTabela, registrarAuditoria } from "@/lib/dados";
import { DIRECAO_LABEL, num } from "@/lib/perf";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/indicadores")({
  head: () => ({
    meta: [
      { title: "Indicadores · Ritmo" },
      { name: "description", content: "Cadastro de indicadores com categoria, unidade de medida, direção da meta, peso e responsável." },
      { property: "og:title", content: "Indicadores · Ritmo" },
      { property: "og:description", content: "Gestão do catálogo de indicadores da operação." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Indicadores,
});

type Opcao = { id: string; nome: string };

function Indicadores() {
  const qc = useQueryClient();
  const { podeGerenciar } = useAuth();
  const { data: indicadores = [], isLoading } = useIndicadores();
  const { data: categorias = [] } = useTabela<Opcao>("indicator_categories", "id, nome", "nome");
  const { data: unidades = [] } = useTabela<Opcao>("measure_units", "id, nome", "nome");
  const { data: equipes = [] } = useTabela<Opcao>("teams", "id, nome", "nome");
  const { data: departamentos = [] } = useTabela<Opcao>("departments", "id, nome", "nome");
  const { data: colaboradores = [] } = useTabela<Opcao>("employees", "id, nome", "nome");

  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("todas");

  const lista = useMemo(
    () =>
      indicadores.filter(
        (i) =>
          (categoria === "todas" || i.indicator_categories?.nome === categoria) &&
          `${i.nome} ${i.codigo ?? ""} ${i.teams?.nome ?? ""}`.toLowerCase().includes(busca.toLowerCase()),
      ),
    [indicadores, busca, categoria],
  );

  const opcoes = (arr: Opcao[]) => arr.map((o) => ({ value: o.id, label: o.nome }));

  const novo = (
    <FormDialog
      titulo="Novo indicador"
      descricao="Defina como o indicador será medido e avaliado."
      gatilho={
        <Button size="sm" disabled={!podeGerenciar}>
          <Plus className="size-4" /> Novo indicador
        </Button>
      }
      campos={[
        { name: "nome", label: "Nome do indicador", obrigatorio: true, colSpan: 2 },
        { name: "codigo", label: "Código" },
        { name: "category_id", label: "Categoria", tipo: "select", opcoes: opcoes(categorias) },
        { name: "unit_id", label: "Unidade de medida", tipo: "select", opcoes: opcoes(unidades) },
        {
          name: "direcao",
          label: "Direção da meta",
          tipo: "select",
          obrigatorio: true,
          opcoes: Object.entries(DIRECAO_LABEL).map(([value, label]) => ({ value, label })),
        },
        { name: "meta_padrao", label: "Meta padrão", tipo: "numero" },
        { name: "peso", label: "Peso (1 a 5)", tipo: "numero" },
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
        { name: "department_id", label: "Departamento", tipo: "select", opcoes: opcoes(departamentos) },
        { name: "team_id", label: "Equipe", tipo: "select", opcoes: opcoes(equipes) },
        { name: "responsavel_id", label: "Responsável", tipo: "select", opcoes: opcoes(colaboradores) },
        { name: "descricao", label: "Descrição / fórmula de cálculo", tipo: "textarea" },
      ]}
      onSubmit={async (v) => {
        const { error } = await supabase.from("indicators").insert({
          nome: v.nome!,
          codigo: v.codigo || null,
          category_id: v.category_id || null,
          unit_id: v.unit_id || null,
          direcao: (v.direcao || "maior_melhor") as never,
          meta_padrao: v.meta_padrao ? Number(v.meta_padrao) : null,
          peso: v.peso ? Number(v.peso) : 1,
          periodicidade: (v.periodicidade || "mensal") as never,
          department_id: v.department_id || null,
          team_id: v.team_id || null,
          responsavel_id: v.responsavel_id || null,
          descricao: v.descricao || null,
        });
        if (error) throw error;
        await registrarAuditoria({ operacao: "criar", tabela: "indicators", descricao: `Indicador criado: ${v.nome}` });
        await qc.invalidateQueries({ queryKey: ["indicadores"] });
        toast.success("Indicador cadastrado.");
      }}
    />
  );

  return (
    <AppShell titulo="Indicadores" breadcrumb="02 · Performance" acoes={novo}>
      <Painel
        titulo="Catálogo de indicadores"
        descricao={`${lista.length} de ${indicadores.length} indicadores`}
        acoes={
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar indicador"
                className="h-9 w-52 pl-8"
              />
            </div>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger className="h-9 w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as categorias</SelectItem>
                {categorias.map((c) => (
                  <SelectItem key={c.id} value={c.nome}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5 pr-3 font-medium">Indicador</th>
                <th className="px-3 py-2.5 font-medium">Categoria</th>
                <th className="px-3 py-2.5 font-medium">Equipe</th>
                <th className="px-3 py-2.5 font-medium">Direção</th>
                <th className="px-3 py-2.5 text-right font-medium">Meta</th>
                <th className="px-3 py-2.5 text-right font-medium">Peso</th>
                <th className="py-2.5 pl-3 font-medium">Responsável</th>
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
              {!isLoading && lista.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-muted-foreground">
                    Nenhum indicador encontrado.
                  </td>
                </tr>
              )}
              {lista.map((i) => (
                <tr key={i.id} className="transition-colors hover:bg-sand/40">
                  <td className="py-3 pr-3">
                    <p className="font-medium">{i.nome}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {i.codigo ?? "—"} · {i.measure_units?.nome ?? "sem unidade"}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{i.indicator_categories?.nome ?? "—"}</td>
                  <td className="px-3 py-3 text-muted-foreground">{i.teams?.nome ?? i.departments?.nome ?? "—"}</td>
                  <td className="px-3 py-3">
                    <Pill tone="info">{DIRECAO_LABEL[i.direcao] ?? i.direcao}</Pill>
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-[13px]">{i.meta_padrao == null ? "—" : num(i.meta_padrao)}</td>
                  <td className="px-3 py-3 text-right font-mono text-[13px]">{i.peso}</td>
                  <td className="py-3 pl-3 text-muted-foreground">{i.responsavel?.nome ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Painel>
    </AppShell>
  );
}
