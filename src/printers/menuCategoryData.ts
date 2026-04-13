export type MenuItem = { id: string; name: string };

export type MenuCategory = { id: string; name: string; items: MenuItem[] };

const RAW: { id: string; name: string; itemNames: string[] }[] = [
  {
    id: 'coffee',
    name: 'Coffee',
    itemNames: ['Cappuccino', 'Latte', 'Americano', 'Espresso', 'Drip Coffee', 'Decaf'],
  },
  {
    id: 'drinks',
    name: 'Drinks',
    itemNames: ['Iced tea', 'Juice', 'Lemonade', 'Smoothie', 'Soda'],
  },
  {
    id: 'mains',
    name: 'Mains',
    itemNames: ['Burger', 'Fish and chips', 'Pasta bowl', 'Steak'],
  },
  {
    id: 'salads',
    name: 'Salads',
    itemNames: ['Caesar salad', 'Garden salad', 'Grain bowl'],
  },
  {
    id: 'soups',
    name: 'Soups',
    itemNames: ['Chowder', 'Minestrone', 'Tomato soup'],
  },
  {
    id: 'starters',
    name: 'Starters',
    itemNames: ['Bruschetta', 'Calamari', 'Wings'],
  },
];

function slugify(name: string, prefix: string) {
  return `${prefix}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}

function toMenuCategory(row: (typeof RAW)[number]): MenuCategory {
  const sortedNames = [...row.itemNames].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  return {
    id: row.id,
    name: row.name,
    items: sortedNames.map((name) => ({ id: slugify(name, row.id), name })),
  };
}

/** Categories and items, each sorted alphabetically by display name */
export const MENU_CATEGORIES: MenuCategory[] = [...RAW]
  .map(toMenuCategory)
  .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

export function emptySelections(categories: MenuCategory[]): Record<string, Set<string>> {
  const out: Record<string, Set<string>> = {};
  for (const c of categories) {
    out[c.id] = new Set();
  }
  return out;
}

export function allSelections(categories: MenuCategory[]): Record<string, Set<string>> {
  const out: Record<string, Set<string>> = {};
  for (const c of categories) {
    out[c.id] = new Set(c.items.map((i) => i.id));
  }
  return out;
}
