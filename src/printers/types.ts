export type PrinterStatus = 'online' | 'offline';

export type Printer = {
  id: string;
  name: string;
  status: PrinterStatus;
  /** When set, printers with the same label are grouped under one heading */
  group?: string;
  /** Model / device identifier shown in printer details */
  modelId?: string;
};

export type PrintingRuleType = 'kitchen_ticket' | 'customer_receipt';

/** One category’s item inclusion when using “Entire categories” content */
export type EntireCategoryRuleContent = {
  categoryId: string;
  includedItemIds: string[];
  autoIncludeNewItems: boolean;
};

export type PrintingRule = {
  id: string;
  name: string;
  ruleType: PrintingRuleType;
  /** Reserved for assigning rules to printers in a later flow */
  assignedPrinterIds?: string[];
  /** Selected fulfillment type labels (order matches user selection) */
  orderFulfillments?: string[];
  /** Selected order source labels */
  orderSources?: string[];
  /** Categories (and item subsets) included via “Entire categories” */
  entireCategoryContent?: EntireCategoryRuleContent[];
};
