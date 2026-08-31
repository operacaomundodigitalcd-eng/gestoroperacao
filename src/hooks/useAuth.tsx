import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "gestor" | "supervisor" | "colaborador" | "visualizador";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [nome, setNome] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const carregarPerfil = async (uid: string) => {
      const [{ data: rolesData }, { data: perfil }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", uid),
        supabase.from("profiles").select("nome").eq("id", uid).maybeSingle(),
      ]);
      if (!active) return;
      setRoles((rolesData ?? []).map((r) => r.role as AppRole));
      setNome(perfil?.nome ?? "");
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => void carregarPerfil(s.user.id), 0);
      } else {
        setRoles([]);
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

  const temPapel = (...r: AppRole[]) => roles.some((x) => r.includes(x));

  return {
    session,
    user,
    roles,
    nome,
    loading,
    temPapel,
    podeGerenciar: temPapel("admin", "gestor"),
    podeLancar: temPapel("admin", "gestor", "supervisor"),
    ehAdmin: temPapel("admin"),
  };
}
