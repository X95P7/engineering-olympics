# Setup Guide - MSOE Engineering Olympics

## Quick Start

1. **Install Dependencies**
   ```bash
   cd app
   npm install
   ```

2. **Configure Firebase (Optional)**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use an existing one
   - Go to Project Settings > General > Your apps
   - Copy the Firebase configuration
   - Create `app/src/firebase/config.js`:
     ```javascript
     export const firebaseConfig = {
       apiKey: "your-actual-api-key",
       authDomain: "your-project.firebaseapp.com",
       projectId: "your-project-id",
       storageBucket: "your-project.appspot.com",
       messagingSenderId: "123456789",
       appId: "your-app-id"
     }
     ```
   - If you skip this step, the leaderboard will use local storage instead

3. **Start Development Server**
   ```bash
   cd app
   npm run dev
   ```
   The app will be available at `http://localhost:3000`

4. **Build for Production**
   ```bash
   cd app
   npm run build
   ```
   The built files will be in `app/dist/`

5. **Deploy to Firebase Hosting**
   ```bash
   firebase deploy --only hosting
   ```

## Project Structure

```
.
├── app/                    # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── BlockEditor.jsx    # Block coding interface
│   │   │   ├── GameCanvas.jsx     # Game logic and rendering
│   │   │   └── Leaderboard.jsx    # Score leaderboard
│   │   ├── firebase/       # Firebase configuration
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Entry point
│   ├── public/             # Static assets
│   └── package.json        # Dependencies
├── firebase.json           # Firebase configuration
├── firestore.rules         # Firestore security rules
└── SETUP.md               # This file
```

## Features

✅ Block-based coding interface with drag-and-drop
✅ MSOE-themed runner game (Raider Runner)
✅ Multiple obstacle types with procedural generation
✅ Real-time leaderboard (Firebase or local storage)
✅ Speed control for faster gameplay
✅ Score tracking and high score saving

## Game Mechanics

- **Jump**: Avoid low obstacles and pigeons
- **Duck**: Avoid high obstacles while on ground
- **Burrow**: Avoid underground pipes
- **Wait Block**: Control timing between actions (value in milliseconds)

## Troubleshooting

### Firebase not working?
- Check that `app/src/firebase/config.js` exists and has valid credentials
- Verify Firestore is enabled in your Firebase project
- Check browser console for errors
- The app will automatically fall back to local storage if Firebase fails

### Game not running?
- Make sure you've added at least one block to the workspace
- Click "Run Algorithm" to start the game
- Check browser console for any errors

### Build errors?
- Make sure you're using Node.js v16 or higher
- Delete `node_modules` and `package-lock.json`, then run `npm install` again

## For Electron (Future)

To convert this to an Electron app:
1. Install Electron: `npm install --save-dev electron`
2. Create `app/electron/main.js` for the Electron main process
3. Update `package.json` to include Electron scripts
4. Build the React app and point Electron to the built files




