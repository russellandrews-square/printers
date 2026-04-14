import { useMemo, useState, type KeyboardEvent } from 'react';
import { MarketButton, MarketPill } from '@squareup/market-react';
import { MarketTrashcanIcon } from '@squareup/market-react/icons';
import {
  MarketCard,
  MarketEmptyState,
  MarketGrid,
  MarketHeader,
  MarketPagingTabs,
  MarketText,
} from '@squareup/market-react/trial';
import { AddPrinterModal } from './AddPrinterModal';
import { AddPrinterUsbPickerModal } from './AddPrinterUsbPickerModal';
import { AddRuleModal } from './AddRuleModal';
import type { SquareAccessoryPrinterCatalogEntry } from './squareAccessoryPrinterCatalog';
import {
  catalogEntryFromSavedPrinter,
  DEFAULT_SQUARE_ACCESSORY_PRINTER,
} from './squareAccessoryPrinterCatalog';
import type { Printer, PrintingRule } from './types';
import { printRuleCardSummary } from './printingRuleSummary';
import './PrintersSettingsMain.css';

const TAB_PRINTERS = 'printers';
const TAB_PRINT_RULES = 'print_rules';

type AddPrinterPhase = 'idle' | 'usb_pick' | 'configure';

type PrinterSection =
  | { kind: 'ungrouped'; printers: Printer[] }
  | { kind: 'group'; groupName: string; printers: Printer[] };

/** Ungrouped printers first (no sub-header); then each named group with its own heading, A–Z. */
function buildPrinterSections(printers: Printer[]): PrinterSection[] {
  const map = new Map<string, Printer[]>();
  for (const p of printers) {
    const key = p.group ?? '';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }

  const ungrouped = map.get('') ?? [];
  map.delete('');

  const sections: PrinterSection[] = [];

  if (ungrouped.length > 0) {
    sections.push({
      kind: 'ungrouped',
      printers: [...ungrouped].sort((a, b) => a.name.localeCompare(b.name)),
    });
  }

  for (const name of [...map.keys()].sort((a, b) => a.localeCompare(b))) {
    const items = map.get(name)!;
    sections.push({
      kind: 'group',
      groupName: name,
      printers: [...items].sort((a, b) => a.name.localeCompare(b.name)),
    });
  }

  return sections;
}

