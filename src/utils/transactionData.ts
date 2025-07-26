import { ITransaction } from '../models/Transaction';

export interface TransactionData {
  userType: string;
  date: string;
  merchant: string;
  amount: number;
  category: string;
  paymentMode: string;
}

// Heavy Spender Transactions (25 transactions)
export const heavySpenderTransactions: TransactionData[] = [
  { userType: "Heavy Spender", date: "22/01/25 10:30", merchant: "Spotify", amount: 732, category: "entertainment", paymentMode: "NetBanking" },
  { userType: "Heavy Spender", date: "22/01/25 14:15", merchant: "Nykaa", amount: 2413, category: "personal care", paymentMode: "Card" },
  { userType: "Heavy Spender", date: "22/01/25 18:45", merchant: "Inox", amount: 1458, category: "entertainment", paymentMode: "UPI" },
  { userType: "Heavy Spender", date: "21/01/25 12:30", merchant: "Myntra", amount: 2421, category: "shopping", paymentMode: "NetBanking" },
  { userType: "Heavy Spender", date: "21/01/25 16:20", merchant: "BigBasket", amount: 1824, category: "groceries", paymentMode: "Card" },
  { userType: "Heavy Spender", date: "21/01/25 20:10", merchant: "Blinkit", amount: 892, category: "groceries", paymentMode: "UPI" },
  { userType: "Heavy Spender", date: "20/01/25 13:15", merchant: "Zomato", amount: 1567, category: "food", paymentMode: "NetBanking" },
  { userType: "Heavy Spender", date: "20/01/25 19:30", merchant: "Domino's", amount: 945, category: "food", paymentMode: "Card" },
  { userType: "Heavy Spender", date: "20/01/25 21:45", merchant: "Uber", amount: 678, category: "transport", paymentMode: "UPI" },
  { userType: "Heavy Spender", date: "19/01/25 11:40", merchant: "Amazon", amount: 3245, category: "shopping", paymentMode: "NetBanking" },
  { userType: "Heavy Spender", date: "19/01/25 15:30", merchant: "Netflix", amount: 599, category: "entertainment", paymentMode: "Card" },
  { userType: "Heavy Spender", date: "19/01/25 20:15", merchant: "Swiggy", amount: 1234, category: "food", paymentMode: "UPI" },
  { userType: "Heavy Spender", date: "18/01/25 10:15", merchant: "Croma", amount: 2876, category: "shopping", paymentMode: "NetBanking" },
  { userType: "Heavy Spender", date: "18/01/25 14:30", merchant: "Pizza Hut", amount: 876, category: "food", paymentMode: "Card" },
  { userType: "Heavy Spender", date: "18/01/25 17:45", merchant: "Ola", amount: 543, category: "transport", paymentMode: "UPI" },
  { userType: "Heavy Spender", date: "17/01/25 12:20", merchant: "Flipkart", amount: 3821, category: "shopping", paymentMode: "NetBanking" },
  { userType: "Heavy Spender", date: "17/01/25 18:30", merchant: "KFC", amount: 654, category: "food", paymentMode: "Card" },
  { userType: "Heavy Spender", date: "17/01/25 21:15", merchant: "Reliance Digital", amount: 2156, category: "shopping", paymentMode: "UPI" },
  { userType: "Heavy Spender", date: "16/01/25 13:40", merchant: "McDonald's", amount: 432, category: "food", paymentMode: "NetBanking" },
  { userType: "Heavy Spender", date: "16/01/25 16:25", merchant: "Shoppers Stop", amount: 3456, category: "shopping", paymentMode: "Card" },
  { userType: "Heavy Spender", date: "16/01/25 19:45", merchant: "Dunzo", amount: 789, category: "groceries", paymentMode: "UPI" },
  { userType: "Heavy Spender", date: "16/01/25 11:20", merchant: "BookMyShow", amount: 567, category: "entertainment", paymentMode: "NetBanking" },
  { userType: "Heavy Spender", date: "16/01/25 13:30", merchant: "Lenskart", amount: 1890, category: "personal care", paymentMode: "Card" },
  { userType: "Heavy Spender", date: "16/01/25 15:50", merchant: "Urban Company", amount: 1234, category: "personal care", paymentMode: "UPI" },
  { userType: "Heavy Spender", date: "16/01/25 20:10", merchant: "Cult.fit", amount: 999, category: "personal care", paymentMode: "NetBanking" }
];

