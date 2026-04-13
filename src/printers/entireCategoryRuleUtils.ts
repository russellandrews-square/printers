import { MENU_CATEGORIES, type MenuCategory } from './menuCategoryData';
import type { EntireCategoryRuleContent } from './types';

type SelectionMap = Record<string, Set<string>>;

export function selectionMapFromEntireCategoryContents(
  contents: EntireCategoryRuleContent[],
): SelectionMap {
  const byCat = new Map(contents.map((c) => [c.categoryId, new Set(c.includedItemIds)]));
  const out: SelectionMap = {};
  for (const cat of MENU_CATEGORIES) {
    out[cat.id] = byCat.get(cat.id) ?? new Set();
  }
  return out;
}

export function autoIncludeRecordFromContents(
  contents: EntireCategoryRuleContent[],
): Record<string, boolean> {
  const r: Record<string, boolean> = {};
  for (const c of contents) {
    r[c.categoryId] = c.autoIncludeNewItems;
  }
  return r;
}

/** Merge a picker save into stored content (menu order, drops categories cleared in picker). */
export function mergeEntireCategorySave(
  prev: EntireCategoryRuleContent[],
  saved: EntireCategoryRuleContent[],
): EntireCategoryRuleContent[] {
  const savedById = new Map(saved.map((s) => [s.categoryId, s]));
  const next: EntireCategoryRuleContent[] = [];
  for (const cat of MENU_CATEGORIES) {
    const row = savedById.get(cat.id);
    if (row) next.push(row);
  }
  const other = prev.filter((p) => !MENU_CATEGORIES.some((c) => c.id === p.categoryId));
  return [...other, ...next];
}

export function categoryContentSecondaryLine(
  content: EntireCategoryRuleContent,
  category: MenuCategory | undefined,
): string | undefined {
  if (!category) return undefined;
  const included = new Set(content.includedItemIds);
  const excluded = category.items.filter((i) => !included.has(i.id));
  if (excluded.length === 0) return undefined;
  const names = [...excluded.map((i) => i.name)].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  );
  return `Excludes: ${names.join(', ')}`;
}

export function menuCategoryById(id: string): MenuCategory | undefined {
  return MENU_CATEGORIES.find((c) => c.id === id);
}
