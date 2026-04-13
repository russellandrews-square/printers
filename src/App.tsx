import { MarketTheme } from '@squareup/market-react';
import { PosSettingsChrome } from './layout/PosSettingsChrome';
import { PrintersSettingsMain } from './printers/PrintersSettingsMain';
import './App.css';

export default function App() {
  return (
    <MarketTheme theme="monochrome" mode="light">
      <PosSettingsChrome>
        <PrintersSettingsMain />
      </PosSettingsChrome>
    </MarketTheme>
  );
}
