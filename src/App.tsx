import { MarketTheme } from '@squareup/market-react';
import { MarketText } from '@squareup/market-react/trial';
import { PosSettingsChrome } from './layout/PosSettingsChrome';
import './App.css';

export default function App() {
  return (
    <MarketTheme theme="monochrome" mode="light">
      <PosSettingsChrome>
        <div className="pos-main-placeholder">
          <MarketText
            component="p"
            typeStyle="paragraph-30"
            textColor="text-10"
            withMargin={false}
            style={{ margin: 0 }}
          >
            Printer management content will go here.
          </MarketText>
        </div>
      </PosSettingsChrome>
    </MarketTheme>
  );
}
