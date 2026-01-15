# Firebase Setup Guide for Leaderboard

Your leaderboard is already configured to connect to Firebase! You just need to set up your Firebase project and add your configuration.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or select an existing project
3. Follow the setup wizard:
   - Enter a project name (e.g., "Engineering Olympics")
   - Enable/disable Google Analytics (optional)
   - Click **"Create project"**

## Step 2: Enable Firestore Database

1. In your Firebase project, click on **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Choose **"Start in test mode"** (we'll update the rules next)
4. Select a location (choose one close to your users, e.g., `us-central1`)
5. Click **"Enable"**

## Step 3: Update Firestore Security Rules

1. In Firestore Database, go to the **"Rules"** tab
2. The rules are already configured in `firestore.rules` in your project
3. Deploy the rules by running in your terminal (from the project root):
   ```bash
   firebase deploy --only firestore:rules
   ```
   
   **OR** manually copy the rules from `firestore.rules` and paste them in the Firebase Console Rules editor, then click **"Publish"**

## Step 4: Deploy Firestore Indexes

1. In Firestore Database, go to the **"Indexes"** tab
2. The index configuration is already in `firestore.indexes.json`
3. Deploy the indexes by running:
   ```bash
   firebase deploy --only firestore:indexes
   ```
   
   **OR** Firebase will automatically prompt you to create the index when you first run a query. Click the link in the error message to create it.

## Step 5: Get Your Firebase Configuration

1. In Firebase Console, click the gear icon ⚙️ next to **"Project Overview"**
2. Select **"Project settings"**
3. Scroll down to **"Your apps"** section
4. If you don't have a web app yet:
   - Click **"</>"** (Web icon) to add a web app
   - Register your app (you can name it "Engineering Olympics Web")
   - **Don't** check "Also set up Firebase Hosting" (unless you want to use it)
   - Click **"Register app"**
5. Copy the `firebaseConfig` object that looks like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   }
   ```

## Step 6: Update Your Config File

1. Open `app/src/firebase/config.js`
2. Replace the placeholder values with your actual Firebase config values:
   ```javascript
   export const firebaseConfig = {
     apiKey: "YOUR_ACTUAL_API_KEY",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-actual-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   }
   ```

## Step 7: Test the Connection

1. Start your development server:
   ```bash
   cd app
   npm run dev
   ```
2. Play the game and submit a score
3. Check the browser console - you should see: `Firebase initialized successfully`
4. Check Firebase Console > Firestore Database - you should see a `scores` collection with your test entry

## Troubleshooting

### Firebase not connecting?
- Check the browser console for error messages
- Verify your `config.js` file has the correct values (not placeholders)
- Make sure Firestore is enabled in your Firebase project
- Check that your Firestore rules allow read/write operations

### Scores not showing?
- Check the browser console for errors
- Verify the Firestore index is created (check the Indexes tab in Firebase Console)
- Make sure you're looking at the correct Firestore database (not Realtime Database)

### Need to install Firebase CLI?
If you don't have Firebase CLI installed:
```bash
npm install -g firebase-tools
firebase login
firebase init
```

## What Happens Next?

Once configured:
- ✅ Scores will be saved to Firestore in real-time
- ✅ Leaderboard will update automatically when new scores are added
- ✅ Scores are shared across all users
- ✅ If Firebase is unavailable, the app falls back to local storage

The leaderboard will automatically use Firebase when it's configured, or fall back to local storage if it's not set up yet.

