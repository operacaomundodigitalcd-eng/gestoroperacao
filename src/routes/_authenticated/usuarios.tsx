import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AppShell, Painel } from "@/components/AppShell";
import { Pill } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useTabela } from "@/lib/dados";
import {
  atualizarUsuario,
  criarUsuario,
  listarPerfis,
  listarPermissoes,
  listarUsuarios,
  permissoesEfetivas,
  type EscopoItem,
  type UsuarioRow,
} from "@/lib/acesso.functions";

export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários · Ritmo" },
      { name: "description", content: "Cadastro de usuários do sistema com perfil de acesso, vínculo com colaborador, escopo de dados e permissões efetivas." },
      { property: "og:title", content: "Usuários · Ritmo" },
      { property: "og:description", content: "Gestão de credenciais, perfis e escopo de acesso." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Usuarios,
});

const ESCOPOS = [
  { value: "COMPANY", label: "Toda a empresa" },
  { value: "DEPARTMENT", label: "Departamentos selecionados" },
  { value: "TEAM", label: "Equipes selecionadas" },
  { value: "SUBGROUP", label: "Subgrupos selecionados" },
  { value: "EMPLOYEE", label: "Colaboradores selecionados" },
  { value: "SELF", label: "Somente dados próprios" },
];

interface Opcao {
  id: string;
  nome: string;
  cpf?: string | null;
  email?: string | null;
  matricula?: string | null;
}
interface LogRow {
  id: string;
  descricao: string | null;
  operacao: string;
  registro_id: string | null;
  user_email: string | null;
  created_at: string;
}

