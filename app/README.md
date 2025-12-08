# MSOE Engineering Olympics - Raider Runner

A block-based coding game where students create algorithms using drag-and-drop blocks to control a runner character through obstacles. Built for the Society of Women Engineers (SWE) Hands On Future event.

## Features

- **Block-Based Coding Interface**: Drag and drop blocks to create algorithms
  - Jump block
  - Duck block
  - Burrow block
  - Wait block (with configurable timing)

- **MSOE-Themed Runner Game**: 
  - Control a Raider character through procedurally generated obstacles
  - Multiple obstacle types: pigeons, fences, houses, trees, skyscrapers, and underground pipes
  - Score-based progression with new obstacles appearing at certain score thresholds

- **Real-time Leaderboard**: 
  - Firebase integration for live score tracking
  - Displays top 10 scores
  - Local storage fallback if Firebase is not configured

- **Game Controls**:
  - Speed up button to accelerate gameplay
  - Automatic algorithm execution

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase project (optional, for leaderboard)

### Installation

1. Navigate to the app directory:
```bash
cd app
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Configure Firebase:
   - Copy `src/firebase/config.example.js` to `src/firebase/config.js`
   - Fill in your Firebase configuration values
   - Update `src/components/Leaderboard.jsx` to import from the config file

4. Start the development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## Game Rules

- **Obstacles**: Up to 3 obstacles can exist on screen at once
- **Avoidability**: All obstacle combinations are designed to be avoidable
- **Restrictions**: Skyscrapers and pipes cannot appear simultaneously
- **Scoring**: Score increases based on distance traveled
- **Actions**:
  - **Jump**: Avoid low obstacles and pigeons
  - **Duck**: Avoid high obstacles while on the ground
  - **Burrow**: Avoid underground pipes
  - **Jumping Duck**: Combine jump and duck to duck while in midair

## Obstacle Progression

- **0+ points**: Pigeons, fences, trees, pipes
- **5000+ points**: Houses appear
- **10000+ points**: Skyscrapers appear

## MSOE Theming

The game features MSOE's signature colors:
- **Red (#8B0000)**: Primary color for the Raider character and UI elements
- **Gold (#FFD700)**: Accent color for highlights and scoring

## Project Structure

```
app/
├── src/
│   ├── components/
│   │   ├── BlockEditor.jsx      # Drag-and-drop block coding interface
│   │   ├── GameCanvas.jsx       # Main game canvas and logic
│   │   └── Leaderboard.jsx      # Firebase leaderboard component
│   ├── App.jsx                  # Main app component
│   ├── main.jsx                 # React entry point
│   └── index.css               # Global styles
├── public/
│   └── index.html              # HTML template
├── package.json
└── vite.config.js              # Vite configuration
```

## Technologies Used

- **React**: UI framework
- **Vite**: Build tool and dev server
- **Firebase Firestore**: Real-time leaderboard
- **Canvas API**: Game rendering

## Development Notes

- The game uses a procedural generation system for obstacles
- Algorithm execution is time-based using the Wait block values
- Collision detection uses bounding box calculations
- The leaderboard automatically updates in real-time when Firebase is configured

## License

ISC




