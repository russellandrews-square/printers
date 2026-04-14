import { MarketCard, MarketModal } from '@squareup/market-react/trial';
import { MarketChevronRightIcon } from '@squareup/market-react/icons';
import type { SquareAccessoryPrinterCatalogEntry } from './squareAccessoryPrinterCatalog';
import { USB_DISCOVERED_PRINTERS } from './squareAccessoryPrinterCatalog';
import { useViewTransitionVisibility } from './useViewTransitionVisibility';
import './AddPrinterUsbPickerModal.css';

export type AddPrinterUsbPickerModalProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (entry: SquareAccessoryPrinterCatalogEntry) => void;
};

export function AddPrinterUsbPickerModal({ open, onClose, onSelect }: AddPrinterUsbPickerModalProps) {
  const modalShown = useViewTransitionVisibility(open);

  if (!modalShown) {
    return null;
  }

  return (
    <MarketModal type="partial" zIndex={1100} onClose={onClose}>
      <MarketModal.Header
        contentWidth="regular"
        title="Select a printer"
        secondaryText="We found 2 printers connected via USB. Which one would you like to set up?"
        leadingActions={<MarketModal.CloseButton type="button" onClick={onClose} />}
      />
      <MarketModal.Content>
        <div className="add-printer-usb-picker-modal__options">
          {USB_DISCOVERED_PRINTERS.map((entry) => (
            <MarketCard
              key={entry.id}
              mode="transient"
              title={entry.catalogName}
              secondaryText="USB"
              leadingAccessory={
                <img
                  className="add-printer-usb-picker-modal__thumb"
                  src={entry.imageUrl}
                  alt=""
                  width={56}
                  height={56}
                />
              }
              trailingAccessory={<MarketChevronRightIcon size="small" aria-hidden />}
              onClick={() => onSelect(entry)}
            />
          ))}
        </div>
      </MarketModal.Content>
    </MarketModal>
  );
}
