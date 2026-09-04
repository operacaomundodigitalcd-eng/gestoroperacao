import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell, Painel } from "@/components/AppShell";
import { Pill } from "@/components/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { useTabela } from "@/lib/dados";
import { listarPapeis, type PapelUsuario } from "@/lib/admin.functions";
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
interface Log {
  id: string;
  operacao: string;
  tabela: string;
  descricao: string | null;
  user_email: string | null;
  created_at: string;
}

function Administracao() {
  const { can } = useAuth();
  const ehAdmin = can("audit.view");
  const buscarPapeis = useServerFn(listarPapeis);
  const { data: perfis = [] } = useTabela<Perfil>("profiles", "id, nome, email, created_at", "nome");
  const { data: papeis = [] } = useQuery<PapelUsuario[]>({
    queryKey: ["papeis-admin"],
    queryFn: () => buscarPapeis(),
    enabled: ehAdmin,
  });
  const { data: logs = [] } = useTabela<Log>("audit_logs", "id, operacao, tabela, descricao, user_email, created_at", "created_at");

  const papeisDe = (id: string) => papeis.filter((p) => p.user_id === id).map((p) => ROLE_LABEL[p.role] ?? p.role);


  return (
    <AppShell titulo="Usuários e Auditoria" breadcrumb="07 · Administração">
      {!ehAdmin && (
        <div className="border-l-2 border-warning bg-warning/10 p-3 text-sm">
          Você está visualizando apenas os registros permitidos ao seu grupo de permissão.
        </div>
      )}

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