function PrinterGridList({
  printers: sectionPrinters,
  onEditPrinter,
}: {
  printers: Printer[];
  onEditPrinter: (p: Printer) => void;
}) {
  return (
    <div className="printers-settings-main__printer-grid" role="list">
      {sectionPrinters.map((p) => (
        <div
          key={p.id}
          className="printers-settings-main__printer-grid-item"
          role="listitem"
        >
          <div
            role="button"
            tabIndex={0}
            className="printers-settings-main__printer-card"
            aria-label={`Edit printer ${p.name}`}
            onClick={() => onEditPrinter(p)}
            onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onEditPrinter(p);
              }
            }}
          >
            <div className="printers-settings-main__printer-card-image-wrap">
              {p.imageUrl ? (
                <img
                  className="printers-settings-main__printer-card-image"
                  src={p.imageUrl}
                  alt=""
                />
              ) : (
                <div
                  className="printers-settings-main__printer-card-image-placeholder"
                  aria-hidden
                />
              )}
            </div>
            <div className="printers-settings-main__printer-card-footer">
              <div className="printers-settings-main__printer-card-meta">
                <div className="printers-settings-main__printer-card-title-row">
                  <MarketText
                    component="span"
                    typeStyle="medium-30"
                    textColor="text-10"
                    withMargin={false}
                    className="printers-settings-main__printer-card-name"
                  >
                    {p.name}
                  </MarketText>
                  <MarketPill
                    className="printers-settings-main__printer-card-pill"
                    label={p.status === 'online' ? 'Online' : 'Offline'}
                    status={p.status === 'online' ? 'success' : 'normal'}
                    size="small"
                  />
                </div>
                {p.modelId ? (
                  <MarketText
                    component="span"
                    typeStyle="paragraph-20"
                    textColor="text-20"
                    withMargin={false}
                    className="printers-settings-main__printer-card-model"
                  >
                    {p.modelId}
                  </MarketText>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PrintersSettingsMain() {
  const [selectedTab, setSelectedTab] = useState(TAB_PRINTERS);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [printRules, setPrintRules] = useState<PrintingRule[]>([]);
  const [addPrinterPhase, setAddPrinterPhase] = useState<AddPrinterPhase>('idle');
  const [pendingCatalogEntry, setPendingCatalogEntry] =
    useState<SquareAccessoryPrinterCatalogEntry | null>(null);
  const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null);
  const [draftExcludedKitchenRuleIds, setDraftExcludedKitchenRuleIds] = useState<string[]>([]);
  const [draftExcludedReceiptRuleIds, setDraftExcludedReceiptRuleIds] = useState<string[]>([]);
  const [addPrintRuleModalOpen, setAddPrintRuleModalOpen] = useState(false);
  const [editingPrintRuleId, setEditingPrintRuleId] = useState<string | null>(null);
  const [addPrintRuleDefaultType, setAddPrintRuleDefaultType] = useState<
    PrintingRule['ruleType'] | undefined
  >(undefined);
  /** Stable id for a new printer while the configure modal is open (cleared when the flow closes). */
  const [draftNewPrinterId, setDraftNewPrinterId] = useState<string | null>(null);
  /** When the user creates a print rule before saving a new printer, the first save must use this id so it matches “Applied to”. */
  const [pendingPrinterIdForSave, setPendingPrinterIdForSave] = useState<string | null>(null);
  const [printRuleModalDefaultAppliedPrinterIds, setPrintRuleModalDefaultAppliedPrinterIds] = useState<
    string[]
  >([]);
  const [printRuleModalExtraPrinters, setPrintRuleModalExtraPrinters] = useState<Printer[]>([]);

  const openAddPrinter = () => setAddPrinterPhase('usb_pick');
  const closeAddPrinter = () => {
    setAddPrinterPhase('idle');
    setPendingCatalogEntry(null);
    setEditingPrinter(null);
    setDraftExcludedKitchenRuleIds([]);
    setDraftExcludedReceiptRuleIds([]);
    setDraftNewPrinterId(null);
  };
  const handleUsbPrinterSelected = (entry: SquareAccessoryPrinterCatalogEntry) => {
    setEditingPrinter(null);
    // New printer: treat every existing account rule as excluded so the modal starts empty;
    // rules created while configuring are not in this list and still show. Saved printers use
    // excluded* ids the same way.
    setDraftExcludedKitchenRuleIds(
      printRules.filter((r) => r.ruleType === 'kitchen_ticket').map((r) => r.id),
    );
    setDraftExcludedReceiptRuleIds(
      printRules.filter((r) => r.ruleType === 'customer_receipt').map((r) => r.id),
    );
    setPendingPrinterIdForSave(null);
    setDraftNewPrinterId(crypto.randomUUID());
    setPendingCatalogEntry(entry);
    setAddPrinterPhase('configure');
  };
  const openEditPrinter = (printer: Printer) => {
    setEditingPrinter(printer);
    setDraftExcludedKitchenRuleIds([]);
    setDraftExcludedReceiptRuleIds([]);
    setDraftNewPrinterId(null);
    setPendingCatalogEntry(catalogEntryFromSavedPrinter(printer));
    setAddPrinterPhase('configure');
  };

  const handleRemoveKitchenRuleFromPrinter = (ruleId: string) => {
    if (editingPrinter) {
      setPrinters((prev) =>
        prev.map((p) =>
          p.id !== editingPrinter.id
            ? p
            : {
                ...p,
                excludedKitchenRuleIds: [...new Set([...(p.excludedKitchenRuleIds ?? []), ruleId])],
              },
        ),
      );
    } else {
      setDraftExcludedKitchenRuleIds((prev) => (prev.includes(ruleId) ? prev : [...prev, ruleId]));
    }
  };

  const handleRemoveCustomerReceiptRuleFromPrinter = (ruleId: string) => {
    if (editingPrinter) {
      setPrinters((prev) =>
        prev.map((p) =>
          p.id !== editingPrinter.id
            ? p
            : {
                ...p,
                excludedCustomerReceiptRuleIds: [
                  ...new Set([...(p.excludedCustomerReceiptRuleIds ?? []), ruleId]),
                ],
              },
        ),
      );
    } else {
      setDraftExcludedReceiptRuleIds((prev) => (prev.includes(ruleId) ? prev : [...prev, ruleId]));
    }
  };
  const openAddPrintRule = () => {
    setPrintRuleModalDefaultAppliedPrinterIds([]);
    setPrintRuleModalExtraPrinters([]);
    setPendingPrinterIdForSave(null);
    setEditingPrintRuleId(null);
    setAddPrintRuleDefaultType(undefined);
    setAddPrintRuleModalOpen(true);
  };
  const closeAddPrintRule = () => {
    setAddPrintRuleModalOpen(false);
    setEditingPrintRuleId(null);
    setAddPrintRuleDefaultType(undefined);
    setPrintRuleModalDefaultAppliedPrinterIds([]);
    setPrintRuleModalExtraPrinters([]);
    setPendingPrinterIdForSave(null);
  };
  const openEditPrintRule = (printRuleId: string) => {
    closeAddPrinter();
    setPrintRuleModalDefaultAppliedPrinterIds([]);
    setPrintRuleModalExtraPrinters([]);
    setEditingPrintRuleId(printRuleId);
    setAddPrintRuleDefaultType(undefined);
    setAddPrintRuleModalOpen(true);
  };

  const handleDeletePrintRule = (printRuleId: string) => {
    setPrintRules((prev) => prev.filter((r) => r.id !== printRuleId));
    setPrinters((prev) =>
      prev.map((p) => {
        const nextKitchen = p.excludedKitchenRuleIds?.filter((id) => id !== printRuleId);
        const nextReceipt = p.excludedCustomerReceiptRuleIds?.filter((id) => id !== printRuleId);
        return {
          ...p,
          excludedKitchenRuleIds:
            nextKitchen && nextKitchen.length > 0 ? nextKitchen : undefined,
          excludedCustomerReceiptRuleIds:
            nextReceipt && nextReceipt.length > 0 ? nextReceipt : undefined,
        };
      }),
    );
    if (editingPrintRuleId === printRuleId) {
      closeAddPrintRule();
    }
  };

  const beginRuleCreationFromPrinter = (ruleType: PrintingRule['ruleType']) => {
    if (editingPrinter) {
      setPendingPrinterIdForSave(null);
      setPrintRuleModalDefaultAppliedPrinterIds([editingPrinter.id]);
      setPrintRuleModalExtraPrinters([]);
    } else if (draftNewPrinterId && pendingCatalogEntry) {
      setPrintRuleModalDefaultAppliedPrinterIds([draftNewPrinterId]);
      setPrintRuleModalExtraPrinters([
        {
          id: draftNewPrinterId,
          name: pendingCatalogEntry.catalogName,
          status: 'online',
          modelId: pendingCatalogEntry.modelId,
          imageUrl: pendingCatalogEntry.imageUrl,
        },
      ]);
    } else {
      setPendingPrinterIdForSave(null);
      setPrintRuleModalDefaultAppliedPrinterIds([]);
      setPrintRuleModalExtraPrinters([]);
    }
    setEditingPrintRuleId(null);
    setAddPrintRuleDefaultType(ruleType);
    setAddPrintRuleModalOpen(true);
  };

  const openKitchenRuleCreateFromPrinter = () => {
    beginRuleCreationFromPrinter('kitchen_ticket');
  };

  const openCustomerReceiptRuleCreateFromPrinter = () => {
    beginRuleCreationFromPrinter('customer_receipt');
  };

  const handleSavePrinter = (draft: Omit<Printer, 'id'>, existingPrinterId?: string) => {
    if (existingPrinterId) {
      setPendingPrinterIdForSave(null);
      setPrinters((prev) =>
        prev.map((p) =>
          p.id === existingPrinterId ? { ...p, ...draft, id: existingPrinterId } : p,
        ),
      );
    } else {
      const newId = pendingPrinterIdForSave ?? draftNewPrinterId ?? crypto.randomUUID();
      setPrinters((prev) => [
        ...prev,
        {
          ...draft,
          id: newId,
          excludedKitchenRuleIds:
            draftExcludedKitchenRuleIds.length > 0 ? [...draftExcludedKitchenRuleIds] : undefined,
          excludedCustomerReceiptRuleIds:
            draftExcludedReceiptRuleIds.length > 0 ? [...draftExcludedReceiptRuleIds] : undefined,
        },
      ]);
      setPendingPrinterIdForSave(null);
      setDraftNewPrinterId(null);
    }
  };

  const handleSavePrintRule = (draft: Omit<PrintingRule, 'id'>, existingPrintRuleId?: string) => {
    if (existingPrintRuleId) {
      setPrintRules((prev) =>
        prev.map((r) =>
          r.id === existingPrintRuleId ? { ...draft, id: existingPrintRuleId } : r,
        ),
      );
    } else {
      setPrintRules((prev) => [...prev, { ...draft, id: crypto.randomUUID() }]);
    }
  };

  const editingPrintRule = useMemo(
    () =>
      editingPrintRuleId
        ? printRules.find((r) => r.id === editingPrintRuleId) ?? null
        : null,
    [editingPrintRuleId, printRules],
  );

  const printersForAddPrintRuleModal = useMemo(() => {
    const merged = [...printers];
    for (const extra of printRuleModalExtraPrinters) {
      if (!merged.some((p) => p.id === extra.id)) {
        merged.push(extra);
      }
    }
    return merged;
  }, [printers, printRuleModalExtraPrinters]);

  const printerSections = useMemo(() => buildPrinterSections(printers), [printers]);

  const existingGroupNames = useMemo(
    () =>
      [...new Set(printers.map((p) => p.group).filter((g): g is string => Boolean(g)))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [printers],
  );

  const kitchenTicketPrintRules = useMemo(
    () =>
      printRules
        .filter((r) => r.ruleType === 'kitchen_ticket')
        .sort((a, b) => a.name.localeCompare(b.name)),
    [printRules],
  );

  const customerReceiptPrintRules = useMemo(
    () =>
      printRules
        .filter((r) => r.ruleType === 'customer_receipt')
        .sort((a, b) => a.name.localeCompare(b.name)),
    [printRules],
  );

  const excludedKitchenRuleIdsForPrinterModal = useMemo(() => {
    if (editingPrinter) {
      const live = printers.find((p) => p.id === editingPrinter.id);
      return new Set(live?.excludedKitchenRuleIds ?? editingPrinter.excludedKitchenRuleIds ?? []);
    }
    return new Set(draftExcludedKitchenRuleIds);
  }, [editingPrinter, printers, draftExcludedKitchenRuleIds]);

  const excludedReceiptRuleIdsForPrinterModal = useMemo(() => {
    if (editingPrinter) {
      const live = printers.find((p) => p.id === editingPrinter.id);
      return new Set(
        live?.excludedCustomerReceiptRuleIds ?? editingPrinter.excludedCustomerReceiptRuleIds ?? [],
      );
    }
    return new Set(draftExcludedReceiptRuleIds);
  }, [editingPrinter, printers, draftExcludedReceiptRuleIds]);

  const kitchenTicketPrintRulesForPrinterModal = useMemo(
    () =>
      kitchenTicketPrintRules.filter((r) => !excludedKitchenRuleIdsForPrinterModal.has(r.id)),
    [kitchenTicketPrintRules, excludedKitchenRuleIdsForPrinterModal],
  );

  const customerReceiptPrintRulesForPrinterModal = useMemo(
    () =>
      customerReceiptPrintRules.filter((r) => !excludedReceiptRuleIdsForPrinterModal.has(r.id)),
    [customerReceiptPrintRules, excludedReceiptRuleIdsForPrinterModal],
  );

  const kitchenPrintRulesAvailableToAdd = useMemo(
    () =>
      kitchenTicketPrintRules.filter((r) => excludedKitchenRuleIdsForPrinterModal.has(r.id)),
    [kitchenTicketPrintRules, excludedKitchenRuleIdsForPrinterModal],
  );

  const receiptPrintRulesAvailableToAdd = useMemo(
    () =>
      customerReceiptPrintRules.filter((r) => excludedReceiptRuleIdsForPrinterModal.has(r.id)),
    [customerReceiptPrintRules, excludedReceiptRuleIdsForPrinterModal],
  );

  const handleAddExistingKitchenRuleToPrinter = (ruleId: string) => {
    if (editingPrinter) {
      setPrinters((prev) =>
        prev.map((p) => {
          if (p.id !== editingPrinter.id) return p;
          const next = (p.excludedKitchenRuleIds ?? []).filter((id) => id !== ruleId);
          return {
            ...p,
            excludedKitchenRuleIds: next.length > 0 ? next : undefined,
          };
        }),
      );
    } else {
      setDraftExcludedKitchenRuleIds((prev) => prev.filter((id) => id !== ruleId));
    }
  };

  const handleAddExistingReceiptRuleToPrinter = (ruleId: string) => {
    if (editingPrinter) {
      setPrinters((prev) =>
        prev.map((p) => {
          if (p.id !== editingPrinter.id) return p;
          const next = (p.excludedCustomerReceiptRuleIds ?? []).filter((id) => id !== ruleId);
          return {
            ...p,
            excludedCustomerReceiptRuleIds: next.length > 0 ? next : undefined,
          };
        }),
      );
    } else {
      setDraftExcludedReceiptRuleIds((prev) => prev.filter((id) => id !== ruleId));
    }
  };

  const headerTitle = selectedTab === TAB_PRINTERS ? 'Printers' : 'Print rules';

  const addAction = (
    <MarketButton
      rank="primary"
      type="button"
      onClick={() => {
        if (selectedTab === TAB_PRINTERS) openAddPrinter();
        else openAddPrintRule();
      }}
    >
      {selectedTab === TAB_PRINTERS ? 'Add printer' : 'Add print rule'}
    </MarketButton>
  );

  return (
    <>
      <MarketHeader
        compact
        size="large"
        title={headerTitle}
        contentWidth="fluid"
        trailingActions={addAction}
      />

      <MarketPagingTabs
        selectedTab={selectedTab}
        onSelectedTabChange={(detail) => setSelectedTab(detail.value)}
      >
        <MarketPagingTabs.TabList className="printers-settings-main__tabs">
          <MarketPagingTabs.Tab id={TAB_PRINTERS}>Printers</MarketPagingTabs.Tab>
          <MarketPagingTabs.Tab id={TAB_PRINT_RULES}>Print rules</MarketPagingTabs.Tab>
        </MarketPagingTabs.TabList>

        <MarketPagingTabs.TabPanel
          aria-labelledby={TAB_PRINTERS}
          className="printers-settings-main__printers-tab-panel"
        >
          {printers.length === 0 ? (
            <div className="printers-settings-main__empty">
              <MarketEmptyState
                borderless
                primaryText="No printers to show"
                actions={
                  <MarketButton rank="primary" type="button" onClick={openAddPrinter}>
                    Add printer
                  </MarketButton>
                }
              />
            </div>
          ) : (
            <>
              {printerSections.map((section, sectionIndex) =>
                section.kind === 'ungrouped' ? (
                  <div key="__ungrouped" className="printers-settings-main__section">
                    <PrinterGridList printers={section.printers} onEditPrinter={openEditPrinter} />
                  </div>
                ) : (
                  <section
                    key={section.groupName}
                    className="printers-settings-main__section"
                    aria-labelledby={`printer-group-heading-${sectionIndex}`}
                  >
                    <MarketText
                      id={`printer-group-heading-${sectionIndex}`}
                      className="printers-settings-main__section-heading"
                      component="h2"
                      typeStyle="heading-20"
                      textColor="text-10"
                      withMargin={false}
                    >
                      {section.groupName}
                    </MarketText>
                    <PrinterGridList printers={section.printers} onEditPrinter={openEditPrinter} />
                  </section>
                ),
              )}
            </>
          )}
        </MarketPagingTabs.TabPanel>

        <MarketPagingTabs.TabPanel
          aria-labelledby={TAB_PRINT_RULES}
          className="printers-settings-main__print-rules-tab-panel"
        >
          {printRules.length === 0 ? (
            <div className="printers-settings-main__empty">
              <MarketEmptyState
                borderless
                primaryText="No print rules to show"
                secondaryText="Create print rules to control what prints on each printer."
                actions={
                  <MarketButton rank="primary" type="button" onClick={openAddPrintRule}>
                    Add print rule
                  </MarketButton>
                }
              />
            </div>
          ) : (
            <div className="printers-settings-main__print-rules-list">
              <MarketGrid
                columns={{ narrow: 1, medium: 1, wide: 1, extraWide: 1 }}
                gap={200}
              >
                {printRules.map((printRule) => (
                  <MarketGrid.Item key={printRule.id}>
                    <MarketCard
                      mode="transient"
                      title={printRule.name}
                      secondaryText={printRuleCardSummary(printRule)}
                      onClick={() => openEditPrintRule(printRule.id)}
                      trailingAccessory={
                        <div
                          className="printers-settings-main__print-rule-card-trailing"
                          onClick={(ev) => ev.stopPropagation()}
                          onMouseDown={(ev) => ev.stopPropagation()}
                        >
                          <MarketButton
                            type="button"
                            rank="tertiary"
                            destructive
                            aria-label={`Delete print rule ${printRule.name}`}
                            icon={<MarketTrashcanIcon aria-hidden />}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeletePrintRule(printRule.id);
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
        </MarketPagingTabs.TabPanel>
      </MarketPagingTabs>

      <AddPrinterUsbPickerModal
        open={addPrinterPhase === 'usb_pick'}
        onClose={closeAddPrinter}
        onSelect={handleUsbPrinterSelected}
      />

      <AddPrinterModal
        open={addPrinterPhase === 'configure'}
        onClose={closeAddPrinter}
        catalogEntry={pendingCatalogEntry ?? DEFAULT_SQUARE_ACCESSORY_PRINTER}
        initialPrinter={editingPrinter}
        onSave={handleSavePrinter}
        existingGroupNames={existingGroupNames}
        kitchenTicketPrintRules={kitchenTicketPrintRulesForPrinterModal}
        availableKitchenPrintRulesToAdd={kitchenPrintRulesAvailableToAdd}
        onCreateKitchenRule={openKitchenRuleCreateFromPrinter}
        onEditKitchenRule={openEditPrintRule}
        onRemoveKitchenRuleFromPrinter={handleRemoveKitchenRuleFromPrinter}
        onAddExistingKitchenRuleToPrinter={handleAddExistingKitchenRuleToPrinter}
        customerReceiptPrintRules={customerReceiptPrintRulesForPrinterModal}
        availableReceiptPrintRulesToAdd={receiptPrintRulesAvailableToAdd}
        onCreateCustomerReceiptRule={openCustomerReceiptRuleCreateFromPrinter}
        onEditCustomerReceiptRule={openEditPrintRule}
        onRemoveCustomerReceiptRuleFromPrinter={handleRemoveCustomerReceiptRuleFromPrinter}
        onAddExistingReceiptRuleToPrinter={handleAddExistingReceiptRuleToPrinter}
        stackedPrintRuleModalOpen={addPrintRuleModalOpen}
      />

      <AddRuleModal
        open={addPrintRuleModalOpen}
        onClose={closeAddPrintRule}
        onSave={handleSavePrintRule}
        initialRule={editingPrintRule}
        defaultRuleType={addPrintRuleDefaultType}
        printers={printersForAddPrintRuleModal}
        defaultAppliedPrinterIds={printRuleModalDefaultAppliedPrinterIds}
        onConnectPrinter={openAddPrinter}
      />
    </>
  );
}
