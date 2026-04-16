import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { MarketButton, MarketDivider, MarketInput, MarketLink } from '@squareup/market-react';
import {
  MarketCard,
  MarketEmptyState,
  MarketModal,
  MarketSegmentedControl,
  MarketSelect,
  MarketText,
} from '@squareup/market-react/trial';
import { MarketTrashcanIcon } from '@squareup/market-react/icons';
import { AddRuleContentDropdown } from './AddRuleContentDropdown';
import type { AddRuleContentOptionId } from './addRuleContentOptions';
import {
  categoryContentSecondaryLine,
  mergeEntireCategorySave,
  menuCategoryById,
} from './entireCategoryRuleUtils';
import { EntireCategoriesPicker } from './EntireCategoriesPicker';
import {
  mergeModifierGroupSave,
  modifierGroupById,
  selectedModifierOptionNamesSorted,
} from './modifierGroupRuleUtils';
import { ModifierGroupsPicker } from './ModifierGroupsPicker';
import { specificItemNamesSorted } from './menuCategoryData';
import { orderSourceFieldsFromState, orderSourceStateFromRule } from './orderSourceSelection';
import { OrderSourceMultiSelect } from './OrderSourceMultiSelect';
import { FULFILLMENT_RULE_OPTIONS } from './printingRuleFieldOptions';
import { SpecificItemsPicker } from './SpecificItemsPicker';
import type {
  EntireCategoryRuleContent,
  ModifierGroupRuleContent,
  Printer,
  PrintingRule,
  PrintingRuleType,
} from './types';
import { useViewTransitionVisibility } from './useViewTransitionVisibility';
import './AddRuleModal.css';

export type AddRuleModalProps = {
  open: boolean;
  onClose: () => void;
  /** Pass `existingRuleId` when saving an edit so the parent can replace that row */
  onSave: (rule: Omit<PrintingRule, 'id'>, existingRuleId?: string) => void;
  /** When set, the form is filled from this rule (edit mode) */
  initialRule?: PrintingRule | null;
  /** Used when creating a new rule (`initialRule` unset). Defaults to ticket print (`kitchen_ticket`). */
  defaultRuleType?: PrintingRule['ruleType'];
  /** Saved printers shown in “Applied to”; empty list shows the empty state in the dropdown. */
  printers: readonly Printer[];
  /** Opens the connect / add printer flow (e.g. USB picker). */
  onConnectPrinter?: () => void;
  /**
   * When creating a new rule, pre-select these printer IDs in “Applied to” (e.g. printer the user came from).
   * Ignored when `initialRule` is set.
   */
  defaultAppliedPrinterIds?: readonly string[];
};

const SELECT_ALL = '__select_all__';

const FULFILLMENT_OPTIONS = [...FULFILLMENT_RULE_OPTIONS];

const FULFILLMENT_IDS = FULFILLMENT_OPTIONS.map((o) => o.value);

function withSelectAllValue(real: Set<string>, allIds: readonly string[]): Set<string> {
  const s = new Set(real);
  if (allIds.length > 0 && real.size === allIds.length) {
    s.add(SELECT_ALL);
  }
  return s;
}

function handleMultiSelectChange(
  e: CustomEvent<{ prevValues: Set<string>; values: Set<string> }>,
  allIds: readonly string[],
  setReal: (next: Set<string>) => void,
) {
  const prev = e.detail.prevValues;
  const nextRaw = new Set(e.detail.values);
  const prevAllRow = prev.has(SELECT_ALL);
  const nextAllRow = nextRaw.has(SELECT_ALL);
  nextRaw.delete(SELECT_ALL);

  if (nextAllRow !== prevAllRow) {
    if (nextAllRow) {
      setReal(new Set(allIds));
    } else {
      setReal(new Set());
    }
    return;
  }

  setReal(nextRaw);
}

function titlesForValues(selected: Set<string>, options: { value: string; title: string }[]): string[] {
  return [...selected]
    .map((v) => options.find((o) => o.value === v)?.title)
    .filter((t): t is string => Boolean(t));
}

function multiSelectionLabel(selected: Set<string>, options: { value: string; title: string }[]): string {
  if (selected.size === 0) {
    return '';
  }
  if (selected.size === options.length) {
    return 'All selected';
  }
  return titlesForValues(selected, options).join(', ');
}

