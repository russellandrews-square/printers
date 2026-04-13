import { MarketCard, MarketModal } from '@squareup/market-react/trial';
import { MarketChevronRightIcon } from '@squareup/market-react/icons';
import { useViewTransitionVisibility } from './useViewTransitionVisibility';
import './AddRuleContentModal.css';

export const ADD_RULE_CONTENT_OPTIONS = [
  {
    id: 'entire-categories',
    title: 'Entire categories',
    description: 'You can exclude certain items and opt out of future additions.',
  },
  {
    id: 'specific-items',
    title: 'Specific items',
    description: 'Choose certain items despite its category.',
  },
  {
    id: 'modifier-groups',
    title: 'Modifier groups',
    description: 'Include items with specific modifiers.',
  },
] as const;

export type AddRuleContentOptionId = (typeof ADD_RULE_CONTENT_OPTIONS)[number]['id'];

export type AddRuleContentModalProps = {
  open: boolean;
  onClose: () => void;
  onOpenEntireCategories?: () => void;
};

export function AddRuleContentModal({ open, onClose, onOpenEntireCategories }: AddRuleContentModalProps) {
  const modalShown = useViewTransitionVisibility(open);

  if (!modalShown) {
    return null;
  }

  return (
    <MarketModal type="partial" zIndex={1100} onClose={onClose}>
      <MarketModal.Header
        contentWidth="regular"
        title="New content"
        leadingActions={<MarketModal.CloseButton type="button" onClick={onClose} />}
      />
      <MarketModal.Content>
        <div className="add-rule-content-modal__options">
          {ADD_RULE_CONTENT_OPTIONS.map((opt) => (
            <MarketCard
              key={opt.id}
              mode="transient"
              title={opt.title}
              secondaryText={opt.description}
              trailingAccessory={<MarketChevronRightIcon size="small" aria-hidden />}
              onClick={() => {
                if (opt.id === 'entire-categories') {
                  onOpenEntireCategories?.();
                }
              }}
            />
          ))}
        </div>
      </MarketModal.Content>
    </MarketModal>
  );
}
