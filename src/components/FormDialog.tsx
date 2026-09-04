import { useEffect, useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type Campo = {
  name: string;
  label: string;
  tipo?: "texto" | "numero" | "data" | "textarea" | "select";
  opcoes?: { value: string; label: string }[];
  obrigatorio?: boolean;
  placeholder?: string;
  mascara?: (v: string) => string;
  colSpan?: 1 | 2;
};

export type Valores = {
  /** Texto opcional (null quando vazio). */
  txt: (campo: string) => string | null;
  /** Texto obrigatorio. */
  req: (campo: string) => string;
  /** Numero opcional (null quando vazio). */
  nmr: (campo: string) => number | null;
  /** Numero com valor padrao. */
  num: (campo: string, padrao: number) => number;
};

export function FormDialog({
  titulo,
  descricao,
  campos,
  gatilho,
  valoresIniciais,
  onSubmit,
}: {
  titulo: string;
  descricao?: string;
  campos: Campo[];
  gatilho: ReactNode;
  valoresIniciais?: Record<string, string>;
  onSubmit: (valores: Valores) => Promise<void>;
}) {
  const [aberto, setAberto] = useState(false);
  const [valores, setValores] = useState<Record<string, string>>(valoresIniciais ?? {});
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (aberto) {
      setValores(valoresIniciais ?? {});
      setErro(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  const set = (name: string, v: string) => setValores((p) => ({ ...p, [name]: v }));

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>{gatilho}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">{titulo}</DialogTitle>
          {descricao && <DialogDescription>{descricao}</DialogDescription>}
        </DialogHeader>

        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const faltando = campos.filter((c) => c.obrigatorio && !valores[c.name]);
            if (faltando.length) {
              setErro(`Preencha: ${faltando.map((c) => c.label).join(", ")}`);
              return;
            }
            setSalvando(true);
            setErro(null);
            try {
              await onSubmit({
                txt: (c) => (valores[c] ?? "").trim() || null,
                req: (c) => (valores[c] ?? "").trim(),
                nmr: (c) => (valores[c] ? Number(valores[c]) : null),
                num: (c, padrao) => (valores[c] ? Number(valores[c]) : padrao),
              });
              setAberto(false);
            } catch (err) {
              setErro(mensagemDeErro(err));
            } finally {
              setSalvando(false);
            }
          }}
        >
          {campos.map((campo) => (
            <div key={campo.name} className={campo.colSpan === 2 || campo.tipo === "textarea" ? "sm:col-span-2" : ""}>
              <Label htmlFor={campo.name} className="mb-1.5 block text-xs font-medium">
                {campo.label}
                {campo.obrigatorio && <span className="text-destructive"> *</span>}
              </Label>

              {campo.tipo === "select" ? (
                <Select value={valores[campo.name] ?? ""} onValueChange={(v) => set(campo.name, v)}>
                  <SelectTrigger id={campo.name}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {(campo.opcoes ?? []).map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : campo.tipo === "textarea" ? (
                <Textarea
                  id={campo.name}
                  value={valores[campo.name] ?? ""}
                  placeholder={campo.placeholder}
                  onChange={(e) => set(campo.name, e.target.value)}
                />
              ) : (
                <Input
                  id={campo.name}
                  type={campo.tipo === "numero" ? "number" : campo.tipo === "data" ? "date" : "text"}
                  step="any"
                  value={valores[campo.name] ?? ""}
                  placeholder={campo.placeholder}
                  onChange={(e) => set(campo.name, campo.mascara ? campo.mascara(e.target.value) : e.target.value)}
                />
              )}
            </div>
          ))}

          {erro && <p className="sm:col-span-2 text-sm text-destructive">{erro}</p>}

          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
