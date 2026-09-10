# Performance Pulse

Desenvolva uma aplicação web completa, moderna, responsiva e profissional para **Gestão de Indicadores, Metas e Performance de Equipes**, destinada ao acompanhamento operacional e gerencial de uma empresa.

O sistema deverá permitir cadastrar colaboradores, equipes, subgrupos, indicadores, metas, resultados mensais, responsáveis, análises, planos de ação e gerar dashboards, comparativos históricos e apresentações executivas para os gestores.

A aplicação deve ser preparada para crescimento futuro, permitindo criação de novos departamentos, indicadores, cargos, equipes, usuários e regras sem necessidade de alteração estrutural no código.

---

# 1. OBJETIVO DO SISTEMA

O sistema deverá permitir:

* acompanhar indicadores de desempenho;
* acompanhar metas individuais;
* acompanhar metas por equipe;
* acompanhar metas por setor ou subgrupo;
* acompanhar metas corporativas;
* registrar resultados mensais;
* comparar períodos;
* comparar colaboradores;
* comparar equipes;
* comparar meses;
* comparar anos;
* identificar evolução ou queda de performance;
* visualizar tendências;
* identificar metas atingidas ou não atingidas;
* gerar análises gerenciais;
* registrar justificativas;
* criar planos de ação;
* apresentar resultados de forma executiva para os gestores da empresa;
* manter histórico completo dos indicadores;
* manter histórico das alterações realizadas.

O sistema deverá priorizar uma experiência visual semelhante a sistemas modernos de Business Intelligence e gestão de performance.

---

# 2. IDENTIDADE VISUAL

Criar interface:

* moderna;
* corporativa;
* elegante;
* clean;
* responsiva;
* intuitiva;
* adequada para desktop, tablet e celular.

Utilizar:

* cards;
* gráficos;
* tabelas;
* filtros;
* dashboards;
* indicadores visuais;
* semáforos de performance;
* menus laterais;
* breadcrumbs;
* tooltips;
* modais;
* notificações.

Não utilizar excesso de informações na mesma tela.

Priorizar boa experiência de uso para gestores.

---

# 3. LOGIN

Criar tela de autenticação utilizando:

**E-mail + senha.**

Incluir:

* login;
* logout;
* recuperar senha;
* redefinir senha;
* alterar senha;
* lembrar acesso;
* bloqueio após tentativas consecutivas incorretas;
* controle de sessão.

Nenhum usuário poderá acessar a aplicação sem autenticação.

---

# 4. PRIMEIRO USUÁRIO ADMINISTRADOR

Criar inicialmente o seguinte usuário administrador:

Nome:
**Cinthia Maria Barbosa Lima Garcia**

CPF:
**00306604167**

E-mail:
**[cinthia@mundodigitaltech.com.br](mailto:cinthia@mundodigitaltech.com.br)**

Tipo de usuário:
**Administrador Geral**

Permissões:
**Acesso completo ao sistema.**

A senha inicial deverá ser definida de forma segura durante a primeira configuração ou primeiro acesso.

Nunca deixar uma senha padrão exposta no código-fonte.

---

# 5. CONTROLE DE ACESSO

O sistema deverá utilizar controle de acesso baseado em perfis e permissões.

Criar inicialmente os seguintes grupos:

### Administrador Geral

Pode:

* visualizar toda empresa;
* cadastrar usuários;
* cadastrar colaboradores;
* editar colaboradores;
* excluir/inativar colaboradores;
* criar equipes;
* criar departamentos;
* criar indicadores;
* criar metas;
* lançar resultados;
* alterar resultados;
* visualizar todos os dashboards;
* gerar relatórios;
* criar apresentações;
* cadastrar grupos de acesso;
* alterar permissões;
* visualizar logs;
* acessar configurações.

### Gestor

Pode visualizar e administrar apenas equipes ou departamentos sob sua responsabilidade.

Pode:

