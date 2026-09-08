import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, PowerOff, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FormDialog, mensagemDeErro } from "@/components/FormDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { registrarAuditoria, useTabela } from "@/lib/dados";

export interface EquipeBase {
  id: string;
  nome: string;
  descricao: string | null;
  status: string;
  department_id?: string | null;
  gestor_id?: string | null;
  supervisor_id?: string | null;
  observacoes?: string | null;
}

type Opcao = { id: string; nome: string };

const CAMPOS_RELACIONADOS: { tabela: "employees" | "goals" | "indicators" | "results" | "action_plans"; rotulo: string }[] = [
  { tabela: "employees", rotulo: "colaboradores" },
  { tabela: "goals", rotulo: "metas" },
  { tabela: "indicators", rotulo: "indicadores" },
  { tabela: "results", rotulo: "resultados" },
  { tabela: "action_plans", rotulo: "planos de ação" },
];

async function vinculosDaEquipe(id: string) {
  const achados: string[] = [];
  for (const c of CAMPOS_RELACIONADOS) {
    const { count } = await supabase.from(c.tabela).select("id", { count: "exact", head: true }).eq("team_id", id);
    if (count && count > 0) achados.push(`${count} ${c.rotulo}`);
  }
  return achados;
}

export function useEquipePermissoes() {
  const { can } = useAuth();
  const legado = can("settings.edit");
  return {
    podeVer: can("teams.view") || can("employees.view") || legado,
    podeCriar: can("teams.create") || legado,
    podeEditar: can("teams.edit") || legado,
    podeInativar: can("teams.inactivate") || legado,
    podeReativar: can("teams.reactivate") || legado,
    podeExcluir: can("teams.delete"),
    podeGerenciarMembros: can("teams.manage_members") || can("employees.edit") || legado,
  };
}

/** Campos do formulário de equipe (criar/editar). */
export function useCamposEquipe() {
  const { data: departamentos = [] } = useTabela<Opcao>("departments", "id, nome", "nome");
  const { data: pessoas = [] } = useTabela<Opcao>("employees", "id, nome", "nome");
  const opcoes = (arr: Opcao[]) => arr.map((o) => ({ value: o.id, label: o.nome }));
  return [
    { name: "nome", label: "Nome da equipe", obrigatorio: true, colSpan: 2 as const },
    { name: "department_id", label: "Departamento", tipo: "select" as const, opcoes: opcoes(departamentos) },
    { name: "gestor_id", label: "Gestor responsável", tipo: "select" as const, opcoes: opcoes(pessoas) },
    { name: "supervisor_id", label: "Supervisor", tipo: "select" as const, opcoes: opcoes(pessoas) },
    {
      name: "status",
      label: "Situação",
      tipo: "select" as const,
      opcoes: [
        { value: "ativo", label: "Ativa" },
        { value: "inativo", label: "Inativa" },
      ],
    },
    { name: "descricao", label: "Descrição", tipo: "textarea" as const },
    { name: "observacoes", label: "Observações", tipo: "textarea" as const },
  ];
}

