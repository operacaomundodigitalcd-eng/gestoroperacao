import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface Permissao {
  id: string;
  code: string;
  module: string;
  action: string;
  description: string | null;
}

export interface PerfilRow {
  id: string;
  name: string;
  description: string | null;
  is_system_role: boolean;
  is_super_admin: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by_nome: string | null;
  usuarios: number;
  codes: string[];
}

export interface EscopoItem {
  scope_type: string;
  scope_id: string | null;
}

export interface AcessoUsuario {
  superAdmin: boolean;
  perfis: { id: string; name: string }[];
  codes: string[];
  extras: string[];
  restricoes: string[];
  escopos: EscopoItem[];
}

export interface UsuarioRow {
  user_id: string;
  nome: string;
  email: string;
  status: string;
  employee_id: string | null;
  employee_nome: string | null;
  valid_from: string | null;
  valid_to: string | null;
  role_id: string | null;
  role_nome: string | null;
  created_at: string;
}

/** Acesso efetivo do usuário autenticado (usado pelo menu e pelos botões). */
export const meuAcesso = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AcessoUsuario> => {
    const { acessoDe } = await import("./acesso.server");
    return acessoDe(context.userId);
  });

/** Catálogo completo de permissões do sistema. */
export const listarPermissoes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Permissao[]> => {
    const { exigir } = await import("./acesso.server");
    await exigir(context.userId, "roles.view");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("permissions").select("id, code, module, action, description").order("module").order("action");
    if (error) throw new Error("Não foi possível carregar as permissões.");
    return (data ?? []) as Permissao[];
  });

/** Lista os perfis de acesso com contagem de usuários e permissões. */
export const listarPerfis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PerfilRow[]> => {
    const { exigir } = await import("./acesso.server");
    await exigir(context.userId, "roles.view");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: perfis }, { data: vinculos }, { data: rp }, { data: perfisUsuarios }] = await Promise.all([
      supabaseAdmin.from("roles").select("*").order("name"),
      supabaseAdmin.from("user_roles").select("role_id"),
      supabaseAdmin.from("role_permissions").select("role_id, allowed, permissions(code)"),
      supabaseAdmin.from("profiles").select("id, nome"),
    ]);

    const nomePorId = new Map((perfisUsuarios ?? []).map((p) => [p.id, p.nome]));
    const permsPorPerfil = new Map<string, string[]>();
    for (const linha of (rp ?? []) as unknown as { role_id: string; allowed: boolean; permissions: { code: string } | null }[]) {
      if (!linha.allowed || !linha.permissions) continue;
      const atual = permsPorPerfil.get(linha.role_id) ?? [];
      atual.push(linha.permissions.code);
      permsPorPerfil.set(linha.role_id, atual);
    }

    return (perfis ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      is_system_role: r.is_system_role,
      is_super_admin: r.is_super_admin,
      active: r.active,
      created_at: r.created_at,
      updated_at: r.updated_at,
      created_by_nome: r.created_by ? (nomePorId.get(r.created_by) ?? null) : null,
      usuarios: (vinculos ?? []).filter((v) => v.role_id === r.id).length,
      codes: permsPorPerfil.get(r.id) ?? [],
    }));
  });

interface SalvarPerfilInput {
  id?: string;
  name: string;
  description?: string;
  active: boolean;
  codes: string[];
  baseRoleId?: string;
}

