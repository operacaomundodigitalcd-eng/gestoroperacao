import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MESES } from "@/lib/perf";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

type Item = { to: string; label: string; perm: string };
type Grupo = { titulo: string; codigo: string; itens: Item[] };

export const MENU: Grupo[] = [
  { titulo: "Dashboard", codigo: "01", itens: [{ to: "/dashboard", label: "Visão Gerencial", perm: "dashboard.view" }] },
  {
    titulo: "Performance",
    codigo: "02",
    itens: [
      { to: "/indicadores", label: "Indicadores", perm: "indicators.view" },
      { to: "/corporativo", label: "Corporativo", perm: "dashboard.executive_view" },
      { to: "/metas", label: "Metas", perm: "goals.view" },
      { to: "/resultados", label: "Resultados", perm: "results.view" },
      { to: "/comparativos", label: "Comparativos", perm: "results.view" },
      { to: "/rankings", label: "Rankings", perm: "results.view" },
    ],
  },
  {
    titulo: "Pessoas",
    codigo: "03",
    itens: [
      { to: "/colaboradores", label: "Colaboradores", perm: "employees.view" },
      { to: "/equipes", label: "Equipes", perm: "employees.view" },
      { to: "/departamentos", label: "Departamentos", perm: "employees.view" },
    ],
  },
  {
    titulo: "Gestão",
    codigo: "04",
    itens: [
      { to: "/analises", label: "Análises", perm: "analyses.view" },
      { to: "/planos-de-acao", label: "Planos de Ação", perm: "action_plans.view" },
      { to: "/fechamento", label: "Fechamento Mensal", perm: "results.view" },
    ],
  },
  { titulo: "Apresentações", codigo: "05", itens: [{ to: "/apresentacoes", label: "Apresentações", perm: "presentations.view" }] },
  { titulo: "Relatórios", codigo: "06", itens: [{ to: "/relatorios", label: "Relatórios", perm: "reports.view" }] },
  {
    titulo: "Administração",
    codigo: "07",
    itens: [
      { to: "/usuarios", label: "Usuários", perm: "users.view" },
      { to: "/perfis-de-acesso", label: "Perfis de Acesso", perm: "roles.view" },
      { to: "/administracao", label: "Auditoria", perm: "audit.view" },
    ],
  },
];

function NavConteudo({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { can, loading } = useAuth();
  const hoje = new Date();
  const grupos = MENU.map((g) => ({ ...g, itens: g.itens.filter((i) => loading || can(i.perm)) })).filter((g) => g.itens.length);

  return (
    <div className="flex h-full flex-col gap-5 bg-sidebar px-4 py-5 text-sidebar-foreground">
      <Link to="/dashboard" onClick={onNavigate} className="flex items-center gap-2 px-1">
        <span className="grid size-8 place-items-center bg-sidebar-primary font-display text-sm font-bold text-sidebar-primary-foreground">
          R
        </span>
        <span className="font-display font-bold tracking-tight">
          Ritmo<span className="text-sidebar-primary">.</span>
        </span>
      </Link>

      <nav className="flex flex-col gap-3 overflow-y-auto text-sm">
        {grupos.map((grupo) => (
          <div key={grupo.titulo}>
            <p className="px-3 pb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/40">
              {grupo.codigo} · {grupo.titulo}
            </p>
            {grupo.itens.map((item) => {
              const ativo = path === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={cn(
                    "-mx-1 flex items-center justify-between rounded-md px-3 py-2 transition-colors",
                    ativo
                      ? "bg-sidebar-primary font-semibold text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto rounded-md bg-sidebar-accent px-3 py-3">
        <p className="font-mono text-[10px] text-sidebar-foreground/50">COMPETÊNCIA</p>
        <p className="font-display text-sm font-semibold">
          {MESES[hoje.getMonth()]} / {hoje.getFullYear()}
        </p>
      </div>
    </div>
  );
}

export function AppShell({
  titulo,
  breadcrumb,
  acoes,
  children,
}: {
  titulo: string;
  breadcrumb?: string;
  acoes?: ReactNode;
  children: ReactNode;
}) {
  const { nome, perfilNome } = useAuth();
  const [aberto, setAberto] = useState(false);
  const primeiroNome = (nome || "usuário").split(" ")[0];

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="fixed h-screen w-60">
          <NavConteudo />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
            <Sheet open={aberto} onOpenChange={setAberto}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 border-0 p-0">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <NavConteudo onNavigate={() => setAberto(false)} />
              </SheetContent>
            </Sheet>

            <div className="mr-auto flex flex-wrap items-baseline gap-2">
              <h1 className="font-display text-xl font-bold tracking-tight">{titulo}</h1>
              <span className="font-mono text-[11px] text-muted-foreground">{breadcrumb ?? "Ritmo"}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">{acoes}</div>

            <div className="hidden items-center gap-3 border-l border-border pl-3 md:flex">
              <div className="text-right leading-tight">
                <p className="text-[13px] font-semibold">{primeiroNome}</p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {perfilNome ?? "Sem perfil"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Sair"
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = "/auth";
                }}
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-5 p-4 sm:p-5">{children}</main>

        <footer className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 font-mono text-[11px] text-muted-foreground">
          <span>Ritmo · Plataforma de gestão de performance</span>
          <span>Dados protegidos por controle de acesso e auditoria</span>
        </footer>
      </div>
    </div>
  );
}

export function Painel({
  titulo,
  descricao,
  acoes,
  children,
  className,
}: {
  titulo?: string;
  descricao?: string;
  acoes?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("animate-rise rounded-lg bg-card ring-1 ring-border", className)}>
      {titulo && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
          <div>
            <h2 className="font-display text-base font-bold tracking-tight">{titulo}</h2>
            {descricao && <p className="font-mono text-[11px] text-muted-foreground">{descricao}</p>}
          </div>
          {acoes}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
