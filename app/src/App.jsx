import React, { useState } from 'react'
import BlockEditor from './components/BlockEditor'
import GameCanvas from './components/GameCanvas'
import Leaderboard from './components/Leaderboard'
import './App.css'

function App() {
  const [algorithm, setAlgorithm] = useState(null)
  const [gameRunning, setGameRunning] = useState(false)
  const [score, setScore] = useState(0)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  const handleRunAlgorithm = (algo) => {
    setAlgorithm(algo)
    setGameRunning(true)
    setScore(0)
  }

  const handleGameEnd = (finalScore) => {
    setGameRunning(false)
    setScore(finalScore)
  }

  // Window controls (only in Electron)
  const handleMinimize = () => {
    if (window.electronAPI) {
      window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = () => {
    if (window.electronAPI) {
      window.electronAPI.maximizeWindow();
    }
  };

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.closeWindow();
    }
  };

  const isElectron = typeof window !== 'undefined' && window.electronAPI;

  return (
    <div className="app">
      <header className="app-header" style={isElectron ? { WebkitAppRegion: 'drag' } : {}}>
        {isElectron && (
          <div className="window-controls">
            <button 
              className="window-control-btn minimize-btn"
              onClick={handleMinimize}
              style={{ WebkitAppRegion: 'no-drag' }}
              title="Minimize"
            >
              <span>−</span>
            </button>
            <button 
              className="window-control-btn maximize-btn"
              onClick={handleMaximize}
              style={{ WebkitAppRegion: 'no-drag' }}
              title="Maximize"
            >
              <span>□</span>
            </button>
            <button 
              className="window-control-btn close-btn"
              onClick={handleClose}
              style={{ WebkitAppRegion: 'no-drag' }}
              title="Close"
            >
              <span>×</span>
            </button>
          </div>
        )}
        <div className="header-content" style={isElectron ? { paddingRight: '140px' } : {}}>
          <div className="header-title">
            <h1>MSOE Engineering Olympics</h1>
            <p>Block Coding Challenge - Roscoe Raider on the High Seas</p>
          </div>
          <button 
            className="leaderboard-toggle-btn"
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            style={isElectron ? { WebkitAppRegion: 'no-drag' } : {}}
          >
            {showLeaderboard ? 'Close' : 'Leaderboard'}
          </button>
        </div>
      </header>
      <div className="app-container">
        <div className="left-panel">
          <BlockEditor onRun={handleRunAlgorithm} disabled={gameRunning} />
        </div>
        <div className="right-panel">
          <GameCanvas
            algorithm={algorithm}
            gameRunning={gameRunning}
            onGameEnd={handleGameEnd}
            onScoreChange={setScore}
          />
          <div className="score-display">
            <h2>Score: {score}</h2>
          </div>
        </div>
      </div>
      <Leaderboard 
        currentScore={score} 
        gameRunning={gameRunning} 
        onClose={() => setShowLeaderboard(false)}
        isVisible={showLeaderboard}
      />
    </div>
  )
}

export default App