function Usuarios() {
  const { can } = useAuth();
  const qc = useQueryClient();
  const fnUsuarios = useServerFn(listarUsuarios);
  const fnPerfis = useServerFn(listarPerfis);
  const fnCriar = useServerFn(criarUsuario);

  const { data: usuarios = [] } = useQuery({ queryKey: ["usuarios"], queryFn: () => fnUsuarios(), enabled: can("users.view") });
  const { data: perfis = [] } = useQuery({ queryKey: ["perfis"], queryFn: () => fnPerfis(), enabled: can("users.view") });
  const { data: colaboradores = [] } = useTabela<Opcao>("employees", "id, nome, cpf, email, matricula", "nome");

  const [novo, setNovo] = useState(false);
  const [detalhe, setDetalhe] = useState<UsuarioRow | null>(null);
  const perfisAtivos = perfis.filter((p) => p.active);

  return (
    <AppShell
      titulo="Usuários"
      breadcrumb="07 · Administração"
      acoes={
        can("users.create") && (
          <Button size="sm" onClick={() => setNovo(true)}>
            + Novo Usuário
          </Button>
        )
      }
    >
      <Painel titulo="Contas de acesso" descricao={`${usuarios.length} usuários`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5 pr-3 font-medium">Usuário</th>
                <th className="px-3 py-2.5 font-medium">E-mail</th>
                <th className="px-3 py-2.5 font-medium">Colaborador</th>
                <th className="px-3 py-2.5 font-medium">Perfil de acesso</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="py-2.5 pl-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {usuarios.map((u) => (
                <tr key={u.user_id} className="transition-colors hover:bg-sand/40">
                  <td className="py-3 pr-3 font-medium">{u.nome}</td>
                  <td className="px-3 py-3 font-mono text-[12px] text-muted-foreground">{u.email}</td>
                  <td className="px-3 py-3 text-muted-foreground">{u.employee_nome ?? "—"}</td>
                  <td className="px-3 py-3">{u.role_nome ? <Pill tone="info">{u.role_nome}</Pill> : "—"}</td>
                  <td className="px-3 py-3">
                    <Pill tone={u.status === "ativo" ? "success" : "warning"}>{u.status}</Pill>
                  </td>
                  <td className="py-3 pl-3">
                    <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" onClick={() => setDetalhe(u)}>
                      Abrir
                    </Button>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground">
                    Nenhum usuário visível.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Painel>

      <Dialog open={novo} onOpenChange={setNovo}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Novo usuário</DialogTitle>
          </DialogHeader>
          <NovoUsuario
            perfis={perfisAtivos.map((p) => ({ id: p.id, nome: p.name }))}
            colaboradores={colaboradores}
            onSalvar={async (v) => {
              await fnCriar({ data: v });
              toast.success("Usuário criado.");
              void qc.invalidateQueries({ queryKey: ["usuarios"] });
              setNovo(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {detalhe && (
        <DetalheUsuario
          usuario={detalhe}
          perfis={perfisAtivos.map((p) => ({ id: p.id, nome: p.name }))}
          colaboradores={colaboradores}
          onFechar={() => setDetalhe(null)}
        />
      )}
    </AppShell>
  );
}

function SeletorEscopo({
  escopos,
  onChange,
}: {
  escopos: EscopoItem[];
  onChange: (e: EscopoItem[]) => void;
}) {
  const [tipo, setTipo] = useState(escopos[0]?.scope_type ?? "COMPANY");
  const { data: departamentos = [] } = useTabela<Opcao>("departments", "id, nome", "nome");
  const { data: equipes = [] } = useTabela<Opcao>("teams", "id, nome", "nome");
  const { data: subgrupos = [] } = useTabela<Opcao>("subgroups", "id, nome", "nome");
  const { data: colaboradores = [] } = useTabela<Opcao>("employees", "id, nome", "nome");

  const alvos = tipo === "DEPARTMENT" ? departamentos : tipo === "TEAM" ? equipes : tipo === "SUBGROUP" ? subgrupos : tipo === "EMPLOYEE" ? colaboradores : [];
  const selecionados = escopos.filter((e) => e.scope_type === tipo).map((e) => e.scope_id);

  const trocarTipo = (t: string) => {
    setTipo(t);
    onChange(t === "COMPANY" || t === "SELF" ? [{ scope_type: t, scope_id: null }] : []);
  };

  const alternar = (id: string) => {
    const existe = escopos.some((e) => e.scope_type === tipo && e.scope_id === id);
    onChange(existe ? escopos.filter((e) => !(e.scope_type === tipo && e.scope_id === id)) : [...escopos.filter((e) => e.scope_type === tipo), { scope_type: tipo, scope_id: id }]);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">Escopo de acesso</Label>
      <Select value={tipo} onValueChange={trocarTipo}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ESCOPOS.map((e) => (
            <SelectItem key={e.value} value={e.value}>
              {e.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {alvos.length > 0 && (
        <div className="max-h-40 space-y-1 overflow-y-auto rounded-md p-2 ring-1 ring-border">
          {alvos.map((a) => (
            <label key={a.id} className="flex items-center gap-2 text-sm">
              <Switch checked={selecionados.includes(a.id)} onCheckedChange={() => alternar(a.id)} />
              <span>{a.nome}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function NovoUsuario({
  perfis,
  colaboradores,
  onSalvar,
}: {
  perfis: { id: string; nome: string }[];
  colaboradores: Opcao[];
  onSalvar: (v: {
    nome: string;
    email: string;
    senha: string;
    roleId: string;
    employeeId?: string;
    status: string;
    validFrom?: string;
    validTo?: string;
    escopos: EscopoItem[];
  }) => Promise<void>;
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [roleId, setRoleId] = useState("");
  const [busca, setBusca] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [status, setStatus] = useState("ativo");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [escopos, setEscopos] = useState<EscopoItem[]>([{ scope_type: "COMPANY", scope_id: null }]);
  const [salvando, setSalvando] = useState(false);

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) return colaboradores.slice(0, 8);
    return colaboradores
      .filter((c) => [c.nome, c.cpf, c.email, c.matricula].some((v) => (v ?? "").toLowerCase().includes(t)))
      .slice(0, 8);
  }, [busca, colaboradores]);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label className="mb-1.5 block text-xs">Nome *</Label>
        <Input value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>
      <div>
        <Label className="mb-1.5 block text-xs">E-mail *</Label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <Label className="mb-1.5 block text-xs">Senha inicial *</Label>
        <Input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
      </div>
      <div>
        <Label className="mb-1.5 block text-xs">Perfil de acesso *</Label>
        <Select value={roleId} onValueChange={setRoleId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {perfis.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="sm:col-span-2">
        <Label className="mb-1.5 block text-xs">Vincular a colaborador existente (nome, CPF, e-mail ou matrícula)</Label>
        <Input value={busca} placeholder="Pesquisar colaborador" onChange={(e) => setBusca(e.target.value)} />
        <div className="mt-2 flex flex-wrap gap-1">
          {filtrados.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setEmployeeId(employeeId === c.id ? "" : c.id)}
              className={`rounded-sm px-2 py-1 text-[11px] ring-1 ${employeeId === c.id ? "bg-foreground text-background" : "ring-border"}`}
            >
              {c.nome}
            </button>
          ))}
          {colaboradores.length === 0 && <span className="text-sm text-muted-foreground">Nenhum colaborador cadastrado.</span>}
        </div>
      </div>

      <div>
        <Label className="mb-1.5 block text-xs">Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="mb-1.5 block text-xs">Início</Label>
          <Input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs">Término</Label>
          <Input type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} />
        </div>
      </div>

      <div className="sm:col-span-2">
        <SeletorEscopo escopos={escopos} onChange={setEscopos} />
      </div>

      <DialogFooter className="sm:col-span-2">
        <Button
          disabled={salvando}
          onClick={async () => {
            setSalvando(true);
            try {
              await onSalvar({
                nome,
                email,
                senha,
                roleId,
                status,
                escopos,
                ...(employeeId ? { employeeId } : {}),
                ...(validFrom ? { validFrom } : {}),
                ...(validTo ? { validTo } : {}),
              });
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Não foi possível criar o usuário.");
            } finally {
              setSalvando(false);
            }
          }}
        >
          {salvando ? "Salvando..." : "Criar usuário"}
        </Button>
      </DialogFooter>
    </div>
  );
}

function DetalheUsuario({
  usuario,
  perfis,
  colaboradores,
  onFechar,
}: {
  usuario: UsuarioRow;
  perfis: { id: string; nome: string }[];
  colaboradores: Opcao[];
  onFechar: () => void;
}) {
  const qc = useQueryClient();
  const fnAtualizar = useServerFn(atualizarUsuario);
  const fnEfetivas = useServerFn(permissoesEfetivas);
  const fnPerms = useServerFn(listarPermissoes);

  const [roleId, setRoleId] = useState(usuario.role_id ?? "");
  const [employeeId, setEmployeeId] = useState(usuario.employee_id ?? "");
  const [status, setStatus] = useState(usuario.status);
  const [validFrom, setValidFrom] = useState(usuario.valid_from ?? "");
  const [validTo, setValidTo] = useState(usuario.valid_to ?? "");
  const [escopos, setEscopos] = useState<EscopoItem[]>([]);
  const [extras, setExtras] = useState<string[]>([]);
  const [restricoes, setRestricoes] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  const { data: acesso } = useQuery({
    queryKey: ["acesso", usuario.user_id],
    queryFn: async () => {
      const a = await fnEfetivas({ data: { userId: usuario.user_id } });
      setEscopos(a.escopos);
      setExtras(a.extras);
      setRestricoes(a.restricoes);
      return a;
    },
  });
  const { data: permissoes = [] } = useQuery({ queryKey: ["permissoes"], queryFn: () => fnPerms() });
  const { data: logs = [] } = useTabela<LogRow>("audit_logs", "id, descricao, operacao, registro_id, user_email, created_at", "created_at");
  const historico = logs.filter((l) => l.registro_id === usuario.user_id).slice(0, 30);

  const alternarLista = (lista: string[], set: (v: string[]) => void, code: string) =>
    set(lista.includes(code) ? lista.filter((c) => c !== code) : [...lista, code]);

  const salvar = async () => {
    setSalvando(true);
    try {
      await fnAtualizar({
        data: {
          userId: usuario.user_id,
          status,
          escopos,
          extras,
          restricoes,
          employeeId: employeeId || null,
          validFrom: validFrom || null,
          validTo: validTo || null,
          ...(roleId ? { roleId } : {}),
        },
      });
      toast.success("Usuário atualizado.");
      void qc.invalidateQueries({ queryKey: ["usuarios"] });
      void qc.invalidateQueries({ queryKey: ["acesso", usuario.user_id] });
      void qc.invalidateQueries({ queryKey: ["meu-acesso"] });
      onFechar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display">{usuario.nome}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="dados">
          <TabsList>
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="perfil">Perfil</TabsTrigger>
            <TabsTrigger value="escopo">Escopo</TabsTrigger>
            <TabsTrigger value="efetivas">Permissões efetivas</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="grid gap-4 pt-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-xs">E-mail</Label>
              <Input value={usuario.email} readOnly />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Colaborador vinculado</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sem vínculo" />
                </SelectTrigger>
                <SelectContent>
                  {colaboradores.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="mb-1.5 block text-xs">Data de início</Label>
                <Input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs">Data de término</Label>
                <Input type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="perfil" className="space-y-3 pt-4">
            <p className="text-sm">
              Perfil atual: <strong>{usuario.role_nome ?? "—"}</strong>
            </p>
            <Label className="text-xs">Alterar perfil</Label>
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {perfis.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              <div>
                <p className="mb-2 font-mono text-[11px] uppercase text-muted-foreground">Permissões adicionais</p>
                <div className="max-h-52 space-y-1 overflow-y-auto rounded-md p-2 ring-1 ring-border">
                  {permissoes.map((p) => (
                    <label key={`a-${p.code}`} className="flex items-center gap-2 text-[12px]">
                      <Switch checked={extras.includes(p.code)} onCheckedChange={() => alternarLista(extras, setExtras, p.code)} />
                      <span className="font-mono">{p.code}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 font-mono text-[11px] uppercase text-muted-foreground">Restrições adicionais</p>
                <div className="max-h-52 space-y-1 overflow-y-auto rounded-md p-2 ring-1 ring-border">
                  {permissoes.map((p) => (
                    <label key={`r-${p.code}`} className="flex items-center gap-2 text-[12px]">
                      <Switch checked={restricoes.includes(p.code)} onCheckedChange={() => alternarLista(restricoes, setRestricoes, p.code)} />
                      <span className="font-mono">{p.code}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Uma restrição sempre prevalece sobre uma permissão adicional ou do perfil.
            </p>
          </TabsContent>

          <TabsContent value="escopo" className="pt-4">
            <SeletorEscopo escopos={escopos} onChange={setEscopos} />
          </TabsContent>

          <TabsContent value="efetivas" className="space-y-3 pt-4 text-sm">
            {acesso?.superAdmin && <Pill tone="destructive">Administrador Geral · acesso total e irrestrito</Pill>}
            <div>
              <p className="mb-2 font-mono text-[11px] uppercase text-muted-foreground">Pode</p>
              <div className="flex flex-wrap gap-1">
                {(acesso?.codes ?? []).map((c) => (
                  <Pill key={c} tone="success">
                    {c}
                  </Pill>
                ))}
                {!acesso?.codes.length && <span className="text-muted-foreground">Nenhuma permissão.</span>}
              </div>
            </div>
            <div>
              <p className="mb-2 font-mono text-[11px] uppercase text-muted-foreground">Não pode</p>
              <div className="flex flex-wrap gap-1">
                {permissoes
                  .filter((p) => !(acesso?.codes ?? []).includes(p.code))
                  .map((p) => (
                    <Pill key={p.code} tone="muted">
                      {p.code}
                    </Pill>
                  ))}
              </div>
            </div>
            <div>
              <p className="mb-2 font-mono text-[11px] uppercase text-muted-foreground">Escopo</p>
              <div className="flex flex-wrap gap-1">
                {(acesso?.escopos ?? []).map((e, i) => (
                  <Pill key={`${e.scope_type}-${i}`} tone="info">
                    {ESCOPOS.find((x) => x.value === e.scope_type)?.label ?? e.scope_type}
                  </Pill>
                ))}
                {!acesso?.escopos.length && <span className="text-muted-foreground">Sem restrição de escopo.</span>}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="historico" className="pt-4">
            <ul className="divide-y divide-border text-sm">
              {historico.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center gap-3 py-2">
                  <Pill tone="info">{l.operacao}</Pill>
                  <span className="flex-1">{l.descricao}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">{new Date(l.created_at).toLocaleString("pt-BR")}</span>
                </li>
              ))}
              {historico.length === 0 && <li className="py-2 text-muted-foreground">Sem histórico registrado.</li>}
            </ul>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onFechar}>
            Fechar
          </Button>
          <Button disabled={salvando} onClick={salvar}>
            {salvando ? "Salvando..." : "Salvar alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
