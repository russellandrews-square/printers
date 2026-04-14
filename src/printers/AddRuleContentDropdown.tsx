import { useState } from 'react';
import { MarketButton } from '@squareup/market-react';
import { MarketDropdown, MarketList } from '@squareup/market-react/trial';
import { ADD_RULE_CONTENT_OPTIONS, type AddRuleContentOptionId } from './addRuleContentOptions';

/**
 * Above AddRuleModal (1150), below EntireCategoriesPicker (1200) so the categories sheet stacks on top.
 */
const ADD_CONTENT_DROPDOWN_Z_INDEX = 1175;

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
  const [open, setOpen] = useState(false);

  return (
    <div className={className}>
      <MarketDropdown
        placement="bottom"
        strategy="fixed"
        open={open}
        onOpenChange={setOpen}
      >
        <MarketDropdown.Trigger>
          <MarketButton type="button" rank="secondary" className={triggerClassName}>
            Add content
          </MarketButton>
        </MarketDropdown.Trigger>
        <MarketDropdown.Content style={{ zIndex: ADD_CONTENT_DROPDOWN_Z_INDEX }}>
          <MarketList>
            {ADD_RULE_CONTENT_OPTIONS.map((opt) => (
              <MarketList.Item
                key={opt.id}
                mode="transient"
                title={opt.title}
                secondaryText={opt.description}
                onClick={() => {
                  onPick(opt.id);
                  setOpen(false);
                }}
              />
            ))}
          </MarketList>
        </MarketDropdown.Content>
      </MarketDropdown>
    </div>
  );
}
