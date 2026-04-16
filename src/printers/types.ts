export type PrinterStatus = 'online' | 'offline';

export type Printer = {
  id: string;
  name: string;
  status: PrinterStatus;
  /** When set, printers with the same label are grouped under one heading */
  group?: string;
  /** Model / device identifier shown in printer details */
  modelId?: string;
  /** Optional hero / list thumbnail (e.g. from hardware catalog) */
  imageUrl?: string;
  /** Print rule IDs hidden on this printer’s Add/Edit modal only; print rules stay in the account list */
  excludedKitchenRuleIds?: string[];
  excludedCustomerReceiptRuleIds?: string[];
};

/** Discriminator: ticket print rules (`kitchen_ticket`) vs receipt print rules (`customer_receipt`). */
export type PrintingRuleType = 'kitchen_ticket' | 'customer_receipt';

/** One category’s item inclusion when using “Entire categories” content */
export type EntireCategoryRuleContent = {
  categoryId: string;
  includedItemIds: string[];
  autoIncludeNewItems: boolean;
};

/** One modifier group’s option inclusion when using “Modifier groups” content */
export type ModifierGroupRuleContent = {
  modifierGroupId: string;
  includedOptionIds: string[];
};

export type PrintingRule = {
  id: string;
  name: string;
  ruleType: PrintingRuleType;
  /** Reserved for assigning print rules to printers in a later flow */
  assignedPrinterIds?: string[];
  /** Selected fulfillment type labels (order matches user selection) */
  orderFulfillments?: string[];
  /** Selected order source labels (non-POS channels plus `"POS"` when any POS terminal applies). */
  orderSources?: string[];
  /**
   * When the rule includes POS, optional list of which POS terminals apply.
   * Omitted or empty with `"POS"` in `orderSources` means all terminals (legacy default).
   */
  orderSourcePosTerminalIds?: string[];
  /** Categories (and item subsets) included via “Entire categories” */
  entireCategoryContent?: EntireCategoryRuleContent[];
  /** Item ids included via “Specific items” (kitchen ticket only) */
  specificItemIds?: string[];
  /** Modifier groups (and selected options) included via “Modifier groups” */
  modifierGroupContent?: ModifierGroupRuleContent[];
};
