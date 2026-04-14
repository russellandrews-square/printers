import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
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
  FULFILLMENT_RULE_OPTIONS,
  SOURCE_RULE_OPTIONS,
} from './printingRuleFieldOptions';
import type { EntireCategoryRuleContent, PrintingRule, PrintingRuleType } from './types';
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
};

const SELECT_ALL = '__select_all__';

const FULFILLMENT_OPTIONS = [...FULFILLMENT_RULE_OPTIONS];
const SOURCE_OPTIONS = [...SOURCE_RULE_OPTIONS];

const FULFILLMENT_IDS = FULFILLMENT_OPTIONS.map((o) => o.value);
const SOURCE_IDS = SOURCE_OPTIONS.map((o) => o.value);

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

export function AddRuleModal({
  open,
  onClose,
  onSave,
  initialRule = null,
  defaultRuleType,
}: AddRuleModalProps) {
  const [ruleName, setRuleName] = useState('');
  const [fulfillments, setFulfillments] = useState<Set<string>>(() => allSelectedSet(FULFILLMENT_IDS));
  const [sources, setSources] = useState<Set<string>>(() => allSelectedSet(SOURCE_IDS));
  const [entireCategoriesOpen, setEntireCategoriesOpen] = useState(false);
  const [categoryContents, setCategoryContents] = useState<EntireCategoryRuleContent[]>([]);
  const [pickerDrillCategoryId, setPickerDrillCategoryId] = useState<string | null>(null);
  const [ruleKind, setRuleKind] = useState<PrintingRuleType>(() => {
    return initialRule?.ruleType ?? defaultRuleType ?? 'kitchen_ticket';
  });

  const modalShown = useViewTransitionVisibility(open);

  useLayoutEffect(() => {
    if (!modalShown) {
      return;
    }
    const nextKind: PrintingRuleType = initialRule?.ruleType ?? defaultRuleType ?? 'kitchen_ticket';
    setRuleKind(nextKind);
    if (initialRule) {
      setRuleName(initialRule.name);
      setFulfillments(valuesFromStoredTitles(initialRule.orderFulfillments, FULFILLMENT_OPTIONS));
      setSources(valuesFromStoredTitles(initialRule.orderSources, SOURCE_OPTIONS));
      setCategoryContents(
        initialRule.ruleType === 'kitchen_ticket' ? (initialRule.entireCategoryContent ?? []) : [],
      );
    } else {
      setRuleName('');
      setFulfillments(allSelectedSet(FULFILLMENT_IDS));
      setSources(allSelectedSet(SOURCE_IDS));
      setCategoryContents([]);
    }
    setEntireCategoriesOpen(false);
    setPickerDrillCategoryId(null);
  }, [modalShown, initialRule?.id, defaultRuleType]);

  useEffect(() => {
    if (ruleKind === 'customer_receipt') {
      setCategoryContents([]);
      setEntireCategoriesOpen(false);
      setPickerDrillCategoryId(null);
    }
  }, [ruleKind]);

  const fulfillmentSelectValues = useMemo(
    () => withSelectAllValue(fulfillments, FULFILLMENT_IDS),
    [fulfillments],
  );
  const sourceSelectValues = useMemo(() => withSelectAllValue(sources, SOURCE_IDS), [sources]);

  const fulfillmentSelectionLabel = useMemo(
    () => multiSelectionLabel(fulfillments, FULFILLMENT_OPTIONS),
    [fulfillments],
  );
  const sourceSelectionLabel = useMemo(
    () => multiSelectionLabel(sources, SOURCE_OPTIONS),
    [sources],
  );

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
    setPickerDrillCategoryId(null);
    setEntireCategoriesOpen(true);
  }, []);

  const openEntireCategoriesEditor = useCallback((categoryId: string) => {
    setPickerDrillCategoryId(categoryId);
    setEntireCategoriesOpen(true);
  }, []);

  const handleAddContentPick = useCallback((id: AddRuleContentOptionId) => {
    if (id === 'entire-categories') {
      openEntireCategoriesFromChooser();
    }
  }, [openEntireCategoriesFromChooser]);

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
    onSave(
      {
        name,
        ruleType: ruleKind,
        orderFulfillments: titlesForValues(fulfillments, FULFILLMENT_OPTIONS),
        orderSources: titlesForValues(sources, SOURCE_OPTIONS),
        entireCategoryContent:
          ruleKind === 'kitchen_ticket' && categoryContents.length > 0
            ? categoryContents
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
        onClose={onClose}
        noVeil={entireCategoriesOpen}
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
            <MarketSelect
              label="Order source"
              selectionMode="multiple"
              selectedValues={sourceSelectValues}
              selectionLabel={sourceSelectionLabel || undefined}
              placeholder="Select order sources"
              onSelectionChange={(e) => handleMultiSelectChange(e, SOURCE_IDS, setSources)}
            >
              <MarketSelect.Option value={SELECT_ALL} title="Select all" />
              {SOURCE_OPTIONS.map((o) => (
                <MarketSelect.Option key={o.value} value={o.value} title={o.title} />
              ))}
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

                {categoryContents.length === 0 ? (
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
                          title={title}
                          secondaryText={secondary}
                          verticalAlignment={secondary ? 'top' : 'center'}
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
                              <MarketButton
                                type="button"
                                rank="tertiary"
                                destructive
                                aria-label={`Remove ${cat?.name ?? 'category'}`}
                                icon={<MarketTrashcanIcon aria-hidden />}
                                onClick={() =>
                                  setCategoryContents((prev) =>
                                    prev.filter((c) => c.categoryId !== row.categoryId),
                                  )
                                }
                              />
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
    </>
  );
}
