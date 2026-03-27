// File: src/components/school-units/schema.ts
import { z } from "zod";

export const schema = z.object({
  id: z.number(),
  municipality: z.string(),
  nte: z.string(),
  schoolUnit: z.string(),
  sec_code: z.string(),
  // Campo adicional: `uo_code` (Código UO)
  // - Marcamos como opcional porque registros antigos podem não ter esse valor.
  // - Usado pelo frontend para exibir a coluna Código UO na tabela.
  uo_code: z.string().optional(),
  typology: z.string(),
  status: z.string(),
  limit: z.string(),
  // Campo de status de homologação
  // - Armazena a última ação registrada: "HOMOLOGATED" | "UNHOMOLOGATED" | null
  // - Preenchido pela API com base no registro mais recente da tabela `homologations`
  homologationStatus: z.string().nullable().optional(),
});
export type SchoolUnitRow = z.infer<typeof schema>;
