export const CITIES = [
  "Leander", "Liberty Hill", "Georgetown", "Round Rock",
  "Cedar Park", "Hutto", "Austin",
];

export interface ParsedFilters {
  city?: string;
  beds?: number;
  baths?: number;
  max_price?: number;
  min_price?: number;
  property_type?: string;
  listing_type?: "sale" | "rent";
  status?: string;
}

export type Intent =
  | "property_search"
  | "greeting"
  | "help"
  | "contact"
  | "valuation"
  | "mortgage"
  | "fallback";

export interface ParseResult {
  intent: Intent;
  filters: ParsedFilters;
}

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

function toNum(s: string): number | undefined {
  const n = parseInt(s, 10);
  if (!isNaN(n)) return n;
  return NUMBER_WORDS[s.toLowerCase()];
}

function parsePrices(text: string): { min?: number; max?: number } {
  const result: { min?: number; max?: number } = {};

  const maxRe = /(?:under|below|less\s+than|max(?:imum)?|up\s+to)\s*\$?([\d,]+)\s*([km]?)/i;
  const maxM = text.match(maxRe);
  if (maxM) {
    let v = parseInt(maxM[1].replace(/,/g, ""), 10);
    if (maxM[2].toLowerCase() === "k") v *= 1000;
    if (maxM[2].toLowerCase() === "m") v *= 1_000_000;
    result.max = v;
  }

  const minRe = /(?:above|over|more\s+than|at\s+least|minimum)\s*\$?([\d,]+)\s*([km]?)/i;
  const minM = text.match(minRe);
  if (minM) {
    let v = parseInt(minM[1].replace(/,/g, ""), 10);
    if (minM[2].toLowerCase() === "k") v *= 1000;
    if (minM[2].toLowerCase() === "m") v *= 1_000_000;
    result.min = v;
  }

  return result;
}

export function parseMessage(text: string): ParseResult {
  const lower = text.toLowerCase();
  const filters: ParsedFilters = {};

  if (/\b(hi|hello|hey|howdy|greetings)\b/i.test(text) && text.trim().split(/\s+/).length < 5) {
    return { intent: "greeting", filters };
  }
  if (/\b(help|what can you do|capabilities|how do you work)\b/i.test(lower)) {
    return { intent: "help", filters };
  }
  if (/\b(contact|agent|call|schedule|tour|appointment|meet|speak with)\b/i.test(lower)) {
    return { intent: "contact", filters };
  }
  if (/\b(value|worth|valuation|sell my home|home value|what is my home|appraisal)\b/i.test(lower)) {
    return { intent: "valuation", filters };
  }
  if (/\b(mortgage|monthly payment|afford|calculator|loan|interest rate|down payment)\b/i.test(lower)) {
    return { intent: "mortgage", filters };
  }

  const bedM = text.match(/(\w+)\s*(?:bed(?:room)?s?|br)\b/i) ?? text.match(/\b(\w+)\s*-\s*bed(?:room)?/i);
  if (bedM) { const n = toNum(bedM[1]); if (n !== undefined) filters.beds = n; }

  const bathM = text.match(/(\w+)\s*(?:bath(?:room)?s?|ba)\b/i);
  if (bathM) { const n = toNum(bathM[1]); if (n !== undefined) filters.baths = n; }

  for (const city of CITIES) {
    if (new RegExp(`\\b${city}\\b`, "i").test(text)) { filters.city = city; break; }
  }

  const prices = parsePrices(text);
  if (prices.max !== undefined) filters.max_price = prices.max;
  if (prices.min !== undefined) filters.min_price = prices.min;

  if (/single[\s-]family/i.test(text)) filters.property_type = "Single Family";
  else if (/condo/i.test(text)) filters.property_type = "Condo";
  else if (/townhouse|townhome/i.test(text)) filters.property_type = "Townhouse";
  else if (/\bland\b/i.test(text)) filters.property_type = "Land";

  filters.listing_type = /\b(rent|rental|for\s+rent)\b/i.test(text) ? "rent" : "sale";

  if (/\bsold\b/i.test(text)) filters.status = "sold";
  else if (/\bpending\b/i.test(text)) filters.status = "pending";
  else filters.status = "active";

  const hasSearchTerms =
    filters.beds !== undefined || filters.baths !== undefined ||
    filters.city !== undefined || filters.max_price !== undefined ||
    filters.min_price !== undefined || filters.property_type !== undefined ||
    /\b(home|house|property|properties|listing|real estate|find|show|search|look)\b/i.test(text);

  return { intent: hasSearchTerms ? "property_search" : "fallback", filters };
}
