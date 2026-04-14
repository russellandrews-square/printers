/** Keep in sync with rule form UI (AddRuleModal). */

export const FULFILLMENT_RULE_OPTIONS = [
  { value: 'catering', title: 'Catering' },
  { value: 'delivery', title: 'Delivery' },
  { value: 'dine-in', title: 'Dine-in' },
  { value: 'pick-up', title: 'Pick up' },
  { value: 'to-go', title: 'To go' },
] as const;

export const SOURCE_RULE_OPTIONS = [
  { value: 'delivery-app', title: 'Delivery app' },
  { value: 'phone-call', title: 'Phone call' },
  { value: 'pos', title: 'POS' },
  { value: 'walk-in', title: 'Walk-in' },
  { value: 'website', title: 'Website' },
] as const;

export const FULFILLMENT_RULE_TITLES: readonly string[] = FULFILLMENT_RULE_OPTIONS.map((o) => o.title);
export const SOURCE_RULE_TITLES: readonly string[] = SOURCE_RULE_OPTIONS.map((o) => o.title);
