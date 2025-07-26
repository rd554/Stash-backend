import fs from 'fs'
import path from 'path'

export interface PersonaTransaction {
  id: string
  date: string
  merchant: string
  amount: number
  category: string
  paymentMethod: string
}

export class TransactionService {
  private static instance: TransactionService
  private personaData: { [key: string]: PersonaTransaction[] } = {}
  private lastUpdateDate: string = ''

  private constructor() {
    this.loadPersonaData()
  }

  public static getInstance(): TransactionService {
    if (!TransactionService.instance) {
      TransactionService.instance = new TransactionService()
    }
    return TransactionService.instance
  }

  private loadPersonaData() {
    try {
      const personasDir = path.join(__dirname, '../../data/personas')
      
      // Load all persona data
      const heavySpenderPath = path.join(personasDir, 'heavy-spender.json')
      const mediumSpenderPath = path.join(personasDir, 'medium-spender.json')
      const maxSaverPath = path.join(personasDir, 'max-saver.json')

      if (fs.existsSync(heavySpenderPath)) {
        this.personaData['heavy'] = JSON.parse(fs.readFileSync(heavySpenderPath, 'utf8'))
      }
      
      if (fs.existsSync(mediumSpenderPath)) {
        this.personaData['medium'] = JSON.parse(fs.readFileSync(mediumSpenderPath, 'utf8'))
      }
      
      if (fs.existsSync(maxSaverPath)) {
        this.personaData['max'] = JSON.parse(fs.readFileSync(maxSaverPath, 'utf8'))
      }

      console.log('Persona transaction data loaded successfully')
    } catch (error) {
      console.error('Error loading persona transaction data:', error)
    }
  }

