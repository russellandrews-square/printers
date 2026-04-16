import { MODIFIER_GROUPS, type ModifierGroup, type ModifierOption } from './modifierGroupData';
import type { ModifierGroupRuleContent } from './types';

type SelectionMap = Record<string, Set<string>>;

export function emptyModifierSelections(groups: ModifierGroup[]): SelectionMap {
  const out: SelectionMap = {};
  for (const g of groups) {
    out[g.id] = new Set();
  }
  return out;
}

export function allModifierSelections(groups: ModifierGroup[]): SelectionMap {
  const out: SelectionMap = {};
  for (const g of groups) {
    out[g.id] = new Set(g.options.map((o) => o.id));
  }
  return out;
}

export function selectionMapFromModifierGroupContents(
  contents: ModifierGroupRuleContent[],
): SelectionMap {
  const byGroup = new Map(contents.map((c) => [c.modifierGroupId, new Set(c.includedOptionIds)]));
  const out: SelectionMap = {};
  for (const g of MODIFIER_GROUPS) {
    out[g.id] = byGroup.get(g.id) ?? new Set();
  }
  return out;
}

/** Merge picker save into stored content (catalog order; drops groups cleared in picker). */
export function mergeModifierGroupSave(
  prev: ModifierGroupRuleContent[],
  saved: ModifierGroupRuleContent[],
): ModifierGroupRuleContent[] {
  const savedById = new Map(saved.map((s) => [s.modifierGroupId, s]));
  const next: ModifierGroupRuleContent[] = [];
  for (const g of MODIFIER_GROUPS) {
    const row = savedById.get(g.id);
    if (row) next.push(row);
  }
  const other = prev.filter((p) => !MODIFIER_GROUPS.some((g) => g.id === p.modifierGroupId));
  return [...other, ...next];
}

export function modifierGroupById(id: string): ModifierGroup | undefined {
  return MODIFIER_GROUPS.find((g) => g.id === id);
}

const OPTION_BY_ID: Map<string, ModifierOption> = new Map();
for (const g of MODIFIER_GROUPS) {
  for (const o of g.options) {
    OPTION_BY_ID.set(o.id, o);
  }
}

export function modifierOptionById(id: string): ModifierOption | undefined {
  return OPTION_BY_ID.get(id);
}

/** Selected option display names, sorted alphabetically. */
export function selectedModifierOptionNamesSorted(ids: readonly string[]): string[] {
  return [...ids]
    .map((id) => modifierOptionById(id)?.name ?? id)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}
