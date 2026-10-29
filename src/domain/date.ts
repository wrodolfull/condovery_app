export function dateForApi(value: string) {
  if (!value.trim()) return null;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!m) throw new Error("Informe a data como dia/mês/ano.");
  const iso = m[3] + "-" + m[2] + "-" + m[1];
  const d = new Date(iso + "T12:00:00Z");
  if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0, 10) !== iso)
    throw new Error("Data inválida.");
  return iso;
}

/** Mask a numeric DDMMYYYY input while keeping backspace and pasted dates useful. */
export function formatPreferredDate(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
}
