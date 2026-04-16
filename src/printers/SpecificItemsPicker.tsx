import { useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { MarketButton, MarketCheckbox } from '@squareup/market-react';
import { MarketList, MarketModal } from '@squareup/market-react/trial';
import { allMenuItemsFlat, menuItemById } from './menuCategoryData';
import { MarketSearch } from './MarketSearch';
import { useViewTransitionVisibility } from './useViewTransitionVisibility';
import './SpecificItemsPicker.css';

export type SpecificItemsPickerProps = {
  open: boolean;
  initialItemIds?: readonly string[];
  onDismiss: () => void;
  onSave: (itemIds: string[]) => void;
  baseZIndex?: number;
};

function CheckboxWrap({ children }: { children: ReactNode }) {
  const stop = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };
  return (
    <span
      className="specific-items-picker__checkbox-wrap"
      onClick={stop}
      onPointerDown={stop}
      onMouseDown={stop}
      onKeyDown={stop}
    >
      {children}
    </span>
  );
}

function sortItemIdsForSave(ids: Set<string>): string[] {
  return [...ids].sort((a, b) => {
    const ia = menuItemById(a);
    const ib = menuItemById(b);
    const na = ia?.name ?? a;
    const nb = ib?.name ?? b;
    const cmp = na.localeCompare(nb, undefined, { sensitivity: 'base' });
    if (cmp !== 0) return cmp;
    return a.localeCompare(b);
  });
}

export function SpecificItemsPicker({
  open,
  initialItemIds = [],
  onDismiss,
  onSave,
  baseZIndex = 1200,
}: SpecificItemsPickerProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [layoutReady, setLayoutReady] = useState(false);

  const initialItemIdsRef = useRef(initialItemIds);
  initialItemIdsRef.current = initialItemIds;

  const pickerShown = useViewTransitionVisibility(open);

  const allItems = useMemo(() => allMenuItemsFlat(), []);

  useLayoutEffect(() => {
    if (!pickerShown) {
      setLayoutReady(false);
      return;
    }
    setSearch('');
    setSelected(new Set(initialItemIdsRef.current));
    setLayoutReady(true);
  }, [pickerShown]);

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter((i) => i.name.toLowerCase().includes(q));
  }, [allItems, search]);

  const handleSave = useCallback(() => {
    onSave(sortItemIdsForSave(selected));
  }, [onSave, selected]);

  if (!pickerShown || !layoutReady) {
    return null;
  }

  return (
    <MarketModal type="partial" zIndex={baseZIndex} onClose={onDismiss}>
      <MarketModal.Header
        contentWidth="regular"
        title="Specific Items"
        leadingActions={<MarketModal.CloseButton type="button" onClick={onDismiss} />}
        trailingActions={
          <MarketButton type="button" rank="primary" onClick={handleSave}>
            Save
          </MarketButton>
        }
      />
      <MarketModal.Content>
        <div className="specific-items-picker__search">
          <MarketSearch
            label="Search items"
            placeholder="Search items"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <MarketList showDividers>
          {visibleItems.map((item) => (
            <MarketList.Item
              key={item.id}
              mode="transient"
              title={item.name}
              leadingAccessory={
                <CheckboxWrap>
                  <MarketCheckbox
                    checked={selected.has(item.id)}
                    onChange={(e) => {
                      setSelected((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) {
                          next.add(item.id);
                        } else {
                          next.delete(item.id);
                        }
                        return next;
                      });
                    }}
                    aria-label={item.name}
                  />
                </CheckboxWrap>
              }
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('.specific-items-picker__checkbox-wrap')) {
                  return;
                }
                setSelected((prev) => {
                  const next = new Set(prev);
                  if (next.has(item.id)) {
                    next.delete(item.id);
                  } else {
                    next.add(item.id);
                  }
                  return next;
                });
              }}
            />
          ))}
        </MarketList>
      </MarketModal.Content>
    </MarketModal>
  );
}
