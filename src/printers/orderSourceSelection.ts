import {
  ORDER_SOURCE_NON_POS_OPTIONS,
  POS_SOURCE_TITLE,
  POS_TERMINAL_OPTIONS,
} from './printingRuleFieldOptions';
import type { PrintingRule } from './types';

const ALL_NON_POS_VALUES = ORDER_SOURCE_NON_POS_OPTIONS.map((o) => o.value);
const ALL_POS_IDS: string[] = POS_TERMINAL_OPTIONS.map((o) => o.id);
const POS_TITLE = POS_SOURCE_TITLE;

/** Legacy `orderSources` titles before phone + walk-in were merged into one option. */
const LEGACY_PHONE_OR_WALK_IN_TITLES = ['Phone call', 'Walk-in'] as const;

function allNonPosSet(): Set<string> {
  return new Set(ALL_NON_POS_VALUES);
}

function allPosTerminalsSet(): Set<string> {
  return new Set(ALL_POS_IDS);
}

/** Total selectable rows (non-POS channels + each POS terminal). */
export function orderSourceSelectableCount(): number {
  return ALL_NON_POS_VALUES.length + ALL_POS_IDS.length;
}

export type OrderSourceSelectionState = {
  nonPos: Set<string>;
  posTerminals: Set<string>;
};

export function orderSourceStateFromRule(rule: PrintingRule | null): OrderSourceSelectionState {
  if (!rule || rule.orderSources === undefined) {
    return { nonPos: allNonPosSet(), posTerminals: allPosTerminalsSet() };
  }

  const titles = rule.orderSources;
  const nonPos = new Set<string>();
  for (const o of ORDER_SOURCE_NON_POS_OPTIONS) {
    if (titles.includes(o.title)) {
      nonPos.add(o.value);
    }
  }
  if (
    LEGACY_PHONE_OR_WALK_IN_TITLES.some((t) => titles.includes(t)) &&
    !nonPos.has('phone-or-walk-in')
  ) {
    nonPos.add('phone-or-walk-in');
  }

  const hasPos = titles.includes(POS_TITLE);
  let posTerminals = new Set<string>();
  if (hasPos) {
    const stored = rule.orderSourcePosTerminalIds;
    if (stored && stored.length > 0) {
      for (const id of stored) {
        if (ALL_POS_IDS.includes(id)) {
          posTerminals.add(id);
        }
      }
    } else {
      posTerminals = allPosTerminalsSet();
    }
  }

  return { nonPos, posTerminals };
}

export function orderSourceFieldsFromState(state: OrderSourceSelectionState): {
  orderSources: string[];
  orderSourcePosTerminalIds: string[] | undefined;
} {
  const titles: string[] = [];
  for (const o of ORDER_SOURCE_NON_POS_OPTIONS) {
    if (state.nonPos.has(o.value)) {
      titles.push(o.title);
    }
  }

  let orderSourcePosTerminalIds: string[] | undefined;
  if (state.posTerminals.size > 0) {
    titles.push(POS_TITLE);
    const allPos =
      state.posTerminals.size === ALL_POS_IDS.length &&
      ALL_POS_IDS.every((id) => state.posTerminals.has(id));
    if (!allPos) {
      orderSourcePosTerminalIds = [...state.posTerminals].sort();
    }
  }

  return { orderSources: titles, orderSourcePosTerminalIds };
}

export function isAllOrderSourcesSelected(state: OrderSourceSelectionState): boolean {
  return (
    state.nonPos.size === ALL_NON_POS_VALUES.length &&
    state.posTerminals.size === ALL_POS_IDS.length
  );
}

export function orderSourceTriggerLabel(state: OrderSourceSelectionState): string {
  if (state.nonPos.size === 0 && state.posTerminals.size === 0) {
    return '';
  }
  if (isAllOrderSourcesSelected(state)) {
    return 'All selected';
  }

  const parts: string[] = [];
  for (const o of ORDER_SOURCE_NON_POS_OPTIONS) {
    if (state.nonPos.has(o.value)) {
      parts.push(o.title);
    }
  }
  if (state.posTerminals.size > 0) {
    if (state.posTerminals.size === ALL_POS_IDS.length) {
      parts.push(POS_TITLE);
    } else {
      const names = [...state.posTerminals]
        .map((id) => POS_TERMINAL_OPTIONS.find((p) => p.id === id)?.title ?? id)
        .sort((a, b) => a.localeCompare(b));
      parts.push(`${POS_TITLE}: ${names.join(', ')}`);
    }
  }
  return parts.join(', ');
}

/** Summary fragment for rule cards (“All sources” vs compact list). */
export function orderSourcesSummaryText(rule: PrintingRule): string {
  const state = orderSourceStateFromRule(rule);
  if (isAllOrderSourcesSelected(state)) {
    return 'All sources';
  }
  if (state.nonPos.size === 0 && state.posTerminals.size === 0) {
    return 'No sources';
  }
  return orderSourceTriggerLabel(state);
}
