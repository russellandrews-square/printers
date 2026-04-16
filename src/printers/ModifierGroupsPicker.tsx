import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react';
import { MarketButton, MarketCheckbox } from '@squareup/market-react';
import { MarketList, MarketModal, MarketText } from '@squareup/market-react/trial';
import { MarketChevronRightIcon } from '@squareup/market-react/icons';
import { MODIFIER_GROUPS, type ModifierGroup } from './modifierGroupData';
import {
  allModifierSelections,
  emptyModifierSelections,
  selectionMapFromModifierGroupContents,
} from './modifierGroupRuleUtils';
import type { ModifierGroupRuleContent } from './types';
import { MarketSearch } from './MarketSearch';
import { useViewTransitionVisibility } from './useViewTransitionVisibility';
import './EntireCategoriesPicker.css';

export type ModifierGroupsPickerProps = {
  open: boolean;
  initialContents?: ModifierGroupRuleContent[];
  initialDrillModifierGroupId?: string | null;
  onDismiss: () => void;
  onSave: (rows: ModifierGroupRuleContent[]) => void;
  baseZIndex?: number;
};

type SelectionMap = Record<string, Set<string>>;

function selectionKind(group: ModifierGroup, selected: Set<string>): 'none' | 'some' | 'all' {
  const n = selected.size;
  if (n === 0) return 'none';
  if (n === group.options.length) return 'all';
  return 'some';
}

function totalOptionCount(groups: ModifierGroup[]): number {
  return groups.reduce((acc, g) => acc + g.options.length, 0);
}