* visualizar indicadores;
* cadastrar metas;
* lançar resultados;
* acompanhar equipe;
* registrar análise;
* registrar plano de ação;
* gerar relatórios;
* gerar apresentação gerencial.

### Supervisor

Pode acompanhar somente as equipes ou colaboradores vinculados a ele.

Pode:

* visualizar indicadores;
* visualizar metas;
* lançar resultados quando autorizado;
* incluir comentários;
* incluir justificativas;
* registrar plano de ação.

### Colaborador

Pode visualizar somente informações autorizadas referentes ao próprio desempenho.

Pode visualizar:

* suas metas;
* seus indicadores;
* seus resultados;
* histórico mensal;
* evolução;
* feedbacks liberados para visualização.

### Visualizador / Diretoria

Perfil somente leitura.

Pode visualizar:

* dashboards executivos;
* indicadores corporativos;
* resultados;
* comparativos;
* apresentações;
* relatórios gerenciais.

---

# 6. PERMISSÕES PERSONALIZADAS

Não limitar o sistema apenas aos perfis padrão.

Permitir que o administrador crie novos grupos de acesso.

Cada grupo deverá possuir permissões configuráveis individualmente.

Exemplo:

* visualizar;
* cadastrar;
* editar;
* excluir;
* aprovar;
* lançar resultado;
* alterar resultado;
* gerar relatório;
* visualizar salário, se futuramente utilizado;
* acessar dashboards;
* administrar usuários;
* acessar determinada equipe;
* acessar determinado departamento;
* exportar dados.

Utilizar conceito de RBAC — Role-Based Access Control.

---

# 7. CADASTRO DE COLABORADORES

Criar módulo:

**Pessoas > Colaboradores**

Campos obrigatórios:

* Nome completo;
* CPF;
* E-mail;
* Telefone;
* Chefia imediata;
* Supervisor;
* Equipe;
* Jornada de trabalho;
* Cargo;
* Função.

Adicionar também:

* matrícula;
* status;
* data de admissão;
* departamento;
* subgrupo;
* unidade;
* gestor responsável;
* data de desligamento;
* observações.

Status possíveis:

* Ativo;
* Inativo;
* Afastado;
* Férias;
* Desligado.

CPF e e-mail não poderão ser duplicados.

Adicionar máscaras e validações para:

* CPF;
* telefone;
* e-mail.

---

# 8. ESTRUTURA ORGANIZACIONAL

Permitir estruturar:

Empresa
↓
Departamento
↓
Equipe
↓
Subgrupo
↓
Colaborador

Exemplo inicial:

## Operações

### TI

### Suporte ao Cliente

### Validação de Certificado Digital

### Arquivo / Digitalização

### Implantação

### Customer Success

Permitir adicionar novos grupos futuramente.

O sistema não deverá depender de grupos fixos escritos diretamente no código.

---

# 9. CADASTRO DE EQUIPES

Criar cadastro de equipes contendo:

* nome;
* descrição;
* departamento;
* gestor;
* supervisor;
* colaboradores;
* status;
* data de criação.

Permitir que um colaborador seja associado a uma equipe principal.

Opcionalmente permitir participação em equipes secundárias.

---

# 10. CADASTRO DE INDICADORES

Criar módulo:

**Performance > Indicadores**

Cada indicador deverá possuir:

* nome;
* código;
* descrição;
* departamento;
* equipe;
* subgrupo;
* categoria;
* unidade de medida;
* responsável;
* periodicidade;
* direção da meta;
* fórmula;
* fonte dos dados;
* meta padrão;
* peso;
* status;
* observações.

---

# 11. CATEGORIAS DE INDICADORES

Permitir categorias personalizadas.

Criar inicialmente:

* Produtividade;
* Qualidade;
* Atendimento;
* Prazo;
* Comportamental;
* Financeiro;
* Operacional;
* Cliente;
* Pessoas;
* Tecnologia.

---

# 12. UNIDADES DE MEDIDA

Permitir:

* percentual;
* quantidade;
* minutos;
* horas;
* dias;
* reais;
* índice;
* nota;
* páginas;
* documentos;
* chamados;
* atendimentos;
* certificados;
* caixas;
* dossiês.

Permitir criar novas unidades.

---

# 13. DIREÇÃO DO INDICADOR

O sistema deverá saber se:

### Maior é melhor

Exemplo:

Produtividade

Meta:
≥ 95%

### Menor é melhor

Exemplo:

Tempo Médio de Atendimento.

Meta:
≤ 10 minutos

### Igual à meta

### Entre intervalo

Exemplo:

Entre 95% e 100%.

Isso deverá ser levado em consideração automaticamente na identificação de atingimento.

---

# 14. INDICADORES INICIAIS SUGERIDOS

Deixar cadastrados como exemplos, permitindo edição ou exclusão:

### Suporte ao Cliente

* SLA;
* tempo de primeira interação;
* TMA;
* quantidade de chamados;
* chamados resolvidos;
* taxa de resolução;
* backlog;
* CSAT;
* NPS;
* taxa de abandono.

### TI

* disponibilidade dos sistemas;
* SLA de atendimento;
* incidentes;
* tempo médio de resolução;
* reincidência;
* chamados concluídos;
* chamados pendentes.

### Validação de Certificado

* quantidade de validações;
* produtividade;
* tempo médio de atendimento;
* taxa de reprovação;
* taxa de retrabalho;
* qualidade;
* erro operacional.

### Arquivo / Digitalização

* páginas digitalizadas;
* caixas tratadas;
* documentos indexados;
* produtividade diária;
* índice de retrabalho;
* qualidade;
* taxa de erro;
* cumprimento de prazo.

---

# 15. CADASTRO DE METAS

Criar módulo:

**Performance > Metas**

A meta poderá ser atribuída para:

* empresa;
* departamento;
* equipe;
* subgrupo;
* colaborador.

Campos:

* título;
* indicador;
* responsável;
* tipo de responsável;
* departamento;
* equipe;
* colaborador;
* período inicial;
* período final;
* valor meta;
* unidade;
* peso;
* prioridade;
* periodicidade;
* descrição;
* observação;
* status.

---

# 16. RESPONSÁVEL PELA META

Campo:

**Tipo de responsabilidade**

Opções:

* Individual;
* Equipe;
* Subgrupo;
* Departamento;
* Corporativa.

Caso seja Individual:
selecionar colaborador.

Caso seja Equipe:
selecionar equipe.

Caso seja Departamento:
selecionar departamento.

---

# 17. PERIODICIDADE

Permitir:

* diária;
* semanal;
* mensal;
* trimestral;
* semestral;
* anual;
* personalizada.

Para apresentação gerencial, consolidar principalmente resultados mensais.

---

# 18. LANÇAMENTO DE RESULTADOS

Criar tela específica para lançamento dos resultados.

Permitir selecionar:

* ano;
* mês;
* departamento;
* equipe;
* indicador;
* colaborador.

Campos:

* valor realizado;
* valor da meta;
* percentual atingido;
* observação;
* justificativa;
* responsável pelo lançamento;
* data do lançamento.

O sistema deverá calcular automaticamente:

**% Atingimento = Resultado / Meta × 100**

considerando a lógica específica do indicador.

---

# 19. STATUS DE PERFORMANCE

Gerar automaticamente:

### Superou a meta

### Meta atingida

### Atenção

### Meta não atingida

Utilizar semáforo visual.

Sugestão:

🟢 Meta atingida ou superada

🟡 Próximo da meta

🔴 Meta não atingida

Permitir configurar os intervalos posteriormente.

---

# 20. SCORE DE PERFORMANCE

Criar cálculo consolidado considerando os pesos dos indicadores.

Exemplo:

Indicador A:
peso 30%

Indicador B:
peso 40%

Indicador C:
peso 30%

Resultado:

