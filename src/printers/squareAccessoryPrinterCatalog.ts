/**
 * Static hardware catalog for add-printer / list thumbnails.
 */

export type SquareAccessoryPrinterCatalogEntry = {
  id: string;
  catalogName: string;
  modelId: string;
  imageUrl: string;
};

const STAR_TSP143IV_MODEL = 'Star Micronics STAR TSP143IV UE receipt printer';

export const SQUARE_ACCESSORY_PRINTER_CATALOG: SquareAccessoryPrinterCatalogEntry[] = [
  {
    id: 'star-tsp143iv-ue',
    catalogName: STAR_TSP143IV_MODEL,
    modelId: STAR_TSP143IV_MODEL,
    imageUrl: '/printers/printer-hero.png',
  },
];

export const DEFAULT_SQUARE_ACCESSORY_PRINTER = SQUARE_ACCESSORY_PRINTER_CATALOG[0]!;

export function getSquareAccessoryPrinterCatalogEntry(
  id: string,
): SquareAccessoryPrinterCatalogEntry | undefined {
  return SQUARE_ACCESSORY_PRINTER_CATALOG.find((e) => e.id === id);
}
