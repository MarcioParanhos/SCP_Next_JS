// File: src/components/servidores/schema.ts
// Defines the Zod schema for an Employee and the corresponding TypeScript type.
// - Used for static typing in components and API data validation.
// - Each field maps to a column displayed in the employees table.
import { z } from "zod";

export const servidorSchema = z.object({
  id: z.number(),            // Unique identifier in the database
  name: z.string(),          // Full name of the employee (column: SERVIDOR)
  cpf: z.string(),           // Brazilian CPF tax number (column: CPF)
  enrollment: z.string(),    // Functional enrollment number, e.g. "PENDING" (column: MATRÍCULA)
  bond_type: z.string(),     // Employment bond type, e.g. "REDA" (column: VÍNCULO)
  work_schedule: z.string(), // Work schedule / shift, e.g. "20H" (column: REGIME)
  createdAt: z.string(),     // Registration date as ISO string (column: DATA DO CADASTRO)
});

// Type inferred automatically by Zod — used to type props and component state
export type ServidorRow = z.infer<typeof servidorSchema>;