**Score Geral do Colaborador = 92%**

Gerar score para:

* colaborador;
* equipe;
* departamento;
* empresa.

---

# 21. DASHBOARD EXECUTIVO

Criar Dashboard Principal contendo:

* Score geral;
* metas atingidas;
* metas não atingidas;
* indicadores críticos;
* indicadores em atenção;
* evolução mensal;
* ranking das equipes;
* ranking dos indicadores;
* melhor desempenho;
* maior queda;
* evolução versus mês anterior;
* evolução versus ano anterior.

---

# 22. FILTROS

Todos os dashboards deverão permitir filtros por:

* ano;
* mês;
* período personalizado;
* departamento;
* equipe;
* subgrupo;
* colaborador;
* cargo;
* função;
* indicador;
* categoria;
* gestor;
* supervisor.

Permitir utilização combinada de filtros.

---

# 23. COMPARATIVOS MENSAIS

Criar comparações automáticas:

Janeiro x Fevereiro

Fevereiro x Março

Março x Abril

etc.

Exibir:

* valor anterior;
* valor atual;
* diferença absoluta;
* diferença percentual;
* tendência.

Exemplo:

Produtividade

Janeiro: 88%

Fevereiro: 94%

Evolução:
+6 pontos percentuais.

---

# 24. COMPARATIVO ANUAL

Permitir comparar:

2025 x 2026

2026 x 2027

etc.

Comparar:

* indicador;
* colaborador;
* equipe;
* departamento.

Exibir gráficos lado a lado.

---

# 25. GRÁFICOS

Utilizar diferentes tipos de gráficos conforme o objetivo.

Criar suporte para:

* gráfico de barras;
* gráfico de linhas;
* gráfico de área;
* gráfico de coluna;
* gráfico de rosca;
* gráfico de radar;
* gráfico de evolução;
* ranking horizontal;
* gauge;
* heatmap.

---

# 26. ANÁLISES GERENCIAIS

Para cada indicador permitir registrar:

* análise do resultado;
* causa identificada;
* impacto;
* justificativa;
* pontos positivos;
* pontos negativos;
* ações necessárias;
* responsável pela ação;
* prazo;
* situação da ação.

---

# 27. PLANO DE AÇÃO

Criar módulo de Plano de Ação integrado ao indicador.

Estrutura baseada em:

**O que será feito?**

**Por que será feito?**

**Quem será responsável?**

**Quando deverá ser concluído?**

**Como será realizado?**

Adicionar:

* prazo;
* responsável;
* prioridade;
* status;
* comentário;
* evidência;
* data de conclusão.

Status:

* Não iniciado;
* Em andamento;
* Concluído;
* Atrasado;
* Cancelado.

---

# 28. APRESENTAÇÃO PARA GESTORES

Criar módulo:

**Apresentação Gerencial**

O sistema deverá permitir gerar uma apresentação automática a partir dos dados selecionados.

Usuário poderá selecionar:

* período;
* departamentos;
* equipes;
* indicadores;
* metas;
* gráficos;
* análises.

Gerar estrutura semelhante a apresentação executiva.

---

# 29. MODELO DA APRESENTAÇÃO

Criar automaticamente:

## Slide 1

Título da apresentação

Exemplo:

**Resultados Operacionais — Agosto/2026**

## Slide 2

Resumo Executivo

Mostrar:

* Score Geral;
* metas atingidas;
* metas não atingidas;
* indicadores críticos.

## Slide 3

Visão Geral dos Indicadores

## Slide 4

Comparativo Mensal

## Slide 5

Comparativo com mesmo período do ano anterior

## Slide 6

Resultados por Equipe

## Slide 7

Principais Evoluções

## Slide 8

Principais Pontos de Atenção

## Slide 9

Indicadores Críticos

## Slide 10

Planos de Ação

## Slide 11

Próximos Passos

---

# 30. EDITOR DA APRESENTAÇÃO

Antes de finalizar a apresentação, permitir:

