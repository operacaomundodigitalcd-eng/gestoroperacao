import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface EscopoItem {
  scope_type: string;
  scope_id: string | null;
}

export interface AcessoEfetivo {
  superAdmin: boolean;
  perfis: { id: string; name: string }[];
  codes: string[];
  extras: string[];
  restricoes: string[];
  escopos: EscopoItem[];
}

/** Resolve o acesso efetivo de um usuário: super admin > restrições > permissões extras > perfil. */
export async function acessoDe(userId: string): Promise<AcessoEfetivo> {
  const [{ data: vinculos }, { data: excecoes }, { data: escopos }] = await Promise.all([
    supabaseAdmin.from("user_roles").select("role_id, roles(id, name, is_super_admin, active)").eq("user_id", userId),
    supabaseAdmin.from("user_permissions").select("type, permissions(code)").eq("user_id", userId),
    supabaseAdmin.from("user_access_scopes").select("scope_type, scope_id").eq("user_id", userId),
  ]);

  type Vinculo = { roles: { id: string; name: string; is_super_admin: boolean; active: boolean } | null };
  const ativos = ((vinculos ?? []) as unknown as Vinculo[]).map((v) => v.roles).filter((r): r is NonNullable<Vinculo["roles"]> => !!r && r.active);

  const superAdmin = ativos.some((r) => r.is_super_admin);
  const idsPerfis = ativos.map((r) => r.id);

  let doPerfil: string[] = [];
  if (idsPerfis.length) {
    const { data } = await supabaseAdmin
      .from("role_permissions")
      .select("allowed, permissions(code)")
      .in("role_id", idsPerfis)
      .eq("allowed", true);
    doPerfil = ((data ?? []) as unknown as { permissions: { code: string } | null }[])
      .map((d) => d.permissions?.code)
      .filter((c): c is string => !!c);
  }

  const linhas = (excecoes ?? []) as unknown as { type: string; permissions: { code: string } | null }[];
  const extras = linhas.filter((l) => l.type === "ALLOW").map((l) => l.permissions?.code).filter((c): c is string => !!c);
  const restricoes = linhas.filter((l) => l.type === "DENY").map((l) => l.permissions?.code).filter((c): c is string => !!c);

  let codes: string[];
  if (superAdmin) {
    const { data } = await supabaseAdmin.from("permissions").select("code");
    codes = (data ?? []).map((p) => p.code);
  } else {
    codes = Array.from(new Set([...doPerfil, ...extras])).filter((c) => !restricoes.includes(c));
  }

  return {
    superAdmin,
    perfis: ativos.map((r) => ({ id: r.id, name: r.name })),
    codes: codes.sort(),
    extras,
    restricoes,
    escopos: (escopos ?? []) as EscopoItem[],
  };
}

/** Lança erro quando o usuário não possui a permissão exigida. */
export async function exigir(userId: string, code: string): Promise<AcessoEfetivo> {
  const acesso = await acessoDe(userId);
  if (!acesso.codes.includes(code)) {
    throw new Error(`Acesso negado: é necessária a permissão ${code}.`);
  }
  return acesso;
}

/** Registra uma operação de controle de acesso na trilha de auditoria. */
export async function auditar(params: {
  userId: string;
  operacao: string;
  tabela: string;
  registroId?: string | null;
  descricao: string;
  anterior?: unknown;
  novo?: unknown;
}) {
  const { data: perfil } = await supabaseAdmin.from("profiles").select("email").eq("id", params.userId).maybeSingle();
  await supabaseAdmin.from("audit_logs").insert({
    user_id: params.userId,
    user_email: perfil?.email ?? null,
    operacao: params.operacao,
    tabela: params.tabela,
    registro_id: params.registroId ?? null,
    descricao: params.descricao,
    valor_anterior: (params.anterior ?? null) as never,
    valor_novo: (params.novo ?? null) as never,
  });
}
