# DeFi Web3 Multi-Chain Platform

## Project Structure (Atomic Design Pattern)

\`\`\`
src/
├── components/
│   ├── atoms/           # Basic building blocks
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Card/
│   │   └── ...
│   ├── molecules/       # Combinations of atoms
│   │   ├── WalletConnector/
│   │   ├── TokenSelector/
│   │   └── ...
│   ├── organisms/       # Complex UI components
│   │   ├── DepositForm/
│   │   ├── Leaderboard/
│   │   └── ...
│   └── templates/       # Page layouts
│       ├── DashboardLayout/
│       └── ...
├── hooks/              # Custom React hooks
├── services/           # API services
├── config/             # Configuration files
└── utils/              # Utility functions
\`\`\`

## Features

- 🔗 Multi-wallet support (MetaMask, Coinbase, Rainbow)
- 🌐 Multi-chain support (ETH, BNB, Arbitrum, Base, CORE)
- 💰 USDC/USDT deposits with yield farming
- 📊 Real-time statistics and leaderboards
- 🎨 Dark/Light mode support
- 📱 Responsive design

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: TailwindCSS v4 + shadcn/ui
- **State Management**: React Context + Custom Hooks
- **Web3**: wagmi + viem
- **Form Management**: React Hook Form + Zod
- **Code Quality**: ESLint (Airbnb) + Prettier

## Getting Started

\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
\`\`\`

## Coding Conventions

- Use PascalCase for component names and files
- Use camelCase for variables and functions
- Always use TypeScript interfaces for props
- Follow Atomic Design pattern for component organization
- Use semantic HTML and proper ARIA attributes
- Implement proper error boundaries and loading states
