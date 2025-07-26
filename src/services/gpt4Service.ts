import OpenAI from 'openai';
import { config } from '../config/env';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export interface UserContext {
  name: string;
  age: number;
  spendingPersonality: string;
  recentTransactions: any[];
  financialGoals?: string[];
  monthlyIncome?: number;
}

export interface ChatContext {
  userMessage: string;
  userContext: UserContext;
  chatHistory: any[];
}

export class GPT4Service {
  private static instance: GPT4Service;
  
  private constructor() {}
  
  public static getInstance(): GPT4Service {
    if (!GPT4Service.instance) {
      GPT4Service.instance = new GPT4Service();
    }
    return GPT4Service.instance;
  }
  
  async generateResponse(context: ChatContext): Promise<string> {
    try {
      if (!config.openaiApiKey) {
        return this.getFallbackResponse(context);
      }
      
      const systemPrompt = this.buildSystemPrompt(context.userContext);
      const userPrompt = this.buildUserPrompt(context);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          ...this.formatChatHistory(context.chatHistory),
          {
            role: "user",
            content: userPrompt
          }
        ],
        max_tokens: 150,
        temperature: 0.8,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });
      
      return completion.choices[0]?.message?.content || this.getFallbackResponse(context);
    } catch (error) {
      console.error('GPT-4 API error:', error);
      return this.getFallbackResponse(context);
    }
  }

  async generateResponseFromPrompt(prompt: string): Promise<string> {
    try {
      if (!config.openaiApiKey) {
        return "I'm here to help with your financial questions! What would you like to know about your spending or savings?";
      }
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `You are Stash AI, a mindful money coach and financial advisor. 

IMPORTANT GUIDELINES:
- Keep responses CONVERSATIONAL and SHORT (2-3 sentences max)
- Be PROACTIVE and ENCOURAGING, not analytical
- Ask FOLLOW-UP QUESTIONS to keep the conversation going
- Use Indian context (₹, UPI, etc.)
- Focus on ONE specific actionable tip at a time
- Be friendly and supportive, like a caring friend
- Don't overwhelm with too much information

Example style: "Great question! Here's one simple tip: [specific action]. What do you think about trying this approach?"`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.8,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });
      
      return completion.choices[0]?.message?.content || "I'm here to help with your financial questions! What would you like to know about your spending or savings?";
    } catch (error) {
      console.error('GPT-4 API error:', error);
      return "I'm here to help with your financial questions! What would you like to know about your spending or savings?";
    }
  }
  
  private buildSystemPrompt(userContext: UserContext): string {
    const { name, age, spendingPersonality, recentTransactions, financialGoals, monthlyIncome } = userContext;
    
    // Calculate spending insights
    const totalSpent = recentTransactions.reduce((sum, txn) => sum + txn.amount, 0);
    const avgTransaction = recentTransactions.length > 0 ? totalSpent / recentTransactions.length : 0;
    const topCategories = this.getTopSpendingCategories(recentTransactions);
    
    return `You are Stash AI, a mindful money coach and financial advisor. You're speaking with ${name}, a ${age}-year-old with a ${spendingPersonality} spending personality.

**User Profile:**
- Name: ${name}
- Age: ${age}
- Spending Personality: ${spendingPersonality}
- Monthly Income: ${monthlyIncome ? `₹${monthlyIncome.toLocaleString()}` : 'Not specified'}
- Financial Goals: ${financialGoals?.join(', ') || 'Not specified'}

**Recent Financial Activity:**
- Total recent spending: ₹${totalSpent.toLocaleString()}
- Average transaction: ₹${avgTransaction.toLocaleString()}
- Top spending categories: ${topCategories.join(', ')}

**Your Role:**
1. Provide personalized financial advice based on their spending personality
2. Help them achieve their financial goals
3. Offer actionable tips for saving and budgeting
4. Be encouraging but honest about spending habits
5. Use Indian context (₹, UPI, Indian banks, etc.)
6. Keep responses conversational and friendly
7. Provide specific, actionable advice
8. Use emojis sparingly but effectively

**Response Guidelines:**
- Keep responses CONVERSATIONAL and SHORT (2-3 sentences max)
- Be PROACTIVE and ENCOURAGING, not analytical
- Ask FOLLOW-UP QUESTIONS to keep the conversation going
- Focus on ONE specific actionable tip at a time
- Be friendly and supportive, like a caring friend
- Don't overwhelm with too much information
- Use Indian financial context and examples
- Always end with a question to encourage engagement`;
  }
  
  private buildUserPrompt(context: ChatContext): string {
    return `User message: "${context.userMessage}"

Please provide a personalized response based on the user's financial profile and recent transactions.`;
  }
  
  private formatChatHistory(chatHistory: any[]): any[] {
    return chatHistory.slice(-10).map(msg => ({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.message
    }));
  }
  
  private getTopSpendingCategories(transactions: any[]): string[] {
    const categoryMap = new Map<string, number>();
    
    transactions.forEach(txn => {
      const category = txn.category || 'Other';
      categoryMap.set(category, (categoryMap.get(category) || 0) + txn.amount);
    });
    
    return Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category);
  }
  
  private getFallbackResponse(context: ChatContext): string {
    const { userContext, userMessage } = context;
    const { name, spendingPersonality } = userContext;
    
    // Fallback to the previous simulated response logic
    const message = userMessage.toLowerCase();
    
    if (message.includes('save') || message.includes('saving')) {
      return `Hi ${name}! I can see you're interested in saving money. As a ${spendingPersonality}, here are some personalized tips:

💡 **Quick Savings Tips:**
• Set up automatic transfers to savings account
• Track your daily spending with our app
• Look for areas where you can reduce expenses

Would you like me to help you set up a savings goal or analyze your spending patterns?`;
    }
    
    if (message.includes('spend') || message.includes('expense')) {
      return `Hey ${name}! Let me analyze your spending patterns as a ${spendingPersonality}:

📊 **Your Spending Overview:**
I can help you understand your spending patterns and identify areas for improvement.

🎯 **Insights:**
${spendingPersonality === 'Heavy Spender' ? 'I notice you have several high-value transactions. Consider setting daily spending limits.' : 
  spendingPersonality === 'Max Saver' ? 'Great job maintaining low spending! You\'re on track with your savings goals.' : 
  'Your spending is well-balanced. Keep up the good work!'}

Would you like me to help you create a budget or identify areas for improvement?`;
    }
    
    return `Hi ${name}! I'm your Stash AI financial coach. I can help you with:

💬 **What I can do:**
• Analyze your spending patterns
• Provide personalized savings tips
• Help you set and track financial goals
• Answer questions about budgeting
• Give investment advice

I can see you're a ${spendingPersonality}. How can I help you today?

Just ask me about saving money, budgeting, spending analysis, or any financial topic!`;
  }
}

export default GPT4Service.getInstance(); 