// Medium Spender Transactions (28 transactions)
export const mediumSpenderTransactions: TransactionData[] = [
  { userType: "Medium Spender", date: "22/01/25 09:55", merchant: "IRCTC", amount: 391, category: "travel", paymentMode: "Card" },
  { userType: "Medium Spender", date: "22/01/25 13:27", merchant: "Paytm Wallet", amount: 2413, category: "savings", paymentMode: "NetBanking" },
  { userType: "Medium Spender", date: "22/01/25 17:04", merchant: "Google Pay", amount: 2015, category: "utilities", paymentMode: "UPI" },
  { userType: "Medium Spender", date: "21/01/25 11:06", merchant: "PhonePe Wallet", amount: 2421, category: "savings", paymentMode: "UPI" },
  { userType: "Medium Spender", date: "21/01/25 15:38", merchant: "IRCTC", amount: 1824, category: "travel", paymentMode: "Card" },
  { userType: "Medium Spender", date: "21/01/25 18:45", merchant: "Uber", amount: 456, category: "transport", paymentMode: "UPI" },
  { userType: "Medium Spender", date: "20/01/25 12:30", merchant: "Amazon", amount: 1234, category: "shopping", paymentMode: "NetBanking" },
  { userType: "Medium Spender", date: "20/01/25 16:20", merchant: "Local Kirana", amount: 567, category: "groceries", paymentMode: "Cash" },
  { userType: "Medium Spender", date: "20/01/25 19:15", merchant: "RedBus", amount: 789, category: "travel", paymentMode: "Card" },
  { userType: "Medium Spender", date: "19/01/25 10:40", merchant: "Swiggy", amount: 345, category: "food", paymentMode: "UPI" },
  { userType: "Medium Spender", date: "19/01/25 14:30", merchant: "Phone Recharge", amount: 199, category: "utilities", paymentMode: "NetBanking" },
  { userType: "Medium Spender", date: "19/01/25 17:45", merchant: "Myntra", amount: 876, category: "shopping", paymentMode: "Card" },
  { userType: "Medium Spender", date: "18/01/25 11:15", merchant: "Zomato", amount: 432, category: "food", paymentMode: "UPI" },
  { userType: "Medium Spender", date: "18/01/25 15:30", merchant: "Metro Card", amount: 100, category: "transport", paymentMode: "Cash" },
  { userType: "Medium Spender", date: "18/01/25 18:45", merchant: "Electricity Bill", amount: 567, category: "utilities", paymentMode: "NetBanking" },
  { userType: "Medium Spender", date: "17/01/25 12:20", merchant: "Flipkart", amount: 1234, category: "shopping", paymentMode: "Card" },
  { userType: "Medium Spender", date: "17/01/25 16:30", merchant: "Local Restaurant", amount: 345, category: "food", paymentMode: "UPI" },
  { userType: "Medium Spender", date: "17/01/25 19:15", merchant: "Savings Transfer", amount: 2000, category: "savings", paymentMode: "NetBanking" },
  { userType: "Medium Spender", date: "16/01/25 10:40", merchant: "Gas Bill", amount: 234, category: "utilities", paymentMode: "UPI" },
  { userType: "Medium Spender", date: "16/01/25 14:25", merchant: "Ola", amount: 123, category: "transport", paymentMode: "Card" },
  { userType: "Medium Spender", date: "16/01/25 17:45", merchant: "Local Market", amount: 456, category: "groceries", paymentMode: "Cash" },
  { userType: "Medium Spender", date: "16/01/25 20:20", merchant: "Netflix", amount: 499, category: "entertainment", paymentMode: "NetBanking" },
  { userType: "Medium Spender", date: "16/01/25 11:30", merchant: "Water Bill", amount: 89, category: "utilities", paymentMode: "UPI" },
  { userType: "Medium Spender", date: "16/01/25 15:50", merchant: "BookMyShow", amount: 299, category: "entertainment", paymentMode: "Card" },
  { userType: "Medium Spender", date: "16/01/25 18:10", merchant: "Local Pharmacy", amount: 234, category: "personal care", paymentMode: "Cash" },
  { userType: "Medium Spender", date: "16/01/25 09:30", merchant: "Rent Transfer", amount: 8000, category: "housing", paymentMode: "NetBanking" },
  { userType: "Medium Spender", date: "16/01/25 12:45", merchant: "Local Bakery", amount: 67, category: "food", paymentMode: "Cash" },
  { userType: "Medium Spender", date: "16/01/25 16:15", merchant: "DTH Recharge", amount: 299, category: "utilities", paymentMode: "UPI" }
];

