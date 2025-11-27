# HubSpot Lifecycle Gate Governance App

A HubSpot application that enforces lifecycle and deal stage-gate validation rules, ensuring required fields, dependencies, and entry criteria are met before progression. Provides rep scorecards, SLA tracking, coaching insights, and automated governance alerts.

## Features

### Stage-Gate Validation
- **Lifecycle Stage Rules**: Validates contact lifecycle stage transitions (Lead → MQL → SQL → Opportunity → Customer)
- **Deal Stage Rules**: Validates deal stage progressions through the sales pipeline
- **Required Fields**: Enforces required fields for each stage transition
- **Conditional Logic**: Supports custom conditions and dependencies

### CRM Cards
- **Contact Governance Card**: Shows compliance status and validation warnings for contacts
- **Deal Governance Card**: Shows deal stage compliance and potential issues
- **Rep Scorecard Card**: Displays individual rep performance metrics

### Compliance Tracking
- **Rep Scorecards**: Track individual rep compliance scores
- **Violation History**: Log and track all stage-gate violations
- **Trend Analysis**: Monitor improving/declining compliance trends

### Governance Alerts
- **Real-time Alerts**: Immediate notification on violations
- **Alert Management**: Acknowledge and resolve alerts
- **Severity Levels**: Info, warning, error, and critical alerts

### Timeline Events
- **Stage Transitions**: Record all stage changes in HubSpot timeline
- **Validation Results**: Log validation outcomes
- **Compliance Events**: Track governance-related activities

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **HubSpot SDK**: @hubspot/api-client
- **Testing**: Jest + Supertest

## Getting Started

### Prerequisites

- Node.js 18 or higher
- A HubSpot developer account
- A HubSpot app configured with OAuth

### Installation

```bash
# Clone the repository
git clone https://github.com/inevitablesale/hubspot-lifecycle-gate-governance-app.git
cd hubspot-lifecycle-gate-governance-app

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure your environment variables (see Configuration section)
```

### Configuration

Create a `.env` file with the following variables:

```env
# HubSpot OAuth Configuration
HUBSPOT_CLIENT_ID=your_client_id
HUBSPOT_CLIENT_SECRET=your_client_secret
HUBSPOT_REDIRECT_URI=http://localhost:3000/oauth/callback
HUBSPOT_SCOPES=crm.objects.contacts.read,crm.objects.contacts.write,crm.objects.deals.read,crm.objects.deals.write,timeline

# Application Configuration
PORT=3000
NODE_ENV=development
APP_SECRET=your_app_secret
BASE_URL=http://localhost:3000
```

### Running the Application

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Linting and Formatting

```bash
# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix

# Format code with Prettier
npm run format
```

## API Endpoints

### Health Check
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health information

### OAuth
- `GET /oauth/authorize` - Initiate OAuth flow
- `GET /oauth/callback` - OAuth callback handler
- `GET /oauth/status/:portalId` - Check authentication status
- `POST /oauth/disconnect/:portalId` - Disconnect a portal

### Validation
- `POST /api/validation/validate` - Validate a stage transition
- `POST /api/validation/validate/batch` - Batch validate multiple transitions
- `GET /api/validation/rules/:objectType` - Get validation rules for contact or deal

### CRM Cards
- `GET /crm-cards/contact` - Contact governance CRM card
- `GET /crm-cards/deal` - Deal governance CRM card

### Scorecards
- `GET /api/scorecards` - Get all scorecards
- `GET /api/scorecards/:userId` - Get user scorecard
- `GET /api/scorecards/:userId/card` - Get scorecard as CRM card
- `GET /api/scorecards/:userId/violations` - Get user violations
- `POST /api/scorecards/:userId/violations/:violationId/resolve` - Resolve a violation

### Alerts
- `GET /api/alerts/portal/:portalId` - Get portal alerts
- `GET /api/alerts/user/:userId` - Get user alerts
- `GET /api/alerts/:alertId` - Get specific alert
- `POST /api/alerts/:alertId/acknowledge` - Acknowledge an alert

## Stage Gate Rules

### Contact Lifecycle Stage Rules

| Transition | Required Fields | Conditions |
|------------|----------------|------------|
| Lead → MQL | email, firstname, lastname, company | Valid email format |
| MQL → SQL | phone, hubspot_owner_id | Lead status must be set |
| SQL → Opportunity | hubspot_owner_id | Must have associated deal |
| Opportunity → Customer | - | Must have closed-won deal |

### Deal Stage Rules

| Transition | Required Fields | Conditions |
|------------|----------------|------------|
| Appointment → Qualified | dealname, amount, hubspot_owner_id | - |
| Qualified → Presentation | closedate | Must have associated contact |
| Presentation → Decision Maker | - | Amount > 0 |
| Contract Sent → Closed Won | amount, closedate | - |

## Project Structure

```
├── src/
│   ├── alerts/           # Alert service
│   ├── config/           # Configuration and rules
│   ├── crm-cards/        # CRM card generators
│   ├── middleware/       # Express middleware
│   ├── routes/           # API routes
│   ├── services/         # Business logic services
│   ├── timeline/         # Timeline event service
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── validation/       # Validation engine
│   ├── app.ts            # Express app setup
│   └── index.ts          # Entry point
├── tests/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── setup.ts          # Test setup
├── hubspot.config.yml    # HubSpot app configuration
├── package.json
├── tsconfig.json
└── README.md
```

## HubSpot App Setup

1. Create a new app in the HubSpot Developer Portal
2. Configure OAuth with the required scopes
3. Add CRM card extensions pointing to your deployment URL
4. Configure timeline event templates
5. Set up webhook subscriptions for property changes

See `hubspot.config.yml` for the complete app configuration.

## License

ISC
