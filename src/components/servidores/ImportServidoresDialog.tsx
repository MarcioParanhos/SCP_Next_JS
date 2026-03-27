"use client";

// ============================================================
// ImportServidoresDialog
// ============================================================
// Permite importar servidores em massa via arquivo CSV.
//
// Fluxo de uso:
//   1. Usuário clica em "Importar CSV" → dialog abre
//   2. Usuário seleciona ou arrasta um arquivo .csv para a área de upload
//   3. O arquivo é parseado no cliente (suporta separador ; ou ,)
//   4. A API é consultada em modo dryRun para verificar duplicatas por CPF
//   5. Preview mostra cada linha com status: Novo / Duplicado / Inválido
//   6. Usuário revisa e clica em "Importar X servidor(es)"
//   7. Apenas os registros com status "Novo" são enviados para o banco
//
// Colunas aceitas no CSV (português ou inglês, qualquer ordem):
//   nome / name
//   cpf
//   matricula / enrollment
//   vinculo / bond_type
//   regime / work_schedule
//
// Regras de validação básica (client-side):
//   - nome, cpf, vinculo e regime são obrigatórios
//   - matricula é opcional (padrão: PENDING quando ausente)

import * as React from "react";
import { FileText, Upload } from "lucide-react";
import { IconLoader } from "@tabler/icons-react";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ServidorRow } from "./schema";

// -----------------------------------------------------------------------
// Tipo de cada linha parseada do CSV
// O status é calculado em dois momentos:
//   - Após o parse: "invalido" (campos obrigatórios ausentes) ou "novo" (provisório)
//   - Após o dryRun: "duplicado" (CPF já existe no banco) ou confirmação de "novo"
// -----------------------------------------------------------------------
type ParsedRow = {
  name: string;
  cpf: string;
  enrollment: string;
  bond_type: string;
  work_schedule: string;
  status: "novo" | "duplicado" | "invalido";
  errors: string[]; // mensagens de erro de validação
};

// -----------------------------------------------------------------------
// Mapa de nomes de colunas aceitos no CSV → chave interna do tipo ParsedRow
// Permite que o usuário use cabeçalhos em português ou inglês
// -----------------------------------------------------------------------
const HEADER_MAP: Record<string, keyof Omit<ParsedRow, "status" | "errors">> = {
  nome: "name",
  name: "name",
  cpf: "cpf",
  matricula: "enrollment",
  enrollment: "enrollment",
  vinculo: "bond_type",
  vínculo: "bond_type",
  bond_type: "bond_type",
  regime: "work_schedule",
  work_schedule: "work_schedule",
};

// -----------------------------------------------------------------------
// splitCsvLine: divide uma linha CSV respeitando campos entre aspas duplas
// Exemplo: 'João "Silva",123,"Rua A, B"' → ['João "Silva"', '123', 'Rua A, B']
// -----------------------------------------------------------------------
function splitCsvLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      // Aspas duplas escapadas (""): produz um " literal dentro do campo
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === sep && !inQuotes) {
      // Separador fora de aspas: finaliza o campo atual
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }

  result.push(current.trim());
  return result;
}

