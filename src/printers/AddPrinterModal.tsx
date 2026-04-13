import { useState } from 'react';
import { MarketButton, MarketDivider, MarketLink, MarketPill, MarketToggle } from '@squareup/market-react';
import {
  MarketButtonGroup,
  MarketModal,
  MarketSelect,
  MarketText,
} from '@squareup/market-react/trial';
import {
  MarketEllipsisHorizontalIcon,
  MarketGripDotsVerticalIcon,
} from '@squareup/market-react/icons';
import type { Printer } from './types';
import { useViewTransitionVisibility } from './useViewTransitionVisibility';
import './AddPrinterModal.css';

export type AddPrinterModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (printer: Omit<Printer, 'id'>) => void;
};

const NAME_OPTIONS = [
  { value: 'main-bar', title: 'Main Bar Printer' },
  { value: 'dessert', title: 'Dessert Printer' },
  { value: 'kitchen', title: 'Kitchen Printer' },
];

const GROUP_OPTIONS = [
  { value: 'bar', title: 'Bar printers' },
  { value: 'kitchen', title: 'Kitchen printers' },
  { value: 'foh', title: 'Front of house printers' },
];

const PAPER_OPTIONS = [
  { value: '62', title: '62mm die-cut' },
  { value: '80', title: '80mm roll' },
];

export function AddPrinterModal({ open, onClose, onSave }: AddPrinterModalProps) {
  const [name, setName] = useState<string>('main-bar');
  const [group, setGroup] = useState<string>('bar');
  const [paper, setPaper] = useState<string>('62');
  const [kitchenRuleEnabled, setKitchenRuleEnabled] = useState(true);

  const modalShown = useViewTransitionVisibility(open);

  if (!modalShown) {
    return null;
  }

  const nameTitle = NAME_OPTIONS.find((o) => o.value === name)?.title ?? 'Printer';
  const modelId = 'STAR GH9377R62';

  const handleSave = () => {
    const groupTitle = GROUP_OPTIONS.find((o) => o.value === group)?.title ?? '';
    onSave({
      name: nameTitle,
      status: 'online',
      group: groupTitle || undefined,
      modelId,
    });
    onClose();
  };

  return (
    <MarketModal type="partial" onClose={onClose}>
      <MarketModal.Header
        contentWidth="regular"
        title={nameTitle}
        secondaryText={modelId}
        leadingActions={
          <MarketModal.CloseButton type="button" onClick={onClose} />
        }
        trailingActions={
          <MarketButtonGroup layout="side" maxVisibleItems={4}>
            <MarketButton type="button" rank="primary" onClick={handleSave}>
              Save
            </MarketButton>
            <MarketButton type="button" rank="secondary" onClick={() => undefined}>
              Print test
            </MarketButton>
            <MarketButton
              type="button"
              rank="secondary"
              icon={<MarketEllipsisHorizontalIcon size="medium" aria-hidden />}
              aria-label="More actions"
            />
          </MarketButtonGroup>
        }
      />

      <MarketModal.Content >
        <div className="add-printer-modal__hero">
          <div
            className="add-printer-modal__hero-visual"
            role="img"
            aria-label="Printer preview"
          />
        </div>

        <section className="add-printer-modal__section">
          <MarketText
            component="h2"
            typeStyle="heading-20"
            textColor="text-10"
            withMargin={true}
          >
            Details
          </MarketText>
          <div className="add-printer-modal__fields">
            <MarketSelect
              label="Name"
              selectedValue={name}
              onSelectionChange={(e) => {
                const v = e.detail.value;
                if (v != null) setName(String(v));
              }}
            >
              {NAME_OPTIONS.map((o) => (
                <MarketSelect.Option key={o.value} value={o.value} title={o.title} />
              ))}
            </MarketSelect>
            <MarketSelect
              label="Group"
              selectedValue={group}
              onSelectionChange={(e) => {
                const v = e.detail.value;
                if (v != null) setGroup(String(v));
              }}
            >
              {GROUP_OPTIONS.map((o) => (
                <MarketSelect.Option key={o.value} value={o.value} title={o.title} />
              ))}
            </MarketSelect>
            <MarketSelect
              label="Paper size"
              selectedValue={paper}
              onSelectionChange={(e) => {
                const v = e.detail.value;
                if (v != null) setPaper(String(v));
              }}
            >
              {PAPER_OPTIONS.map((o) => (
                <MarketSelect.Option key={o.value} value={o.value} title={o.title} />
              ))}
            </MarketSelect>
          </div>
        </section>

        <MarketDivider />

        <section className="add-printer-modal__section">
          <div className="add-printer-modal__section-title-row">
            <MarketText
              component="h2"
              typeStyle="heading-20"
              textColor="text-10"
              withMargin={true}
            >
              Connection
            </MarketText>
            <MarketPill label="Connected" size="small" status="success" />
          </div>
          <div className="add-printer-modal__kv">
            <MarketText component="span" typeStyle="paragraph-20" withMargin={false}>
              Connection type
            </MarketText>
            <MarketText component="span" typeStyle="paragraph-20" withMargin={false}>
              Wi-Fi
            </MarketText>
            <MarketText
              component="span"
              typeStyle="paragraph-20"
              textColor="text-30"
              withMargin={false}
              className="add-printer-modal__kv-label"
            >
              IP address
            </MarketText>
            <MarketText component="span" typeStyle="paragraph-20" withMargin={false}>
              198.886.0.172
            </MarketText>
          </div>
        </section>

        <MarketDivider />

        <section className="add-printer-modal__section">
          <MarketText
            component="h2"
            typeStyle="heading-20"
            textColor="text-10"
            withMargin={true}
          >
            Kitchen ticket rules
          </MarketText>
          <div className="add-printer-modal__rule-row">
            <span className="add-printer-modal__rule-grip" aria-hidden>
              <MarketGripDotsVerticalIcon size="medium" />
            </span>
            <div className="add-printer-modal__rule-body">
              <MarketText component="p" typeStyle="semibold-20" textColor="text-10" withMargin={false}>
                Cocktails and beer
              </MarketText>
              <MarketText
                component="p"
                typeStyle="paragraph-20"
                textColor="text-30"
                withMargin={false}
                className="add-printer-modal__muted"
              >
                Dine-in orders, from anywhere, only Cocktails and Beer
              </MarketText>
            </div>
            <div className="add-printer-modal__rule-actions">
              <MarketToggle
                checked={kitchenRuleEnabled}
                onChange={() => setKitchenRuleEnabled((v) => !v)}
                aria-label="Enable Cocktails and beer kitchen ticket rule"
              />
            </div>
          </div>
          <div className="add-printer-modal__add-link">
            <MarketLink type="button" standalone onClick={() => undefined}>
              + Add kitchen ticket rule
            </MarketLink>
          </div>
        </section>

        <MarketDivider />

        <section className="add-printer-modal__section">
          <MarketText
            component="h2"
            typeStyle="heading-20"
            textColor="text-10"
            withMargin={true}
          >
            Customer receipt rules
          </MarketText>
          <MarketText
            component="p"
            typeStyle="paragraph-20"
            textColor="text-30"
            withMargin={false}
          >
            No customer receipt rules yet.
          </MarketText>
          <div className="add-printer-modal__add-link">
            <MarketLink type="button" standalone onClick={() => undefined}>
              + Add customer receipt rule
            </MarketLink>
          </div>
        </section>
      </MarketModal.Content>
    </MarketModal>
  );
}
