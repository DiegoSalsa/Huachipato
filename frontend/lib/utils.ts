//
// Common corrupted name substrings from bad CSV exports.
// Maps the corrupted version (with ?) to the clean, normalized version (no accents).
//
const CORRUPTED_NAMES_MAP: Record<string, string> = {
  "D?AZ": "DIAZ",
  "BRICE?O": "BRICENO",
  "N?ÑEZ": "NUNEZ",
  "NU?EZ": "NUNEZ",
  "N?NEZ": "NUNEZ",
  "PE?A": "PENA",
  "MU?OZ": "MUNOZ",
  "IBA?EZ": "IBANEZ",
  "YA?EZ": "YANEZ",
  "MART?NEZ": "MARTINEZ",
  "FERN?NDEZ": "FERNANDEZ",
  "HERN?NDEZ": "HERNANDEZ",
  "RODR?GUEZ": "RODRIGUEZ",
  "L?PEZ": "LOPEZ",
  "G?MEZ": "GOMEZ",
  "P?REZ": "PEREZ",
  "S?NCHEZ": "SANCHEZ",
  "RAM?REZ": "RAMIREZ",
  "GARC?A": "GARCIA",
  "GUTI?RREZ": "GUTIERREZ",
  "CORT?S": "CORTES",
  "VALD?S": "VALDES",
  "M?RQUEZ": "MARQUEZ",
  "V?SQUEZ": "VASQUEZ",
  "VEL?SQUEZ": "VELASQUEZ",
  "?": "", // Elimina signos sueltos que no fueron corregidos antes
  "": "", // Elimina caracteres genericos de reemplazo
};

//
// Normalize player name for consistent matching across CSVs.
//
// Steps:
//   1. trim()
//   2. UPPERCASE
//   3. Fix common corrupted exports (por ejemplo "D?AZ" -> "DIAZ")
//   4. Remove accents/diacritics (NFD + strip combining chars)
//   5. Collapse multiple spaces -> single space
//
// "  Cris  Martínez " -> "CRIS MARTINEZ"
// " E Cañete"         -> "E CANETE"
//
export function normalizeName(raw: string): string {
  let upper = raw.trim().toUpperCase();
  
  // Reemplaza textos danados conocidos
  for (const [corrupted, fixed] of Object.entries(CORRUPTED_NAMES_MAP)) {
    if (upper.includes(corrupted)) {
      upper = upper.split(corrupted).join(fixed);
    }
  }

  return upper
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

//
// Clean a numeric string: strip thousand separators (dots, spaces),
// normalize comma decimal separators to dots, then parse.
//
//   "35.421"   -> 35421   (dots as thousands)
//   "25,5"     -> 25.5    (comma as decimal)
//   "35.421,5" -> 35421.5 (mixed)
//   ""         -> "0"
//
export function cleanNumericString(value: unknown): string {
  if (value === null || value === undefined || value === "") return "0";
  let str = String(value).trim();
  if (str === "" || str === "-") return "0";

  // Puntos como separador de miles y coma decimal (por ejemplo "35.421,5")
  if (/^\d{1,3}(\.\d{3})*(,\d+)?$/.test(str)) {
    str = str.replace(/\./g, "").replace(",", ".");
  }
  // Comas como separador de miles (por ejemplo "35,421")
  else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(str)) {
    str = str.replace(/,/g, "");
  }
  // Coma decimal simple (por ejemplo "25,5")
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
