import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { UserMinus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pill } from "@/components/StatusBadge";
import { mensagemDeErro } from "@/components/FormDialog";
import { supabase } from "@/integrations/supabase/client";
import { registrarAuditoria, useTabela } from "@/lib/dados";
import { useEquipePermissoes } from "@/components/EquipeAcoes";

interface PessoaRow {
  id: string;
  nome: string;
  team_id: string | null;
  status: string;
  positions: { nome: string } | null;
  job_functions: { nome: string } | null;
  supervisor: { nome: string } | null;
}

const SELECT_PESSOAS = "id, nome, team_id, status, positions(nome), job_functions(nome), supervisor:employees!employees_supervisor_id_fkey(nome)";

export function usePessoasComCargo() {
  return useTabela<PessoaRow>("employees", SELECT_PESSOAS, "nome");
}

export function IntegrantesEquipe({ equipeId, equipeNome }: { equipeId: string; equipeNome: string }) {
  const qc = useQueryClient();
  const perm = useEquipePermissoes();
  const { data: pessoas = [] } = usePessoasComCargo();
  const { data: equipes = [] } = useTabela<{ id: string; nome: string; status: string }>("teams", "id, nome, status", "nome");
  const [novo, setNovo] = useState("");

  const membros = pessoas.filter((p) => p.team_id === equipeId);
  const disponiveis = pessoas.filter((p) => p.team_id !== equipeId);

  const mover = async (pessoa: PessoaRow, destino: string | null, rotulo: string) => {
    const { error } = await supabase.from("employees").update({ team_id: destino }).eq("id", pessoa.id);
    if (error) {
      toast.error(mensagemDeErro(error));
      return;
    }
    await registrarAuditoria({
      operacao: destino === null ? "remover_integrante" : pessoa.team_id ? "transferir_integrante" : "incluir_integrante",
      tabela: "teams",
      registro_id: equipeId,
      descricao: `${pessoa.nome}: ${rotulo}`,
      valor_anterior: { employee_id: pessoa.id, team_id: pessoa.team_id },
      valor_novo: { employee_id: pessoa.id, team_id: destino },
    });
    await qc.invalidateQueries({ queryKey: ["tabela", "employees"] });
    await qc.invalidateQueries({ queryKey: ["tabela", "employee_team_history"] });
    toast.success("Vínculo atualizado. O cadastro do colaborador foi preservado.");
  };

  return (
    <div className="space-y-4">
      {perm.podeGerenciarMembros && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[240px]">
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Adicionar colaborador</p>
            <Select value={novo} onValueChange={setNovo}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Selecione um colaborador" />
              </SelectTrigger>
              <SelectContent>
                {disponiveis.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            size="sm"
            disabled={!novo}
            onClick={() => {
              const p = disponiveis.find((x) => x.id === novo);
              if (!p) return;
              void mover(p, equipeId, `vinculado à equipe ${equipeNome}`);
              setNovo("");
            }}
          >
            <UserPlus className="size-4" /> Adicionar
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="py-2.5 pr-3 font-medium">Colaborador</th>
              <th className="px-3 py-2.5 font-medium">Cargo</th>
              <th className="px-3 py-2.5 font-medium">Função</th>
              <th className="px-3 py-2.5 font-medium">Supervisor</th>
              <th className="px-3 py-2.5 font-medium">Situação</th>
              <th className="py-2.5 pl-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {membros.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-sand/40">
                <td className="py-3 pr-3 font-medium">{p.nome}</td>
                <td className="px-3 py-3 text-muted-foreground">{p.positions?.nome ?? "—"}</td>
                <td className="px-3 py-3 text-muted-foreground">{p.job_functions?.nome ?? "—"}</td>
                <td className="px-3 py-3 text-muted-foreground">{p.supervisor?.nome ?? "—"}</td>
                <td className="px-3 py-3">
                  <Pill tone={p.status === "ativo" ? "success" : "warning"}>{p.status}</Pill>
                </td>
                <td className="py-3 pl-3">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Select
                      value=""
                      disabled={!perm.podeGerenciarMembros}
                      onValueChange={(destino) => {
                        const alvo = equipes.find((e) => e.id === destino);
                        void mover(p, destino, `transferido para a equipe ${alvo?.nome ?? ""}`);
                      }}
                    >
                      <SelectTrigger className="h-8 w-[190px]">
                        <SelectValue placeholder="Transferir para..." />
                      </SelectTrigger>
                      <SelectContent>
                        {equipes
                          .filter((e) => e.id !== equipeId && e.status === "ativo")
                          .map((e) => (
                            <SelectItem key={e.id} value={e.id}>
                              {e.nome}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!perm.podeGerenciarMembros}
                      onClick={() => void mover(p, null, "removido da equipe")}
                    >
                      <UserMinus className="size-4" /> Remover
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {membros.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-muted-foreground">
                  Nenhum colaborador vinculado a esta equipe.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
