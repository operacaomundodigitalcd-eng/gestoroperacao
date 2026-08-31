import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acesso · Ritmo Gestão de Performance" },
      { name: "description", content: "Entre com e-mail e senha para acessar os indicadores, metas e dashboards da operação." },
      { property: "og:title", content: "Acesso · Ritmo Gestão de Performance" },
      { property: "og:description", content: "Autenticação segura da plataforma de gestão de performance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const MAX_TENTATIVAS = 5;
const BLOQUEIO_MS = 5 * 60 * 1000;

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [lembrar, setLembrar] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [bloqueadoAte, setBloqueadoAte] = useState<number | null>(null);

  useEffect(() => {
    const salvo = localStorage.getItem("ritmo:email");
    if (salvo) setEmail(salvo);
    const bloqueio = Number(localStorage.getItem("ritmo:bloqueio") ?? 0);
    if (bloqueio > Date.now()) setBloqueadoAte(bloqueio);
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const registrarFalha = () => {
    const n = Number(localStorage.getItem("ritmo:tentativas") ?? 0) + 1;
    localStorage.setItem("ritmo:tentativas", String(n));
    if (n >= MAX_TENTATIVAS) {
      const ate = Date.now() + BLOQUEIO_MS;
      localStorage.setItem("ritmo:bloqueio", String(ate));
      localStorage.setItem("ritmo:tentativas", "0");
      setBloqueadoAte(ate);
      toast.error("Acesso bloqueado por 5 minutos após tentativas incorretas consecutivas.");
    } else {
      toast.error(`Credenciais inválidas. Tentativa ${n} de ${MAX_TENTATIVAS}.`);
    }
  };

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bloqueadoAte && bloqueadoAte > Date.now()) {
      toast.error("Acesso temporariamente bloqueado. Tente novamente em alguns minutos.");
      return;
    }
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    setCarregando(false);
    if (error) return registrarFalha();
    localStorage.setItem("ritmo:tentativas", "0");
    if (lembrar) localStorage.setItem("ritmo:email", email.trim());
    else localStorage.removeItem("ritmo:email");
    void navigate({ to: "/dashboard" });
  };

  const criarConta = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { nome } },
    });
    setCarregando(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Conta criada. Verifique seu e-mail se a confirmação estiver ativa.");
    void navigate({ to: "/dashboard" });
  };

  const recuperar = async () => {
    if (!email.trim()) {
      toast.error("Informe o e-mail para recuperar a senha.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Enviamos um link de redefinição para o seu e-mail.");

  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center bg-sidebar-primary font-display text-sm font-bold text-sidebar-primary-foreground">
            R
          </span>
          <span className="font-display font-bold tracking-tight">
            Ritmo<span className="text-sidebar-primary">.</span>
          </span>
        </div>
        <div className="max-w-md">
          <h2 className="font-display text-4xl font-bold leading-tight tracking-tight">
            Gestão de indicadores, metas e performance de equipes.
          </h2>
          <p className="mt-4 text-sm text-sidebar-foreground/70">
            Score consolidado, semáforo de atingimento, comparativos mensais e anuais, planos de ação e apresentações
            executivas — em um único lugar.
          </p>
        </div>
        <p className="font-mono text-[11px] text-sidebar-foreground/40">
          Acesso controlado por grupos de permissão · auditoria completa
        </p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl font-bold tracking-tight">Acessar a plataforma</h1>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">Autenticação obrigatória</p>

          <Tabs defaultValue="entrar" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="entrar">Entrar</TabsTrigger>
              <TabsTrigger value="criar">Criar acesso</TabsTrigger>
            </TabsList>

            <TabsContent value="entrar">
              <form onSubmit={entrar} className="space-y-4">
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="senha">Senha</Label>
                  <Input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={lembrar} onCheckedChange={(v) => setLembrar(Boolean(v))} />
                    Lembrar acesso
                  </label>
                  <button type="button" onClick={recuperar} className="text-sm underline underline-offset-4">
                    Esqueci a senha
                  </button>
                </div>
                <Button type="submit" className="w-full" disabled={carregando}>
                  {carregando ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="criar">
              <form onSubmit={criarConta} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome completo</Label>
                  <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="email2">E-mail</Label>
                  <Input id="email2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="senha2">Senha</Label>
                  <Input
                    id="senha2"
                    type="password"
                    minLength={8}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                  />
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">Mínimo de 8 caracteres.</p>
                </div>
                <Button type="submit" className="w-full" disabled={carregando}>
                  {carregando ? "Criando..." : "Criar acesso"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-6 font-mono text-[10px] leading-relaxed text-muted-foreground">
            O primeiro acesso com o e-mail cinthia@mundodigitaltech.com.br recebe automaticamente o grupo Administrador
            Geral. A senha é definida pela própria usuária no primeiro cadastro.
          </p>
        </div>
      </div>
    </div>
  );
}