// -----------------------------------------------------------------------
// parseCSVText: converte o texto bruto do CSV em um array de ParsedRow
// Aplica validação básica (campos obrigatórios) e normalização de valores
// -----------------------------------------------------------------------
function parseCSVText(text: string): ParsedRow[] {
  // Remove BOM (presente em arquivos CSV gerados pelo Excel no Windows)
  const clean = text.replace(/^\uFEFF/, "").trim();
  const lines = clean.split(/\r?\n/).filter((l) => l.trim());

  // Arquivo deve ter pelo menos 1 linha de cabeçalho e 1 linha de dados
  if (lines.length < 2) return [];

  // Detecta o separador: ponto-e-vírgula tem precedência sobre vírgula
  const sep = lines[0].includes(";") ? ";" : ",";

  // Normaliza os cabeçalhos: minúsculas, sem aspas, sem espaços extras
  const rawHeaders = splitCsvLine(lines[0], sep).map((h) =>
    h.toLowerCase().trim().replace(/['"]/g, "")
  );

  // Mapeia a posição de cada coluna para a chave interna (null = coluna desconhecida)
  const fieldKeys = rawHeaders.map((h) => HEADER_MAP[h] ?? null);

  // Processa cada linha de dados (a partir da linha 1, pulando o cabeçalho)
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line, sep);

    // Monta o objeto com os campos mapeados
    const raw: Record<string, string> = {};
    fieldKeys.forEach((key, i) => {
      if (key) raw[key] = values[i] ?? "";
    });

    // Normaliza os valores de cada campo
    const name = raw.name?.trim() ?? "";
    const cpf = raw.cpf?.trim() ?? "";
    const enrollment = raw.enrollment?.trim() || "PENDING"; // padrão PENDING
    const bond_type = raw.bond_type?.trim().toUpperCase() ?? "";
    const work_schedule = raw.work_schedule?.trim().toUpperCase() ?? "";

    // Validação dos campos obrigatórios
    const errors: string[] = [];
    if (!name) errors.push("Nome obrigatório");
    if (!cpf) errors.push("CPF obrigatório");
    if (!bond_type) errors.push("Vínculo obrigatório");
    if (!work_schedule) errors.push("Regime obrigatório");

    return {
      name,
      cpf,
      enrollment,
      bond_type,
      work_schedule,
      // Status inicial: inválido se faltar campo, caso contrário "novo" (provisório)
      status: errors.length > 0 ? ("invalido" as const) : ("novo" as const),
      errors,
    };
  });
}

