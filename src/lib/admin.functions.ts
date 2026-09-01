import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface PapelUsuario {
  id: string;
  user_id: string;
  role: string;
}

/** Lista os grupos de permissão de todos os usuários. Apenas administradores. */
export const listarPapeis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PapelUsuario[]> => {
    const { data: meus, error: erroPapel } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);

    if (erroPapel) throw new Error("Não foi possível validar suas permissões.");
    if (!(meus ?? []).some((r) => r.role === "admin")) {
      throw new Error("Acesso restrito a administradores.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("user_roles").select("id, user_id, role");
    if (error) throw new Error("Não foi possível carregar os grupos de permissão.");
    return (data ?? []) as PapelUsuario[];
  });
