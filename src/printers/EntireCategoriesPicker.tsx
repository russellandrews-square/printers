import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { MarketButton, MarketCheckbox, MarketToggle } from '@squareup/market-react';
import { MarketCard, MarketList, MarketModal, MarketText } from '@squareup/market-react/trial';
import { MarketChevronRightIcon } from '@squareup/market-react/icons';
import {
  MENU_CATEGORIES,
  allSelections,
  emptySelections,
  type MenuCategory,
} from './menuCategoryData';
import {
  autoIncludeRecordFromContents,
  selectionMapFromEntireCategoryContents,
} from './entireCategoryRuleUtils';
import type { EntireCategoryRuleContent } from './types';
import { MarketSearch } from './MarketSearch';
import { useViewTransitionVisibility } from './useViewTransitionVisibility';
import './EntireCategoriesPicker.css';

export type EntireCategoriesPickerProps = {
  open: boolean;
  /** Hydrate checkboxes when opening (e.g. edit or add more). */
  initialContents?: EntireCategoryRuleContent[];
  /**
   * When set to a valid menu category id, opens straight on that category’s item list
   * (skips the “Entire categories” list sheet).
   */
  initialDrillCategoryId?: string | null;
  onDismiss: () => void;
  onSave: (categories: EntireCategoryRuleContent[]) => void;
  /** Categories modal z-index; items modal stacks +100 */
  baseZIndex?: number;
};

type SelectionMap = Record<string, Set<string>>;

function selectionKind(cat: MenuCategory, selected: Set<string>): 'none' | 'some' | 'all' {
  const n = selected.size;
  if (n === 0) return 'none';
  if (n === cat.items.length) return 'all';
  return 'some';
}

function totalItemCount(categories: MenuCategory[]): number {
  return categories.reduce((acc, c) => acc + c.items.length, 0);
}

function totalSelectedCount(selections: SelectionMap, categories: MenuCategory[]): number {
  return categories.reduce((acc, c) => acc + (selections[c.id]?.size ?? 0), 0);
}

function CheckboxWrap({ children }: { children: ReactNode }) {
  const stop = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };
  return (
    <span
      className="entire-cat-picker__checkbox-wrap"
      onClick={stop}
      onPointerDown={stop}
      onMouseDown={stop}
      onKeyDown={stop}
    >
      {children}
    </span>
  );
}

