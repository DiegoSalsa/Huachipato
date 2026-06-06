/**
 * Normalize player name for consistent matching across CSVs.
 *
 * Steps:
 *   1. trim()
 *   2. UPPERCASE
 *   3. Remove accents/diacritics (NFD + strip combining chars)
 *   4. Collapse multiple spaces → single space
 *
 * "  Cris  Martínez " → "CRIS MARTINEZ"
 * " E Cañete"         → "E CANETE"
 */
export function normalizeName(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Clean a numeric string: strip thousand separators (dots, spaces),
 * normalize comma decimal separators to dots, then parse.
 *
 *   "35.421"   → 35421   (dots as thousands)
 *   "25,5"     → 25.5    (comma as decimal)
 *   "35.421,5" → 35421.5 (mixed)
 *   ""         → "0"
 */
export function cleanNumericString(value: unknown): string {
  if (value === null || value === undefined || value === "") return "0";
  let str = String(value).trim();
  if (str === "" || str === "-") return "0";

  // dots as thousands, comma as decimal (e.g. "35.421,5")
  if (/^\d{1,3}(\.\d{3})*(,\d+)?$/.test(str)) {
    str = str.replace(/\./g, "").replace(",", ".");
  }
  // commas as thousands (e.g. "35,421")
  else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(str)) {
    str = str.replace(/,/g, "");
  }
  // simple comma as decimal (e.g. "25,5")
  else if (/^\d+,\d+$/.test(str)) {
    str = str.replace(",", ".");
  }

  return str;
}

export function parseFloatSafe(value: unknown): number {
  const parsed = parseFloat(cleanNumericString(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseIntSafe(value: unknown): number {
  const parsed = parseInt(cleanNumericString(value), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}
