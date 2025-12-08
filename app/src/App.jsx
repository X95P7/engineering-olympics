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

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <h1>MSOE Engineering Olympics</h1>
            <p>Block Coding Challenge - Roscoe Raider on the High Seas</p>
          </div>
          <button 
            className="leaderboard-toggle-btn"
            onClick={() => setShowLeaderboard(!showLeaderboard)}
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