// Max Saver Transactions (25 transactions)
export const maxSaverTransactions: TransactionData[] = [
  { userType: "Max Saver", date: "22/01/25 08:00", merchant: "Phone Recharge", amount: 242, category: "utilities", paymentMode: "NetBanking" },
  { userType: "Max Saver", date: "22/01/25 12:27", merchant: "IRCTC", amount: 456, category: "travel", paymentMode: "UPI" },
  { userType: "Max Saver", date: "22/01/25 16:04", merchant: "Metro Card", amount: 100, category: "transport", paymentMode: "Cash" },
  { userType: "Max Saver", date: "21/01/25 09:06", merchant: "Local Kirana", amount: 234, category: "groceries", paymentMode: "Cash" },
  { userType: "Max Saver", date: "21/01/25 13:38", merchant: "Rent Transfer", amount: 5000, category: "housing", paymentMode: "NetBanking" },
  { userType: "Max Saver", date: "21/01/25 17:45", merchant: "Savings Account Transfer", amount: 3000, category: "savings", paymentMode: "UPI" },
  { userType: "Max Saver", date: "20/01/25 10:30", merchant: "Electricity Bill", amount: 567, category: "utilities", paymentMode: "Card" },
  { userType: "Max Saver", date: "20/01/25 14:20", merchant: "Local Market", amount: 189, category: "groceries", paymentMode: "Cash" },
  { userType: "Max Saver", date: "20/01/25 18:15", merchant: "Gas Bill", amount: 123, category: "utilities", paymentMode: "UPI" },
  { userType: "Max Saver", date: "19/01/25 09:40", merchant: "Water Bill", amount: 78, category: "utilities", paymentMode: "NetBanking" },
  { userType: "Max Saver", date: "19/01/25 13:30", merchant: "Local Pharmacy", amount: 156, category: "personal care", paymentMode: "Cash" },
  { userType: "Max Saver", date: "19/01/25 16:45", merchant: "Bus Pass", amount: 500, category: "transport", paymentMode: "UPI" },
  { userType: "Max Saver", date: "18/01/25 10:15", merchant: "Local Bakery", amount: 45, category: "food", paymentMode: "Cash" },
  { userType: "Max Saver", date: "18/01/25 14:30", merchant: "Savings FD", amount: 5000, category: "savings", paymentMode: "NetBanking" },
  { userType: "Max Saver", date: "18/01/25 17:45", merchant: "Local Vegetables", amount: 145, category: "groceries", paymentMode: "Cash" },
  { userType: "Max Saver", date: "17/01/25 11:20", merchant: "Mutual Fund SIP", amount: 2000, category: "savings", paymentMode: "UPI" },
  { userType: "Max Saver", date: "17/01/25 15:30", merchant: "Local Tea Shop", amount: 25, category: "food", paymentMode: "Cash" },
  { userType: "Max Saver", date: "17/01/25 18:15", merchant: "Library Fee", amount: 50, category: "education", paymentMode: "Cash" },
  { userType: "Max Saver", date: "16/01/25 09:40", merchant: "Home Medicine", amount: 89, category: "personal care", paymentMode: "Cash" },
  { userType: "Max Saver", date: "16/01/25 13:25", merchant: "Local Fruits", amount: 78, category: "groceries", paymentMode: "Cash" },
  { userType: "Max Saver", date: "16/01/25 16:45", merchant: "Bank Transfer", amount: 10000, category: "savings", paymentMode: "NetBanking" },
  { userType: "Max Saver", date: "16/01/25 19:20", merchant: "Local Dairy", amount: 67, category: "groceries", paymentMode: "Cash" },
  { userType: "Max Saver", date: "16/01/25 11:30", merchant: "Newspaper", amount: 15, category: "utilities", paymentMode: "Cash" },
  { userType: "Max Saver", date: "16/01/25 14:50", merchant: "Public Transport", amount: 45, category: "transport", paymentMode: "Cash" },
  { userType: "Max Saver", date: "16/01/25 17:10", merchant: "PPF Deposit", amount: 1500, category: "savings", paymentMode: "NetBanking" }
];

export const getTransactionDataByPersonality = (personality: string): TransactionData[] => {
  switch (personality) {
    case 'Heavy Spender':
      return heavySpenderTransactions;
    case 'Medium Spender':
      return mediumSpenderTransactions;
    case 'Max Saver':
      return maxSaverTransactions;
    default:
      return mediumSpenderTransactions;
  }
};

export const convertToTransactionModel = (data: TransactionData, userId: string): Partial<ITransaction> => {
  const [day, month, year] = data.date.split(' ')[0].split('/');
  const [hour, minute] = data.date.split(' ')[1].split(':');
  
  return {
    userId,
    date: new Date(parseInt(year) + 2000, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute)),
    merchant: data.merchant,
    amount: data.amount,
    category: data.category,
    paymentMode: data.paymentMode,
    isSimulated: true
  };
}; 