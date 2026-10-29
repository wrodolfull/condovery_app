/** Parse editable Brazilian currency without floating-point rounding.
 *  1.234 is R$ 1.234,00; 1.234,56 is R$ 1.234,56.
 *  Also accept 19.90 as an ungrouped decimal for mobile keyboards.
 */
export function parseBRLInput(raw: string, maxCents = 10_000_000): number | null {
  const text = raw.trim().replace(/^R\$\s*/, "");
  let whole: string;
  let fraction = "";
  if (/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{0,2})?$/.test(text)) {
    [whole, fraction = ""] = text.split(",");
    whole = whole.replaceAll(".", "");
  } else if (/^\d+\.\d{1,2}$/.test(text)) {
    [whole, fraction = ""] = text.split(".");
  } else {
    return null;
  }
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0") || "0");
  return Number.isSafeInteger(cents) && cents >= 0 && cents <= maxCents ? cents : null;
}

export function formatBRLInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}
