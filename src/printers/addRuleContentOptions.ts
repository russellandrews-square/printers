/** Options for “Add content” (dropdown); only `entire-categories` is wired in the UI today. */
export const ADD_RULE_CONTENT_OPTIONS = [
  {
    id: 'entire-categories',
    title: 'Entire categories',
    description: 'You can exclude certain items and opt out of future additions.',
  },
  {
    id: 'specific-items',
    title: 'Specific items',
    description: 'Choose certain items despite its category.',
  },
  {
    id: 'modifier-groups',
    title: 'Modifier groups',
    description: 'Include items with specific modifiers.',
  },
] as const;

export type AddRuleContentOptionId = (typeof ADD_RULE_CONTENT_OPTIONS)[number]['id'];
