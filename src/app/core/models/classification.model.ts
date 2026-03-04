/**
 * Classification types and suggestion contract.
 * @see specs/002-guided-transaction-classification/contracts/classification-transaction.md
 */

export type ClassificationType = 'income' | 'expense' | 'transfer' | 'ignore';

export type Confidence = 'High' | 'Medium' | 'Low';

const CONFIDENCE_ORDER: Confidence[] = ['Low', 'Medium', 'High'];

/** Returns true if c is at or above threshold (High > Medium > Low). */
export function confidenceAtOrAbove(c: Confidence, threshold: Confidence): boolean {
  const ci = CONFIDENCE_ORDER.indexOf(c);
  const ti = CONFIDENCE_ORDER.indexOf(threshold);
  return ci >= 0 && ti >= 0 && ci >= ti;
}

export interface ClassificationSuggestion {
  type: ClassificationType;
  category?: string; // required when type is income or expense
  confidence: Confidence;
  sourceId: string;
}
