# 🔧 Stash AI Backend

> **Node.js/Express API Server for Stash AI**

The backend API server for Stash AI, built with Node.js, Express.js, TypeScript, and MongoDB. This server provides RESTful APIs for financial management, AI-powered insights, and real-time features.

## 🚀 Features

### 🔌 Core API Features
- **RESTful APIs**: Complete CRUD operations for all entities
- **Authentication**: User authentication and session management
- **Real-time Communication**: Socket.IO for live updates
- **AI Integration**: OpenAI GPT-4 for intelligent insights
- **Data Persistence**: MongoDB with Mongoose ODM

### 🤖 AI-Powered Features
- **Financial Insights**: AI-generated spending analysis
- **Predictive Analytics**: Future spending forecasts
- **Health Scoring**: Financial health monitoring
- **Smart Recommendations**: Personalized financial advice
- **Behavioral Analysis**: Spending pattern recognition

### 📊 Financial Management
- **Transaction Management**: Add, update, delete transactions
- **Budget Management**: Dynamic budget caps with tracking
- **Persona-based Data**: Realistic transaction simulation
- **Category Management**: Smart transaction categorization
- **Goal Tracking**: Financial goal monitoring

### 🔔 Real-time Features
- **Live Notifications**: Instant alerts and insights
- **Real-time Updates**: Live data synchronization
- **Socket.IO Integration**: WebSocket communication
- **Event-driven Architecture**: Reactive system design

## 🏗️ Architecture

```
backend/
├── src/
│   ├── models/                 # MongoDB Models
│   │   ├── User.ts            # User model
│   │   ├── Transaction.ts     # Transaction model
│   │   ├── ChatMessage.ts     # Chat message model
│   │   ├── Nudge.ts           # Nudge model
│   │   ├── AIInsight.ts       # AI insight model
│   │   ├── Budget.ts          # Budget model
│   │   └── Salary.ts          # Salary model
│   ├── routes/                # Express Routes
│   │   ├── auth.ts            # Authentication routes
│   │   ├── transactions.ts    # Transaction routes
│   │   ├── chat.ts            # Chat routes
│   │   ├── nudges.ts          # Nudge routes
│   │   ├── budget.ts          # Budget routes
│   │   ├── salary.ts          # Salary routes
│   │   ├── financial.ts       # Financial metrics routes
│   │   ├── agenticInsights.ts # AI insights routes
│   │   ├── personas.ts        # Persona data routes
│   │   └── system.ts          # System routes
│   ├── services/              # Business Logic
│   │   ├── gpt4Service.ts     # OpenAI integration
│   │   ├── notificationService.ts # Real-time notifications
│   │   ├── nudgeService.ts    # Nudge generation
│   │   ├── agenticInsightService.ts # AI insights
│   │   ├── predictiveAnalyticsService.ts # Predictive analytics
│   │   ├── financialProfileService.ts # Financial calculations
│   │   ├── transactionService.ts # Transaction management
│   │   └── advancedAnalyticsService.ts # Advanced analytics
│   ├── config/                # Configuration
│   │   └── env.ts             # Environment configuration
│   ├── utils/                 # Utilities
│   │   ├── database.ts        # Database connection
│   │   ├── budgetData.ts      # Budget data utilities
│   │   └── transactionData.ts # Transaction utilities
│   └── index.ts               # Server entry point
├── data/                      # Static Data
│   └── personas/              # Persona transaction data
│       ├── heavy-spender.json
│       ├── medium-spender.json
│       └── max-saver.json
├── dist/                      # Build output
├── package.json
└── tsconfig.json
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn
- OpenAI API key (for AI features)

### Installation

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Verify server is running**
   Navigate to [http://localhost:5000/health](http://localhost:5000/health)

## 🔧 Configuration

### Environment Variables

Create `.env` file:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/stash-ai

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
ENABLE_REAL_GPT4=true

# Real-time Features
ENABLE_REALTIME_NOTIFICATIONS=true

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# JWT Configuration (if using JWT)
JWT_SECRET=your_jwt_secret_here

# Optional: Logging
LOG_LEVEL=info
```

### Available Scripts

```bash
npm run dev          # Start development server with nodemon
npm run build        # Build TypeScript to JavaScript
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/login          # User login
POST   /api/auth/register       # User registration
GET    /api/auth/profile/:id    # Get user profile
```

### Transactions
```
GET    /api/transactions/:userId           # Get user transactions
POST   /api/transactions/:userId           # Add new transaction
PUT    /api/transactions/:id               # Update transaction
DELETE /api/transactions/:id               # Delete transaction
GET    /api/transactions/:userId/budget    # Get budget transactions
```

### Budget Management
```
GET    /api/budget/:userId                 # Get user budget caps
PUT    /api/budget/:userId/:category       # Update budget cap
DELETE /api/budget/:userId                 # Reset budget caps
```

### Financial Metrics
```
GET    /api/financial/metrics/:userId      # Get financial metrics
GET    /api/financial/budget/:userId       # Get budget overview
GET    /api/salary/:userId                 # Get user salary
PUT    /api/salary/:userId                 # Update user salary
```

### AI Insights
```
POST   /api/agentic/insights/:userId/generate  # Generate AI insights
GET    /api/agentic/insights/:userId/insights  # Get user insights
```

