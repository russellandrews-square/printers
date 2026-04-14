import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { MarketButton, MarketDivider, MarketField, MarketLink } from '@squareup/market-react';
import {
  MarketButtonGroup,
  MarketCard,
  MarketCombobox,
  MarketComboboxPresentationMode,
  MarketEmptyState,
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

function PickExistingPrinterRuleModal({
  open,
  onClose,
  title,
  secondaryText,
  printRules,
  onSelect,
  onCreatePrintRule,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  secondaryText?: string;
  printRules: PrintingRule[];
  /** Called once per selected rule when the user chooses Done. */
  onSelect: (printRuleId: string) => void;
  onCreatePrintRule: () => void;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (open) {
      setSelectedIds(new Set());
    }
  }, [open]);

  const toggleRuleSelected = useCallback((ruleId: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(ruleId);
      } else {
        next.delete(ruleId);
      }
      return next;
    });
  }, []);

  const handleCreatePrintRule = useCallback(() => {
    onClose();
    onCreatePrintRule();
  }, [onClose, onCreatePrintRule]);

  const handleDone = useCallback(() => {
    for (const id of selectedIds) {
      onSelect(id);
    }
    onClose();
  }, [onClose, onSelect, selectedIds]);

  if (!open) {
    return null;
  }

  return (
    <MarketModal type="partial" zIndex={1200} onClose={onClose}>
      <MarketModal.Header
        contentWidth="regular"
        title={title}
        secondaryText={secondaryText}
        leadingActions={<MarketModal.CloseButton type="button" onClick={onClose} />}
        trailingActions={
          <MarketButtonGroup
            layout="side"
            align="end"
            className="add-printer-modal__pick-existing-header-actions"
          >
            <MarketButton rank="primary" type="button" onClick={handleDone}>
              Done
            </MarketButton>
            <MarketButton rank="secondary" type="button" onClick={handleCreatePrintRule}>
              Create print rule
            </MarketButton>
          </MarketButtonGroup>
        }
      />
      <MarketModal.Content>
        <div className="add-printer-modal__pick-existing-body">
          {printRules.length === 0 ? (
            <MarketEmptyState
              borderless
              primaryText="No rules to add"
              secondaryText="Create a print rule for your account first."
            />
          ) : (
            <div className="add-printer-modal__pick-existing-cards" role="list">
              {printRules.map((r) => (
                <MarketCard
                  key={r.id}
                  role="listitem"
                  mode="checkbox"
                  className="add-printer-modal__pick-existing-card"
                  title={r.name}
                  secondaryText={printRuleCardSummary(r)}
                  selected={selectedIds.has(r.id)}
                  value={r.id}
                  onSelectedChange={(e) => {
                    toggleRuleSelected(r.id, e.detail.selected);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </MarketModal.Content>
    </MarketModal>
  );
}

function PrinterRuleRow({
  name,
  summary,
  onEdit,
  onRemove,
  removeAriaLabel,
}: {
  name: string;
  summary: string;
  onEdit: () => void;
  onRemove: () => void;
  removeAriaLabel: string;
}) {
  return (
    <div className="add-printer-modal__rules-row">
      <div
        className="add-printer-modal__rules-row-text"
        role="button"
        tabIndex={0}
        onClick={onEdit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onEdit();
          }
        }}
      >
        <MarketText component="p" typeStyle="medium-30" textColor="text-10" withMargin={false}>
          {name}
        </MarketText>
        <MarketText component="p" typeStyle="paragraph-20" textColor="text-20" withMargin={false}>
          {summary}
        </MarketText>
      </div>
      <div
        className="add-printer-modal__print-rule-card-trailing"
        onClick={(ev) => ev.stopPropagation()}
        onMouseDown={(ev) => ev.stopPropagation()}
      >
        <MarketLink
          type="button"
          standalone
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit();
          }}
        >
          Edit
        </MarketLink>
        <MarketButton
          type="button"
          rank="tertiary"
          destructive
          aria-label={removeAriaLabel}
          icon={<MarketTrashcanIcon aria-hidden />}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
        />
      </div>
    </div>
  );
}

export type AddPrinterModalProps = {
  open: boolean;
  onClose: () => void;
  catalogEntry: SquareAccessoryPrinterCatalogEntry;
  /** When set, the form opens pre-filled for editing this printer. */
  initialPrinter?: Printer | null;
  onSave: (printer: Omit<Printer, 'id'>, existingPrinterId?: string) => void;
  /** Group labels already used by saved printers (combobox starts empty when this is empty). */
  existingGroupNames?: string[];
  kitchenTicketPrintRules: PrintingRule[];
  /** Ticket print rules that exist but are not on this printer yet (e.g. removed earlier); drives “Add existing rule”. */
  availableKitchenPrintRulesToAdd: PrintingRule[];
  onCreateKitchenRule: () => void;
  onEditKitchenRule: (printRuleId: string) => void;
  /** Removes the print rule from this printer’s list only; does not delete the print rule */
  onRemoveKitchenRuleFromPrinter: (printRuleId: string) => void;
  onAddExistingKitchenRuleToPrinter: (printRuleId: string) => void;
  customerReceiptPrintRules: PrintingRule[];
  availableReceiptPrintRulesToAdd: PrintingRule[];
  onCreateCustomerReceiptRule: () => void;
  onEditCustomerReceiptRule: (printRuleId: string) => void;
  onRemoveCustomerReceiptRuleFromPrinter: (printRuleId: string) => void;
  onAddExistingReceiptRuleToPrinter: (printRuleId: string) => void;
  /** When the add-print-rule flow is open above this modal, hide this modal’s veil (one shared backdrop). */
  stackedPrintRuleModalOpen?: boolean;
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
  initialPrinter = null,
  onSave,
  existingGroupNames = [],
  kitchenTicketPrintRules,
  availableKitchenPrintRulesToAdd,
  onCreateKitchenRule,
  onEditKitchenRule,
  onRemoveKitchenRuleFromPrinter,
  onAddExistingKitchenRuleToPrinter,
  customerReceiptPrintRules,
  availableReceiptPrintRulesToAdd,
  onCreateCustomerReceiptRule,
  onEditCustomerReceiptRule,
  onRemoveCustomerReceiptRuleFromPrinter,
  onAddExistingReceiptRuleToPrinter,
  stackedPrintRuleModalOpen = false,
}: AddPrinterModalProps) {
  const [pickKitchenRulesOpen, setPickKitchenRulesOpen] = useState(false);
  const [pickReceiptRulesOpen, setPickReceiptRulesOpen] = useState(false);
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
      setPickKitchenRulesOpen(false);
      setPickReceiptRulesOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (initialPrinter) {
      setName(initialPrinter.name);
      setPaper('62');
      setGroupInputValue('');
      setSelectedGroup(
        initialPrinter.group ? { kind: 'group', name: initialPrinter.group } : null,
      );
    } else {
      setName('');
      setPaper('62');
      setGroupInputValue('');
      setSelectedGroup(null);
    }
    setNameError(null);
  }, [open, initialPrinter]);

  useLayoutEffect(() => {
    if (!open || !modalShown) {
      return;
    }
    const id = requestAnimationFrame(() => {
      nameInputRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [open, modalShown]);

  useEffect(() => {
    if (!modalShown) {
      return;
    }
    document.body.classList.add('add-printer-modal-open');
    return () => {
      document.body.classList.remove('add-printer-modal-open');
    };
  }, [modalShown]);

  const catalog = catalogEntry;
  const allGroupNames = useMemo(
    () => [...new Set([...existingGroupNames, ...sessionGroupNames])].sort((a, b) => a.localeCompare(b)),
    [existingGroupNames, sessionGroupNames],
  );

  const groupComboboxOptions = useMemo((): GroupOption[] => {
    const q = groupInputValue.trim();
    if (q.length === 0) {
      return allGroupNames.map((name) => ({ kind: 'group' as const, name }));
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

  const kitchenHasAnyInAccount =
    kitchenTicketPrintRules.length > 0 || availableKitchenPrintRulesToAdd.length > 0;
  const receiptHasAnyInAccount =
    customerReceiptPrintRules.length > 0 || availableReceiptPrintRulesToAdd.length > 0;

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
    onSave(
      {
        name: trimmed,
        status: initialPrinter?.status ?? 'online',
        group: groupTitle || undefined,
        modelId: catalog.modelId,
        imageUrl: catalog.imageUrl,
      },
      initialPrinter?.id,
    );
    onClose();
  };

  return (
    <>
    <MarketModal
      type="full"
      contentWidth="regular"
      zIndex={1050}
      noVeil={stackedPrintRuleModalOpen}
      onClose={onClose}
    >
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
            className="add-printer-modal__rules-heading"
            component="h2"
            typeStyle="heading-20"
            textColor="text-10"
            withMargin={false}
          >
            Ticket print rules
          </MarketText>
          {!kitchenHasAnyInAccount ? (
            <>
              <div className="add-printer-modal__rules-panel">
                <div className="add-printer-modal__rules-panel-empty">
                  <MarketText
                    component="p"
                    typeStyle="medium-30"
                    textColor="text-10"
                    withMargin={false}
                  >
                    No ticket print rules yet
                  </MarketText>
                  <MarketText
                    component="p"
                    typeStyle="paragraph-20"
                    textColor="text-20"
                    withMargin={false}
                  >
                    Add logic for which orders are sent to this printer.
                  </MarketText>
                </div>
              </div>
              <div className="add-printer-modal__rules-actions">
                <MarketButton
                  rank="secondary"
                  type="button"
                  className="add-printer-modal__rules-action-full"
                  onClick={onCreateKitchenRule}
                >
                  Create ticket print rule
                </MarketButton>
              </div>
            </>
          ) : kitchenTicketPrintRules.length === 0 ? (
            <>
              <div className="add-printer-modal__rules-panel">
                <div className="add-printer-modal__rules-panel-empty">
                  <MarketText
                    component="p"
                    typeStyle="medium-30"
                    textColor="text-10"
                    withMargin={false}
                  >
                    No ticket print rules on this printer
                  </MarketText>
                  <MarketText
                    component="p"
                    typeStyle="paragraph-20"
                    textColor="text-30"
                    withMargin={false}
                  >
                    Create a new rule or add one you&apos;ve already set up for your account.
                  </MarketText>
                </div>
              </div>
              <div className="add-printer-modal__rules-actions">
                <MarketButtonGroup layout="fill" className="add-printer-modal__rules-actions-split">

                  <MarketButton rank="secondary" type="button" onClick={onCreateKitchenRule}>
                    Create ticket print rule
                  </MarketButton>
                  
                </MarketButtonGroup>
              </div>
            </>
          ) : (
            <>
              <div className="add-printer-modal__rules-cards">
                {kitchenTicketPrintRules.map((printRule) => (
                  <div
                    key={printRule.id}
                    className="add-printer-modal__rules-panel add-printer-modal__rule-card"
                  >
                    <PrinterRuleRow
                      name={printRule.name}
                      summary={printRuleCardSummary(printRule)}
                      onEdit={() => onEditKitchenRule(printRule.id)}
                      onRemove={() => onRemoveKitchenRuleFromPrinter(printRule.id)}
                      removeAriaLabel={`Remove print rule ${printRule.name} from this printer`}
                    />
                  </div>
                ))}
              </div>
              <div className="add-printer-modal__rules-actions">
                {availableKitchenPrintRulesToAdd.length > 0 ? (
                  <MarketButtonGroup layout="fill" className="add-printer-modal__rules-actions-split">
                    
                    <MarketButton rank="secondary" type="button" onClick={onCreateKitchenRule}>
                      Create ticket print rule
                    </MarketButton>
                    <MarketButton
                      rank="secondary"
                      type="button"
                      onClick={() => setPickKitchenRulesOpen(true)}
                    >
                      Add existing rule
                    </MarketButton>
                  </MarketButtonGroup>
                ) : (
                  <MarketButton
                    rank="secondary"
                    type="button"
                    className="add-printer-modal__rules-action-full"
                    onClick={onCreateKitchenRule}
                  >
                    Create ticket print rule
                  </MarketButton>
                )}
              </div>
            </>
          )}
        </section>

        <MarketDivider />

        <section className="add-printer-modal__section">
          <MarketText
            className="add-printer-modal__rules-heading"
            component="h2"
            typeStyle="heading-20"
            textColor="text-10"
            withMargin={false}
          >
            Receipt print rules
          </MarketText>
          {!receiptHasAnyInAccount ? (
            <>
              <div className="add-printer-modal__rules-panel">
                <div className="add-printer-modal__rules-panel-empty">
                  <MarketText
                    component="p"
                    typeStyle="medium-30"
                    textColor="text-10"
                    withMargin={false}
                  >
                    No receipt print rules yet
                  </MarketText>
                  <MarketText
                    component="p"
                    typeStyle="paragraph-20"
                    textColor="text-20"
                    withMargin={false}
                  >
                    Add logic for which receipts print on this printer.
                  </MarketText>
                </div>
              </div>
              <div className="add-printer-modal__rules-actions">
                <MarketButton
                  rank="secondary"
                  type="button"
                  className="add-printer-modal__rules-action-full"
                  onClick={onCreateCustomerReceiptRule}
                >
                  Create receipt print rule
                </MarketButton>
              </div>
            </>
          ) : customerReceiptPrintRules.length === 0 ? (
            <>
              <div className="add-printer-modal__rules-panel">
                <div className="add-printer-modal__rules-panel-empty">
                  <MarketText
                    component="p"
                    typeStyle="medium-30"
                    textColor="text-10"
                    withMargin={false}
                  >
                    No receipt print rules on this printer
                  </MarketText>
                  <MarketText
                    component="p"
                    typeStyle="paragraph-20"
                    textColor="text-20"
                    withMargin={false}
                  >
                    Create a new rule or add one you&apos;ve already set up for your account.
                  </MarketText>
                </div>
              </div>
              <div className="add-printer-modal__rules-actions">
                <MarketButtonGroup layout="fill" className="add-printer-modal__rules-actions-split">
                  
                  <MarketButton rank="secondary" type="button" onClick={onCreateCustomerReceiptRule}>
                    Create receipt print rule
                  </MarketButton>
                  <MarketButton
                    rank="secondary"
                    type="button"
                    onClick={() => setPickReceiptRulesOpen(true)}
                  >
                    Add existing rule
                  </MarketButton>
                </MarketButtonGroup>
              </div>
            </>
          ) : (
            <>
              <div className="add-printer-modal__rules-cards">
                {customerReceiptPrintRules.map((printRule) => (
                  <div
                    key={printRule.id}
                    className="add-printer-modal__rules-panel add-printer-modal__rule-card"
                  >
                    <PrinterRuleRow
                      name={printRule.name}
                      summary={printRuleCardSummary(printRule)}
                      onEdit={() => onEditCustomerReceiptRule(printRule.id)}
                      onRemove={() => onRemoveCustomerReceiptRuleFromPrinter(printRule.id)}
                      removeAriaLabel={`Remove print rule ${printRule.name} from this printer`}
                    />
                  </div>
                ))}
              </div>
              <div className="add-printer-modal__rules-actions">
                {availableReceiptPrintRulesToAdd.length > 0 ? (
                  <MarketButtonGroup layout="fill" className="add-printer-modal__rules-actions-split">
                    
                    <MarketButton rank="secondary" type="button" onClick={onCreateCustomerReceiptRule}>
                      Create receipt print rule
                    </MarketButton>
                    <MarketButton
                      rank="secondary"
                      type="button"
                      onClick={() => setPickReceiptRulesOpen(true)}
                    >
                      Add existing rule
                    </MarketButton>
                  </MarketButtonGroup>
                ) : (
                  <MarketButton
                    rank="secondary"
                    type="button"
                    className="add-printer-modal__rules-action-full"
                    onClick={onCreateCustomerReceiptRule}
                  >
                    Create receipt print rule
                  </MarketButton>
                )}
              </div>
            </>
          )}
        </section>
      </MarketModal.Content>
    </MarketModal>

    <PickExistingPrinterRuleModal
      open={pickKitchenRulesOpen}
      onClose={() => setPickKitchenRulesOpen(false)}
      title="Add ticket print rule"
      secondaryText="Choose a rule that already exists for your account."
      printRules={availableKitchenPrintRulesToAdd}
      onSelect={onAddExistingKitchenRuleToPrinter}
      onCreatePrintRule={onCreateKitchenRule}
    />
    <PickExistingPrinterRuleModal
      open={pickReceiptRulesOpen}
      onClose={() => setPickReceiptRulesOpen(false)}
      title="Add receipt print rule"
      secondaryText="Choose a rule that already exists for your account."
      printRules={availableReceiptPrintRulesToAdd}
      onSelect={onAddExistingReceiptRuleToPrinter}
      onCreatePrintRule={onCreateCustomerReceiptRule}
    />
    </>
  );
}
