import { categoryContentSecondaryLine, menuCategoryById } from './entireCategoryRuleUtils';
import { orderSourcesSummaryText } from './orderSourceSelection';
import { FULFILLMENT_RULE_TITLES } from './printingRuleFieldOptions';
import type { PrintingRule } from './types';

function isFullTitleSet(selected: string[] | undefined, allTitles: readonly string[]): boolean {
  if (!selected || selected.length === 0) {
    return true;
  }
  if (selected.length !== allTitles.length) {
    return false;
  }
  const set = new Set(selected);
  return allTitles.every((t) => set.has(t));
}

function fulfillmentSummary(rule: PrintingRule): string {
  const titles = rule.orderFulfillments;
  if (isFullTitleSet(titles, FULFILLMENT_RULE_TITLES)) {
    return 'All fulfillments';
  }
  return titles?.join(', ') ?? 'All fulfillments';
}

function sourceSummary(rule: PrintingRule): string {
  return orderSourcesSummaryText(rule);
}

function contentSummary(rule: PrintingRule): string {
  const rows = rule.entireCategoryContent ?? [];
  if (rows.length === 0) {
    return 'No category content';
  }

  return rows
    .map((row) => {
      const cat = menuCategoryById(row.categoryId);
      const title = cat ? `${cat.name} (Category)` : `${row.categoryId} (Category)`;
      const excludeLine = categoryContentSecondaryLine(row, cat);
      const auto = row.autoIncludeNewItems ? ' · auto-include new items' : '';

      if (excludeLine) {
        return `${title} — ${excludeLine}${auto}`;
      }

      const nItems = cat?.items.length ?? 0;
      const nIncluded = row.includedItemIds.length;
      if (nItems > 0 && nIncluded === nItems) {
        return `${title}: all ${nItems} items${auto}`;
      }
      if (nItems > 0) {
        return `${title}: ${nIncluded} of ${nItems} items${auto}`;
      }
      return `${title}: ${nIncluded} items${auto}`;
    })
    .join(' · ');
}

function ruleTypeLabel(ruleType: PrintingRule['ruleType']): string {
  return ruleType === 'customer_receipt' ? 'Receipt print rule' : 'Ticket print rule';
}

/** One-line summary of fulfillments, sources, and category content for ticket/receipt rule cards. */
export function printRuleCardSummary(rule: PrintingRule): string {
  const body = [
    `Fulfillments: ${fulfillmentSummary(rule)}`,
    `Sources: ${sourceSummary(rule)}`,
    `Content: ${contentSummary(rule)}`,
  ].join(' · ');
  return `${ruleTypeLabel(rule.ruleType)} · ${body}`;
}