function totalSelectedCount(selections: SelectionMap, groups: ModifierGroup[]): number {
  return groups.reduce((acc, g) => acc + (selections[g.id]?.size ?? 0), 0);
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

function sortOptionIdsForSave(group: ModifierGroup, selected: Set<string>): string[] {
  return group.options
    .filter((o) => selected.has(o.id))
    .map((o) => o.id)
    .sort((a, b) => {
      const na = group.options.find((o) => o.id === a)?.name ?? a;
      const nb = group.options.find((o) => o.id === b)?.name ?? b;
      const cmp = na.localeCompare(nb, undefined, { sensitivity: 'base' });
      if (cmp !== 0) return cmp;
      return a.localeCompare(b);
    });
}

export function ModifierGroupsPicker({
  open,
  initialContents = [],
  initialDrillModifierGroupId = null,
  onDismiss,
  onSave,
  baseZIndex = 1200,
}: ModifierGroupsPickerProps) {
  const [groupSearch, setGroupSearch] = useState('');
  const [optionSearch, setOptionSearch] = useState('');
  const [selections, setSelections] = useState<SelectionMap>(() => emptyModifierSelections(MODIFIER_GROUPS));
  const [drillGroupId, setDrillGroupId] = useState<string | null>(null);
  const [hasVisitedDrill, setHasVisitedDrill] = useState(false);
  const [directGroupEntry, setDirectGroupEntry] = useState(false);
  const [layoutReady, setLayoutReady] = useState(false);

  const initialContentsRef = useRef(initialContents);
  initialContentsRef.current = initialContents;
  const initialDrillRef = useRef(initialDrillModifierGroupId);
  initialDrillRef.current = initialDrillModifierGroupId;

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
      MODIFIER_GROUPS.some((g) => g.id === drillTarget);

    setGroupSearch('');
    setOptionSearch('');
    setSelections(selectionMapFromModifierGroupContents(seed));
    setDirectGroupEntry(validDrill);
    if (validDrill) {
      setDrillGroupId(drillTarget);
      setHasVisitedDrill(true);
    } else {
      setDrillGroupId(null);
      setHasVisitedDrill(false);
    }
    setLayoutReady(true);
  }, [pickerShown]);

  const visibleGroups = useMemo(() => {
    const q = groupSearch.trim().toLowerCase();
    if (!q) return MODIFIER_GROUPS;
    return MODIFIER_GROUPS.filter((g) => g.name.toLowerCase().includes(q));
  }, [groupSearch]);

  const drillGroup = useMemo(
    () => MODIFIER_GROUPS.find((g) => g.id === drillGroupId) ?? null,
    [drillGroupId],
  );

  const visibleOptions = useMemo(() => {
    if (!drillGroup) return [];
    const q = optionSearch.trim().toLowerCase();
    if (!q) return drillGroup.options;
    return drillGroup.options.filter((o) => o.name.toLowerCase().includes(q));
  }, [drillGroup, optionSearch]);

  const allOptionsTotal = useMemo(() => totalOptionCount(MODIFIER_GROUPS), []);
  const allOptionsSelected = useMemo(
    () => totalSelectedCount(selections, MODIFIER_GROUPS),
    [selections],
  );

  const selectAllGroupsChecked = allOptionsTotal > 0 && allOptionsSelected === allOptionsTotal;
  const selectAllGroupsIndeterminate = allOptionsSelected > 0 && allOptionsSelected < allOptionsTotal;

  const setGroupSelection = useCallback((groupId: string, optionIds: Set<string>) => {
    setSelections((prev) => ({ ...prev, [groupId]: optionIds }));
  }, []);

  const handleSelectAllGroupsChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelections(allModifierSelections(MODIFIER_GROUPS));
    } else {
      setSelections(emptyModifierSelections(MODIFIER_GROUPS));
    }
  }, []);

  const openDrill = useCallback((groupId: string) => {
    setDrillGroupId(groupId);
    setOptionSearch('');
    setHasVisitedDrill(true);
  }, []);

  const closeDrill = useCallback(() => {
    setDrillGroupId(null);
    setOptionSearch('');
  }, []);

  const handleSave = useCallback(() => {
    const rows: ModifierGroupRuleContent[] = [];
    for (const g of MODIFIER_GROUPS) {
      const sel = selections[g.id] ?? new Set();
      if (sel.size === 0) continue;
      rows.push({
        modifierGroupId: g.id,
        includedOptionIds: sortOptionIdsForSave(g, sel),
      });
    }
    onSave(rows);
  }, [selections, onSave]);

  const handleMainDismiss = useCallback(() => {
    if (drillGroup) {
      closeDrill();
    } else {
      onDismiss();
    }
  }, [drillGroup, closeDrill, onDismiss]);

  if (!pickerShown) {
    return null;
  }

  if (!layoutReady) {
    return null;
  }

  const itemsZ = baseZIndex + 100;
  const itemsSheetIsOnlyModal = directGroupEntry && drillGroup != null;
  const itemsZIndex = itemsSheetIsOnlyModal ? baseZIndex : itemsZ;

  const optionsModal = drillGroup ? (
    <MarketModal
      type="partial"
      zIndex={itemsZIndex}
      onClose={itemsSheetIsOnlyModal ? onDismiss : closeDrill}
    >
      <MarketModal.Header
        compact
        contentWidth="regular"
        title={drillGroup.name}
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
            onClick={itemsSheetIsOnlyModal ? handleSave : closeDrill}
          >
            Done
          </MarketButton>
        }
      />
      <MarketModal.Content>
        <div className="entire-cat-picker__search">
          <MarketSearch
            label="Search options"
            placeholder="Search options"
            value={optionSearch}
            onChange={(e) => setOptionSearch(e.target.value)}
          />
        </div>
        <MarketList showDividers>
          <OptionsSelectAllRow
            group={drillGroup}
            selectedSet={selections[drillGroup.id] ?? new Set()}
            setSelection={(next) => setGroupSelection(drillGroup.id, next)}
          />
          {visibleOptions.map((opt) => (
            <MarketList.Item
              key={opt.id}
              mode="transient"
              title={opt.name}
              leadingAccessory={
                <CheckboxWrap>
                  <MarketCheckbox
                    checked={(selections[drillGroup.id] ?? new Set()).has(opt.id)}
                    onChange={(e) => {
                      const set = new Set(selections[drillGroup.id] ?? []);
                      if (e.target.checked) {
                        set.add(opt.id);
                      } else {
                        set.delete(opt.id);
                      }
                      setGroupSelection(drillGroup.id, set);
                    }}
                    aria-label={opt.name}
                  />
                </CheckboxWrap>
              }
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('.entire-cat-picker__checkbox-wrap')) {
                  return;
                }
                const set = new Set(selections[drillGroup.id] ?? []);
                if (set.has(opt.id)) {
                  set.delete(opt.id);
                } else {
                  set.add(opt.id);
                }
                setGroupSelection(drillGroup.id, set);
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
        noVeil={drillGroup != null}
      >
        <MarketModal.Header
          contentWidth="regular"
          title="Modifier groups"
          leadingActions={
            hasVisitedDrill ? (
              <MarketModal.BackButton type="button" onClick={handleMainDismiss} />
            ) : (
              <MarketModal.CloseButton type="button" onClick={handleMainDismiss} />
            )
          }
          trailingActions={
            <MarketButton type="button" rank="primary" onClick={handleSave}>
              Save
            </MarketButton>
          }
        />
        <MarketModal.Content>
          <div className="entire-cat-picker__search">
            <MarketSearch
              label="Search modifier groups"
              placeholder="Search modifier groups"
              value={groupSearch}
              onChange={(e) => setGroupSearch(e.target.value)}
            />
          </div>
          <div className="entire-cat-picker__sheet-rows" role="list">
            <div className="entire-cat-picker__plain-row" role="listitem">
              <div className="entire-cat-picker__plain-row__checkbox">
                <MarketCheckbox
                  checked={selectAllGroupsChecked}
                  indeterminate={selectAllGroupsIndeterminate}
                  onChange={handleSelectAllGroupsChange}
                  aria-label="Select all modifier groups"
                />
              </div>
              <button
                type="button"
                className="entire-cat-picker__plain-row__main"
                onClick={() => {
                  if (selectAllGroupsChecked) {
                    setSelections(emptyModifierSelections(MODIFIER_GROUPS));
                  } else {
                    setSelections(allModifierSelections(MODIFIER_GROUPS));
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
            {visibleGroups.map((g) => {
              const sel = selections[g.id] ?? new Set();
              const kind = selectionKind(g, sel);
              const excluded =
                kind === 'some' || kind === 'none' ? g.options.length - sel.size : 0;
              const showExcluded = kind === 'some' && excluded > 0;

              return (
                <div key={g.id} className="entire-cat-picker__plain-row" role="listitem">
                  <div className="entire-cat-picker__plain-row__checkbox">
                    <MarketCheckbox
                      checked={kind === 'all'}
                      indeterminate={kind === 'some'}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setGroupSelection(g.id, new Set(g.options.map((o) => o.id)));
                        } else {
                          setGroupSelection(g.id, new Set());
                        }
                      }}
                      aria-label={g.name}
                    />
                  </div>
                  <button
                    type="button"
                    className="entire-cat-picker__plain-row__main"
                    onClick={() => openDrill(g.id)}
                  >
                    <MarketText
                      className="entire-cat-picker__plain-row__title"
                      component="span"
                      typeStyle="medium-30"
                      textColor="text-10"
                      withMargin={false}
                    >
                      {g.name}
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
      {optionsModal}
    </>
  );
}

type OptionsSelectAllRowProps = {
  group: ModifierGroup;
  selectedSet: Set<string>;
  setSelection: (next: Set<string>) => void;
};

function OptionsSelectAllRow({ group, selectedSet, setSelection }: OptionsSelectAllRowProps) {
  const kind = selectionKind(group, selectedSet);
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
                setSelection(new Set(group.options.map((o) => o.id)));
              } else {
                setSelection(new Set());
              }
            }}
            aria-label="Select all options"
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
          setSelection(new Set(group.options.map((o) => o.id)));
        }
      }}
    />
  );
}
