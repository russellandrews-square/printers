import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { MarketButton, MarketDivider, MarketInput, MarketLink, MarketPill } from '@squareup/market-react';
import {
  MarketButtonGroup,
  MarketCard,
  MarketCombobox,
  MarketComboboxPresentationMode,
  MarketEmptyState,
  MarketGrid,
  MarketModal,
  MarketSelect,
  MarketText,
} from '@squareup/market-react/trial';
import { MarketEllipsisHorizontalIcon, MarketTrashcanIcon } from '@squareup/market-react/icons';
import type { Printer, PrintingRule } from './types';
import { kitchenTicketRuleSummary } from './printingRuleSummary';
import { DEFAULT_SQUARE_ACCESSORY_PRINTER } from './squareAccessoryPrinterCatalog';
import { useViewTransitionVisibility } from './useViewTransitionVisibility';
import './AddPrinterModal.css';

export type AddPrinterModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (printer: Omit<Printer, 'id'>) => void;
  /** Group labels already used by saved printers (combobox starts empty when this is empty). */
  existingGroupNames?: string[];
  kitchenTicketRules: PrintingRule[];
  onCreateKitchenRule: () => void;
  onEditKitchenRule: (ruleId: string) => void;
  onDeleteKitchenRule: (ruleId: string) => void;
};

const PAPER_OPTIONS = [
  { value: '62', title: '62mm die-cut' },
  { value: '80', title: '80mm roll' },
];

type GroupOption =
  | { kind: 'group'; name: string }
  | { kind: 'create'; name: string };

function groupOptionKey(o: GroupOption): string {
  return o.kind === 'create' ? `create:${o.name}` : `group:${o.name}`;
}

function groupOptionLabel(o: GroupOption): string {
  return o.kind === 'create' ? `Create group "${o.name}"` : o.name;
}

export function AddPrinterModal({
  open,
  onClose,
  onSave,
  existingGroupNames = [],
  kitchenTicketRules,
  onCreateKitchenRule,
  onEditKitchenRule,
  onDeleteKitchenRule,
}: AddPrinterModalProps) {
  const [name, setName] = useState('');
  const [paper, setPaper] = useState<string>('62');
  const [sessionGroupNames, setSessionGroupNames] = useState<string[]>([]);
  const [groupInputValue, setGroupInputValue] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<GroupOption | null>(null);

  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const modalShown = useViewTransitionVisibility(open);

  useEffect(() => {
    if (!open) {
      return;
    }
    setName('');
    setPaper('62');
    setGroupInputValue('');
    setSelectedGroup(null);
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !modalShown) {
      return;
    }
    const id = requestAnimationFrame(() => {
      nameInputRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [open, modalShown]);

  const catalog = DEFAULT_SQUARE_ACCESSORY_PRINTER;
  const allGroupNames = useMemo(
    () => [...new Set([...existingGroupNames, ...sessionGroupNames])].sort((a, b) => a.localeCompare(b)),
    [existingGroupNames, sessionGroupNames],
  );

  const groupComboboxOptions = useMemo((): GroupOption[] => {
    const q = groupInputValue.trim();
    if (q.length === 0) {
      return [];
    }
    const qLower = q.toLowerCase();
    const matches = allGroupNames.filter((g) => g.toLowerCase().includes(qLower));
    const exact = allGroupNames.some((g) => g.toLowerCase() === qLower);
    const opts: GroupOption[] = matches.map((name) => ({ kind: 'group' as const, name }));
    if (!exact) {
      opts.push({ kind: 'create', name: q });
    }
    return opts;
  }, [allGroupNames, groupInputValue]);

  if (!modalShown) {
    return null;
  }

  const nameTitle = name.trim() !== '' ? name.trim() : 'Printer';

  const handleGroupChange = (value: GroupOption | null) => {
    if (!value) {
      setSelectedGroup(null);
      return;
    }
    if (value.kind === 'create') {
      setSessionGroupNames((prev) =>
        prev.includes(value.name) ? prev : [...prev, value.name],
      );
      setSelectedGroup({ kind: 'group', name: value.name });
      return;
    }
    setSelectedGroup(value);
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    const groupTitle = selectedGroup?.kind === 'group' ? selectedGroup.name : undefined;
    onSave({
      name: trimmed,
      status: 'online',
      group: groupTitle || undefined,
      modelId: catalog.modelId,
      imageUrl: catalog.imageUrl,
    });
    onClose();
  };

  return (
    <MarketModal type="full" contentWidth="regular" onClose={onClose}>
      <MarketModal.Header
        contentWidth="regular"
        title={nameTitle}
        secondaryText={catalog.modelId}
        leadingActions={
          <MarketModal.CloseButton type="button" onClick={onClose} />
        }
        trailingActions={
          <MarketButtonGroup layout="side" maxVisibleItems={4}>
            <MarketButton
              type="button"
              rank="primary"
              onClick={handleSave}
              disabled={!name.trim()}
            >
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
          <img
            className="add-printer-modal__hero-visual"
            src={catalog.imageUrl}
            alt={catalog.catalogName}
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
            <MarketInput
              ref={nameInputRef}
              label="Name"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <MarketCombobox<GroupOption>
              multiple={false}
              label="Group"
              placeholder="Search or create a group like Bar, Kitchen, etc."
              presentationMode={MarketComboboxPresentationMode.ON_INPUT}
              inputValue={groupInputValue}
              onInputChange={setGroupInputValue}
              value={selectedGroup}
              onChange={handleGroupChange}
              options={groupComboboxOptions}
              getKey={groupOptionKey}
              getLabel={groupOptionLabel}
            />
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
          {kitchenTicketRules.length === 0 ? (
            <div className="add-printer-modal__kitchen-empty">
              <MarketEmptyState
                borderless
                primaryText="No kitchen ticket rules yet"
                secondaryText="Create a rule to choose which orders print on this printer."
                actions={
                  <MarketButton rank="primary" type="button" onClick={onCreateKitchenRule}>
                    Create kitchen ticket rule
                  </MarketButton>
                }
              />
            </div>
          ) : (
            <div className="add-printer-modal__kitchen-rules-grid">
              <MarketGrid
                columns={{ narrow: 1, medium: 1, wide: 1, extraWide: 1 }}
                gap={300}
              >
                {kitchenTicketRules.map((rule) => (
                  <MarketGrid.Item key={rule.id}>
                    <MarketCard
                      mode="transient"
                      title={rule.name}
                      secondaryText={kitchenTicketRuleSummary(rule)}
                      onClick={() => onEditKitchenRule(rule.id)}
                      trailingAccessory={
                        <div
                          className="add-printer-modal__kitchen-rule-card-trailing"
                          onClick={(ev) => ev.stopPropagation()}
                          onMouseDown={(ev) => ev.stopPropagation()}
                        >
                          <MarketButton
                            type="button"
                            rank="tertiary"
                            destructive
                            aria-label={`Delete rule ${rule.name}`}
                            icon={<MarketTrashcanIcon aria-hidden />}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onDeleteKitchenRule(rule.id);
                            }}
                          />
                        </div>
                      }
                    />
                  </MarketGrid.Item>
                ))}
              </MarketGrid>
            </div>
          )}
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
