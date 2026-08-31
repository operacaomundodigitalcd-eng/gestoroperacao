export const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

export const MESES_CURTOS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export type Direcao = "maior_melhor" | "menor_melhor" | "igual" | "intervalo";
export type PerfStatus = "superou" | "atingida" | "atencao" | "nao_atingida";

export function calcularPercentual(direcao: Direcao, realizado: number, meta: number): number {
  if (!meta) return 0;
  if (direcao === "menor_melhor") {
    if (!realizado) return 200;
    return Math.round((meta / realizado) * 10000) / 100;
  }
  if (direcao === "igual") {
    const desvio = Math.abs(realizado - meta) / meta;
    return Math.round((1 - desvio) * 10000) / 100;
  }
  return Math.round((realizado / meta) * 10000) / 100;
}

export function statusPorPercentual(percentual: number): PerfStatus {
  if (percentual >= 105) return "superou";
  if (percentual >= 100) return "atingida";
  if (percentual >= 90) return "atencao";
  return "nao_atingida";
}

export const STATUS_INFO: Record<PerfStatus, { label: string; icone: string; tone: "success" | "warning" | "destructive" }> = {
  superou: { label: "Superou a meta", icone: "✓", tone: "success" },
  atingida: { label: "Meta atingida", icone: "✓", tone: "success" },
  atencao: { label: "Atenção", icone: "⚠", tone: "warning" },
  nao_atingida: { label: "Meta não atingida", icone: "✕", tone: "destructive" },
};

export const ACTION_STATUS_LABEL: Record<string, string> = {
  nao_iniciado: "Não iniciado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  atrasado: "Atrasado",
  cancelado: "Cancelado",
};

export const DIRECAO_LABEL: Record<string, string> = {
  maior_melhor: "Maior é melhor",
  menor_melhor: "Menor é melhor",
  igual: "Igual à meta",
  intervalo: "Entre intervalo",
};

export const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador Geral",
  gestor: "Gestor",
  supervisor: "Supervisor",
  colaborador: "Colaborador",
  visualizador: "Visualizador / Diretoria",
};

export const EMPLOYEE_STATUS_LABEL: Record<string, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  afastado: "Afastado",
  ferias: "Férias",
  desligado: "Desligado",
};

export function mascararCpf(cpf?: string | null): string {
  if (!cpf) return "—";
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return "—";
  return `***.***.***-${digits.slice(9)}`;
}

export function formatarCpf(cpf: string): string {
  const d = cpf.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

export function cpfValido(cpf: string): boolean {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const calc = (fim: number) => {
    let soma = 0;
    for (let i = 0; i < fim; i++) soma += Number(d[i]) * (fim + 1 - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
}

export function formatarTelefone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

export function num(v: number | null | undefined, casas = 1): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: casas });
}

export function anosDisponiveis(): number[] {
  const atual = new Date().getFullYear();
  return [atual + 1, atual, atual - 1, atual - 2];
}
