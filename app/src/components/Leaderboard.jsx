import React, { useState, useEffect } from 'react'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import './Leaderboard.css'

// Initialize Firebase (optional - will use local storage if not configured)
let db = null
let firebaseInitialized = false

// Try to load and initialize Firebase config
const loadFirebase = async () => {
  try {
    const configModule = await import('../firebase/config.js')
    const firebaseConfig = configModule.firebaseConfig
    
    // Check if config is valid (not placeholder values)
    if (firebaseConfig && 
        firebaseConfig.apiKey && 
        firebaseConfig.apiKey !== "your-api-key-here" &&
        firebaseConfig.projectId &&
        firebaseConfig.projectId !== "your-project-id") {
      try {
        const app = initializeApp(firebaseConfig)
        db = getFirestore(app)
        firebaseInitialized = true
        console.info('Firebase initialized successfully')
      } catch (initError) {
        console.warn('Firebase initialization failed:', initError)
      }
    } else {
      console.info('Firebase config not configured. Leaderboard will use local storage.')
    }
  } catch (error) {
    // Config file doesn't exist or import failed - that's okay, we'll use local storage
    console.info('Firebase config not available. Leaderboard will use local storage.')
  }
}

// Initialize Firebase asynchronously
loadFirebase()

const Leaderboard = ({ currentScore, gameRunning, onClose, isVisible = false }) => {
  const [scores, setScores] = useState([])
  const [playerName, setPlayerName] = useState('')
  const [showNameInput, setShowNameInput] = useState(false)
  const [previousGameRunning, setPreviousGameRunning] = useState(false)

  useEffect(() => {
    // Check if Firebase is initialized, otherwise use local storage
    const checkFirebase = setInterval(() => {
      if (firebaseInitialized && db) {
        clearInterval(checkFirebase)
        
        const q = query(
          collection(db, 'scores'),
          orderBy('score', 'desc'),
          limit(10)
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const scoreList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          setScores(scoreList)
        }, (error) => {
          console.warn('Firebase error, falling back to local storage:', error)
          loadLocalScores()
        })

        return () => unsubscribe()
      } else if (!firebaseInitialized) {
        // Wait a bit for async Firebase init, then fallback
        setTimeout(() => {
          if (!firebaseInitialized) {
            clearInterval(checkFirebase)
            loadLocalScores()
          }
        }, 1000)
      }
    }, 100)

    // Fallback to local storage immediately
    loadLocalScores()

    return () => clearInterval(checkFirebase)
  }, [])

  // Show name input only when game ends (transitions from running to not running)
  useEffect(() => {
    // Game just ended (was running, now not running) and there's a score
    if (previousGameRunning && !gameRunning && currentScore > 0 && !showNameInput) {
      setShowNameInput(true)
    }
    // Reset when game starts
    if (!previousGameRunning && gameRunning) {
      setShowNameInput(false)
      setPlayerName('')
    }
    setPreviousGameRunning(gameRunning)
  }, [gameRunning, currentScore, previousGameRunning, showNameInput])

  const loadLocalScores = () => {
    const localScores = localStorage.getItem('leaderboard')
    if (localScores) {
      setScores(JSON.parse(localScores).sort((a, b) => b.score - a.score).slice(0, 10))
    }
  }

  const saveLocalScore = (name, score) => {
    const localScores = JSON.parse(localStorage.getItem('leaderboard') || '[]')
    localScores.push({ name, score, timestamp: Date.now() })
    localStorage.setItem('leaderboard', JSON.stringify(localScores))
    loadLocalScores()
  }

  const handleSubmitScore = async (e) => {
    e.preventDefault()
    if (!playerName.trim() || currentScore === 0) return

    const name = playerName.trim()
    const score = currentScore

    if (firebaseInitialized && db) {
      try {
        await addDoc(collection(db, 'scores'), {
          name,
          score,
          timestamp: Date.now()
        })
      } catch (error) {
        console.error('Error saving score to Firebase:', error)
        saveLocalScore(name, score)
      }
    } else {
      saveLocalScore(name, score)
    }

    setPlayerName('')
    setShowNameInput(false)
  }

  return (
    <>
      {/* Score submission popup - shows even when leaderboard is closed */}
      {showNameInput && currentScore > 0 && (
        <div className="name-input-overlay">
          <form onSubmit={handleSubmitScore} className="name-input-form">
            <h3>Submit Your Score!</h3>
            <p>Score: {currentScore}</p>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              autoFocus
              className="name-input"
            />
            <div className="name-input-buttons">
              <button type="submit" className="submit-button">Submit</button>
              <button 
                type="button" 
                onClick={() => setShowNameInput(false)}
                className="cancel-button"
              >
                Skip
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Leaderboard panel - only visible when isVisible is true */}
      {isVisible && (
        <div className="leaderboard">
          <div className="leaderboard-header">
            <h2>Leaderboard</h2>
            <button className="close-leaderboard-btn" onClick={onClose} aria-label="Close leaderboard">
                X
            </button>
          </div>
          <div className="leaderboard-list">
        {scores.length === 0 ? (
          <p className="no-scores">No scores yet. Be the first!</p>
        ) : (
          scores.map((entry, index) => (
            <div 
              key={entry.id || index} 
              className={`leaderboard-entry ${index === 0 ? 'first-place' : ''}`}
            >
              <span className="rank">#{index + 1}</span>
              <span className="name">{entry.name || 'Anonymous'}</span>
              <span className="score">{entry.score.toLocaleString()}</span>
            </div>
          ))
          )}
        </div>
      </div>
      )}
    </>
  )
}

export default Leaderboard

