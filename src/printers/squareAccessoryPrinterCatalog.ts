/**
 * Static hardware catalog for add-printer / list thumbnails.
 */

import type { Printer } from './types';

export type SquareAccessoryPrinterCatalogEntry = {
  id: string;
  catalogName: string;
  modelId: string;
  imageUrl: string;
};

const STAR_TSP143IV_MODEL = 'Star Micronics STAR TSP143IV UE receipt printer';
const STAR_SP742ME_MODEL = 'Star Micronics SP742ME Ethernet printer';

export const SQUARE_ACCESSORY_PRINTER_CATALOG: SquareAccessoryPrinterCatalogEntry[] = [
  {
    id: 'star-tsp143iv-ue',
    catalogName: STAR_TSP143IV_MODEL,
    modelId: STAR_TSP143IV_MODEL,
    imageUrl: '/printers/printer-hero.png',
  },
  {
    id: 'star-sp742me-ethernet',
    catalogName: STAR_SP742ME_MODEL,
    modelId: STAR_SP742ME_MODEL,
    imageUrl: '/printers/printer-hero2.png',
  },
];

/** Simulated devices found on USB in the add-printer flow (kept in sync with catalog). */
export const USB_DISCOVERED_PRINTERS = SQUARE_ACCESSORY_PRINTER_CATALOG;

export const DEFAULT_SQUARE_ACCESSORY_PRINTER = SQUARE_ACCESSORY_PRINTER_CATALOG[0]!;

export function getSquareAccessoryPrinterCatalogEntry(
  id: string,
): SquareAccessoryPrinterCatalogEntry | undefined {
  return SQUARE_ACCESSORY_PRINTER_CATALOG.find((e) => e.id === id);
}

/** Resolve catalog metadata for the add/edit printer modal from a saved printer row. */
export function catalogEntryFromSavedPrinter(p: Printer): SquareAccessoryPrinterCatalogEntry {
  const byModel = SQUARE_ACCESSORY_PRINTER_CATALOG.find((e) => e.modelId === p.modelId);
  if (byModel) return byModel;
  return {
    id: `saved-${p.id}`,
    catalogName: p.modelId ?? p.name,
    modelId: p.modelId ?? p.name,
    imageUrl: p.imageUrl ?? DEFAULT_SQUARE_ACCESSORY_PRINTER.imageUrl,
  };
}
