import { useState, type ReactNode } from 'react';
import { MarketFooter, MarketInput } from '@squareup/market-react';
import {
  MarketBulletListIcon,
  MarketChevronRightIcon,
  MarketChevronUpIcon,
  MarketClipboardIcon,
  MarketDualRotatingArrowsIcon,
  MarketHamburgerLinesIcon,
  MarketTagIcon,
  MarketServiceBellIcon,
} from '@squareup/market-react/icons';
import {
  MarketCard,
  MarketHeader,
  MarketList,
  MarketScrollArea,
  MarketText,
} from '@squareup/market-react/trial';
import './PosSettingsChrome.css';

export type PosTabId = 'menu' | 'orders' | 'transactions' | 'items' | 'more';

export type HardwareNavId =
  | 'network'
  | 'bluetooth'
  | 'general'
  | 'customer-display'
  | 'main-display'
  | 'sounds'
  | 'accessibility'
  | 'regulatory'
  | 'barcode-scanners'
  | 'cash-drawers'
  | 'printers'
  | 'local-connectivity';

type PosSettingsChromeProps = {
  children: ReactNode;
};

const HARDWARE_ITEMS: { id: HardwareNavId; title: string }[] = [
  { id: 'network', title: 'Network' },
  { id: 'bluetooth', title: 'Bluetooth' },
  { id: 'general', title: 'General' },
  { id: 'customer-display', title: 'Customer Display' },
  { id: 'main-display', title: 'Main Display' },
  { id: 'sounds', title: 'Sounds' },
  { id: 'accessibility', title: 'Accessibility' },
  { id: 'regulatory', title: 'Regulatory' },
  { id: 'barcode-scanners', title: 'Barcode Scanners' },
  { id: 'cash-drawers', title: 'Cash Drawers' },
  { id: 'printers', title: 'Printers' },
  { id: 'local-connectivity', title: 'Local Connectivity' },
];

function PosLogoutTab() {
  return (
    <div className="pos-tab-bar__logout">
      <button
        type="button"
        className="pos-tab pos-tab--logout"
        aria-label="Log out"
        onClick={() => undefined}
      >
        <span className="pos-tab__inner">
          <span className="pos-avatar" aria-hidden>
            <MarketText
              component="span"
              typeStyle="semibold-30"
              textColor="text-10"
              withMargin={false}
            >
              CB
            </MarketText>
          </span>
          <MarketText
            component="span"
            typeStyle="medium-30"
            textColor="text-10"
            withMargin={false}
          >
            Log out
          </MarketText>
        </span>
      </button>
    </div>
  );
}

function PosBottomTab({
  id,
  label,
  icon,
  selected,
  badge,
  onSelect,
}: {
  id: PosTabId;
  label: string;
  icon: ReactNode;
  selected: boolean;
  badge?: string;
  onSelect: (id: PosTabId) => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      aria-label={badge != null && badge !== '' ? `${label}, ${badge} unread` : label}
      aria-current={selected ? 'page' : undefined}
      className={`pos-tab${selected ? ' pos-tab--selected' : ''}`}
      onClick={() => onSelect(id)}
    >
      <span className="pos-tab__inner">
        <span className="pos-tab__icon-wrap">
          {icon}
          {badge != null && badge !== '' ? (
            <span className="pos-tab__badge" aria-label={`${badge} notifications`}>
              {badge}
            </span>
          ) : null}
        </span>
        <MarketText
          component="span"
          typeStyle="medium-30"
          textColor="text-10"
          withMargin={false}
        >
          {label}
        </MarketText>
      </span>
    </button>
  );
}

export function PosSettingsChrome({ children }: PosSettingsChromeProps) {
  const [selectedTab, setSelectedTab] = useState<PosTabId>('more');
  const [selectedHardware, setSelectedHardware] = useState<HardwareNavId>('printers');

  return (
    <div className="pos-chrome">
        <div className="pos-chrome__body">
          <aside className="pos-sidebar" aria-label="Settings">
            <div className="pos-sidebar__header">
              <MarketHeader
                title="Settings"
                contentWidth="fluid"
                className="pos-sidebar__page-header"
              />
              <MarketInput
                type="search"
                aria-label="Search"
                placeholder="Search"
                size="medium"
              />
            </div>

            <MarketScrollArea
              wrapperClassName="pos-sidebar__scroll-wrap"
              height="100%"
              showScrollIndicators
            >
              <div className="pos-sidebar__scroll-inner">
                <div className="pos-sidebar__location">
                  <MarketCard
                    className="pos-location-card"
                    mode="transient"
                    title="Restaurant"
                    secondaryText="Active on 3 devices"
                    leadingAccessory={<MarketServiceBellIcon size="medium" aria-hidden />}
                    trailingAccessory={<MarketChevronRightIcon size="small" aria-hidden />}
                    onClick={() => undefined}
                  />
                </div>
                <MarketList showDividers={false}>
                  <MarketList.Item title="Checkout" mode="transient" onClick={() => undefined} />
                  <MarketList.Item
                    title="Hardware"
                    mode="transient"
                    onClick={() => undefined}
                    trailingAccessory={<MarketChevronUpIcon size="small" aria-hidden />}
                  />
                </MarketList>
                <MarketList showDividers={false}>
                  {HARDWARE_ITEMS.map((item) => (
                    <MarketList.Item
                      key={item.id}
                      mode="transient"
                      title={item.title}
                      style={{ paddingLeft: '24px' }}
                      className={
                        selectedHardware === item.id ? 'pos-nav-item--selected' : undefined
                      }
                      onClick={() => setSelectedHardware(item.id)}
                    />
                  ))}
                </MarketList>
              </div>
            </MarketScrollArea>
          </aside>

          <main className="pos-main">{children}</main>
        </div>

        <MarketFooter className="pos-tab-bar">
          <div className="pos-tab-bar__inner">
            <PosLogoutTab />
            <div className="pos-tab-bar__tabs" role="tablist" aria-label="Main navigation">
              <PosBottomTab
                id="menu"
                label="Menu"
                selected={selectedTab === 'menu'}
                onSelect={setSelectedTab}
                icon={<MarketBulletListIcon size="medium" aria-hidden />}
              />
              <PosBottomTab
                id="orders"
                label="Orders"
                selected={selectedTab === 'orders'}
                onSelect={setSelectedTab}
                icon={<MarketClipboardIcon size="medium" aria-hidden />}
                badge="1"
              />
              <PosBottomTab
                id="transactions"
                label="Transactions"
                selected={selectedTab === 'transactions'}
                onSelect={setSelectedTab}
                icon={<MarketDualRotatingArrowsIcon size="medium" aria-hidden />}
              />
              <PosBottomTab
                id="items"
                label="Items"
                selected={selectedTab === 'items'}
                onSelect={setSelectedTab}
                icon={<MarketTagIcon size="medium" aria-hidden />}
              />
              <PosBottomTab
                id="more"
                label="More"
                selected={selectedTab === 'more'}
                onSelect={setSelectedTab}
                icon={<MarketHamburgerLinesIcon size="medium" aria-hidden />}
              />
            </div>
          </div>
        </MarketFooter>
      </div>
  );
}