### Chat & Notifications
```
GET    /api/chat/:userId                   # Get chat history
POST   /api/chat/:userId/message           # Send message
GET    /api/nudges/:userId                 # Get user nudges
POST   /api/nudges/:userId/generate        # Generate nudges
```

### System
```
GET    /health                             # Health check
GET    /api/system/date                    # Get server date
GET    /api/system/health                  # System health
```

## 🗄️ Database Models

### User Model
```typescript
interface IUser {
  username: string;              // Unique username
  name: string;                  // User's full name
  age: number;                   // User's age
  theme: 'light';                // UI theme preference
  spendingPersonality: 'Heavy Spender' | 'Medium Spender' | 'Max Saver';
  userType?: string;             // User type (test/production)
  salary?: number;               // User's salary
  createdAt: Date;
  updatedAt: Date;
}
```

### Transaction Model
```typescript
interface ITransaction {
  userId: string;                // Associated user
  date: Date;                    // Transaction date
  merchant: string;              // Merchant name
  amount: number;                // Transaction amount
  category: string;              // Transaction category
  paymentMode: string;           // Payment method
  isSimulated: boolean;          // Whether transaction is simulated
  createdAt: Date;
  updatedAt: Date;
}
```

### Budget Model
```typescript
interface IBudget {
  userId: string;                // Associated user
  category: string;              // Budget category
  budgetCap: number;             // Budget limit
  spendingPersonality: string;   // User's spending personality
  createdAt: Date;
  updatedAt: Date;
}
```

## 🤖 AI Integration

### OpenAI GPT-4 Service
The backend integrates with OpenAI GPT-4 for intelligent financial insights:

```typescript
// Example AI insight generation
const insight = await gpt4Service.generateInsight({
  userProfile: user,
  transactions: userTransactions,
  context: 'budget_analysis'
});
```

### AI Features
- **Financial Health Scoring**: Analyze spending patterns
- **Predictive Analytics**: Forecast future spending
- **Smart Recommendations**: Personalized financial advice
- **Behavioral Analysis**: Understand spending habits
- **Goal Tracking**: Monitor financial goals

## 🔔 Real-time Features

### Socket.IO Integration
Real-time communication for live updates:

```typescript
// Example real-time notification
io.to(userId).emit('notification', {
  type: 'budget_alert',
  message: 'You\'ve exceeded your budget!',
  data: { category: 'Food', overrun: 1500 }
});
```

### Real-time Events
- **Budget Alerts**: Instant budget overrun notifications
- **AI Insights**: Live insight generation
- **Transaction Updates**: Real-time transaction sync
- **System Notifications**: Server status updates

## 📊 Data Management

### Persona-based Transactions
The system includes realistic transaction data for different spending personalities:

- **Heavy Spender**: High-frequency, high-value transactions
- **Medium Spender**: Balanced spending patterns
- **Max Saver**: Conservative, savings-focused transactions

### Data Simulation
```typescript
// Example persona transaction generation
const transactions = transactionService.getLatestTransactions('medium', 10);
```

## 🔒 Security

### Authentication
- User-based authentication system
- Session management
- Secure API endpoints

### Data Protection
- Input validation and sanitization
- SQL injection prevention (MongoDB)
- CORS configuration
- Environment variable protection

### API Security
- Rate limiting (can be implemented)
- Request validation
- Error handling without sensitive data exposure

## 🧪 Testing

### Available Tests
```bash
npm run test              # Run unit tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Generate coverage report
npm run test:integration  # Run integration tests
```

### Testing Strategy
- **Unit Tests**: Individual function testing
- **Integration Tests**: API endpoint testing
- **Database Tests**: MongoDB integration testing
- **AI Tests**: OpenAI integration testing

## 📈 Performance

### Optimization Features
- **Connection Pooling**: MongoDB connection optimization
- **Caching**: Redis integration (optional)
- **Compression**: Response compression
- **Rate Limiting**: API rate limiting
- **Monitoring**: Performance monitoring

### Monitoring
- **Health Checks**: Regular system health monitoring
- **Error Tracking**: Error monitoring and logging
- **Performance Metrics**: Response time tracking
- **Database Monitoring**: MongoDB performance tracking

## 🚀 Deployment

### Production Setup
1. **Environment Configuration**
   ```bash
   NODE_ENV=production
   MONGODB_URI=your_production_mongodb_uri
   OPENAI_API_KEY=your_production_openai_key
   ```

2. **Build Process**
   ```bash
   npm run build
   npm start
   ```

3. **Process Management**
   - Use PM2 for process management
   - Set up auto-restart on crashes
   - Configure logging

### Deployment Platforms
- **Railway**: Easy deployment with Git integration
- **Render**: Free tier available with auto-deploy
- **Heroku**: Traditional Node.js hosting
- **DigitalOcean**: VPS deployment
- **AWS**: Scalable cloud deployment

## 🔍 Monitoring & Logging

### Logging Configuration
```typescript
// Example logging setup
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Health Monitoring
- **Health Endpoints**: `/health` for basic health checks
- **System Metrics**: CPU, memory, database connection status
- **API Metrics**: Response times, error rates
- **Real-time Monitoring**: Live system status

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **Conventional Commits**: Standard commit message format

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

**Built with ❤️ using Node.js, Express.js, and TypeScript** 