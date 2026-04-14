import { useCallback, useMemo } from 'react';
import { MarketSelect } from '@squareup/market-react/trial';
import {
  isAllOrderSourcesSelected,
  orderSourceTriggerLabel,
  type OrderSourceSelectionState,
} from './orderSourceSelection';
import {
  ORDER_SOURCE_NON_POS_OPTIONS,
  POS_SOURCE_TITLE,
  POS_TERMINAL_OPTIONS,
} from './printingRuleFieldOptions';
import './OrderSourceMultiSelect.css';

export type OrderSourceMultiSelectProps = {
  className?: string;
  /** Passed to `MarketSelect` as `label` (same as other fields). */
  fieldLabel?: string;
  value: OrderSourceSelectionState;
  onChange: (next: OrderSourceSelectionState) => void;
};

/** Same sentinel as fulfillment / printer multi-selects in `AddRuleModal`. */
const SELECT_ALL = '__select_all__';

/** Synthetic option: “all POS terminals” (shown checked when every terminal is selected). */
const POS_GROUP = '__pos_group__';

const POS_PREFIX = 'pos:';

const NON_POS_IDS: string[] = ORDER_SOURCE_NON_POS_OPTIONS.map((o) => o.value);

function posKey(terminalId: string): string {
  return `${POS_PREFIX}${terminalId}`;
}

/** Values passed to `MarketSelect` (includes `SELECT_ALL` / `POS_GROUP` when appropriate). */
function toSelectValues(state: OrderSourceSelectionState): Set<string> {
  const s = new Set<string>();
  for (const v of state.nonPos) {
    s.add(v);
  }
  for (const id of state.posTerminals) {
    s.add(posKey(id));
  }
  const allNonPos =
    NON_POS_IDS.length > 0 && NON_POS_IDS.every((id) => state.nonPos.has(id));
  const allPos =
    POS_TERMINAL_OPTIONS.length > 0 &&
    POS_TERMINAL_OPTIONS.every((p) => state.posTerminals.has(p.id));
  if (allNonPos && allPos) {
    s.add(SELECT_ALL);
  }
  if (allPos && POS_TERMINAL_OPTIONS.length > 0) {
    s.add(POS_GROUP);
  }
  return s;
}

function parseLeafSelection(values: Set<string>): OrderSourceSelectionState {
  const nonPos = new Set<string>();
  const posTerminals = new Set<string>();
  for (const v of values) {
    if (v === SELECT_ALL || v === POS_GROUP) {
      continue;
    }
    if (v.startsWith(POS_PREFIX)) {
      posTerminals.add(v.slice(POS_PREFIX.length));
    } else if (NON_POS_IDS.includes(v)) {
      nonPos.add(v);
    }
  }
  return { nonPos, posTerminals };
}

function handleOrderSourceSelectChange(
  e: CustomEvent<{ prevValues: Set<string>; values: Set<string> }>,
  setState: (next: OrderSourceSelectionState) => void,
) {
  const prev = e.detail.prevValues;
  const nextFull = e.detail.values;

  const prevAll = prev.has(SELECT_ALL);
  const nextAll = nextFull.has(SELECT_ALL);
  if (nextAll !== prevAll) {
    if (nextAll) {
      setState({
        nonPos: new Set(NON_POS_IDS),
        posTerminals: new Set(POS_TERMINAL_OPTIONS.map((p) => p.id)),
      });
    } else {
      setState({ nonPos: new Set(), posTerminals: new Set() });
    }
    return;
  }

  const prevPosG = prev.has(POS_GROUP);
  const nextPosG = nextFull.has(POS_GROUP);

  const nextLeaves = new Set(nextFull);
  nextLeaves.delete(SELECT_ALL);
  nextLeaves.delete(POS_GROUP);

  if (nextPosG !== prevPosG) {
    const parsed = parseLeafSelection(nextLeaves);
    if (nextPosG) {
      parsed.posTerminals = new Set(POS_TERMINAL_OPTIONS.map((p) => p.id));
    } else {
      parsed.posTerminals = new Set();
    }
    setState(parsed);
    return;
  }

  setState(parseLeafSelection(nextLeaves));
}

export function OrderSourceMultiSelect({
  className,
  fieldLabel = 'Order source',
  value,
  onChange,
}: OrderSourceMultiSelectProps) {
  const selectedValues = useMemo(() => toSelectValues(value), [value]);

  const setState = useCallback((next: OrderSourceSelectionState) => onChange(next), [onChange]);

  const onSelectionChange = useCallback(
    (e: CustomEvent<{ prevValues: Set<string>; values: Set<string> }>) => {
      handleOrderSourceSelectChange(e, setState);
    },
    [setState],
  );

  const selectionLabel = orderSourceTriggerLabel(value) || undefined;

  const allPosTerminalsSelected =
    POS_TERMINAL_OPTIONS.length > 0 &&
    POS_TERMINAL_OPTIONS.every((p) => value.posTerminals.has(p.id));

  /** Global “Select all”: indeterminate when some leaves are on but not the full set. */
  const selectAllIndeterminate =
    !isAllOrderSourcesSelected(value) &&
    (value.nonPos.size > 0 || value.posTerminals.size > 0);

  /** POS group row: indeterminate when some terminals are on but not all. */
  const posGroupIndeterminate =
    value.posTerminals.size > 0 && !allPosTerminalsSelected;

  const rootClassName = [className, 'order-source-multi'].filter(Boolean).join(' ');

  return (
    <MarketSelect
      className={rootClassName}
      label={fieldLabel}
      selectionMode="multiple"
      selectedValues={selectedValues}
      selectionLabel={selectionLabel}
      placeholder="Select order sources"
      onSelectionChange={onSelectionChange}
    >
      <MarketSelect.Option
        value={SELECT_ALL}
        title="Select all"
        {...({
          indeterminate: selectAllIndeterminate,
        } satisfies Record<string, unknown>)}
      />
      {ORDER_SOURCE_NON_POS_OPTIONS.map((o) => (
        <MarketSelect.Option key={o.value} value={o.value} title={o.title} />
      ))}
      <MarketSelect.Option
        value={POS_GROUP}
        title={POS_SOURCE_TITLE}
        secondarySideText={`Select all (${POS_TERMINAL_OPTIONS.length})`}
        className="order-source-multi__pos-header"
        {...({
          indeterminate: posGroupIndeterminate,
        } satisfies Record<string, unknown>)}
      />
      {POS_TERMINAL_OPTIONS.map((p) => (
        <MarketSelect.Option
          key={p.id}
          value={posKey(p.id)}
          title={p.title}
          className="order-source-multi__pos-child"
        />
      ))}
    </MarketSelect>
  );
}