* adicionar slide;
* excluir slide;
* alterar ordem;
* editar título;
* editar texto;
* selecionar gráficos;
* adicionar comentários;
* adicionar análises;
* escolher indicadores;
* escolher equipes.

Permitir visualizar uma prévia da apresentação.

---

# 31. ANÁLISE AUTOMÁTICA

Criar um módulo preparado para futuramente utilizar IA.

Quando possível, disponibilizar função:

**Gerar análise**

Exemplo:

A aplicação identifica:

* redução de 8% no indicador;
* terceiro mês consecutivo de queda;
* meta não atingida;
* equipe abaixo da média.

Gerar texto sugerido:

"Em agosto foi observada redução de 8% no desempenho em relação ao mês anterior. Este é o terceiro mês consecutivo de queda, indicando necessidade de investigação das causas e definição de plano de ação."

O usuário deverá poder editar o texto antes de utilizar na apresentação.

Não inventar causas que não estejam cadastradas.

---

# 32. DESTAQUES AUTOMÁTICOS

O dashboard deverá identificar automaticamente:

### Melhor resultado do mês

### Maior evolução

### Maior queda

### Indicador crítico

### Equipe destaque

### Colaborador destaque

### Meta superada

### Meta não atingida

---

# 33. RANKING

Criar ranking de:

* colaboradores;
* equipes;
* departamentos.

IMPORTANTE:

O ranking deverá considerar apenas indicadores comparáveis e respeitar o peso definido.

Permitir ativar ou desativar ranking para determinados indicadores.

---

# 34. TELA INDIVIDUAL DO COLABORADOR

Cada colaborador deverá possuir página própria.

Mostrar:

* dados cadastrais;
* equipe;
* gestor;
* cargo;
* função;
* metas;
* indicadores;
* resultados;
* score mensal;
* score anual;
* evolução;
* histórico.

Gráfico:

**Evolução últimos 12 meses**

---

# 35. TELA DA EQUIPE

Mostrar:

* integrantes;
* responsável;
* supervisor;
* indicadores;
* metas;
* resultados;
* evolução;
* ranking;
* planos de ação;
* histórico.

---

# 36. RELATÓRIOS

Criar módulo de relatórios.

Permitir gerar:

* relatório mensal;
* relatório anual;
* relatório por colaborador;
* relatório por equipe;
* relatório por indicador;
* relatório de metas;
* relatório de planos de ação;
* relatório de evolução.

Permitir exportação.

---

# 37. EXPORTAÇÃO

Preparar suporte para:

* PDF;
* Excel;
* CSV;
* impressão.

Para apresentações preparar arquitetura para exportação futura em:

* PDF;
* PowerPoint/PPTX.

---

# 38. IMPORTAÇÃO DE DADOS

Criar função para importação em lote.

Permitir importar:

* colaboradores;
* indicadores;
* metas;
* resultados.

Via:

CSV ou Excel.

Antes de confirmar a importação:

mostrar prévia dos dados e possíveis erros.

---

# 39. AUDITORIA

Criar log completo de alterações.

Registrar:

* usuário;
* data;
* horário;
* operação;
* registro alterado;
* valor anterior;
* valor novo.

Exemplo:

"Meta do indicador SLA alterada de 90% para 95%."

Nenhuma alteração importante deve acontecer sem rastreabilidade.

---

# 40. HISTÓRICO

As metas e resultados antigos não poderão ser simplesmente sobrescritos.

Manter histórico por período.

Caso uma meta seja alterada:

guardar:

* valor anterior;
* novo valor;
* usuário responsável;
* data da alteração;
* justificativa.

---

# 41. NOTIFICAÇÕES

Criar central de notificações.

Exemplos:

* meta ainda não lançada;
* indicador abaixo da meta;
* plano de ação atrasado;
* prazo próximo;
* resultado aguardando atualização;
* resultado crítico;
* fechamento do mês pendente.

---

# 42. FECHAMENTO DO MÊS

