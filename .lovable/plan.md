# Controle de acesso por perfis, permissões e escopo

Substituir o modelo atual de papéis fixos (`admin`, `gestor`, `supervisor`, ...) por um sistema configurável pela interface: perfis criados pelo Administrador Geral, matriz de permissões granular, escopo de dados e exceções por usuário — validado no backend e no banco, não só na tela.

## Estado atual (verificado)

- Papéis vêm da tabela `user_roles` com enum `app_role` fixo; o app decide tudo por `podeGerenciar` / `podeLancar` / `ehAdmin` em `useAuth`, usado em 12 telas.
- As políticas de segurança do banco checam papéis por subconsulta em `user_roles` (admin/gestor/supervisor) — ou seja, regras rígidas por nome de papel.
- O menu lateral é uma lista estática em `AppShell`.
- Não existe módulo de Reuniões no sistema hoje; as permissões `meetings.*` serão cadastradas, mas sem telas correspondentes até que o módulo exista.

## Banco de dados

Novas tabelas: `roles`, `permissions`, `role_permissions`, `user_permissions` (ALLOW/DENY), `user_access_scopes` (COMPANY, DEPARTMENT, TEAM, SUBGROUP, EMPLOYEE, SELF), e `user_accounts` (vínculo usuário ↔ colaborador, status, perfil, vigência).

- `roles` com `is_system_role`, `is_super_admin`, `active`, autoria e datas.
- `user_roles` passa a referenciar `role_id` (mantendo a coluna antiga durante a migração e depois removendo-a).
- Catálogo de permissões pré-carregado exatamente com os códigos da especificação (dashboard, employees, users, roles, indicators, goals, results, analyses, action_plans, meetings, presentations, reports, audit, settings).
- Perfis modelo criados: Administrador Geral (`is_super_admin = true`, protegido), Gestor, Supervisor, Colaborador, Visualizador — todos editáveis exceto o primeiro.
- Cinthia é migrada para Administrador Geral; demais usuários mapeados pelo papel atual.

Funções de banco (security definer) que passam a ser a base de tudo:

- `is_super_admin(uid)` — atalho de acesso total.
- `has_perm(uid, code)` — precedência: super admin → DENY do usuário → ALLOW do usuário → permissão do perfil.
- `in_scope(uid, department_id, team_id, subgroup_id, employee_id)` — resolve o escopo do usuário.

Todas as políticas de acesso das tabelas existentes (indicadores, metas, resultados, análises, planos, colaboradores, fechamentos, auditoria) são reescritas em cima de `has_perm` + `in_scope`, sem citar nomes de perfil. Administrador Geral ignora restrições.

Proteções: gatilhos impedem excluir/inativar/alterar permissões do perfil Administrador Geral e impedem remover o último administrador ativo.

Auditoria: gatilhos em `roles`, `role_permissions`, `user_roles`, `user_permissions` e `user_access_scopes` gravam em `audit_logs` quem alterou, quando, valor anterior e novo.

## Backend (funções de servidor)

Um módulo de funções protegidas para tudo que exige privilégio, sempre revalidando a permissão do chamador no servidor:

- Perfis: listar, criar, editar, duplicar, inativar, excluir (bloqueado se em uso), salvar matriz de permissões.
- Usuários: listar (com perfil, colaborador vinculado e status), criar credencial, editar, inativar, trocar perfil, salvar permissões extras/restrições e escopos.
- `permissoesEfetivas(userId)`: retorna a lista final consolidada + escopo, usada pela tela e pela simulação.

Escrever também as validações de permissão nas mutações já existentes (metas, indicadores, resultados, fechamento) para que uma chamada direta à API sem `goals.edit`, `results.create` etc. seja rejeitada.

## Frontend

- `useAuth` passa a expor `can("codigo")`, `escopo` e `ehSuperAdmin`, carregados de `permissoesEfetivas`. `podeGerenciar` / `podeLancar` são removidos e cada tela passa a usar o código específico da ação.
- Menu lateral montado dinamicamente: cada item declara a permissão exigida; grupos vazios somem. Botões de criar/editar/excluir aparecem conforme `can(...)`.
- Nova rota **Administração > Perfis de Acesso**: tabela com nome, descrição, nº de usuários, status, criado em, criado por, última alteração; ações visualizar, editar, duplicar, inativar, excluir; botão **+ Criar Perfil**.
- Editor de perfil: dados básicos (nome, descrição, status, perfil base), matriz de permissões por módulo × ação com switches, atalhos "Sem acesso / Somente leitura / Gestão" por módulo, escopo padrão e botão **Simular acesso** (pré-visualiza menu e ações resultantes).
- Nova rota **Administração > Usuários**: lista e cadastro. No cadastro, busca de colaborador por nome, CPF, e-mail ou matrícula (opcional — usuário pode existir sem colaborador), perfil de acesso obrigatório vindo dos perfis ativos, status e vigência.
- Detalhe do usuário com abas **Dados / Perfil / Escopo / Permissões efetivas / Histórico**, incluindo botão "Alterar perfil" e a visão consolidada do que pode e não pode fazer, com o escopo listado.
- A tela atual de Administração passa a conter apenas a trilha de auditoria, com Usuários e Perfis como rotas próprias.

## Ordem de execução

1. Migração: tabelas, catálogo de permissões, perfis modelo, funções, gatilhos e reescrita das políticas.
2. Camada de servidor (perfis, usuários, permissões efetivas) e validação nas mutações existentes.
3. `useAuth` com `can()` + menu dinâmico + substituição dos usos antigos nas 12 telas.
4. Telas de Perfis de Acesso, editor com matriz e simulação.
5. Telas de Usuários, abas de detalhe e permissões efetivas.
6. Verificação ponta a ponta no navegador: criar perfil, duplicar, atribuir a um usuário com escopo de uma equipe e confirmar que ele não enxerga dados de outra equipe.

## Observações

- O módulo de Reuniões não existe ainda; suas permissões ficam cadastradas e prontas, sem tela.
- Nenhuma verificação por nome de perfil permanecerá no código — apenas `can(...)` e escopo.