export function EntireCategoriesPicker({
  open,
  initialContents = [],
  initialDrillCategoryId = null,
  onDismiss,
  onSave,
  baseZIndex = 1200,
}: EntireCategoriesPickerProps) {
  const [categorySearch, setCategorySearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [selections, setSelections] = useState<SelectionMap>(() => emptySelections(MENU_CATEGORIES));
  const [autoInclude, setAutoInclude] = useState<Record<string, boolean>>(() => ({}));
  const [drillCategoryId, setDrillCategoryId] = useState<string | null>(null);
  const [hasVisitedItems, setHasVisitedItems] = useState(false);
  const [directCategoryEntry, setDirectCategoryEntry] = useState(false);
  const [layoutReady, setLayoutReady] = useState(false);

  const initialContentsRef = useRef(initialContents);
  initialContentsRef.current = initialContents;
  const initialDrillRef = useRef(initialDrillCategoryId);
  initialDrillRef.current = initialDrillCategoryId;

  const pickerShown = useViewTransitionVisibility(open);

  useLayoutEffect(() => {
    if (!pickerShown) {
      setLayoutReady(false);
      return;
    }
    const seed = initialContentsRef.current ?? [];
    const drillTarget = initialDrillRef.current;
    const validDrill =
      typeof drillTarget === 'string' &&
      drillTarget.length > 0 &&
      MENU_CATEGORIES.some((c) => c.id === drillTarget);

    setCategorySearch('');
    setItemSearch('');
    setSelections(selectionMapFromEntireCategoryContents(seed));
    setAutoInclude(autoIncludeRecordFromContents(seed));
    setDirectCategoryEntry(validDrill);
    if (validDrill) {
      setDrillCategoryId(drillTarget);
      setHasVisitedItems(true);
    } else {
      setDrillCategoryId(null);
      setHasVisitedItems(false);
    }
    setLayoutReady(true);
  }, [pickerShown]);

  const visibleCategories = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return MENU_CATEGORIES;
    return MENU_CATEGORIES.filter((c) => c.name.toLowerCase().includes(q));
  }, [categorySearch]);

  const drillCategory = useMemo(
    () => MENU_CATEGORIES.find((c) => c.id === drillCategoryId) ?? null,
    [drillCategoryId],
  );

  const visibleItems = useMemo(() => {
    if (!drillCategory) return [];
    const q = itemSearch.trim().toLowerCase();
    if (!q) return drillCategory.items;
    return drillCategory.items.filter((i) => i.name.toLowerCase().includes(q));
  }, [drillCategory, itemSearch]);

  const allItemsTotal = useMemo(() => totalItemCount(MENU_CATEGORIES), []);
  const allItemsSelected = useMemo(
    () => totalSelectedCount(selections, MENU_CATEGORIES),
    [selections],
  );

  const selectAllCategoriesChecked = allItemsTotal > 0 && allItemsSelected === allItemsTotal;
  const selectAllCategoriesIndeterminate = allItemsSelected > 0 && allItemsSelected < allItemsTotal;

  const setCategorySelection = useCallback((categoryId: string, itemIds: Set<string>) => {
    setSelections((prev) => ({ ...prev, [categoryId]: itemIds }));
  }, []);

  const handleSelectAllCategoriesChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
        setSelections(allSelections(MENU_CATEGORIES));
      } else {
        setSelections(emptySelections(MENU_CATEGORIES));
      }
    },
    [],
  );

  const openDrill = useCallback((categoryId: string) => {
    setDrillCategoryId(categoryId);
    setItemSearch('');
    setHasVisitedItems(true);
  }, []);

  const closeDrill = useCallback(() => {
    setDrillCategoryId(null);
    setItemSearch('');
  }, []);

  const handleCategoriesSave = useCallback(() => {
    const categories: EntireCategoryRuleContent[] = [];
    for (const cat of MENU_CATEGORIES) {
      const sel = selections[cat.id] ?? new Set();
      if (sel.size === 0) continue;
      categories.push({
        categoryId: cat.id,
        includedItemIds: [...sel],
        autoIncludeNewItems: autoInclude[cat.id] ?? false,
      });
    }
    onSave(categories);
  }, [selections, autoInclude, onSave]);

  const handleMainDismiss = useCallback(() => {
    if (drillCategory) {
      closeDrill();
    } else {
      onDismiss();
    }
  }, [drillCategory, closeDrill, onDismiss]);

  if (!pickerShown) {
    return null;
  }

  if (!layoutReady) {
    return null;
  }

  const itemsZ = baseZIndex + 100;
  const itemsSheetIsOnlyModal = directCategoryEntry && drillCategory != null;
  const itemsZIndex = itemsSheetIsOnlyModal ? baseZIndex : itemsZ;

  const itemsModal = drillCategory ? (
    <MarketModal
      type="partial"
      zIndex={itemsZIndex}
      onClose={itemsSheetIsOnlyModal ? onDismiss : closeDrill}
    >
      <MarketModal.Header
        contentWidth="regular"
        title={drillCategory.name}
        leadingActions={
          <MarketModal.BackButton
            type="button"
            onClick={itemsSheetIsOnlyModal ? onDismiss : closeDrill}
          />
        }
        trailingActions={
          <MarketButton
            type="button"
            rank="primary"
            onClick={itemsSheetIsOnlyModal ? handleCategoriesSave : closeDrill}
          >
            Done
          </MarketButton>
        }
      />
      <MarketModal.Content>
        <div className="entire-cat-picker__auto-include-card">
          <MarketCard
            title={`Include new items added to ${drillCategory.name}`}
            trailingAccessory={
              <span
                className="entire-cat-picker__toggle-wrap"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <MarketToggle
                  checked={autoInclude[drillCategory.id] ?? false}
                  onChange={(e) =>
                    setAutoInclude((prev) => ({ ...prev, [drillCategory.id]: e.target.checked }))
                  }
                  aria-label={`Include new items added to ${drillCategory.name}`}
                />
              </span>
            }
          />
        </div>
        <div className="entire-cat-picker__search">
          <MarketSearch
            label="Search items"
            placeholder="Search items"
            value={itemSearch}
            onChange={(e) => setItemSearch(e.target.value)}
          />
        </div>
        <MarketList showDividers>
          <ItemsSelectAllRow
            category={drillCategory}
            selectedSet={selections[drillCategory.id] ?? new Set()}
            setSelection={(next) => setCategorySelection(drillCategory.id, next)}
          />
          {visibleItems.map((item) => (
            <MarketList.Item
              key={item.id}
              mode="transient"
              title={item.name}
              leadingAccessory={
                <CheckboxWrap>
                  <MarketCheckbox
                    checked={(selections[drillCategory.id] ?? new Set()).has(item.id)}
                    onChange={(e) => {
                      const set = new Set(selections[drillCategory.id] ?? []);
                      if (e.target.checked) {
                        set.add(item.id);
                      } else {
                        set.delete(item.id);
                      }
                      setCategorySelection(drillCategory.id, set);
                    }}
                    aria-label={item.name}
                  />
                </CheckboxWrap>
              }
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('.entire-cat-picker__checkbox-wrap')) {
                  return;
                }
                const set = new Set(selections[drillCategory.id] ?? []);
                if (set.has(item.id)) {
                  set.delete(item.id);
                } else {
                  set.add(item.id);
                }
                setCategorySelection(drillCategory.id, set);
              }}
            />
          ))}
        </MarketList>
      </MarketModal.Content>
    </MarketModal>
  ) : null;

  const listModal =
    itemsSheetIsOnlyModal ? null : (
      <MarketModal
        type="partial"
        zIndex={baseZIndex}
        onClose={handleMainDismiss}
        noVeil={drillCategory != null}
      >
        <MarketModal.Header
          contentWidth="regular"
          title="Entire categories"
          leadingActions={
            hasVisitedItems ? (
              <MarketModal.BackButton type="button" onClick={handleMainDismiss} />
            ) : (
              <MarketModal.CloseButton type="button" onClick={handleMainDismiss} />
            )
          }
          trailingActions={
            <MarketButton type="button" rank="primary" onClick={handleCategoriesSave}>
              Save
            </MarketButton>
          }
        />
        <MarketModal.Content>
          <div className="entire-cat-picker__search">
            <MarketSearch
              label="Search categories"
              placeholder="Search categories"
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
            />
          </div>
          <div className="entire-cat-picker__sheet-rows" role="list">
            <div className="entire-cat-picker__plain-row" role="listitem">
              <div className="entire-cat-picker__plain-row__checkbox">
                <MarketCheckbox
                  checked={selectAllCategoriesChecked}
                  indeterminate={selectAllCategoriesIndeterminate}
                  onChange={handleSelectAllCategoriesChange}
                  aria-label="Select all categories"
                />
              </div>
              <button
                type="button"
                className="entire-cat-picker__plain-row__main"
                onClick={() => {
                  if (selectAllCategoriesChecked) {
                    setSelections(emptySelections(MENU_CATEGORIES));
                  } else {
                    setSelections(allSelections(MENU_CATEGORIES));
                  }
                }}
              >
                <MarketText
                  className="entire-cat-picker__plain-row__title"
                  component="span"
                  typeStyle="medium-30"
                  textColor="text-10"
                  withMargin={false}
                >
                  Select all
                </MarketText>
              </button>
            </div>
            {visibleCategories.map((cat) => {
              const sel = selections[cat.id] ?? new Set();
              const kind = selectionKind(cat, sel);
              const excluded =
                kind === 'some' || kind === 'none' ? cat.items.length - sel.size : 0;
              const showExcluded = kind === 'some' && excluded > 0;

              return (
                <div key={cat.id} className="entire-cat-picker__plain-row" role="listitem">
                  <div className="entire-cat-picker__plain-row__checkbox">
                    <MarketCheckbox
                      checked={kind === 'all'}
                      indeterminate={kind === 'some'}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCategorySelection(cat.id, new Set(cat.items.map((i) => i.id)));
                        } else {
                          setCategorySelection(cat.id, new Set());
                        }
                      }}
                      aria-label={cat.name}
                    />
                  </div>
                  <button
                    type="button"
                    className="entire-cat-picker__plain-row__main"
                    onClick={() => openDrill(cat.id)}
                  >
                    <MarketText
                      className="entire-cat-picker__plain-row__title"
                      component="span"
                      typeStyle="medium-30"
                      textColor="text-10"
                      withMargin={false}
                    >
                      {cat.name}
                    </MarketText>
                    <span className="entire-cat-picker__plain-row__trail">
                      {showExcluded ? (
                        <MarketText
                          className="entire-cat-picker__plain-row__side"
                          component="span"
                          typeStyle="paragraph-30"
                          textColor="text-10"
                          withMargin={false}
                        >
                          {`${excluded} excluded`}
                        </MarketText>
                      ) : null}
                      <span className="entire-cat-picker__plain-row__chevron" aria-hidden>
                        <MarketChevronRightIcon size="small" />
                      </span>
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </MarketModal.Content>
      </MarketModal>
    );

  return (
    <>
      {listModal}
      {itemsModal}
    </>
  );
}

type ItemsSelectAllRowProps = {
  category: MenuCategory;
  selectedSet: Set<string>;
  setSelection: (next: Set<string>) => void;
};

function ItemsSelectAllRow({ category, selectedSet, setSelection }: ItemsSelectAllRowProps) {
  const kind = selectionKind(category, selectedSet);
  const checked = kind === 'all';
  const indeterminate = kind === 'some';

  return (
    <MarketList.Item
      mode="transient"
      title="Select all"
      leadingAccessory={
        <CheckboxWrap>
          <MarketCheckbox
            checked={checked}
            indeterminate={indeterminate}
            onChange={(e) => {
              if (e.target.checked) {
                setSelection(new Set(category.items.map((i) => i.id)));
              } else {
                setSelection(new Set());
              }
            }}
            aria-label="Select all items"
          />
        </CheckboxWrap>
      }
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('.entire-cat-picker__checkbox-wrap')) {
          return;
        }
        if (checked) {
          setSelection(new Set());
        } else {
          setSelection(new Set(category.items.map((i) => i.id)));
        }
      }}
    />
  );
}
