# EAS Build Configuration Setup

## ⚠️ Important Security Notice

The `eas.json` file contains sensitive Firebase credentials and should **NOT** be committed to GitHub.

## Setup Instructions

### 1. Create Your Local `eas.json`

Copy the template file and add your real credentials:

```bash
# Copy the template
cp eas.json.template eas.json

# Edit eas.json with your actual Firebase credentials
```

### 2. Replace Placeholder Values

Edit `eas.json` and replace these placeholders with your actual Firebase values:

- `YOUR_FIREBASE_API_KEY` → Your Firebase API key
- `YOUR_PROJECT_ID` → Your Firebase project ID (e.g., "lifetag-420c7")
- `YOUR_MESSAGING_SENDER_ID` → Your Firebase messaging sender ID
- `YOUR_APP_ID` → Your Firebase app ID
- `admin@example.com` → Your admin email address

### 3. Firebase Configuration Values

Get these values from:
1. **Firebase Console** → Project Settings → General
2. Or from your `google-services.json` file


### 4. Protected Files

These files are in `.gitignore` and will NOT be pushed to GitHub:
- ✅ `eas.json` - Contains sensitive credentials
- ✅ `google-services.json` - Firebase Android config
- ✅ `GoogleService-Info.plist` - Firebase iOS config
- ✅ `.env.local` - Local environment variables

### 5. Safe to Commit

These files CAN be pushed to GitHub:
- ✅ `eas.json.template` - Template without real credentials
- ✅ `app.json` - App configuration (no secrets)
- ✅ `firebase.config.ts` - Has fallback values but env vars take precedence

## Building Your App

After setting up `eas.json` with real credentials:

```bash
# Development build
eas build -p android --profile development

# Production build
eas build -p android --profile production --clear-cache
```

## EAS Secrets (Alternative Approach)

Instead of storing credentials in `eas.json`, you can use EAS Secrets:

```bash
# Set secrets via EAS CLI
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "your-api-key"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "your-domain"
# ... and so on for each credential
```

Then remove the `env` sections from `eas.json`.

## Troubleshooting

### If app crashes on startup:
1. Verify `google-services.json` is in project root
2. Check Firebase credentials in `eas.json` are correct
3. Ensure package name matches: `com.egbaki.LifeTag`
4. Check build logs: `eas build:list`

### If credentials leak to GitHub:
1. Immediately regenerate API keys in Firebase Console
2. Update `eas.json` with new credentials
3. Remove from Git history: `git filter-branch` or use BFG Repo Cleaner

## Support

For issues, check:
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Firebase Setup Guide](https://firebase.google.com/docs/android/setup)
