# Hola Express Frontend

React Native mobile application for Hola Express.

## Features

- React Native with Expo
- TypeScript
- Navigation ready
- API integration setup
- Component library ready

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Update API URL in `src/services/api.ts` if needed

### Run the application

```bash
# Start Expo development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web
npm run web
```

## Project Structure

- **src/components/** - Reusable UI components
- **src/screens/** - Screen components
- **src/services/** - API and business logic services
- **src/types/** - TypeScript type definitions
- **src/contexts/** - React contexts for state management

## Development

The app is configured with TypeScript for type safety and better developer experience.

## Environment

Make sure to configure the API base URL in `src/services/api.ts` to match your backend server.