/** Cria ou atualiza um perfil e sua matriz de permissões. */
export const salvarPerfil = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: SalvarPerfilInput) => {
    if (!d.name?.trim()) throw new Error("Informe o nome do perfil.");
    return d;
  })
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    const { exigir, auditar } = await import("./acesso.server");
    await exigir(context.userId, data.id ? "roles.edit" : "roles.create");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let codes = data.codes;
    if (!data.id && data.baseRoleId) {
      const { data: base } = await supabaseAdmin
        .from("role_permissions")
        .select("permissions(code)")
        .eq("role_id", data.baseRoleId)
        .eq("allowed", true);
      const doBase = ((base ?? []) as unknown as { permissions: { code: string } | null }[])
        .map((b) => b.permissions?.code)
        .filter((c): c is string => !!c);
      codes = Array.from(new Set([...codes, ...doBase]));
    }

    let roleId = data.id;
    if (roleId) {
      const { data: atual } = await supabaseAdmin.from("roles").select("*").eq("id", roleId).maybeSingle();
      if (atual?.is_system_role) throw new Error("O perfil Administrador Geral não pode ser alterado.");
      const { error } = await supabaseAdmin
        .from("roles")
        .update({ name: data.name, description: data.description ?? null, active: data.active, updated_by: context.userId })
        .eq("id", roleId);
      if (error) throw new Error(error.message);
      await auditar({
        userId: context.userId,
        operacao: "editar",
        tabela: "roles",
        registroId: roleId,
        descricao: `Perfil "${data.name}" atualizado.`,
        anterior: atual,
        novo: { ...atual, name: data.name, description: data.description, active: data.active },
      });
    } else {
      const { data: criado, error } = await supabaseAdmin
        .from("roles")
        .insert({ name: data.name, description: data.description ?? null, active: data.active, created_by: context.userId, updated_by: context.userId })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      roleId = criado.id;
      await auditar({ userId: context.userId, operacao: "criar", tabela: "roles", registroId: roleId, descricao: `Perfil "${data.name}" criado.`, novo: criado });
    }

    await salvarMatriz(roleId!, codes, context.userId);
    return { id: roleId! };
  });

async function salvarMatriz(roleId: string, codes: string[], autor: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { auditar } = await import("./acesso.server");
  const { data: perms } = await supabaseAdmin.from("permissions").select("id, code");
  const idPorCode = new Map((perms ?? []).map((p) => [p.code, p.id]));
  const { data: antes } = await supabaseAdmin.from("role_permissions").select("permissions(code)").eq("role_id", roleId);
  const anteriores = ((antes ?? []) as unknown as { permissions: { code: string } | null }[]).map((a) => a.permissions?.code);

  await supabaseAdmin.from("role_permissions").delete().eq("role_id", roleId);
  const linhas = codes.map((c) => idPorCode.get(c)).filter((id): id is string => !!id).map((permission_id) => ({ role_id: roleId, permission_id }));
  if (linhas.length) {
    const { error } = await supabaseAdmin.from("role_permissions").insert(linhas);
    if (error) throw new Error(error.message);
  }
  await auditar({
    userId: autor,
    operacao: "editar",
    tabela: "role_permissions",
    registroId: roleId,
    descricao: "Permissões do perfil atualizadas.",
    anterior: anteriores,
    novo: codes,
  });
}

/** Salva apenas a matriz de permissões de um perfil. */
export const salvarPermissoesPerfil = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { roleId: string; codes: string[] }) => d)
  .handler(async ({ data, context }) => {
    const { exigir } = await import("./acesso.server");
    await exigir(context.userId, "roles.manage_permissions");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: perfil } = await supabaseAdmin.from("roles").select("is_system_role").eq("id", data.roleId).maybeSingle();
    if (perfil?.is_system_role) throw new Error("As permissões do Administrador Geral não podem ser alteradas.");
    await salvarMatriz(data.roleId, data.codes, context.userId);
    return { ok: true };
  });

/** Duplica um perfil existente com todas as suas permissões. */
export const duplicarPerfil = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { roleId: string; name: string }) => {
    if (!d.name?.trim()) throw new Error("Informe o nome do novo perfil.");
    return d;
  })
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    const { exigir, auditar } = await import("./acesso.server");
    await exigir(context.userId, "roles.duplicate");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: origem } = await supabaseAdmin.from("roles").select("description").eq("id", data.roleId).maybeSingle();
    const { data: criado, error } = await supabaseAdmin
      .from("roles")
      .insert({ name: data.name, description: origem?.description ?? null, created_by: context.userId, updated_by: context.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const { data: base } = await supabaseAdmin.from("role_permissions").select("permission_id").eq("role_id", data.roleId).eq("allowed", true);
    if ((base ?? []).length) {
      await supabaseAdmin.from("role_permissions").insert((base ?? []).map((b) => ({ role_id: criado.id, permission_id: b.permission_id })));
    }
    await auditar({ userId: context.userId, operacao: "criar", tabela: "roles", registroId: criado.id, descricao: `Perfil "${data.name}" duplicado.`, novo: criado });
    return { id: criado.id };
  });

