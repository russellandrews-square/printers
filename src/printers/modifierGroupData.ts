export type ModifierOption = { id: string; name: string };

export type ModifierGroup = { id: string; name: string; options: ModifierOption[] };

const RAW: { id: string; name: string; optionNames: string[] }[] = [
  {
    id: 'add-protein',
    name: 'Add Protein',
    optionNames: ['Chicken', 'Steak', 'Pork'],
  },
  {
    id: 'cooking-pref',
    name: 'Cooking preference',
    optionNames: ['Rare', 'Medium', 'Well done'],
  },
  {
    id: 'extras',
    name: 'Extras',
    optionNames: ['Extra cheese', 'No onion', 'Add avocado'],
  },
];

function slugify(name: string, prefix: string) {
  return `${prefix}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}

function toModifierGroup(row: (typeof RAW)[number]): ModifierGroup {
  const sortedNames = [...row.optionNames].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  );
  return {
    id: row.id,
    name: row.name,
    options: sortedNames.map((name) => ({ id: slugify(name, row.id), name })),
  };
}

/** Modifier groups and options, sorted alphabetically by display name */
export const MODIFIER_GROUPS: ModifierGroup[] = [...RAW]
  .map(toModifierGroup)
  .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
