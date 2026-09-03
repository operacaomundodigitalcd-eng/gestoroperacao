import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AppShell, Painel } from "@/components/AppShell";
import { MENU } from "@/components/AppShell";
import { Pill } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import {
  alternarPerfil,
  duplicarPerfil,
  excluirPerfil,
  listarPerfis,
  listarPermissoes,
  salvarPerfil,
  type Permissao,
  type PerfilRow,
} from "@/lib/acesso.functions";

export const Route = createFileRoute("/_authenticated/perfis-de-acesso")({
  head: () => ({
    meta: [
      { title: "Perfis de Acesso · Ritmo" },
      { name: "description", content: "Crie perfis de acesso, defina a matriz de permissões por módulo e simule o que cada perfil enxerga no sistema." },
      { property: "og:title", content: "Perfis de Acesso · Ritmo" },
      { property: "og:description", content: "Perfis configuráveis com matriz de permissões e escopo de dados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PerfisDeAcesso,
});

const MODULO_LABEL: Record<string, string> = {
  dashboard: "Dashboard",
  employees: "Colaboradores",
  users: "Usuários",
  roles: "Perfis",
  indicators: "Indicadores",
  goals: "Metas",
  results: "Resultados",
  analyses: "Análises",
  action_plans: "Planos de ação",
  meetings: "Reuniões",
  presentations: "Apresentações",
  reports: "Relatórios",
  audit: "Auditoria",
  settings: "Administração",
};

const ACAO_LABEL: Record<string, string> = {
  view: "Visualizar",
  executive_view: "Visão executiva",
  team_view: "Visão por equipe",
  create: "Criar",
  edit: "Editar",
  delete: "Excluir",
  inactivate: "Inativar",
  export: "Exportar",
  approve: "Aprovar",
  manage: "Administrar",
  change_role: "Alterar perfil",
  duplicate: "Duplicar",
  manage_permissions: "Gerenciar permissões",
  reopen_period: "Reabrir competência",
  finish: "Concluir",
  present: "Apresentar",
  reopen: "Reabrir",
  generate_minutes: "Gerar ata",
  generate: "Gerar",
};

function PerfisDeAcesso() {
  const { can } = useAuth();
  const qc = useQueryClient();
  const fnPerfis = useServerFn(listarPerfis);
  const fnPerms = useServerFn(listarPermissoes);
  const fnSalvar = useServerFn(salvarPerfil);
  const fnDuplicar = useServerFn(duplicarPerfil);
  const fnAlternar = useServerFn(alternarPerfil);
  const fnExcluir = useServerFn(excluirPerfil);

  const { data: perfis = [] } = useQuery({ queryKey: ["perfis"], queryFn: () => fnPerfis(), enabled: can("roles.view") });
  const { data: permissoes = [] } = useQuery({ queryKey: ["permissoes"], queryFn: () => fnPerms(), enabled: can("roles.view") });

  const [editando, setEditando] = useState<PerfilRow | null>(null);
  const [criando, setCriando] = useState(false);
  const [duplicando, setDuplicando] = useState<PerfilRow | null>(null);
  const [nomeCopia, setNomeCopia] = useState("");

  const invalidar = () => {
    void qc.invalidateQueries({ queryKey: ["perfis"] });
    void qc.invalidateQueries({ queryKey: ["meu-acesso"] });
  };

  const mDuplicar = useMutation({
    mutationFn: (v: { roleId: string; name: string }) => fnDuplicar({ data: v }),
    onSuccess: () => {
      toast.success("Perfil duplicado.");
      setDuplicando(null);
      invalidar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const mAlternar = useMutation({
    mutationFn: (v: { roleId: string; active: boolean }) => fnAlternar({ data: v }),
    onSuccess: () => {
      toast.success("Status atualizado.");
      invalidar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const mExcluir = useMutation({
    mutationFn: (roleId: string) => fnExcluir({ data: { roleId } }),
    onSuccess: () => {
      toast.success("Perfil excluído.");
      invalidar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell
      titulo="Perfis de Acesso"
      breadcrumb="07 · Administração"
      acoes={
        can("roles.create") && (
          <Button size="sm" onClick={() => setCriando(true)}>
            + Criar Perfil
          </Button>
        )
      }
    >
      <Painel titulo="Perfis cadastrados" descricao={`${perfis.length} perfis`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5 pr-3 font-medium">Perfil</th>
                <th className="px-3 py-2.5 font-medium">Descrição</th>
                <th className="px-3 py-2.5 font-medium">Usuários</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">Criado em</th>
                <th className="px-3 py-2.5 font-medium">Criado por</th>
                <th className="px-3 py-2.5 font-medium">Última alteração</th>
                <th className="py-2.5 pl-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {perfis.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-sand/40">
                  <td className="py-3 pr-3 font-medium">
                    {p.name}
                    {p.is_super_admin && (
                      <span className="ml-2 inline-block align-middle">
                        <Pill tone="destructive">Protegido</Pill>
                      </span>
                    )}
                  </td>
                  <td className="max-w-[280px] px-3 py-3 text-muted-foreground">{p.description ?? "—"}</td>
                  <td className="px-3 py-3 font-mono">{p.usuarios}</td>
                  <td className="px-3 py-3">
                    <Pill tone={p.active ? "success" : "warning"}>{p.active ? "Ativo" : "Inativo"}</Pill>
                  </td>
                  <td className="px-3 py-3 font-mono text-[11px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</td>
                  <td className="px-3 py-3 text-muted-foreground">{p.created_by_nome ?? "sistema"}</td>
                  <td className="px-3 py-3 font-mono text-[11px] text-muted-foreground">{new Date(p.updated_at).toLocaleDateString("pt-BR")}</td>
                  <td className="py-3 pl-3">
                    <div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" onClick={() => setEditando(p)}>
                        {p.is_system_role || !can("roles.edit") ? "Visualizar" : "Editar"}
                      </Button>
                      {can("roles.duplicate") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[11px]"
                          onClick={() => {
                            setDuplicando(p);
                            setNomeCopia(`${p.name} (cópia)`);
                          }}
                        >
                          Duplicar
                        </Button>
                      )}
                      {can("roles.inactivate") && !p.is_system_role && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[11px]"
                          onClick={() => mAlternar.mutate({ roleId: p.id, active: !p.active })}
                        >
                          {p.active ? "Inativar" : "Reativar"}
                        </Button>
                      )}
                      {can("roles.delete") && !p.is_system_role && p.usuarios === 0 && (
                        <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" onClick={() => mExcluir.mutate(p.id)}>
                          Excluir
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {perfis.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-muted-foreground">
                    Nenhum perfil visível.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Painel>

      {(criando || editando) && (
        <EditorPerfil
          perfil={editando}
          permissoes={permissoes}
          perfis={perfis}
          somenteLeitura={!!editando?.is_system_role || !can(editando ? "roles.edit" : "roles.create")}
          onFechar={() => {
            setCriando(false);
            setEditando(null);
          }}
          onSalvar={async (v) => {
            await fnSalvar({ data: v });
            toast.success("Perfil salvo.");
            invalidar();
            setCriando(false);
            setEditando(null);
          }}
        />
      )}

      <Dialog open={!!duplicando} onOpenChange={(o) => !o && setDuplicando(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Duplicar perfil</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Todas as permissões de <strong>{duplicando?.name}</strong> serão copiadas para o novo perfil.
          </p>
          <Label className="text-xs">Nome do novo perfil</Label>
          <Input value={nomeCopia} onChange={(e) => setNomeCopia(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicando(null)}>
              Cancelar
            </Button>
            <Button onClick={() => duplicando && mDuplicar.mutate({ roleId: duplicando.id, name: nomeCopia })}>Duplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function EditorPerfil({
  perfil,
  permissoes,
  perfis,
  somenteLeitura,
  onFechar,
  onSalvar,
}: {
  perfil: PerfilRow | null;
  permissoes: Permissao[];
  perfis: PerfilRow[];
  somenteLeitura: boolean;
  onFechar: () => void;
  onSalvar: (v: { id?: string; name: string; description?: string; active: boolean; codes: string[]; baseRoleId?: string }) => Promise<void>;
}) {
  const [nome, setNome] = useState(perfil?.name ?? "");
  const [descricao, setDescricao] = useState(perfil?.description ?? "");
  const [ativo, setAtivo] = useState(perfil?.active ?? true);
  const [base, setBase] = useState<string>("");
  const [codes, setCodes] = useState<string[]>(perfil?.codes ?? []);
  const [simulando, setSimulando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const modulos = useMemo(() => {
    const m = new Map<string, Permissao[]>();
    for (const p of permissoes) m.set(p.module, [...(m.get(p.module) ?? []), p]);
    return Array.from(m.entries());
  }, [permissoes]);

  const marcado = (code: string) => codes.includes(code);
  const alternar = (code: string) => setCodes((c) => (c.includes(code) ? c.filter((x) => x !== code) : [...c, code]));

  const aplicarNivel = (modulo: string, nivel: "nenhum" | "leitura" | "gestao") => {
    const doModulo = permissoes.filter((p) => p.module === modulo).map((p) => p.code);
    const leitura = doModulo.filter((c) => c.endsWith(".view") || c.endsWith("_view"));
    setCodes((atual) => {
      const restante = atual.filter((c) => !doModulo.includes(c));
      if (nivel === "nenhum") return restante;
      if (nivel === "leitura") return [...restante, ...leitura];
      return [...restante, ...doModulo];
    });
  };

  const aplicarBase = (roleId: string) => {
    setBase(roleId);
    const origem = perfis.find((p) => p.id === roleId);
    if (origem) setCodes(origem.codes);
  };

  const menuVisivel = MENU.map((g) => ({ ...g, itens: g.itens.filter((i) => codes.includes(i.perm)) })).filter((g) => g.itens.length);

  return (
    <Dialog open onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-display">{perfil ? `Perfil: ${perfil.name}` : "Criar perfil"}</DialogTitle>
        </DialogHeader>

        {somenteLeitura && (
          <div className="border-l-2 border-warning bg-warning/10 p-3 text-sm">
            {perfil?.is_super_admin
              ? "O Administrador Geral é um perfil protegido: possui acesso total e não pode ter permissões reduzidas."
              : "Você não possui permissão para alterar este perfil."}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-1.5 block text-xs">Nome do perfil *</Label>
            <Input value={nome} disabled={somenteLeitura} onChange={(e) => setNome(e.target.value)} placeholder="Supervisor Suporte" />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Switch checked={ativo} disabled={somenteLeitura} onCheckedChange={setAtivo} id="ativo" />
            <Label htmlFor="ativo" className="text-xs">
              Perfil ativo
            </Label>
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block text-xs">Descrição</Label>
            <Textarea value={descricao} disabled={somenteLeitura} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          {!perfil && (
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block text-xs">Perfil base (opcional)</Label>
              <Select value={base} onValueChange={aplicarBase}>
                <SelectTrigger>
                  <SelectValue placeholder="Começar do zero" />
                </SelectTrigger>
                <SelectContent>
                  {perfis.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="mt-2">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-display text-sm font-bold">Matriz de permissões</h3>
            <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" onClick={() => setSimulando((s) => !s)}>
              {simulando ? "Fechar simulação" : "Simular acesso"}
            </Button>
          </div>

          {simulando && (
            <div className="mb-3 rounded-md bg-sand/50 p-3 text-sm">
              <p className="mb-2 font-mono text-[11px] uppercase text-muted-foreground">Menus visíveis para este perfil</p>
              {menuVisivel.length === 0 && <p className="text-muted-foreground">Nenhum menu ficará visível.</p>}
              <ul className="flex flex-wrap gap-1">
                {menuVisivel.flatMap((g) => g.itens).map((i) => (
                  <li key={i.to}>
                    <Pill tone="info">{i.label}</Pill>
                  </li>
                ))}
              </ul>
              <p className="mt-3 font-mono text-[11px] uppercase text-muted-foreground">{codes.length} permissões concedidas</p>
            </div>
          )}

          <div className="space-y-3">
            {modulos.map(([modulo, itens]) => (
              <div key={modulo} className="rounded-md ring-1 ring-border">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
                  <span className="font-display text-sm font-semibold">{MODULO_LABEL[modulo] ?? modulo}</span>
                  {!somenteLeitura && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => aplicarNivel(modulo, "nenhum")}>
                        Sem acesso
                      </Button>
                      <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => aplicarNivel(modulo, "leitura")}>
                        Somente leitura
                      </Button>
                      <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => aplicarNivel(modulo, "gestao")}>
                        Gestão
                      </Button>
                    </div>
                  )}
                </div>
                <div className="grid gap-2 p-3 sm:grid-cols-3">
                  {itens.map((p) => (
                    <label key={p.code} className="flex items-center gap-2 text-sm">
                      <Switch checked={marcado(p.code)} disabled={somenteLeitura} onCheckedChange={() => alternar(p.code)} />
                      <span>{ACAO_LABEL[p.action] ?? p.action}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onFechar}>
            Fechar
          </Button>
          {!somenteLeitura && (
            <Button
              disabled={salvando}
              onClick={async () => {
                setSalvando(true);
                try {
                  await onSalvar({
                    ...(perfil ? { id: perfil.id } : {}),
                    ...(base ? { baseRoleId: base } : {}),
                    name: nome,
                    description: descricao,
                    active: ativo,
                    codes,
                  });
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Não foi possível salvar.");
                } finally {
                  setSalvando(false);
                }
              }}
            >
              {salvando ? "Salvando..." : "Salvar perfil"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
