export interface CategoryMapping {
  [key: string]: string;
}

// Category mappings for each user type
export const categoryMappings: Record<string, CategoryMapping> = {
  'Heavy Spender': {
    'entertainment': 'Entertainment',
    'Entertainment': 'Entertainment',
    'food': 'Dining',
    'Food & Dining': 'Dining',
    'Dining': 'Dining',
    'groceries': 'Groceries',
    'Groceries': 'Groceries',
    'shopping': 'Shopping',
    'Shopping': 'Shopping',
    'transport': 'Transport',
    'Transportation': 'Transport',
    'Transport': 'Transport'
  },
  'Medium Spender': {
    'food': 'Food & Dining',
    'Food': 'Food & Dining',
    'Food & Dining': 'Food & Dining',
    'dining': 'Food & Dining',
    'Dining': 'Food & Dining',
    'groceries': 'Groceries',
    'Groceries': 'Groceries',
    'savings': 'Savings',
    'Savings': 'Savings',
    'shopping': 'Shopping',
    'Shopping': 'Shopping',
    'transport': 'Transport',
    'Transportation': 'Transport',
    'Transport': 'Transport'
  },
  'Max Saver': {
    'transport': 'Transport',
    'Transportation': 'Transport',
    'Transport': 'Transport',
    'groceries': 'Groceries',
    'Groceries': 'Groceries',
    'travel': 'Travel',
    'Travel': 'Travel',
    'utilities': 'Utilities',
    'Utilities': 'Utilities',
    'savings': 'Savings',
    'Savings': 'Savings'
  }
};

export const normalizeCategory = (originalCategory: string, userType: string): string => {
  const mapping = categoryMappings[userType];
  if (!mapping) {
    return originalCategory; // Return original if no mapping found
  }
  
  return mapping[originalCategory] || originalCategory;
};

export const getValidCategoriesForUser = (userType: string): string[] => {
  const mapping = categoryMappings[userType];
  if (!mapping) {
    return [];
  }
  
  // Get unique normalized categories
  const categories = new Set(Object.values(mapping));
  return Array.from(categories);
}; 