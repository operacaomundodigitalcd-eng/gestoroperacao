import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { AppShell, Painel } from "@/components/AppShell";
import { Pill, StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EquipeAcoes } from "@/components/EquipeAcoes";
import { IntegrantesEquipe } from "@/components/IntegrantesEquipe";
import { calcularScore, statusDoResultado, useIndicadores, useResultados, useTabela } from "@/lib/dados";
import { MESES, MESES_CURTOS, anosDisponiveis, num } from "@/lib/perf";

export const Route = createFileRoute("/_authenticated/equipe/$id")({
  head: () => ({
    meta: [
      { title: "Painel da Equipe · Ritmo" },
      { name: "description", content: "Painel da equipe com indicadores, metas, resultados mensais, score consolidado e histórico por competência." },
      { property: "og:title", content: "Painel da Equipe · Ritmo" },
      { property: "og:description", content: "Indicadores, metas, resultados e histórico de performance por equipe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PainelEquipe,
});

interface EquipeRow {
  id: string;
  nome: string;
  descricao: string | null;
  status: string;
  observacoes: string | null;
  department_id: string | null;
  gestor_id: string | null;
  supervisor_id: string | null;
  departments: { nome: string } | null;
  gestor: { nome: string } | null;
  supervisor: { nome: string } | null;
}

interface MetaRow {
  id: string;
  titulo: string;
  indicator_id: string;
  team_id: string | null;
  valor_meta: number;
  peso: number;
  periodicidade: string;
  periodo_inicio: string;
  periodo_fim: string;
  status: string;
}

interface PlanoRow {
  id: string;
  o_que: string;
  status: string;
  prioridade: string;
  prazo: string | null;
  team_id: string | null;
  indicator_id: string | null;
}

interface HistoricoRow {
  id: string;
  employee_id: string;
  team_id: string | null;
  inicio: string;
  fim: string | null;
  employees: { nome: string } | null;
  teams: { nome: string } | null;
}

interface AuditoriaRow {
  id: string;
  operacao: string;
  descricao: string | null;
  user_email: string | null;
  created_at: string;
  registro_id: string | null;
  tabela: string;
}

const dataBr = (v: string | null) => (v ? new Date(`${v}T12:00:00`).toLocaleDateString("pt-BR") : "hoje");

function PainelEquipe() {
  const { id } = Route.useParams();
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState<string>("todos");

  const { data: equipes = [] } = useTabela<EquipeRow>(
    "teams",
    "id, nome, descricao, status, observacoes, department_id, gestor_id, supervisor_id, departments(nome), gestor:employees!teams_gestor_fk(nome), supervisor:employees!teams_supervisor_fk(nome)",
    "nome",
  );
  const { data: indicadores = [] } = useIndicadores();
  const { data: resultados = [] } = useResultados(ano);
  const { data: metas = [] } = useTabela<MetaRow>(
    "goals",
    "id, titulo, indicator_id, team_id, valor_meta, peso, periodicidade, periodo_inicio, periodo_fim, status",
    "titulo",
  );
  const { data: pessoas = [] } = useTabela<{ id: string; team_id: string | null }>("employees", "id, team_id");
  const { data: planos = [] } = useTabela<PlanoRow>("action_plans", "id, o_que, status, prioridade, prazo, team_id, indicator_id", "prazo");
  const { data: historico = [] } = useTabela<HistoricoRow>(
    "employee_team_history",
    "id, employee_id, team_id, inicio, fim, employees(nome), teams(nome)",
    "inicio",
  );
  const { data: auditoria = [] } = useTabela<AuditoriaRow>(
    "audit_logs",
    "id, operacao, descricao, user_email, created_at, registro_id, tabela",
    "created_at",
  );

  const equipe = equipes.find((e) => e.id === id);
  const indicadoresEquipe = indicadores.filter((i) => i.team_id === id);
  const metasEquipe = metas.filter((m) => m.team_id === id);
  const membros = pessoas.filter((p) => p.team_id === id);
  const planosEquipe = planos.filter((p) => p.team_id === id || indicadoresEquipe.some((i) => i.id === p.indicator_id));
  const historicoEquipe = historico.filter((h) => h.team_id === id);
  const logEquipe = auditoria.filter((a) => a.tabela === "teams" && a.registro_id === id).slice().reverse();

  const doAno = useMemo(
    () => resultados.filter((r) => r.team_id === id || indicadoresEquipe.some((i) => i.id === r.indicator_id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resultados, id, indicadores],
  );
  const filtrados = mes === "todos" ? doAno : doAno.filter((r) => r.mes === Number(mes));

  const serie = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const rs = doAno.filter((r) => r.mes === i + 1);
        return { mes: MESES_CURTOS[i], score: rs.length ? calcularScore(rs) : null };
      }),
    [doAno],
  );

  const score = calcularScore(filtrados);

  if (!equipe) {
    return (
      <AppShell titulo="Painel da Equipe" breadcrumb="03 · Pessoas">
        <Painel titulo="Equipe não encontrada">
          <Link to="/equipes" className="text-sm underline">
            Voltar para equipes
          </Link>
        </Painel>
      </AppShell>
    );
  }

  return (
    <AppShell
      titulo={equipe.nome}
      breadcrumb="03 · Pessoas · Equipe"
      acoes={
        <>
          <Button asChild size="sm" variant="outline">
            <Link to="/equipes">
              <ArrowLeft className="size-4" /> Equipes
            </Link>
          </Button>
          <EquipeAcoes equipe={equipe} mostrarVisualizar={false} />
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
          <Select value={mes} onValueChange={setMes}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Ano completo</SelectItem>
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
      <section className="flex flex-wrap items-center gap-4 bg-primary p-5 text-primary-foreground">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider opacity-80">
            {equipe.departments?.nome ?? "Sem departamento"} · {mes === "todos" ? `Ano ${ano}` : `${MESES[Number(mes) - 1]}/${ano}`}
          </p>
          <p className="font-display text-3xl font-bold tracking-tight">Score {num(score)}%</p>
        </div>
        <div className="ml-auto flex flex-wrap gap-2 font-mono text-[11px]">
          <span className="rounded-full bg-background px-3 py-1 text-foreground">{indicadoresEquipe.length} indicadores</span>
          <span className="rounded-full bg-background px-3 py-1 text-foreground">{metasEquipe.length} metas</span>
          <span className="rounded-full bg-background px-3 py-1 text-foreground">{membros.length} pessoas</span>
          <span className="rounded-full bg-background px-3 py-1 text-foreground">{filtrados.length} lançamentos</span>
        </div>
      </section>

      <Tabs defaultValue="visao">
        <TabsList className="flex-wrap">
          <TabsTrigger value="visao">Visão Geral</TabsTrigger>
          <TabsTrigger value="integrantes">Integrantes</TabsTrigger>
          <TabsTrigger value="indicadores">Indicadores</TabsTrigger>
          <TabsTrigger value="metas">Metas</TabsTrigger>
          <TabsTrigger value="resultados">Resultados</TabsTrigger>
          <TabsTrigger value="planos">Planos de Ação</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="visao" className="mt-4 grid gap-4 lg:grid-cols-3">
          <Painel titulo="Ficha da equipe" className="lg:col-span-1">
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Departamento</dt>
                <dd className="font-medium">{equipe.departments?.nome ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Gestor</dt>
                <dd className="font-medium">{equipe.gestor?.nome ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Supervisor</dt>
                <dd className="font-medium">{equipe.supervisor?.nome ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Situação</dt>
                <dd>
                  <Pill tone={equipe.status === "ativo" ? "success" : "warning"}>{equipe.status === "ativo" ? "Ativa" : "Inativa"}</Pill>
                </dd>
              </div>
            </dl>
            {equipe.descricao && <p className="mt-3 text-sm text-muted-foreground">{equipe.descricao}</p>}
            {equipe.observacoes && <p className="mt-2 text-sm text-muted-foreground">{equipe.observacoes}</p>}
          </Painel>

          <Painel titulo="Histórico do ano" descricao={`score mensal consolidado · ${ano}`} className="lg:col-span-2">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={serie}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 130]} />
                  <RTooltip formatter={(v: number) => `${num(v)}%`} />
                  <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Painel>
        </TabsContent>

        <TabsContent value="integrantes" className="mt-4">
          <Painel titulo="Integrantes da Equipe" descricao="Remover um integrante altera apenas o vínculo; o cadastro do colaborador é preservado.">
            <IntegrantesEquipe equipeId={equipe.id} equipeNome={equipe.nome} />
          </Painel>
        </TabsContent>

        <TabsContent value="indicadores" className="mt-4">
          <Painel titulo="Indicadores" descricao={`${indicadoresEquipe.length} indicadores da equipe`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="py-2.5 pr-3 font-medium">Indicador</th>
                    <th className="px-3 py-2.5 font-medium">Meta vigente</th>
                    <th className="px-3 py-2.5 text-right font-medium">Peso</th>
                    <th className="px-3 py-2.5 text-right font-medium">Lançamentos</th>
                    <th className="py-2.5 pl-3 text-right font-medium">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {indicadoresEquipe.map((i) => {
                    const rs = filtrados.filter((r) => r.indicator_id === i.id);
                    const meta = metasEquipe.find((m) => m.indicator_id === i.id);
                    return (
                      <tr key={i.id} className="transition-colors hover:bg-sand/40">
                        <td className="py-3 pr-3 font-medium">{i.nome}</td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {meta ? `${meta.titulo} · ${num(meta.valor_meta)}` : i.meta_padrao !== null ? num(i.meta_padrao) : "—"}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-[12px]">{num(i.peso)}</td>
                        <td className="px-3 py-3 text-right font-mono text-[12px]">{rs.length}</td>
                        <td className="py-3 pl-3 text-right font-mono text-[12px]">{rs.length ? `${num(calcularScore(rs))}%` : "—"}</td>
                      </tr>
                    );
                  })}
                  {indicadoresEquipe.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-muted-foreground">
                        Nenhum indicador vinculado a esta equipe.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Painel>
        </TabsContent>

        <TabsContent value="metas" className="mt-4">
          <Painel titulo="Metas" descricao={`${metasEquipe.length} metas vinculadas`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="py-2.5 pr-3 font-medium">Meta</th>
                    <th className="px-3 py-2.5 font-medium">Período</th>
                    <th className="px-3 py-2.5 text-right font-medium">Valor</th>
                    <th className="px-3 py-2.5 text-right font-medium">Peso</th>
                    <th className="py-2.5 pl-3 font-medium">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {metasEquipe.map((m) => (
                    <tr key={m.id} className="transition-colors hover:bg-sand/40">
                      <td className="py-3 pr-3 font-medium">{m.titulo}</td>
                      <td className="px-3 py-3 font-mono text-[12px] text-muted-foreground">
                        {dataBr(m.periodo_inicio)} — {dataBr(m.periodo_fim)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-[12px]">{num(m.valor_meta)}</td>
                      <td className="px-3 py-3 text-right font-mono text-[12px]">{num(m.peso)}</td>
                      <td className="py-3 pl-3">
                        <Pill tone={m.status === "ativa" ? "success" : "muted"}>{m.status}</Pill>
                      </td>
                    </tr>
                  ))}
                  {metasEquipe.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-muted-foreground">
                        Nenhuma meta vinculada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Painel>
        </TabsContent>

        <TabsContent value="resultados" className="mt-4">
          <Painel titulo="Resultados" descricao={`${filtrados.length} lançamentos no período selecionado`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="py-2.5 pr-3 font-medium">Competência</th>
                    <th className="px-3 py-2.5 font-medium">Indicador</th>
                    <th className="px-3 py-2.5 text-right font-medium">Meta</th>
                    <th className="px-3 py-2.5 text-right font-medium">Realizado</th>
                    <th className="px-3 py-2.5 text-right font-medium">%</th>
                    <th className="py-2.5 pl-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[...filtrados]
                    .sort((a, b) => b.mes - a.mes)
                    .map((r) => (
                      <tr key={r.id} className="transition-colors hover:bg-sand/40">
                        <td className="py-3 pr-3 font-mono text-[12px]">
                          {MESES_CURTOS[r.mes - 1]}/{r.ano}
                        </td>
                        <td className="px-3 py-3 font-medium">{r.indicators?.nome ?? "—"}</td>
                        <td className="px-3 py-3 text-right font-mono text-[12px]">{num(r.valor_meta)}</td>
                        <td className="px-3 py-3 text-right font-mono text-[12px]">{num(r.valor_realizado)}</td>
                        <td className="px-3 py-3 text-right font-mono text-[12px]">{num(r.percentual)}%</td>
                        <td className="py-3 pl-3">
                          <StatusBadge status={statusDoResultado(r)} />
                        </td>
                      </tr>
                    ))}
                  {filtrados.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-muted-foreground">
                        Nenhum resultado no período selecionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Painel>
        </TabsContent>

        <TabsContent value="planos" className="mt-4">
          <Painel titulo="Planos de Ação" descricao={`${planosEquipe.length} planos relacionados`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="py-2.5 pr-3 font-medium">Ação</th>
                    <th className="px-3 py-2.5 font-medium">Prioridade</th>
                    <th className="px-3 py-2.5 font-medium">Prazo</th>
                    <th className="py-2.5 pl-3 font-medium">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {planosEquipe.map((p) => (
                    <tr key={p.id} className="transition-colors hover:bg-sand/40">
                      <td className="py-3 pr-3 font-medium">{p.o_que}</td>
                      <td className="px-3 py-3 text-muted-foreground">{p.prioridade}</td>
                      <td className="px-3 py-3 font-mono text-[12px]">{p.prazo ? dataBr(p.prazo) : "—"}</td>
                      <td className="py-3 pl-3">
                        <Pill tone={p.status === "concluido" ? "success" : p.status === "atrasado" ? "destructive" : "muted"}>{p.status}</Pill>
                      </td>
                    </tr>
                  ))}
                  {planosEquipe.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-muted-foreground">
                        Nenhum plano de ação relacionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Painel>
        </TabsContent>

        <TabsContent value="historico" className="mt-4 space-y-4">
          <Painel titulo="Histórico de integrantes" descricao="Períodos de vínculo preservados para relatórios históricos">
            <ul className="space-y-2 text-sm">
              {[...historicoEquipe]
                .sort((a, b) => b.inicio.localeCompare(a.inicio))
                .map((h) => (
                  <li key={h.id} className="flex flex-wrap items-center gap-2 border-l-2 border-primary bg-sand/40 px-3 py-2">
                    <span className="font-medium">{h.employees?.nome ?? "—"}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {dataBr(h.inicio)} — {h.fim ? dataBr(h.fim) : "atual"}
                    </span>
                    {!h.fim && <Pill tone="success">vínculo atual</Pill>}
                  </li>
                ))}
              {historicoEquipe.length === 0 && <li className="text-muted-foreground">Nenhum vínculo registrado.</li>}
            </ul>
          </Painel>

          <Painel titulo="Histórico de alterações" descricao="Auditoria das mudanças cadastrais desta equipe">
            <ul className="space-y-2 text-sm">
              {logEquipe.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-2 border-b border-border pb-2">
                  <span className="font-mono text-[11px] text-muted-foreground">{new Date(a.created_at).toLocaleString("pt-BR")}</span>
                  <span className="font-medium">{a.descricao ?? a.operacao}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">{a.user_email ?? "—"}</span>
                </li>
              ))}
              {logEquipe.length === 0 && <li className="text-muted-foreground">Nenhuma alteração registrada.</li>}
            </ul>
          </Painel>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
