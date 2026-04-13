import { MarketInput } from '@squareup/market-react';
import type { ComponentProps } from 'react';

type MarketInputSearchProps = Extract<ComponentProps<typeof MarketInput>, { type?: 'search' }>;

/**
 * Search field using Market’s search input (`type="search"`).
 * `@squareup/market-react` does not export a separate `MarketSearch` symbol; this matches that API name.
 */
export type MarketSearchProps = Omit<MarketInputSearchProps, 'type'>;

export function MarketSearch(props: MarketSearchProps) {
  return <MarketInput type="search" {...props} />;
}
