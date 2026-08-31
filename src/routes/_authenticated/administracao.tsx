import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Painel } from "@/components/AppShell";
import { Pill } from "@/components/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { useTabela } from "@/lib/dados";
import { ROLE_LABEL } from "@/lib/perf";

export const Route = createFileRoute("/_authenticated/administracao")({
  head: () => ({
    meta: [
      { title: "Usuários e Auditoria · Ritmo" },
      { name: "description", content: "Usuários, grupos de permissão e trilha de auditoria com histórico de operações do sistema." },
      { property: "og:title", content: "Usuários e Auditoria · Ritmo" },
      { property: "og:description", content: "Administração de acessos e rastreabilidade das operações." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Administracao,
});

interface Perfil {
  id: string;
  nome: string;
  email: string;
  created_at: string;
}
interface Papel {
  id: string;
  user_id: string;
  role: string;
}
interface Log {
  id: string;
  operacao: string;
  tabela: string;
  descricao: string | null;
  user_email: string | null;
  created_at: string;
}

function Administracao() {
  const { ehAdmin } = useAuth();
  const { data: perfis = [] } = useTabela<Perfil>("profiles", "id, nome, email, created_at", "nome");
  const { data: papeis = [] } = useTabela<Papel>("user_roles", "id, user_id, role");
  const { data: logs = [] } = useTabela<Log>("audit_logs", "id, operacao, tabela, descricao, user_email, created_at", "created_at");

  const papeisDe = (id: string) => papeis.filter((p) => p.user_id === id).map((p) => ROLE_LABEL[p.role] ?? p.role);

  return (
    <AppShell titulo="Usuários e Auditoria" breadcrumb="07 · Administração">
      {!ehAdmin && (
        <div className="border-l-2 border-warning bg-warning/10 p-3 text-sm">
          Você está visualizando apenas os registros permitidos ao seu grupo de permissão.
        </div>
      )}

      <Painel titulo="Usuários" descricao={`${perfis.length} contas com acesso`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5 pr-3 font-medium">Usuário</th>
                <th className="px-3 py-2.5 font-medium">E-mail</th>
                <th className="px-3 py-2.5 font-medium">Grupos</th>
                <th className="py-2.5 pl-3 font-medium">Criado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {perfis.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-sand/40">
                  <td className="py-3 pr-3 font-medium">{p.nome}</td>
                  <td className="px-3 py-3 font-mono text-[12px] text-muted-foreground">{p.email}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {papeisDe(p.id).map((r) => (
                        <Pill key={r} tone="info">
                          {r}
                        </Pill>
                      ))}
                      {papeisDe(p.id).length === 0 && <span className="text-muted-foreground">—</span>}
                    </div>
                  </td>
                  <td className="py-3 pl-3 font-mono text-[11px] text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
              {perfis.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted-foreground">
                    Nenhum usuário visível.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Painel>

      <Painel titulo="Trilha de auditoria" descricao={`${logs.length} operações registradas`}>
        <ul className="divide-y divide-border text-sm">
          {logs.slice(0, 50).map((l) => (
            <li key={l.id} className="flex flex-wrap items-center gap-3 py-2.5">
              <Pill tone={l.operacao === "excluir" ? "destructive" : l.operacao === "criar" ? "success" : "warning"}>
                {l.operacao}
              </Pill>
              <span className="flex-1">{l.descricao ?? `${l.operacao} em ${l.tabela}`}</span>
              <span className="font-mono text-[11px] text-muted-foreground">{l.user_email ?? "sistema"}</span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {new Date(l.created_at).toLocaleString("pt-BR")}
              </span>
            </li>
          ))}
          {logs.length === 0 && <li className="py-2.5 text-muted-foreground">Nenhum registro de auditoria.</li>}
        </ul>
      </Painel>
    </AppShell>
  );
}