export function EquipeAcoes({ equipe, mostrarVisualizar = true }: { equipe: EquipeBase; mostrarVisualizar?: boolean }) {
  const qc = useQueryClient();
  const perm = useEquipePermissoes();
  const campos = useCamposEquipe();
  const [confirmarStatus, setConfirmarStatus] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [bloqueio, setBloqueio] = useState<string[] | null>(null);
  const ativa = equipe.status === "ativo";

  const atualizar = async () => {
    await qc.invalidateQueries({ queryKey: ["tabela", "teams"] });
  };

  const alternarStatus = async () => {
    const novo = ativa ? "inativo" : "ativo";
    const { error } = await supabase.from("teams").update({ status: novo }).eq("id", equipe.id);
    if (error) {
      toast.error(mensagemDeErro(error));
      return;
    }
    await registrarAuditoria({
      operacao: ativa ? "inativar" : "reativar",
      tabela: "teams",
      registro_id: equipe.id,
      descricao: `Equipe ${ativa ? "inativada" : "reativada"}: ${equipe.nome}`,
      valor_anterior: { status: equipe.status },
      valor_novo: { status: novo },
    });
    await atualizar();
    setConfirmarStatus(false);
    toast.success(ativa ? "Equipe inativada." : "Equipe reativada.");
  };

  const tentarExcluir = async () => {
    const achados = await vinculosDaEquipe(equipe.id);
    if (achados.length) {
      setBloqueio(achados);
      return;
    }
    setConfirmarExclusao(true);
  };

  const excluir = async () => {
    const { error } = await supabase.from("teams").delete().eq("id", equipe.id);
    if (error) {
      toast.error(mensagemDeErro(error));
      return;
    }
    await registrarAuditoria({
      operacao: "excluir",
      tabela: "teams",
      registro_id: equipe.id,
      descricao: `Equipe excluída: ${equipe.nome}`,
      valor_anterior: equipe,
    });
    await atualizar();
    setConfirmarExclusao(false);
    toast.success("Equipe excluída.");
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {mostrarVisualizar && (
        <Button asChild size="sm" variant="outline" title="Visualizar">
          <Link to="/equipe/$id" params={{ id: equipe.id }}>
            <Eye className="size-4" /> Visualizar
          </Link>
        </Button>
      )}

      <FormDialog
        titulo={`Editar equipe · ${equipe.nome}`}
        descricao="Alterar os dados cadastrais não modifica resultados históricos já lançados."
        gatilho={
          <Button size="sm" variant="outline" disabled={!perm.podeEditar} title="Editar">
            <Pencil className="size-4" /> Editar
          </Button>
        }
        campos={campos}
        valoresIniciais={{
          nome: equipe.nome,
          department_id: equipe.department_id ?? "",
          gestor_id: equipe.gestor_id ?? "",
          supervisor_id: equipe.supervisor_id ?? "",
          status: equipe.status,
          descricao: equipe.descricao ?? "",
          observacoes: equipe.observacoes ?? "",
        }}
        onSubmit={async (v) => {
          const novo = {
            nome: v.req("nome"),
            department_id: v.txt("department_id"),
            gestor_id: v.txt("gestor_id"),
            supervisor_id: v.txt("supervisor_id"),
            status: v.txt("status") ?? equipe.status,
            descricao: v.txt("descricao"),
            observacoes: v.txt("observacoes"),
          };
          const { error } = await supabase.from("teams").update(novo).eq("id", equipe.id);
          if (error) throw error;
          await registrarAuditoria({
            operacao: "editar",
            tabela: "teams",
            registro_id: equipe.id,
            descricao: `Equipe editada: ${equipe.nome}`,
            valor_anterior: equipe,
            valor_novo: novo,
          });
          await atualizar();
          toast.success("Equipe atualizada.");
        }}
      />

      <Button
        size="sm"
        variant="outline"
        disabled={ativa ? !perm.podeInativar : !perm.podeReativar}
        onClick={() => setConfirmarStatus(true)}
      >
        {ativa ? <PowerOff className="size-4" /> : <Power className="size-4" />}
        {ativa ? "Inativar" : "Reativar"}
      </Button>

      <Button size="sm" variant="outline" disabled={!perm.podeExcluir} onClick={() => void tentarExcluir()}>
        <Trash2 className="size-4" /> Excluir
      </Button>

      <AlertDialog open={confirmarStatus} onOpenChange={setConfirmarStatus}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{ativa ? "Inativar equipe" : "Reativar equipe"}</AlertDialogTitle>
            <AlertDialogDescription>
              {ativa
                ? "Esta equipe será inativada e não aparecerá como opção para novos cadastros. O histórico permanecerá disponível. Deseja continuar?"
                : "Esta equipe voltará a ficar disponível para novos cadastros. Deseja continuar?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); void alternarStatus(); }}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmarExclusao} onOpenChange={setConfirmarExclusao}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir equipe</AlertDialogTitle>
            <AlertDialogDescription>
              A equipe {equipe.nome} não possui vínculos e será excluída definitivamente. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); void excluir(); }}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bloqueio !== null} onOpenChange={(o) => !o && setBloqueio(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exclusão bloqueada</AlertDialogTitle>
            <AlertDialogDescription>
              Esta equipe possui histórico vinculado ({bloqueio?.join(", ")}). Para preservar os relatórios, utilize a opção
              Inativar em vez de excluir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Entendi</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
