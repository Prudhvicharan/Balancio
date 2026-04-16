import type { ParsedTransaction, PaymentMethod } from '@/types';
import { getTodayISO } from './utils';

const METHOD_ALIASES: Record<string, PaymentMethod> = {
  cash: 'cash',
  venmo: 'venmo',
  bank: 'bank',
  transfer: 'bank',
  wire: 'bank',
  online: 'bank',
  amex: 'amex',
  'american express': 'amex',
  zelle: 'zelle',
  paypal: 'paypal',
  pp: 'paypal',
};

function detectMethod(text: string): PaymentMethod {
  const lower = text.toLowerCase();
  for (const [alias, method] of Object.entries(METHOD_ALIASES)) {
    if (lower.includes(alias)) return method;
  }
  return 'other';
}

function extractNote(segment: string): string | undefined {
  // Remove amount patterns, method keywords, punctuation
  const cleaned = segment
    .replace(/[+-]?\$?\d+(\.\d{1,2})?/g, '')
    .replace(/\b(cash|venmo|bank|online|amex|zelle|paypal|transfer|wire|out of|paid|remaining)\b/gi, '')
    .replace(/[()[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length > 1 ? cleaned : undefined;
}

interface ParseSegment {
  raw: string;
  amount: number;
  type: 'lent' | 'received';
  paymentMethod: PaymentMethod;
  note?: string;
}

/**
 * Parse messy free-form text into structured transactions.
 *
 * Handles formats like:
 *   "500(online) + 250(Amex Venmo) + 100(out of 700 online)"
 *   "+500, +200, -100"
 *   "paid 300 cash, 200 venmo"
 */
export function parseSmartInput(
  raw: string,
  defaultType: 'lent' | 'received' = 'lent'
): ParsedTransaction[] {
  const results: ParsedTransaction[] = [];

  // Split on commas, semicolons, newlines, or + (but not inside parens)
  const segments = raw.split(/[,;\n]|\s+(?=[+-])/).map((s) => s.trim()).filter(Boolean);

  for (const segment of segments) {
    // Match amount patterns: optional sign, optional $, digits, optional decimal
    const amountMatch = segment.match(/([+-])?\$?(\d+(?:\.\d{1,2})?)/);
    if (!amountMatch) continue;

    const sign = amountMatch[1];
    const amount = parseFloat(amountMatch[2]);
    if (!amount || amount <= 0) continue;

    // Determine type from sign or keywords
    let type: 'lent' | 'received' = defaultType;
    if (sign === '+') type = 'lent';
    else if (sign === '-') type = 'received';
    else if (/\b(paid|received|got back|repaid|returned)\b/i.test(segment)) type = 'received';
    else if (/\b(lent|gave|sent|given)\b/i.test(segment)) type = 'lent';

    const paymentMethod = detectMethod(segment);
    const note = extractNote(segment);

    results.push({ amount, type, paymentMethod, note });
  }

  return results;
}

interface BulkParseResult {
  transactions: ParsedTransaction[];
  date: string;
  rawInput: string;
}

export function parseBulkInput(raw: string, defaultType: 'lent' | 'received' = 'lent'): BulkParseResult {
  const transactions = parseSmartInput(raw, defaultType);
  return {
    transactions,
    date: getTodayISO(),
    rawInput: raw,
  };
}
