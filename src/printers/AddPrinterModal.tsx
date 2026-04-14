import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { MarketButton, MarketDivider, MarketField } from '@squareup/market-react';
import {
  MarketButtonGroup,
  MarketCard,
  MarketCombobox,
  MarketComboboxPresentationMode,
  MarketEmptyState,
  MarketGrid,
  MarketModal,
  MarketSelect,
  MarketTable,
  MarketText,
} from '@squareup/market-react/trial';
import { MarketEllipsisHorizontalIcon, MarketTrashcanIcon } from '@squareup/market-react/icons';
import type { Printer, PrintingRule } from './types';
import { printRuleCardSummary } from './printingRuleSummary';
import type { SquareAccessoryPrinterCatalogEntry } from './squareAccessoryPrinterCatalog';
import { useViewTransitionVisibility } from './useViewTransitionVisibility';
import './AddPrinterModal.css';

export type AddPrinterModalProps = {
  open: boolean;
  onClose: () => void;
  catalogEntry: SquareAccessoryPrinterCatalogEntry;
  onSave: (printer: Omit<Printer, 'id'>) => void;
  /** Group labels already used by saved printers (combobox starts empty when this is empty). */
  existingGroupNames?: string[];
  kitchenTicketRules: PrintingRule[];
  onCreateKitchenRule: () => void;
  onEditKitchenRule: (ruleId: string) => void;
  onDeleteKitchenRule: (ruleId: string) => void;
  customerReceiptRules: PrintingRule[];
  onCreateCustomerReceiptRule: () => void;
  onEditCustomerReceiptRule: (ruleId: string) => void;
  onDeleteCustomerReceiptRule: (ruleId: string) => void;
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
  catalogEntry,
  onSave,
  existingGroupNames = [],
  kitchenTicketRules,
  onCreateKitchenRule,
  onEditKitchenRule,
  onDeleteKitchenRule,
  customerReceiptRules,
  onCreateCustomerReceiptRule,
  onEditCustomerReceiptRule,
  onDeleteCustomerReceiptRule,
}: AddPrinterModalProps) {
  const [name, setName] = useState('');
  const [paper, setPaper] = useState<string>('62');
  const [sessionGroupNames, setSessionGroupNames] = useState<string[]>([]);
  const [groupInputValue, setGroupInputValue] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<GroupOption | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

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
    setNameError(null);
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

  const catalog = catalogEntry;
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

  const nameTitle = name.trim() !== '' ? name.trim() : 'New printer';

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
      setNameError('Name is required');
      nameInputRef.current?.focus();
      return;
    }
    setNameError(null);
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
            Printer details
          </MarketText>
          <div className="add-printer-modal__fields">
            <MarketField
              ref={nameInputRef}
              label="Name"
              placeholder="Name (like Expo Printer, Kitchen Printer, Host Printer, etc.)"
              value={name}
              invalid={nameError != null}
              errorMessage={nameError ?? undefined}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError != null) {
                  setNameError(null);
                }
              }}
            />
            <MarketCombobox<GroupOption>
              multiple={false}
              label="Group"
              placeholder="Search or create a group like Bar Printers, Kitchen Printers, etc."
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

          <MarketTable className="add-printer-modal__details-table">
            <MarketTable.Row>
              <MarketTable.Cell component="th">Type</MarketTable.Cell>
              <MarketTable.Cell>Receipt printer</MarketTable.Cell>
            </MarketTable.Row>
            <MarketTable.Row>
              <MarketTable.Cell component="th">Model</MarketTable.Cell>
              <MarketTable.Cell>mC-Print3</MarketTable.Cell>
            </MarketTable.Row>
            <MarketTable.Row>
              <MarketTable.Cell component="th">Connection</MarketTable.Cell>
              <MarketTable.Cell>USB</MarketTable.Cell>
            </MarketTable.Row>
            <MarketTable.Row>
              <MarketTable.Cell component="th">Printer type</MarketTable.Cell>
              <MarketTable.Cell>80mm, thermal</MarketTable.Cell>
            </MarketTable.Row>
            <MarketTable.Row>
              <MarketTable.Cell component="th">Serial number</MarketTable.Cell>
              <MarketTable.Cell>2581425101400486</MarketTable.Cell>
            </MarketTable.Row>
          </MarketTable>

        </section>

        <MarketDivider />

        <section className="add-printer-modal__section">
          <MarketText
            component="h2"
            typeStyle="heading-20"
            textColor="text-10"
            withMargin={true}
          >
            Ticket print rules
          </MarketText>
          {kitchenTicketRules.length === 0 ? (
            <div className="add-printer-modal__rules-empty">
              <MarketEmptyState
                primaryText="No ticket print rules yet"
                secondaryText="Create a rule to choose which orders print tickets on this printer."
                actions={
                  <MarketButton rank="primary" type="button" onClick={onCreateKitchenRule}>
                    Create ticket print rule
                  </MarketButton>
                }
              />
            </div>
          ) : (
            <div className="add-printer-modal__rules-grid">
              <MarketGrid
                columns={{ narrow: 1, medium: 1, wide: 1, extraWide: 1 }}
                gap={300}
              >
                {kitchenTicketRules.map((rule) => (
                  <MarketGrid.Item key={rule.id}>
                    <MarketCard
                      mode="transient"
                      title={rule.name}
                      secondaryText={printRuleCardSummary(rule)}
                      onClick={() => onEditKitchenRule(rule.id)}
                      trailingAccessory={
                        <div
                          className="add-printer-modal__rule-card-trailing"
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
            Receipt print rules
          </MarketText>
          {customerReceiptRules.length === 0 ? (
            <div className="add-printer-modal__rules-empty">
              <MarketEmptyState
                primaryText="No receipt print rules yet"
                secondaryText="Create a rule to choose when receipts print on this printer."
                actions={
                  <MarketButton rank="primary" type="button" onClick={onCreateCustomerReceiptRule}>
                    Create receipt print rule
                  </MarketButton>
                }
              />
            </div>
          ) : (
            <div className="add-printer-modal__rules-grid">
              <MarketGrid
                columns={{ narrow: 1, medium: 1, wide: 1, extraWide: 1 }}
                gap={300}
              >
                {customerReceiptRules.map((rule) => (
                  <MarketGrid.Item key={rule.id}>
                    <MarketCard
                      mode="transient"
                      title={rule.name}
                      secondaryText={printRuleCardSummary(rule)}
                      onClick={() => onEditCustomerReceiptRule(rule.id)}
                      trailingAccessory={
                        <div
                          className="add-printer-modal__rule-card-trailing"
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
                              onDeleteCustomerReceiptRule(rule.id);
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
      </MarketModal.Content>
    </MarketModal>
  );
}