function allSelectedSet(ids: readonly string[]) {
  return new Set(ids);
}

function valuesFromStoredTitles(
  titles: string[] | undefined,
  options: { value: string; title: string }[],
): Set<string> {
  if (titles === undefined) {
    return allSelectedSet(options.map((o) => o.value));
  }
  const next = new Set<string>();
  for (const t of titles) {
    const opt = options.find((o) => o.title === t);
    if (opt) next.add(opt.value);
  }
  return next;
}

function assignedPrinterIdsFromInitial(
  stored: string[] | undefined,
  validPrinterIds: readonly string[],
): Set<string> {
  if (stored === undefined || stored.length === 0) {
    return new Set();
  }
  const valid = new Set(validPrinterIds);
  return new Set(stored.filter((id) => valid.has(id)));
}

export function AddRuleModal({
  open,
  onClose,
  onSave,
  initialRule = null,
  defaultRuleType,
  printers,
  onConnectPrinter,
  defaultAppliedPrinterIds = [],
}: AddRuleModalProps) {
  const [ruleName, setRuleName] = useState('');
  const [fulfillments, setFulfillments] = useState<Set<string>>(() => allSelectedSet(FULFILLMENT_IDS));
  const [orderSourcesState, setOrderSourcesState] = useState(() => orderSourceStateFromRule(null));
  const [appliedPrinters, setAppliedPrinters] = useState<Set<string>>(new Set());
  const [entireCategoriesOpen, setEntireCategoriesOpen] = useState(false);
  const [categoryContents, setCategoryContents] = useState<EntireCategoryRuleContent[]>([]);
  const [specificItemsOpen, setSpecificItemsOpen] = useState(false);
  const [specificItemIds, setSpecificItemIds] = useState<string[]>([]);
  const [pickerDrillCategoryId, setPickerDrillCategoryId] = useState<string | null>(null);
  const [modifierGroupsOpen, setModifierGroupsOpen] = useState(false);
  const [modifierGroupContents, setModifierGroupContents] = useState<ModifierGroupRuleContent[]>([]);
  const [pickerDrillModifierGroupId, setPickerDrillModifierGroupId] = useState<string | null>(null);
  const [ruleKind, setRuleKind] = useState<PrintingRuleType>(() => {
    return initialRule?.ruleType ?? defaultRuleType ?? 'kitchen_ticket';
  });

  const modalShown = useViewTransitionVisibility(open);

  const printersRef = useRef(printers);
  printersRef.current = printers;

  const printerSelectOptions = useMemo(
    () =>
      [...printers]
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((p) => ({ value: p.id, title: p.name })),
    [printers],
  );
  const printerOptionIds = useMemo(() => printerSelectOptions.map((o) => o.value), [printerSelectOptions]);

  const defaultAppliedPrinterKey = useMemo(
    () => (defaultAppliedPrinterIds ?? []).slice().sort().join('\0'),
    [defaultAppliedPrinterIds],
  );

  useLayoutEffect(() => {
    if (!modalShown) {
      return;
    }
    const nextKind: PrintingRuleType = initialRule?.ruleType ?? defaultRuleType ?? 'kitchen_ticket';
    setRuleKind(nextKind);
    if (initialRule) {
      setRuleName(initialRule.name);
      setFulfillments(valuesFromStoredTitles(initialRule.orderFulfillments, FULFILLMENT_OPTIONS));
      setOrderSourcesState(orderSourceStateFromRule(initialRule));
      setAppliedPrinters(
        assignedPrinterIdsFromInitial(
          initialRule.assignedPrinterIds,
          printersRef.current.map((p) => p.id),
        ),
      );
      setCategoryContents(
        initialRule.ruleType === 'kitchen_ticket' ? (initialRule.entireCategoryContent ?? []) : [],
      );
      setSpecificItemIds(
        initialRule.ruleType === 'kitchen_ticket' ? (initialRule.specificItemIds ?? []) : [],
      );
      setModifierGroupContents(
        initialRule.ruleType === 'kitchen_ticket' ? (initialRule.modifierGroupContent ?? []) : [],
      );
    } else {
      setRuleName('');
      setFulfillments(allSelectedSet(FULFILLMENT_IDS));
      setOrderSourcesState(orderSourceStateFromRule(null));
      const validPrinterIds = new Set(printersRef.current.map((p) => p.id));
      setAppliedPrinters(
        new Set((defaultAppliedPrinterIds ?? []).filter((id) => validPrinterIds.has(id))),
      );
      setCategoryContents([]);
      setSpecificItemIds([]);
      setModifierGroupContents([]);
    }
    setEntireCategoriesOpen(false);
    setSpecificItemsOpen(false);
    setModifierGroupsOpen(false);
    setPickerDrillCategoryId(null);
    setPickerDrillModifierGroupId(null);
  }, [modalShown, initialRule?.id, defaultRuleType, defaultAppliedPrinterKey]);

  useEffect(() => {
    if (ruleKind === 'customer_receipt') {
      setCategoryContents([]);
      setSpecificItemIds([]);
      setModifierGroupContents([]);
      setEntireCategoriesOpen(false);
      setSpecificItemsOpen(false);
      setModifierGroupsOpen(false);
      setPickerDrillCategoryId(null);
      setPickerDrillModifierGroupId(null);
    }
  }, [ruleKind]);

  useEffect(() => {
    const valid = new Set(printerOptionIds);
    setAppliedPrinters((prev) => {
      const next = new Set([...prev].filter((id) => valid.has(id)));
      if (next.size === prev.size && [...prev].every((id) => next.has(id))) {
        return prev;
      }
      return next;
    });
  }, [printerOptionIds]);

  useEffect(() => {
    if (!modalShown) {
      return;
    }
    document.body.classList.add('add-rule-modal-open');
    return () => {
      document.body.classList.remove('add-rule-modal-open');
    };
  }, [modalShown]);

  const fulfillmentSelectValues = useMemo(
    () => withSelectAllValue(fulfillments, FULFILLMENT_IDS),
    [fulfillments],
  );
  const appliedPrinterSelectValues = useMemo(() => {
    if (printerOptionIds.length <= 1) {
      return appliedPrinters;
    }
    return withSelectAllValue(appliedPrinters, printerOptionIds);
  }, [appliedPrinters, printerOptionIds]);

  const fulfillmentSelectionLabel = useMemo(
    () => multiSelectionLabel(fulfillments, FULFILLMENT_OPTIONS),
    [fulfillments],
  );
  const appliedToSelectionLabel = useMemo(() => {
    if (appliedPrinters.size === 0) {
      return 'No printers';
    }
    if (printerSelectOptions.length === 1) {
      const only = printerSelectOptions[0];
      return appliedPrinters.has(only.value) ? only.title : '';
    }
    return multiSelectionLabel(appliedPrinters, printerSelectOptions);
  }, [appliedPrinters, printerSelectOptions]);

  const handleEntireCategoriesSave = useCallback((saved: EntireCategoryRuleContent[]) => {
    setCategoryContents((prev) => mergeEntireCategorySave(prev, saved));
    setEntireCategoriesOpen(false);
    setPickerDrillCategoryId(null);
  }, []);

  const handleEntireCategoriesDismiss = useCallback(() => {
    setEntireCategoriesOpen(false);
    setPickerDrillCategoryId(null);
  }, []);

  const openEntireCategoriesFromChooser = useCallback(() => {
    setSpecificItemsOpen(false);
    setModifierGroupsOpen(false);
    setPickerDrillModifierGroupId(null);
    setPickerDrillCategoryId(null);
    setEntireCategoriesOpen(true);
  }, []);

  const openEntireCategoriesEditor = useCallback((categoryId: string) => {
    setSpecificItemsOpen(false);
    setModifierGroupsOpen(false);
    setPickerDrillModifierGroupId(null);
    setPickerDrillCategoryId(categoryId);
    setEntireCategoriesOpen(true);
  }, []);

  const openSpecificItemsPicker = useCallback(() => {
    setEntireCategoriesOpen(false);
    setModifierGroupsOpen(false);
    setPickerDrillCategoryId(null);
    setPickerDrillModifierGroupId(null);
    setSpecificItemsOpen(true);
  }, []);

  const openModifierGroupsFromChooser = useCallback(() => {
    setEntireCategoriesOpen(false);
    setSpecificItemsOpen(false);
    setPickerDrillCategoryId(null);
    setPickerDrillModifierGroupId(null);
    setModifierGroupsOpen(true);
  }, []);

  const openModifierGroupsEditor = useCallback((groupId: string) => {
    setEntireCategoriesOpen(false);
    setSpecificItemsOpen(false);
    setPickerDrillCategoryId(null);
    setPickerDrillModifierGroupId(groupId);
    setModifierGroupsOpen(true);
  }, []);

  const handleSpecificItemsSave = useCallback((ids: string[]) => {
    setSpecificItemIds(ids);
    setSpecificItemsOpen(false);
  }, []);

  const handleSpecificItemsDismiss = useCallback(() => {
    setSpecificItemsOpen(false);
  }, []);

  const handleModifierGroupsSave = useCallback((saved: ModifierGroupRuleContent[]) => {
    setModifierGroupContents((prev) => mergeModifierGroupSave(prev, saved));
    setModifierGroupsOpen(false);
    setPickerDrillModifierGroupId(null);
  }, []);

  const handleModifierGroupsDismiss = useCallback(() => {
    setModifierGroupsOpen(false);
    setPickerDrillModifierGroupId(null);
  }, []);

  const handleAddContentPick = useCallback(
    (id: AddRuleContentOptionId) => {
      if (id === 'entire-categories') {
        openEntireCategoriesFromChooser();
      } else if (id === 'specific-items') {
        openSpecificItemsPicker();
      } else if (id === 'modifier-groups') {
        openModifierGroupsFromChooser();
      }
    },
    [openEntireCategoriesFromChooser, openModifierGroupsFromChooser, openSpecificItemsPicker],
  );

  if (!modalShown) {
    return null;
  }

  const ruleNameValid = ruleName.trim().length > 0;
  const newRulePlaceholderTitle =
    ruleKind === 'customer_receipt' ? 'New receipt print rule' : 'New ticket print rule';
  const headerTitle = ruleName.trim() || newRulePlaceholderTitle;

  const handleSave = () => {
    const name = ruleName.trim();
    if (!name) {
      return;
    }
    const orderSourcePayload = orderSourceFieldsFromState(orderSourcesState);
    onSave(
      {
        name,
        ruleType: ruleKind,
        orderFulfillments: titlesForValues(fulfillments, FULFILLMENT_OPTIONS),
        orderSources: orderSourcePayload.orderSources,
        orderSourcePosTerminalIds: orderSourcePayload.orderSourcePosTerminalIds,
        assignedPrinterIds:
          appliedPrinters.size > 0 ? [...appliedPrinters] : undefined,
        entireCategoryContent:
          ruleKind === 'kitchen_ticket' && categoryContents.length > 0
            ? categoryContents
            : undefined,
        specificItemIds:
          ruleKind === 'kitchen_ticket' && specificItemIds.length > 0
            ? specificItemIds
            : undefined,
        modifierGroupContent:
          ruleKind === 'kitchen_ticket' && modifierGroupContents.length > 0
            ? modifierGroupContents
            : undefined,
      },
      initialRule?.id,
    );
    onClose();
  };

  const handleRuleKindChange = (e: CustomEvent<{ value: string }>) => {
    const v = e.detail.value as PrintingRuleType;
    setRuleKind(v);
  };

  return (
    <>
      <MarketModal
        type="full"
        contentWidth="regular"
        zIndex={1150}
        onClose={onClose}
        noVeil={entireCategoriesOpen || specificItemsOpen || modifierGroupsOpen}
      >
        <MarketModal.Header
          contentWidth="regular"
          title={headerTitle}
          leadingActions={<MarketModal.CloseButton type="button" onClick={onClose} />}
          trailingActions={
            <MarketButton
              type="button"
              rank="primary"
              disabled={!ruleNameValid}
              onClick={handleSave}
            >
              Save
            </MarketButton>
          }
        />

        <MarketModal.Content>
          <div className="add-rule-modal__rule-kind">
            <MarketSegmentedControl value={ruleKind} onChange={handleRuleKindChange} aria-label="Rule type">
              <MarketSegmentedControl.Segment value="kitchen_ticket" label="Ticket" />
              <MarketSegmentedControl.Segment value="customer_receipt" label="Receipt" />
            </MarketSegmentedControl>
          </div>

          <div className="add-rule-modal__fields">
            <MarketInput
              label="Rule name"
              placeholder={
                ruleKind === 'customer_receipt'
                  ? 'Rule name (like Print Host Receipts, Print Bar Receipts, etc.)'
                  : 'Rule name (like Print Bar Tickets, Print Salad Tickets, Print All Tickets, etc.)'
              }
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
            />
            <MarketSelect
              label="Order fulfillments"
              selectionMode="multiple"
              selectedValues={fulfillmentSelectValues}
              selectionLabel={fulfillmentSelectionLabel || undefined}
              placeholder="Select fulfillment types"
              onSelectionChange={(e) =>
                handleMultiSelectChange(e, FULFILLMENT_IDS, setFulfillments)
              }
            >
              <MarketSelect.Option value={SELECT_ALL} title="Select all" />
              {FULFILLMENT_OPTIONS.map((o) => (
                <MarketSelect.Option key={o.value} value={o.value} title={o.title} />
              ))}
            </MarketSelect>
            <OrderSourceMultiSelect
              value={orderSourcesState}
              onChange={setOrderSourcesState}
            />
            <MarketSelect
              label="Applied to"
              selectionMode="multiple"
              selectedValues={appliedPrinterSelectValues}
              selectionLabel={appliedToSelectionLabel}
              placeholder="No printers"
              onSelectionChange={(e) =>
                handleMultiSelectChange(e, printerOptionIds, setAppliedPrinters)
              }
            >
              {printerSelectOptions.length === 0 ? (
                <div
                  className="add-rule-modal__applied-to-empty"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <div className="add-rule-modal__applied-to-empty-contents">
                    <MarketEmptyState
                      className="add-rule-modal__applied-to-empty-state"
                      borderless
                      primaryText="No printers are set up yet."
                      actions={
                      <MarketButton
                        rank="primary"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onConnectPrinter?.();
                        }}
                      >
                        Add printer
                      </MarketButton>
                    }
                    />
                  </div>
                </div>
              ) : (
                <>
                  {printerSelectOptions.length > 1 ? (
                    <MarketSelect.Option value={SELECT_ALL} title="Select all" />
                  ) : null}
                  {printerSelectOptions.map((o) => (
                    <MarketSelect.Option key={o.value} value={o.value} title={o.title} />
                  ))}
                </>
              )}
            </MarketSelect>
          </div>

          {ruleKind === 'kitchen_ticket' && (
            <>
              <MarketDivider margin="large" />

              <section className="add-rule-modal__section">
                <MarketText
                  className="add-rule-modal__section-title"
                  component="h2"
                  typeStyle="heading-20"
                  textColor="text-10"
                >
                  Print orders with this content
                </MarketText>

                {categoryContents.length === 0 &&
                specificItemIds.length === 0 &&
                modifierGroupContents.length === 0 ? (
                  <MarketEmptyState
                    primaryText="No content added yet"
                    secondaryText="Add specific categories, items, and modifiers."
                    actions={
                      <div className="add-rule-modal__empty-actions">
                        <AddRuleContentDropdown
                          className="add-rule-modal__add-content-dropdown"
                          triggerClassName="add-rule-modal__add-content-dropdown-trigger"
                          onPick={handleAddContentPick}
                        />
                      </div>
                    }
                  />
                ) : (
                  <div className="add-rule-modal__content-list">
                    {categoryContents.map((row) => {
                      const cat = menuCategoryById(row.categoryId);
                      const title = cat ? `${cat.name} (Category)` : `${row.categoryId} (Category)`;
                      const secondary = categoryContentSecondaryLine(row, cat);
                      return (
                        <MarketCard
                          key={row.categoryId}
                          mode="transient"
                          title={title}
                          secondaryText={secondary}
                          verticalAlignment={secondary ? 'top' : 'center'}
                          onClick={() => openEntireCategoriesEditor(row.categoryId)}
                          trailingAccessory={
                            <div className="add-rule-modal__content-card-actions">
                              <MarketLink
                                type="button"
                                standalone
                                onClick={(e) => {
                                  e.preventDefault();
                                  openEntireCategoriesEditor(row.categoryId);
                                }}
                              >
                                Edit
                              </MarketLink>
                              <span
                                className="add-rule-modal__content-card-trash-stop"
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                              >
                                <MarketButton
                                  type="button"
                                  rank="tertiary"
                                  destructive
                                  aria-label={`Remove ${cat?.name ?? 'category'}`}
                                  icon={<MarketTrashcanIcon aria-hidden />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCategoryContents((prev) =>
                                      prev.filter((c) => c.categoryId !== row.categoryId),
                                    );
                                  }}
                                />
                              </span>
                            </div>
                          }
                        />
                      );
                    })}
                    {specificItemIds.length > 0 ? (
                      <MarketCard
                        key="__specific_items__"
                        mode="transient"
                        title="Specific items"
                        secondaryText={specificItemNamesSorted(specificItemIds).join(', ')}
                        verticalAlignment="top"
                        onClick={() => openSpecificItemsPicker()}
                        trailingAccessory={
                          <div className="add-rule-modal__content-card-actions">
                            <MarketLink
                              type="button"
                              standalone
                              onClick={(e) => {
                                e.preventDefault();
                                openSpecificItemsPicker();
                              }}
                            >
                              Edit
                            </MarketLink>
                            <span
                              className="add-rule-modal__content-card-trash-stop"
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <MarketButton
                                type="button"
                                rank="tertiary"
                                destructive
                                aria-label="Remove specific items"
                                icon={<MarketTrashcanIcon aria-hidden />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSpecificItemIds([]);
                                }}
                              />
                            </span>
                          </div>
                        }
                      />
                    ) : null}
                    {modifierGroupContents.map((row) => {
                      const grp = modifierGroupById(row.modifierGroupId);
                      const title = grp
                        ? `${grp.name} (Modifier Group)`
                        : `${row.modifierGroupId} (Modifier Group)`;
                      const secondary = selectedModifierOptionNamesSorted(row.includedOptionIds).join(
                        ', ',
                      );
                      return (
                        <MarketCard
                          key={row.modifierGroupId}
                          mode="transient"
                          title={title}
                          secondaryText={secondary}
                          verticalAlignment="top"
                          onClick={() => openModifierGroupsEditor(row.modifierGroupId)}
                          trailingAccessory={
                            <div className="add-rule-modal__content-card-actions">
                              <MarketLink
                                type="button"
                                standalone
                                onClick={(e) => {
                                  e.preventDefault();
                                  openModifierGroupsEditor(row.modifierGroupId);
                                }}
                              >
                                Edit
                              </MarketLink>
                              <span
                                className="add-rule-modal__content-card-trash-stop"
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                              >
                                <MarketButton
                                  type="button"
                                  rank="tertiary"
                                  destructive
                                  aria-label={`Remove ${grp?.name ?? 'modifier group'}`}
                                  icon={<MarketTrashcanIcon aria-hidden />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setModifierGroupContents((prev) =>
                                      prev.filter((g) => g.modifierGroupId !== row.modifierGroupId),
                                    );
                                  }}
                                />
                              </span>
                            </div>
                          }
                        />
                      );
                    })}
                    <AddRuleContentDropdown
                      className="add-rule-modal__add-content-dropdown"
                      triggerClassName="add-rule-modal__add-content-dropdown-trigger"
                      onPick={handleAddContentPick}
                    />
                  </div>
                )}
              </section>
            </>
          )}
        </MarketModal.Content>
      </MarketModal>

      <EntireCategoriesPicker
        open={entireCategoriesOpen}
        initialContents={categoryContents}
        initialDrillCategoryId={pickerDrillCategoryId}
        onDismiss={handleEntireCategoriesDismiss}
        onSave={handleEntireCategoriesSave}
        baseZIndex={1200}
      />
      <SpecificItemsPicker
        open={specificItemsOpen}
        initialItemIds={specificItemIds}
        onDismiss={handleSpecificItemsDismiss}
        onSave={handleSpecificItemsSave}
        baseZIndex={1200}
      />
      <ModifierGroupsPicker
        open={modifierGroupsOpen}
        initialContents={modifierGroupContents}
        initialDrillModifierGroupId={pickerDrillModifierGroupId}
        onDismiss={handleModifierGroupsDismiss}
        onSave={handleModifierGroupsSave}
        baseZIndex={1200}
      />
    </>
  );
}
