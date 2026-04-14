/** Keep in sync with print rule form UI (AddRuleModal). */

export const FULFILLMENT_RULE_OPTIONS = [
  { value: 'catering', title: 'Catering' },
  { value: 'delivery', title: 'Delivery' },
  { value: 'dine-in', title: 'Dine-in' },
  { value: 'pick-up', title: 'Pick up' },
  { value: 'to-go', title: 'To go' },
] as const;

export const SOURCE_RULE_OPTIONS = [
  { value: 'delivery-app', title: 'Delivery app' },
  { value: 'phone-or-walk-in', title: 'Phone call or walk-in' },
  { value: 'pos', title: 'POS' },
  { value: 'website', title: 'Website' },
] as const;

/** Order channels other than POS (POS uses `POS_TERMINAL_OPTIONS` in the UI). */
export const ORDER_SOURCE_NON_POS_OPTIONS = SOURCE_RULE_OPTIONS.filter((o) => o.value !== 'pos');

/** Placeholder POS devices for “specific POS” selection (replace with API data later). */
export const POS_TERMINAL_OPTIONS = [
  { id: 'bar-pos', title: 'Bar POS' },
  { id: 'dining-room-pos-1', title: 'Dining Room POS 1' },
  { id: 'dining-room-pos-2', title: 'Dining Room POS 2' },
  { id: 'host-pos', title: 'Host POS' },
  { id: 'kitchen-pos', title: 'Kitchen POS' },
  { id: 'server-terminal-1', title: 'Server Terminal 1' },
  { id: 'server-terminal-2', title: 'Server Terminal 2' },
  { id: 'server-terminal-3', title: 'Server Terminal 3' },
  { id: 'server-terminal-4', title: 'Server Terminal 4' },
  { id: 'server-terminal-5', title: 'Server Terminal 5' },
  { id: 'service-bar-terminal', title: 'Service Bar Terminal' },
] as const;

export const POS_SOURCE_TITLE = 'POS' as const;

export const FULFILLMENT_RULE_TITLES: readonly string[] = FULFILLMENT_RULE_OPTIONS.map((o) => o.title);
export const SOURCE_RULE_TITLES: readonly string[] = SOURCE_RULE_OPTIONS.map((o) => o.title);
