// Helper para formatação de datas no padrão local (pt-BR)
// Mantemos uma função simples e reutilizável para evitar duplicação
export function formatDateLocal(value?: string | Date | null, opts?: { withTime?: boolean }) {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "-";

  try {
    const datePart = d.toLocaleDateString("pt-BR");
    if (opts && opts.withTime === false) return datePart;
    const timePart = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return `${datePart} às ${timePart}`;
  } catch (e) {
    // Fallback simples
    return d.toISOString();
  }
}

export default formatDateLocal;
