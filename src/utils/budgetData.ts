export interface BudgetCategory {
  category: string;
  amount: number;
  budgetCap: number;
}

export interface PersonaBudget {
  persona: string;
  categories: BudgetCategory[];
}

export const budgetData: Record<string, PersonaBudget> = {
  'Heavy Spender': {
    persona: 'Heavy Spender',
    categories: [
      { category: 'Entertainment', amount: 0, budgetCap: 12000 },
      { category: 'Food & Dining', amount: 0, budgetCap: 10000 },  // Changed from 'Dining' to 'Food & Dining'
      { category: 'Groceries', amount: 0, budgetCap: 12000 },
      { category: 'Shopping', amount: 0, budgetCap: 15000 },
      { category: 'Transport', amount: 0, budgetCap: 4000 }
    ]
  },
  'Medium Spender': {
    persona: 'Medium Spender',
    categories: [
      { category: 'Food & Dining', amount: 0, budgetCap: 6000 },  // Changed from 'Food' to 'Food & Dining'
      { category: 'Groceries', amount: 0, budgetCap: 7000 },
      { category: 'Savings', amount: 0, budgetCap: 20000 },
      { category: 'Shopping', amount: 0, budgetCap: 12000 },
      { category: 'Transport', amount: 0, budgetCap: 5000 }
    ]
  },
  'Max Saver': {
    persona: 'Max Saver',
    categories: [
      { category: 'Transport', amount: 0, budgetCap: 5000 },
      { category: 'Groceries', amount: 0, budgetCap: 6000 },
      { category: 'Travel', amount: 0, budgetCap: 4000 },
      { category: 'Utilities', amount: 0, budgetCap: 7000 },
      { category: 'Savings', amount: 0, budgetCap: 25000 }
    ]
  }
};

export const getBudgetForPersona = (persona: string): PersonaBudget | null => {
  return budgetData[persona] || null;
};

export const getDefaultEMI = (persona: string): number => {
  const emiMap = {
    'Heavy Spender': 45000,
    'Medium Spender': 20000,
    'Max Saver': 12000
  };
  return emiMap[persona as keyof typeof emiMap] || 20000;
};

export const getDefaultSalary = (): number => {
  return 100000; // Default for all personas
}; 