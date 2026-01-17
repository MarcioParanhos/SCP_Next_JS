// File: src/components/school-units/schema.ts
import { z } from "zod";

export const schema = z.object({
  id: z.number(),
  municipality: z.string(),
  nte: z.string(),
  schoolUnit: z.string(),
  sec_code: z.string(),
  typology: z.string(),
  status: z.string(),
  limit: z.string(),
});
export type SchoolUnitRow = z.infer<typeof schema>;