Criar rotina:

**Fechar competência**

Exemplo:

Agosto/2026

Antes do fechamento mostrar:

* indicadores sem lançamento;
* metas pendentes;
* dados incompletos;
* análises pendentes.

Após fechamento:

o período deverá ficar bloqueado para alteração comum.

Somente usuários autorizados poderão reabrir o período.

Registrar reabertura no log.

---

# 43. BANCO DE DADOS

Estruturar banco de dados relacional.

Sugestão de tabelas:

users

roles

permissions

role_permissions

employees

departments

teams

subgroups

positions

functions

work_schedules

indicators

indicator_categories

goals

goal_responsibles

results

performance_scores

analyses

action_plans

action_plan_updates

presentations

presentation_slides

notifications

audit_logs

period_closures

---

# 44. RELACIONAMENTOS

Implementar relacionamentos adequados entre:

usuário

↓

colaborador

↓

departamento

↓

equipe

↓

indicador

↓

meta

↓

resultado

↓

análise

↓

plano de ação

---

# 45. SEGURANÇA

Implementar:

* autenticação segura;
* controle de sessão;
* senhas criptografadas;
* proteção por função;
* validações no backend;
* Row Level Security, se utilizar Supabase;
* logs;
* prevenção contra acesso não autorizado.

Nunca confiar somente na ocultação de botões na interface.

Todas as permissões deverão ser validadas também no backend/banco.

---

# 46. CPF E DADOS PESSOAIS

CPF deverá:

* possuir máscara;
* ser validado;
* ser único;
* não ficar exposto em dashboards ou relatórios sem necessidade.

Nas tabelas comuns mostrar preferencialmente apenas CPF mascarado.

Exemplo:

***.***.***-67

---

# 47. LGPD

Preparar o sistema considerando boas práticas da LGPD.

Controlar:

* quem pode acessar dados pessoais;
* logs de acesso;
* permissões;
* minimização de dados exibidos.

---

# 48. MENU PRINCIPAL

Criar menu lateral:

### Dashboard

### Performance

* Indicadores
* Metas
* Resultados
* Comparativos
* Rankings

### Pessoas

* Colaboradores
* Equipes
* Departamentos
* Subgrupos

### Gestão

* Análises
* Planos de Ação
* Fechamento Mensal

### Apresentações

* Nova apresentação
* Apresentações salvas

### Relatórios

### Administração

* Usuários
* Grupos de acesso
* Permissões
* Cadastros auxiliares
* Auditoria
* Configurações

---

# 49. HOME DO SISTEMA

Após login apresentar:

**Olá, Cinthia.**

E abaixo:

### Performance Geral

### Competência Atual

### Metas atingidas

### Metas não atingidas

### Indicadores em atenção

### Indicadores críticos

### Resultados pendentes

### Planos de ação atrasados

### Evolução nos últimos 12 meses

---

# 50. DASHBOARD GERENCIAL

Criar uma tela chamada:

**Visão Gerencial**

O objetivo deverá ser permitir que a gestão entenda a situação da operação em poucos minutos.

Mostrar:

* resultado geral;
* principais indicadores;
* equipes;
* tendências;
* problemas;
* evolução;
* metas;
* planos de ação.

Evitar que o gestor tenha que acessar várias telas para entender a situação.

---

# 51. COMPARATIVO INTELIGENTE

Permitir selecionar:

**Comparar com:**

* mês anterior;
* mesmo mês do ano anterior;
* média dos últimos 3 meses;
* média dos últimos 6 meses;
* média do ano;
* meta.

Exibir automaticamente as diferenças.

---

# 52. META X REALIZADO

Todos os indicadores deverão possuir possibilidade de gráfico:

**Meta x Realizado**

Exemplo:

Jan
Meta: 95
Realizado: 91

Fev
Meta: 95
Realizado: 96

Mar
Meta: 95
Realizado: 98

---

# 53. CORES E SEMÁFORO

