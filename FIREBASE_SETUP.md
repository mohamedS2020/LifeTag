# Firebase Setup Instructions

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `LifeTag`
4. Disable Google Analytics (optional for this project)
5. Click "Create project"

## 2. Add Web App

1. In your Firebase project console, click the web icon (`</>`)
2. Register app with nickname: `LifeTag-Web`
3. Do NOT check "Set up Firebase Hosting" for now
4. Click "Register app"
5. Copy the configuration object from the Firebase SDK setup

## 3. Configure Authentication

1. In Firebase Console, go to "Authentication" > "Sign-in method"
2. Enable "Email/Password" provider
3. Save the changes

## 4. Set up Cloud Firestore

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Start in "production mode" (we'll configure rules later)
4. Choose a location close to your users
5. Click "Done"

## 5. Update Configuration

1. Copy the Firebase configuration object from step 2
2. Replace the placeholder values in `src/config/firebase.config.ts`
3. Ensure all values are properly set

## 6. Firebase Collections Structure

The app will use these Firestore collections:

- `users` - User account information
- `profiles` - Medical profiles and emergency information  
- `medicalProfessionals` - Verified medical professional accounts
- `auditLogs` - Access logs for security tracking

## 7. Next Steps

After completing the Firebase setup:
- Security rules will be configured in task 8.1
- Authentication services will be implemented in task 2.1
- Database services will be implemented in task 3.2