// -----------------------------------------------------------------------
// ImportServidoresDialog — componente principal
// Props:
//   onImport?: (rows: ServidorRow[]) => void
//     — callback chamado após importação bem-sucedida com os registros criados
// -----------------------------------------------------------------------
export function ImportServidoresDialog({
  onImport,
}: {
  onImport?: (rows: ServidorRow[]) => void;
}) {
  // Controle de abertura do dialog
  const [open, setOpen] = React.useState(false);

  // Linhas parseadas do CSV com seus status
  const [rows, setRows] = React.useState<ParsedRow[]>([]);

  // Estados de carregamento
  const [checking, setChecking] = React.useState(false);   // verificando duplicatas
  const [importing, setImporting] = React.useState(false); // importando no banco

  // Estado visual da área de drag & drop
  const [dragging, setDragging] = React.useState(false);

  // Referência ao input file oculto
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // -----------------------------------------------------------------------
  // handleOpenChange: limpa todo o estado ao fechar o dialog
  // -----------------------------------------------------------------------
  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (!v) {
      setRows([]);
      setChecking(false);
      setImporting(false);
      setDragging(false);
      // Reseta o input para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // -----------------------------------------------------------------------
  // handleFile: lê o arquivo .csv e inicia o fluxo de parse + verificação
  // -----------------------------------------------------------------------
  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Formato inválido. Selecione um arquivo .csv");
      return;
    }

    // Limite de tamanho: 10 MB — arquivos maiores são rejeitados com mensagem clara
    const MAX_SIZE_MB = 10;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Arquivo muito grande. O limite é ${MAX_SIZE_MB} MB.`);
      return;
    }

    const text = await file.text();
    const parsed = parseCSVText(text);

    if (parsed.length === 0) {
      toast.error("Arquivo vazio ou com formato inválido. Verifique o cabeçalho.");
      return;
    }

    // Exibe o preview imediatamente e em seguida verifica duplicatas
    setRows(parsed);
    await checkDuplicates(parsed);
  }

  // -----------------------------------------------------------------------
  // checkDuplicates: consulta a API em modo dryRun para marcar duplicatas.
  // A duplicata é identificada pela combinação CPF + matrícula:
  // um mesmo CPF com matrícula diferente é considerado um novo registro válido.
  // -----------------------------------------------------------------------
  async function checkDuplicates(parsed: ParsedRow[]) {
    // Só envia as linhas válidas para a verificação
    const validRows = parsed.filter((r) => r.status !== "invalido");
    if (validRows.length === 0) return;

    setChecking(true);
    try {
      const res = await fetch("/api/servidores/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // dryRun=true: a API retorna as chaves duplicadas (cpf|enrollment) sem salvar
        body: JSON.stringify({ rows: validRows, dryRun: true }),
      });

      if (!res.ok) throw new Error("Falha na verificação");

      const { duplicateKeys }: { duplicateKeys: string[] } = await res.json();
      // Conjunto de chaves compostas "cpf|enrollment" já existentes no banco
      const dupSet = new Set(duplicateKeys);

      // Atualiza o status de cada linha com base na resposta da API
      setRows((prev) =>
        prev.map((r) => {
          // Chave composta da linha atual (mesmo formato que a API usa)
          const key = `${r.cpf}|${r.enrollment || "PENDING"}`;
          return {
            ...r,
            status:
              r.status === "invalido"
                ? "invalido"      // mantém inválido (erro de validação)
                : dupSet.has(key)
                ? "duplicado"     // CPF + matrícula já existem juntos no banco
                : "novo",         // combinação CPF+matrícula é nova, será importada
          };
        })
      );
    } catch {
      toast.error("Não foi possível verificar duplicatas. Tente novamente.");
    } finally {
      setChecking(false);
    }
  }

  // -----------------------------------------------------------------------
  // handleImport: envia apenas as linhas com status "novo" para o banco
  // -----------------------------------------------------------------------
  async function handleImport() {
    const newRows = rows.filter((r) => r.status === "novo");
    if (newRows.length === 0) return;

    setImporting(true);
    try {
      const res = await fetch("/api/servidores/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // dryRun=false: a API cria os registros no banco
        body: JSON.stringify({ rows: newRows, dryRun: false }),
      });

      if (!res.ok) throw new Error("Falha na importação");

      const { created }: { created: ServidorRow[] } = await res.json();

      // Notifica o componente pai com os registros criados
      onImport?.(created);
      toast.success(`${created.length} servidor(es) importado(s) com sucesso.`);
      handleOpenChange(false);
    } catch {
      toast.error("Erro ao importar. Tente novamente.");
    } finally {
      setImporting(false);
    }
  }

  // Contadores para o painel de resumo
  const newCount = rows.filter((r) => r.status === "novo").length;
  const dupCount = rows.filter((r) => r.status === "duplicado").length;
  const invalidCount = rows.filter((r) => r.status === "invalido").length;

  // Limite de linhas exibidas no preview para não travar o browser em arquivos grandes.
  // O restante é processado normalmente — apenas a exibição é reduzida.
  const PREVIEW_LIMIT = 20;
  const previewRows = rows.slice(0, PREVIEW_LIMIT);
  const hiddenCount = rows.length - previewRows.length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* Botão que abre o dialog */}
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4" />
          Importar CSV
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[92vh] max-w-7xl flex-col gap-4">
        <DialogHeader>
          <DialogTitle>Importar Servidores via CSV</DialogTitle>
        </DialogHeader>

        {rows.length === 0 ? (
          // ------------------------------------------------------------------
          // Passo 1: área de upload com suporte a drag & drop
          // ------------------------------------------------------------------
          <div
            className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-14 text-center transition-colors ${
              dragging ? "border-primary bg-primary/5" : "hover:bg-muted/40"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
          >
            <FileText className="h-12 w-12 text-muted-foreground" />

            <div className="space-y-1">
              <p className="text-sm font-medium">
                Clique ou arraste um arquivo CSV aqui
              </p>
              <p className="text-xs text-muted-foreground">
                Colunas aceitas:{" "}
                <code className="rounded bg-muted px-1 py-0.5">
                  nome, cpf, matricula, vinculo, regime
                </code>
              </p>
              <p className="text-xs text-muted-foreground">
                Separador: ponto e vírgula <code className="rounded bg-muted px-1 py-0.5">;</code>{" "}
                ou vírgula <code className="rounded bg-muted px-1 py-0.5">,</code>
                {" — "}
                tamanho máximo: <code className="rounded bg-muted px-1 py-0.5">10 MB</code>
              </p>
            </div>

            {/* Input oculto acionado pelo clique na área */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>
        ) : (
          // ------------------------------------------------------------------
          // Passo 2: preview das linhas com status por linha
          // ------------------------------------------------------------------
          <>
            {/* Painel de resumo dos contadores */}
            <div className="flex flex-wrap items-center gap-2">
              {checking ? (
                // Spinner enquanto a API verifica duplicatas
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <IconLoader className="h-4 w-4 animate-spin" />
                  Verificando duplicatas no banco...
                </span>
              ) : (
                <>
                  {/* Badge verde: registros novos que serão importados */}
                  <Badge className="border-green-600 text-green-600" variant="outline">
                    {newCount} novo(s)
                  </Badge>

                  {/* Badge amarelo: duplicatas que serão ignoradas */}
                  {dupCount > 0 && (
                    <Badge className="border-yellow-600 text-yellow-600" variant="outline">
                      {dupCount} duplicado(s) — CPF + matrícula já cadastrados, serão ignorados
                    </Badge>
                  )}

                  {/* Badge vermelho: linhas inválidas por falta de campos */}
                  {invalidCount > 0 && (
                    <Badge className="border-destructive text-destructive" variant="outline">
                      {invalidCount} inválido(s) — campo obrigatório ausente, serão ignorados
                    </Badge>
                  )}
                </>
              )}
            </div>

            {/* Tabela de preview com scroll vertical */}
            <div className="flex-1 overflow-auto rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 bg-muted">
                  <TableRow>
                    <TableHead className="w-32">Status</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Vínculo</TableHead>
                    <TableHead>Regime</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {/* Exibe apenas as primeiras PREVIEW_LIMIT linhas para performance */}
                  {previewRows.map((row, i) => (
                    // Linhas não-novas recebem opacidade reduzida para indicar que serão ignoradas
                    <TableRow
                      key={i}
                      className={row.status !== "novo" ? "opacity-50" : undefined}
                    >
                      {/* Coluna de status: badge colorido */}
                      <TableCell>
                        {checking ? (
                          // Durante a verificação, mostra badge neutro
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            Verificando...
                          </Badge>
                        ) : row.status === "novo" ? (
                          <Badge variant="outline" className="border-green-600 text-green-600 text-xs">
                            Novo
                          </Badge>
                        ) : row.status === "duplicado" ? (
                          <Badge variant="outline" className="border-yellow-600 text-yellow-600 text-xs">
                            Duplicado
                          </Badge>
                        ) : (
                          // Inválido: mostra o primeiro erro de validação como tooltip implícito
                          <Badge variant="outline" className="border-destructive text-destructive text-xs">
                            Inválido
                          </Badge>
                        )}
                      </TableCell>

                      {/* Dados da linha — exibe "—" quando o campo está vazio */}
                      <TableCell className="font-medium">
                        {row.name || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {row.cpf || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {row.enrollment === "PENDING" ? (
                          // Matrícula não informada: exibe "Pendente" em cinza
                          <span className="text-muted-foreground text-sm">Pendente</span>
                        ) : (
                          row.enrollment
                        )}
                      </TableCell>
                      <TableCell>
                        {row.bond_type || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {row.work_schedule || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Aviso de linhas ocultas quando o arquivo tem mais de PREVIEW_LIMIT registros */}
                  {hiddenCount > 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-3 text-center text-sm text-muted-foreground"
                      >
                        ... e mais{" "}
                        <span className="font-medium text-foreground">{hiddenCount}</span>{" "}
                        registro(s) não exibido(s) no preview — todos serão processados na importação.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {/* Rodapé com botões de ação */}
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => {
              if (rows.length > 0) {
                // Volta para a tela de upload sem fechar o dialog
                setRows([]);
                if (fileInputRef.current) fileInputRef.current.value = "";
              } else {
                handleOpenChange(false);
              }
            }}
          >
            {rows.length > 0 ? "Trocar arquivo" : "Cancelar"}
          </Button>

          {/* Botão de importação: só habilitado quando há linhas novas e nenhum carregamento ativo */}
          {rows.length > 0 && (
            <Button
              onClick={handleImport}
              disabled={newCount === 0 || checking || importing}
            >
              {importing ? (
                <>
                  <IconLoader className="animate-spin" />
                  Importando...
                </>
              ) : (
                `Importar ${newCount} servidor(es)`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