Evitar utilizar exclusivamente cores para demonstrar status.

Sempre mostrar:

ícone + texto + cor.

Exemplo:

✓ Meta atingida

⚠ Atenção

✕ Meta não atingida.

---

# 54. FAVORITOS

Permitir que gestores marquem indicadores como favoritos.

Esses indicadores deverão aparecer primeiro no dashboard pessoal do usuário.

---

# 55. SALVAR FILTROS

Permitir salvar visualizações.

Exemplo:

"Dashboard Suporte"

"Indicadores Diretoria"

"Performance TI"

"Fechamento Operações"

---

# 56. OBSERVAÇÕES IMPORTANTES PARA O DESENVOLVIMENTO

Não construir o sistema baseado em dados estáticos.

Departamentos, equipes, indicadores, categorias, unidades, cargos, funções e metas deverão ser cadastros dinâmicos.

Utilizar componentes reutilizáveis.

Preparar o banco para grande volume histórico.

Utilizar boas práticas de desenvolvimento.

Separar:

frontend;

backend;

banco;

regras de negócio;

controle de acesso.

---

# 57. TECNOLOGIA

Caso seja utilizado Supabase, configurar:

* Authentication;
* PostgreSQL;
* Row Level Security;
* Storage;
* políticas de segurança;
* relacionamento das tabelas.

Utilizar UUID como chave primária sempre que adequado.

Utilizar timestamps:

created_at

updated_at

created_by

updated_by

quando pertinente.

---

# 58. DADOS DEMONSTRATIVOS

Após estruturar a aplicação, criar alguns dados fictícios exclusivamente para demonstrar os dashboards.

Exemplo:

Equipe:
Suporte ao Cliente

Indicador:
SLA

Meta:
95%

Janeiro:
92%

Fevereiro:
96%

Março:
97%

Outro indicador:

TMA

Meta:
10 minutos

Janeiro:
13 min

Fevereiro:
11 min

Março:
9 min

Os dados demonstrativos devem poder ser excluídos pelo administrador.

---

# 59. PRIORIDADE DE CONSTRUÇÃO

Caso o projeto precise ser desenvolvido progressivamente, implementar nesta ordem:

FASE 1

* banco de dados;
* autenticação;
* usuários;
* permissões;
* colaboradores;
* equipes;
* departamentos;
* indicadores;
* metas;
* resultados.

FASE 2

* dashboards;
* gráficos;
* comparativos;
* filtros;
* score;
* ranking.

FASE 3

* análises;
* plano de ação;
* fechamento mensal;
* auditoria.

FASE 4

* apresentação gerencial;
* relatórios;
* exportações;
* análise automática.

---

# 60. CRITÉRIO PRINCIPAL DE UX

O sistema deve responder rapidamente às seguintes perguntas:

1. Como está a performance da empresa?

2. Quais metas foram atingidas?

3. Quais metas não foram atingidas?

4. Qual equipe está com maior dificuldade?

5. Qual indicador piorou?

6. Qual indicador melhorou?

7. Como estamos em relação ao mês passado?

8. Como estamos em relação ao ano passado?

9. Quem é responsável pelo indicador?

10. Existe plano de ação?

11. Qual prazo para resolução?

12. Qual o histórico desse indicador?

Essas respostas deverão estar disponíveis com poucos cliques.

---

# 61. REGRA FINAL

Antes de construir cada módulo, verificar se ele respeita:

* separação por empresa/departamento/equipe;
* filtros;
* histórico;
* permissões;
* auditoria;
* responsividade;
* segurança;
* possibilidade de crescimento futuro.

Não simplificar os relacionamentos de indicadores e metas de forma que impeça análises históricas posteriormente.

O sistema deverá funcionar como uma plataforma de **Gestão de Performance Operacional e Estratégica**, e não apenas como uma planilha online de indicadores.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://gestoroperacao.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/aecafdaa-a058-48b6-9f23-1cd39ba54fa5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
