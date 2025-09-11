# LifeTag

Emergency Medical Information System - A React Native app for carrying emergency medical information via QR codes.

## 🚀 Getting Started

### Prerequisites
- Node.js (v20.17.0 or higher)
- npm or yarn
- Expo CLI
- Firebase project

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd LifeTag
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your actual Firebase configuration values.

4. **Start the development server**
   ```bash
   npm start
   ```

### Firebase Configuration

This app requires a Firebase project with:
- Authentication (Email/Password enabled)
- Cloud Firestore database
- Security rules configured

See `FIREBASE_SETUP.md` for detailed setup instructions.

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Auth/           # Authentication components
│   ├── Profile/        # Profile management
│   ├── QR/            # QR code generation/scanning
│   └── Admin/         # Admin verification
├── services/           # Business logic and API calls
├── utils/             # Utility functions
├── context/           # React Context providers
├── navigation/        # Navigation configuration
├── screens/           # Screen components
├── types/            # TypeScript type definitions
└── config/           # App configuration
```

## 🔒 Security

- Firebase API keys are stored in environment variables
- Sensitive folders (`.curser/`, `tasks/`) are ignored by git
- Medical data is encrypted in Firestore
- QR codes contain minimal emergency data only

## 📱 Features

- Emergency medical profile creation
- QR code generation with offline emergency data
- Medical professional verification system
- Audit logging for profile access
- Cross-platform (iOS, Android, Web)