  public getLatestTransactions(personaType: string, limit: number = 10): PersonaTransaction[] {
    try {
      // Use current date instead of hardcoded dates
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1; // getMonth() returns 0-11
      const day = today.getDate();
      
      // Calculate the date range: Start of current month to today
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      
      console.log(`Getting transactions for ${personaType} from ${startDate} to ${endDate}`);
      
      const transactions = this.personaData[personaType] || [];
      console.log(`Total transactions in persona data for ${personaType}:`, transactions.length);
      
      // Get transactions from start of month to today, sort by date (most recent first), and take latest
      let validTransactions = transactions
        .filter(tx => {
          const txDate = tx.date;
          return txDate >= startDate && txDate <= endDate;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      // Check if we need to generate transactions for missing dates
      const latestDateInData = validTransactions.length > 0 ? validTransactions[0].date : startDate;
      const latestDate = new Date(latestDateInData);
      const currentDate = new Date(endDate);
      
      // If current date is beyond the latest date in data, generate missing transactions
      if (currentDate > latestDate) {
        console.log(`Generating transactions for missing dates from ${latestDateInData} to ${endDate}`);
        const missingTransactions = this.generateTransactionsForMissingDates(personaType, latestDateInData, endDate);
        validTransactions = [...missingTransactions, ...validTransactions];
      }
      
      console.log(`Valid transactions for ${personaType}:`, validTransactions.length);
      return validTransactions.slice(0, limit);
    } catch (error) {
      console.error('Error getting latest transactions:', error);
      return [];
    }
  }

  private generateTransactionsForMissingDates(personaType: string, startDate: string, endDate: string): PersonaTransaction[] {
    const transactions: PersonaTransaction[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Generate 1-3 transactions per day for missing dates
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      
      // Skip if this date already has transactions
      if (dateStr <= startDate) continue;
      
      // Generate 1-3 transactions for this date
      const numTransactions = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < numTransactions; i++) {
        const transaction = this.generateRandomTransaction(personaType, dateStr, i + 1);
        transactions.push(transaction);
      }
    }
    
    return transactions;
  }

  private generateRandomTransaction(personaType: string, date: string, index: number): PersonaTransaction {
    const merchants = {
      heavy: ['Luxury Restaurant', 'Shopping Mall', 'Cinema Hall', 'Gaming Zone', 'Uber', 'Netflix'],
      medium: ['Local Kirana', 'Restaurant', 'Shopping Mall', 'Metro Card', 'Savings Account Transfer'],
      max: ['Local Kirana', 'Metro Card', 'Savings Account Transfer', 'Electricity Bill', 'Local Market']
    };
    
    const categories = {
      heavy: ['dining', 'entertainment', 'shopping', 'transport'],
      medium: ['groceries', 'food', 'shopping', 'transport', 'savings'],
      max: ['groceries', 'transport', 'savings', 'utilities']
    };
    
    const paymentMethods = ['Card', 'UPI', 'NetBanking', 'Cash'];
    
    const personaMerchants = merchants[personaType as keyof typeof merchants] || merchants.medium;
    const personaCategories = categories[personaType as keyof typeof categories] || categories.medium;
    
    const merchant = personaMerchants[Math.floor(Math.random() * personaMerchants.length)];
    const category = personaCategories[Math.floor(Math.random() * personaCategories.length)];
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    
    // Generate amount based on persona type
    let amount: number;
    if (personaType === 'heavy') {
      amount = Math.floor(Math.random() * 2000) + 500; // 500-2500
    } else if (personaType === 'medium') {
      amount = Math.floor(Math.random() * 1000) + 200; // 200-1200
    } else {
      amount = Math.floor(Math.random() * 500) + 100; // 100-600
    }
    
    return {
      id: `persona_${personaType}_${date.replace(/-/g, '')}_${index.toString().padStart(3, '0')}`,
      date: date,
      merchant: merchant,
      amount: amount,
      category: category,
      paymentMethod: paymentMethod
    };
  }

  private updateTransactionsForDate(currentDate: string) {
    // This method can be used to dynamically update transactions based on the current date
    // For now, we'll just reload the data to ensure we have the latest
    this.loadPersonaData()
  }

  public getTransactionsByDateRange(personaType: string, startDate: string, endDate: string): PersonaTransaction[] {
    try {
      const transactions = this.personaData[personaType] || []
      
      return transactions.filter(tx => {
        const txDate = tx.date
        return txDate >= startDate && txDate <= endDate
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    } catch (error) {
      console.error('Error getting transactions by date range:', error)
      return []
    }
  }

  public getTransactionsByDateRangeAndCategory(personaType: string, startDate: string, endDate: string, userType: string): PersonaTransaction[] {
    try {
      const transactions = this.personaData[personaType] || []
      
      // Category mapping based on user type
      let categoryMapping: { [key: string]: string } = {};
      
      if (userType === 'Heavy Spender') {
        categoryMapping = {
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
        };
      } else if (userType === 'Medium Spender') {
        categoryMapping = {
          'food': 'Food',
          'Food': 'Food',
          'Food & Dining': 'Food',
          'groceries': 'Groceries',
          'Groceries': 'Groceries',
          'savings': 'Savings',
          'Savings': 'Savings',
          'shopping': 'Shopping',
          'Shopping': 'Shopping',
          'transport': 'Transport',
          'Transportation': 'Transport',
          'Transport': 'Transport'
        };
      } else if (userType === 'Max Saver') {
        categoryMapping = {
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
        };
      }
      
      // Filter transactions by date range and normalize categories
      const filteredTransactions = transactions
        .filter((tx: PersonaTransaction) => {
          const txDate = tx.date
          return txDate >= startDate && txDate <= endDate
        })
        .map((tx: PersonaTransaction) => ({
          ...tx,
          category: categoryMapping[tx.category] || tx.category
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      
      return filteredTransactions
    } catch (error) {
      console.error('Error getting transactions by date range and category:', error)
      return []
    }
  }

  public getWeeklyTransactions(personaType: string): { [key: string]: number } {
    try {
      // Get last 7 days (excluding today) - Fixed dates for July 2025
      const endDate = new Date('2025-07-23') // July 23 (yesterday)
      const startDate = new Date('2025-07-17') // July 17 (7 days ago)
      
      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]
      
      // Get transactions for last 7 days
      const weekTransactions = this.getTransactionsByDateRange(personaType, startDateStr, endDateStr)
      
      // Group by date for last 7 days
      const dailyTotals: { [key: string]: number } = {}
      
      // Initialize last 7 days with 0 (July 17-23)
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate)
        date.setDate(startDate.getDate() + i)
        const dayKey = date.toISOString().split('T')[0]
        dailyTotals[dayKey] = 0
      }

      // Add actual transactions to their respective days
      weekTransactions.forEach(tx => {
        const txDate = tx.date
        if (dailyTotals[txDate] !== undefined) {
          dailyTotals[txDate] += tx.amount
        }
      })
      return dailyTotals
    } catch (error) {
      console.error('Error getting weekly transactions:', error)
      return {}
    }
  }

  public getTransactionStats(personaType: string, days: number = 30): {
    totalAmount: number
    transactionCount: number
    averageAmount: number
    topCategories: { category: string; amount: number; count: number }[]
  } {
    try {
      const currentDate = new Date().toISOString().split('T')[0]
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      const startDateStr = startDate.toISOString().split('T')[0]
      
      const transactions = this.getTransactionsByDateRange(personaType, startDateStr, currentDate)
      
      const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0)
      const transactionCount = transactions.length
      const averageAmount = transactionCount > 0 ? totalAmount / transactionCount : 0
      
      // Calculate top categories
      const categoryTotals: { [key: string]: { amount: number; count: number } } = {}
      transactions.forEach(tx => {
        if (!categoryTotals[tx.category]) {
          categoryTotals[tx.category] = { amount: 0, count: 0 }
        }
        categoryTotals[tx.category].amount += tx.amount
        categoryTotals[tx.category].count += 1
      })
      
      const topCategories = Object.entries(categoryTotals)
        .map(([category, data]) => ({ category, amount: data.amount, count: data.count }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
      
      return {
        totalAmount,
        transactionCount,
        averageAmount,
        topCategories
      }
    } catch (error) {
      console.error('Error getting transaction stats:', error)
      return {
        totalAmount: 0,
        transactionCount: 0,
        averageAmount: 0,
        topCategories: []
      }
    }
  }
}

export default TransactionService.getInstance() 