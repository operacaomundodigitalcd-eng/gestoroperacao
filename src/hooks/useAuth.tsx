import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { meuAcesso, type EscopoItem } from "@/lib/acesso.functions";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [nome, setNome] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const buscarAcesso = useServerFn(meuAcesso);

  useEffect(() => {
    let active = true;

    const carregarPerfil = async (uid: string) => {
      const { data: perfil } = await supabase.from("profiles").select("nome").eq("id", uid).maybeSingle();
      if (!active) return;
      setNome(perfil?.nome ?? "");
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => void carregarPerfil(s.user.id), 0);
      } else {
        setNome("");
      }
    });

    void supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) await carregarPerfil(data.session.user.id);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const { data: acesso, isLoading: carregandoAcesso } = useQuery({
    queryKey: ["meu-acesso", user?.id ?? "anon"],
    queryFn: () => buscarAcesso(),
    enabled: !!user,
    staleTime: 60_000,
  });

  const codes: string[] = acesso?.codes ?? [];
  const escopos: EscopoItem[] = acesso?.escopos ?? [];

  /** Verifica uma permissão pelo código, ex.: can("goals.edit"). */
  const can = (code: string) => codes.includes(code);

  return {
    session,
    user,
    nome,
    loading: loading || (!!user && carregandoAcesso),
    can,
    codes,
    escopos,
    ehSuperAdmin: acesso?.superAdmin ?? false,
    perfilNome: acesso?.perfis[0]?.name ?? null,
  };
}