/** Ativa ou inativa um perfil. */
export const alternarPerfil = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { roleId: string; active: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { exigir, auditar } = await import("./acesso.server");
    await exigir(context.userId, "roles.inactivate");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("roles").update({ active: data.active, updated_by: context.userId }).eq("id", data.roleId);
    if (error) throw new Error(error.message);
    await auditar({
      userId: context.userId,
      operacao: "editar",
      tabela: "roles",
      registroId: data.roleId,
      descricao: data.active ? "Perfil reativado." : "Perfil inativado.",
      novo: { active: data.active },
    });
    return { ok: true };
  });

/** Exclui um perfil que não esteja em uso. */
export const excluirPerfil = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { roleId: string }) => d)
  .handler(async ({ data, context }) => {
    const { exigir, auditar } = await import("./acesso.server");
    await exigir(context.userId, "roles.delete");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: emUso } = await supabaseAdmin.from("user_roles").select("user_id").eq("role_id", data.roleId);
    if ((emUso ?? []).length) throw new Error("Este perfil está atribuído a usuários e não pode ser excluído.");
    const { error } = await supabaseAdmin.from("roles").delete().eq("id", data.roleId);
    if (error) throw new Error(error.message);
    await auditar({ userId: context.userId, operacao: "excluir", tabela: "roles", registroId: data.roleId, descricao: "Perfil excluído." });
    return { ok: true };
  });

/** Lista os usuários do sistema com perfil, colaborador vinculado e status. */
export const listarUsuarios = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UsuarioRow[]> => {
    const { exigir } = await import("./acesso.server");
    await exigir(context.userId, "users.view");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: perfis }, { data: contas }, { data: vinculos }, { data: colaboradores }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, nome, email, created_at").order("nome"),
      supabaseAdmin.from("user_accounts").select("user_id, employee_id, status, valid_from, valid_to"),
      supabaseAdmin.from("user_roles").select("user_id, role_id, roles(name)"),
      supabaseAdmin.from("employees").select("id, nome"),
    ]);

    const conta = new Map((contas ?? []).map((c) => [c.user_id, c]));
    const nomeColab = new Map((colaboradores ?? []).map((c) => [c.id, c.nome]));
    const vinculo = new Map(
      ((vinculos ?? []) as unknown as { user_id: string; role_id: string | null; roles: { name: string } | null }[]).map((v) => [v.user_id, v]),
    );

    return (perfis ?? []).map((p) => {
      const c = conta.get(p.id);
      const v = vinculo.get(p.id);
      return {
        user_id: p.id,
        nome: p.nome,
        email: p.email,
        status: c?.status ?? "ativo",
        employee_id: c?.employee_id ?? null,
        employee_nome: c?.employee_id ? (nomeColab.get(c.employee_id) ?? null) : null,
        valid_from: c?.valid_from ?? null,
        valid_to: c?.valid_to ?? null,
        role_id: v?.role_id ?? null,
        role_nome: v?.roles?.name ?? null,
        created_at: p.created_at,
      };
    });
  });

interface UsuarioInput {
  email: string;
  nome: string;
  senha?: string;
  roleId: string;
  employeeId?: string | null;
  status?: string;
  validFrom?: string | null;
  validTo?: string | null;
  escopos?: EscopoItem[];
}

/** Cria uma credencial de acesso e define perfil e escopo. */
export const criarUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: UsuarioInput) => {
    if (!d.email?.trim()) throw new Error("Informe o e-mail.");
    if (!d.roleId) throw new Error("Selecione o perfil de acesso.");
    if (!d.senha || d.senha.length < 8) throw new Error("A senha inicial deve ter ao menos 8 caracteres.");
    return d;
  })
  .handler(async ({ data, context }): Promise<{ userId: string }> => {
    const { exigir, auditar } = await import("./acesso.server");
    await exigir(context.userId, "users.create");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: criado, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.senha,
      email_confirm: true,
      user_metadata: { nome: data.nome },
    });
    if (error || !criado.user) throw new Error(error?.message ?? "Não foi possível criar o usuário.");
    const userId = criado.user.id;

    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "colaborador", role_id: data.roleId });
    await supabaseAdmin.from("user_accounts").upsert({
      user_id: userId,
      employee_id: data.employeeId ?? null,
      status: data.status ?? "ativo",
      valid_from: data.validFrom ?? null,
      valid_to: data.validTo ?? null,
    });
    if (data.employeeId) await supabaseAdmin.from("employees").update({ user_id: userId }).eq("id", data.employeeId);
    if (data.escopos?.length) {
      await supabaseAdmin.from("user_access_scopes").insert(data.escopos.map((e) => ({ user_id: userId, scope_type: e.scope_type, scope_id: e.scope_id })));
    }

    await auditar({ userId: context.userId, operacao: "criar", tabela: "user_accounts", registroId: userId, descricao: `Usuário ${data.email} criado.`, novo: { email: data.email, roleId: data.roleId } });
    return { userId };
  });

