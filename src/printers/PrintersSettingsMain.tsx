import { useMemo, useState } from 'react';
import { MarketButton } from '@squareup/market-react';
import {
  MarketCard,
  MarketEmptyState,
  MarketGrid,
  MarketHeader,
  MarketPagingTabs,
  MarketTable,
  MarketText,
} from '@squareup/market-react/trial';
import { AddPrinterModal } from './AddPrinterModal';
import { AddRuleModal } from './AddRuleModal';
import type { Printer, PrintingRule } from './types';
import './PrintersSettingsMain.css';

const TAB_PRINTERS = 'printers';
const TAB_RULES = 'rules';

function ruleTypeLabel(ruleType: PrintingRule['ruleType']): string {
  switch (ruleType) {
    case 'kitchen_ticket':
      return 'Kitchen ticket';
    case 'customer_receipt':
      return 'Customer receipt';
    default:
      return ruleType;
  }
}

function groupPrinters(printers: Printer[]): { sectionTitle: string; printers: Printer[] }[] {
  const map = new Map<string, Printer[]>();
  for (const p of printers) {
    const key = p.group ?? '';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  return [...map.entries()]
    .map(([key, items]) => ({
      sectionTitle: key === '' ? 'Printers' : key,
      printers: [...items].sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.sectionTitle.localeCompare(b.sectionTitle));
}

export function PrintersSettingsMain() {
  const [selectedTab, setSelectedTab] = useState(TAB_PRINTERS);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [rules, setRules] = useState<PrintingRule[]>([]);
  const [addPrinterOpen, setAddPrinterOpen] = useState(false);
  const [addRuleOpen, setAddRuleOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  const openAddPrinter = () => setAddPrinterOpen(true);
  const closeAddPrinter = () => setAddPrinterOpen(false);
  const openAddRule = () => {
    setEditingRuleId(null);
    setAddRuleOpen(true);
  };
  const closeAddRule = () => {
    setAddRuleOpen(false);
    setEditingRuleId(null);
  };
  const openEditRule = (ruleId: string) => {
    setEditingRuleId(ruleId);
    setAddRuleOpen(true);
  };

  const handleSaveNewPrinter = (draft: Omit<Printer, 'id'>) => {
    setPrinters((prev) => [...prev, { ...draft, id: crypto.randomUUID() }]);
  };

  const handleSaveRule = (draft: Omit<PrintingRule, 'id'>, existingRuleId?: string) => {
    if (existingRuleId) {
      setRules((prev) =>
        prev.map((r) => (r.id === existingRuleId ? { ...draft, id: existingRuleId } : r)),
      );
    } else {
      setRules((prev) => [...prev, { ...draft, id: crypto.randomUUID() }]);
    }
  };

  const editingRule = useMemo(
    () => (editingRuleId ? rules.find((r) => r.id === editingRuleId) ?? null : null),
    [editingRuleId, rules],
  );

  const groupedPrinters = useMemo(() => groupPrinters(printers), [printers]);

  const headerTitle = selectedTab === TAB_PRINTERS ? 'Printers' : 'Rules';

  const addAction = (
    <MarketButton
      rank="primary"
      type="button"
      onClick={() => {
        if (selectedTab === TAB_PRINTERS) openAddPrinter();
        else openAddRule();
      }}
    >
      {selectedTab === TAB_PRINTERS ? 'Add printer' : 'Add rule'}
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
          <MarketPagingTabs.Tab id={TAB_RULES}>Rules</MarketPagingTabs.Tab>
        </MarketPagingTabs.TabList>

        <MarketPagingTabs.TabPanel aria-labelledby={TAB_PRINTERS}>
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
              {groupedPrinters.map(({ sectionTitle, printers: sectionPrinters }) => (
                <section key={sectionTitle} className="printers-settings-main__section">
                  <MarketText
                    className="printers-settings-main__section-heading"
                    component="h2"
                    typeStyle="heading-20"
                    textColor="text-10"
                    withMargin={false}
                  >
                    {sectionTitle}
                  </MarketText>
                  <MarketGrid
                    columns={{ narrow: 1, medium: 2, wide: 3, extraWide: 4 }}
                    gap={300}
                  >
                    {sectionPrinters.map((p) => (
                      <MarketGrid.Item key={p.id}>
                        <MarketCard
                          mode="transient"
                          title={p.name}
                          secondaryText={p.modelId}
                          trailingAccessory={
                            <MarketText
                              component="span"
                              typeStyle="semibold-10"
                              textColor={
                                p.status === 'online' ? 'success-text' : 'text-30'
                              }
                              withMargin={false}
                            >
                              {p.status === 'online' ? 'Online' : 'Offline'}
                            </MarketText>
                          }
                          onClick={() => undefined}
                        />
                      </MarketGrid.Item>
                    ))}
                  </MarketGrid>
                </section>
              ))}
            </>
          )}
        </MarketPagingTabs.TabPanel>

        <MarketPagingTabs.TabPanel aria-labelledby={TAB_RULES}>
          {rules.length === 0 ? (
            <div className="printers-settings-main__empty">
              <MarketEmptyState
                borderless
                primaryText="No rules to show"
                actions={
                  <MarketButton rank="primary" type="button" onClick={openAddRule}>
                    Add rule
                  </MarketButton>
                }
              />
            </div>
          ) : (
            <MarketTable>
              <MarketTable.Head>
                <MarketTable.Row>
                  <MarketTable.Cell component="th">Name</MarketTable.Cell>
                  <MarketTable.Cell component="th">Type</MarketTable.Cell>
                </MarketTable.Row>
              </MarketTable.Head>
              <MarketTable.Body>
                {rules.map((r) => (
                  <MarketTable.Row
                    key={r.id}
                    className="printers-settings-main__rules-row"
                    aria-label={`Edit rule ${r.name}`}
                    tabIndex={0}
                    onClick={() => openEditRule(r.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openEditRule(r.id);
                      }
                    }}
                  >
                    <MarketTable.Cell>{r.name}</MarketTable.Cell>
                    <MarketTable.Cell>{ruleTypeLabel(r.ruleType)}</MarketTable.Cell>
                  </MarketTable.Row>
                ))}
              </MarketTable.Body>
            </MarketTable>
          )}
        </MarketPagingTabs.TabPanel>
      </MarketPagingTabs>

      <AddPrinterModal
        open={addPrinterOpen}
        onClose={closeAddPrinter}
        onSave={handleSaveNewPrinter}
      />

      <AddRuleModal
        open={addRuleOpen}
        onClose={closeAddRule}
        onSave={handleSaveRule}
        initialRule={editingRule}
      />
    </>
  );
}
