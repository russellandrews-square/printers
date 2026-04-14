import { MarketButton } from '@squareup/market-react';
import { MarketDropdown, MarketList } from '@squareup/market-react/trial';
import { ADD_RULE_CONTENT_OPTIONS, type AddRuleContentOptionId } from './addRuleContentOptions';

export type AddRuleContentDropdownProps = {
  className?: string;
  triggerClassName?: string;
  onPick: (id: AddRuleContentOptionId) => void;
};

export function AddRuleContentDropdown({
  className,
  triggerClassName,
  onPick,
}: AddRuleContentDropdownProps) {
  return (
    <div className={className}>
      <MarketDropdown placement="bottom">
        <MarketDropdown.Trigger>
          <MarketButton type="button" rank="secondary" className={triggerClassName}>
            Add content
          </MarketButton>
        </MarketDropdown.Trigger>
        <MarketDropdown.Content>
          <MarketList>
            {ADD_RULE_CONTENT_OPTIONS.map((opt) => (
              <MarketList.Item
                key={opt.id}
                mode="transient"
                title={opt.title}
                secondaryText={opt.description}
                onClick={() => onPick(opt.id)}
              />
            ))}
          </MarketList>
        </MarketDropdown.Content>
      </MarketDropdown>
    </div>
  );
}