interface AtualizarInput {
  userId: string;
  roleId?: string;
  employeeId?: string | null;
  status?: string;
  validFrom?: string | null;
  validTo?: string | null;
  escopos?: EscopoItem[];
  extras?: string[];
  restricoes?: string[];
}

/** Atualiza dados, perfil, escopo e exceções de um usuário. */
export const atualizarUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: AtualizarInput) => d)
  .handler(async ({ data, context }) => {
    const { exigir, auditar, acessoDe } = await import("./acesso.server");
    await exigir(context.userId, "users.edit");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const antes = await acessoDe(data.userId);

    if (data.roleId) {
      const acesso = await acessoDe(context.userId);
      if (!acesso.codes.includes("users.change_role")) throw new Error("Acesso negado: é necessária a permissão users.change_role.");
      const anterior = antes.perfis[0]?.name ?? "—";
      const { data: novo } = await supabaseAdmin.from("roles").select("name").eq("id", data.roleId).maybeSingle();
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
      const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: data.userId, role: "colaborador", role_id: data.roleId });
      if (error) throw new Error(error.message);
      await auditar({
        userId: context.userId,
        operacao: "editar",
        tabela: "user_roles",
        registroId: data.userId,
        descricao: `Perfil alterado de ${anterior} para ${novo?.name ?? "—"}.`,
        anterior: { perfil: anterior },
        novo: { perfil: novo?.name },
      });
    }

    await supabaseAdmin.from("user_accounts").upsert({
      user_id: data.userId,
      employee_id: data.employeeId ?? null,
      status: data.status ?? "ativo",
      valid_from: data.validFrom ?? null,
      valid_to: data.validTo ?? null,
    });
    if (data.employeeId) await supabaseAdmin.from("employees").update({ user_id: data.userId }).eq("id", data.employeeId);

    if (data.escopos) {
      await supabaseAdmin.from("user_access_scopes").delete().eq("user_id", data.userId);
      if (data.escopos.length) {
        await supabaseAdmin.from("user_access_scopes").insert(data.escopos.map((e) => ({ user_id: data.userId, scope_type: e.scope_type, scope_id: e.scope_id })));
      }
    }

    if (data.extras || data.restricoes) {
      const { data: perms } = await supabaseAdmin.from("permissions").select("id, code");
      const idPorCode = new Map((perms ?? []).map((p) => [p.code, p.id]));
      await supabaseAdmin.from("user_permissions").delete().eq("user_id", data.userId);
      const linhas = [
        ...(data.extras ?? []).map((c) => ({ user_id: data.userId, permission_id: idPorCode.get(c)!, type: "ALLOW" })),
        ...(data.restricoes ?? []).map((c) => ({ user_id: data.userId, permission_id: idPorCode.get(c)!, type: "DENY" })),
      ].filter((l) => !!l.permission_id);
      if (linhas.length) await supabaseAdmin.from("user_permissions").insert(linhas);
    }

    if (data.status === "inativo") {
      await supabaseAdmin.auth.admin.updateUserById(data.userId, { ban_duration: "876000h" });
    } else if (data.status === "ativo") {
      await supabaseAdmin.auth.admin.updateUserById(data.userId, { ban_duration: "none" });
    }

    await auditar({
      userId: context.userId,
      operacao: "editar",
      tabela: "user_accounts",
      registroId: data.userId,
      descricao: "Dados de acesso do usuário atualizados.",
      anterior: { escopos: antes.escopos, extras: antes.extras, restricoes: antes.restricoes },
      novo: { escopos: data.escopos, extras: data.extras, restricoes: data.restricoes, status: data.status },
    });
    return { ok: true };
  });

/** Permissões efetivas de um usuário (perfil + exceções + escopo). */
export const permissoesEfetivas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => d)
  .handler(async ({ data, context }): Promise<AcessoUsuario> => {
    const { exigir, acessoDe } = await import("./acesso.server");
    if (data.userId !== context.userId) await exigir(context.userId, "users.view");
    return acessoDe(data.userId);
  });
