import React, { useState, useEffect } from 'react'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, query, orderBy, limit, onSnapshot, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore'
import './Leaderboard.css'

// Initialize Firebase (optional - will use local storage if not configured)
let db = null
let firebaseInitialized = false

// Try to load and initialize Firebase config
const loadFirebase = async () => {
  try {
    const configModule = await import('../firebase/config.js')
    const firebaseConfig = configModule.default || configModule.firebaseConfig
    
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
    console.info(error)
  }
}

// Initialize Firebase asynchronously
loadFirebase()

const Leaderboard = ({ currentScore, gameRunning, onClose, isVisible = false, onTeamNameChange, deathMessage = '' }) => {
  const [scores, setScores] = useState([])
  const [teamName, setTeamName] = useState('')
  const [showNameInput, setShowNameInput] = useState(false)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [previousGameRunning, setPreviousGameRunning] = useState(false)
  const [existingScore, setExistingScore] = useState(null)

  // Load team name on mount
  useEffect(() => {
    const savedName = localStorage.getItem('teamName')
    if (savedName) {
      setTeamName(savedName)
      if (onTeamNameChange) onTeamNameChange(savedName)
    } else {
      // Ask for team name on first load
      setShowNameInput(true)
    }
  }, [onTeamNameChange])

  useEffect(() => {
    let unsubscribe = null
    let checkFirebase = null
    let timeoutId = null

    // Check if Firebase is initialized, otherwise use local storage
    checkFirebase = setInterval(() => {
      if (firebaseInitialized && db) {
        clearInterval(checkFirebase)
        
        const q = query(
          collection(db, 'scores'),
          orderBy('score', 'desc'),
          limit(10)
        )

        unsubscribe = onSnapshot(q, (snapshot) => {
          const scoreList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          setScores(scoreList)
        }, (error) => {
          console.warn('Firebase error, falling back to local storage:', error)
          loadLocalScores()
        })
      } else if (!firebaseInitialized) {
        // Wait a bit for async Firebase init, then fallback
        timeoutId = setTimeout(() => {
          if (!firebaseInitialized && checkFirebase) {
            clearInterval(checkFirebase)
            loadLocalScores()
          }
        }, 1000)
      }
    }, 100)

    // Fallback to local storage immediately
    loadLocalScores()

    return () => {
      if (checkFirebase) clearInterval(checkFirebase)
      if (unsubscribe) unsubscribe()
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  // Show save prompt when game ends (transitions from running to not running)
  useEffect(() => {
    // Game just ended (was running, now not running) and there's a score and team name is set
    if (previousGameRunning && !gameRunning && currentScore > 0 && teamName && !showSavePrompt && !showNameInput) {
      checkExistingScore()
      setShowSavePrompt(true)
    }
    // Reset when game starts
    if (!previousGameRunning && gameRunning) {
      setShowSavePrompt(false)
    }
    setPreviousGameRunning(gameRunning)
  }, [gameRunning, currentScore, previousGameRunning, showSavePrompt, showNameInput, teamName])

  const checkExistingScore = async () => {
    if (firebaseInitialized && db) {
      try {
        const q = query(
          collection(db, 'scores'),
          where('name', '==', teamName)
        )
        const querySnapshot = await getDocs(q)
        if (!querySnapshot.empty) {
          const existing = querySnapshot.docs[0].data()
          setExistingScore({ id: querySnapshot.docs[0].id, score: existing.score })
        } else {
          setExistingScore(null)
        }
      } catch (error) {
        console.warn('Error checking existing score:', error)
        // Fallback to local storage check
        const localScores = JSON.parse(localStorage.getItem('leaderboard') || '[]')
        const existing = localScores.find(s => s.name === teamName)
        setExistingScore(existing ? { score: existing.score } : null)
      }
    } else {
      // Check local storage
      const localScores = JSON.parse(localStorage.getItem('leaderboard') || '[]')
      const existing = localScores.find(s => s.name === teamName)
      setExistingScore(existing ? { score: existing.score } : null)
    }
  }

  const loadLocalScores = () => {
    const localScores = localStorage.getItem('leaderboard')
    if (localScores) {
      setScores(JSON.parse(localScores).sort((a, b) => b.score - a.score).slice(0, 10))
    }
  }

  const saveLocalScore = (name, score, shouldOverwrite = false) => {
    const localScores = JSON.parse(localStorage.getItem('leaderboard') || '[]')
    
    if (shouldOverwrite) {
      // Find and update existing score
      const index = localScores.findIndex(s => s.name === name)
      if (index !== -1) {
        localScores[index] = { name, score, timestamp: Date.now() }
      } else {
        localScores.push({ name, score, timestamp: Date.now() })
      }
    } else {
      localScores.push({ name, score, timestamp: Date.now() })
    }
    
    localStorage.setItem('leaderboard', JSON.stringify(localScores))
    loadLocalScores()
  }

  const handleSaveTeamName = (e) => {
    e.preventDefault()
    const name = teamName.trim()
    if (!name) return
    
    setTeamName(name)
    localStorage.setItem('teamName', name)
    if (onTeamNameChange) onTeamNameChange(name)
    setShowNameInput(false)
  }

  const handleSaveScore = async () => {
    if (!teamName || currentScore === 0) return

    const name = teamName.trim()
    const score = currentScore
    
    // Only save if there's no existing score OR if the new score is better
    if (existingScore && score <= existingScore.score) {
      // Score is not better, don't save
      setShowSavePrompt(false)
      setExistingScore(null)
      return
    }

    const shouldOverwrite = existingScore && score > existingScore.score

    if (firebaseInitialized && db) {
      try {
        if (shouldOverwrite && existingScore.id) {
          // Update existing score in Firebase
          await updateDoc(doc(db, 'scores', existingScore.id), {
            score,
            timestamp: Date.now()
          })
        } else if (shouldOverwrite) {
          // Need to find the document first
          const q = query(
            collection(db, 'scores'),
            where('name', '==', name)
          )
          const querySnapshot = await getDocs(q)
          if (!querySnapshot.empty) {
            await updateDoc(doc(db, 'scores', querySnapshot.docs[0].id), {
              score,
              timestamp: Date.now()
            })
          }
        } else {
          // Add new score (no existing score)
          await addDoc(collection(db, 'scores'), {
            name,
            score,
            timestamp: Date.now()
          })
        }
      } catch (error) {
        console.error('Error saving score to Firebase:', error)
        saveLocalScore(name, score, shouldOverwrite)
      }
    } else {
      saveLocalScore(name, score, shouldOverwrite)
    }

    setShowSavePrompt(false)
    setExistingScore(null)
  }

  return (
    <>
      {/* Team name input popup - shows on first load */}
      {showNameInput && (
        <div className="name-input-overlay">
          <form onSubmit={handleSaveTeamName} className="name-input-form">
            <h3>Enter Your Team Name</h3>
            <p>This will be used for the leaderboard</p>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter your team name"
              maxLength={20}
              autoFocus
              className="name-input"
            />
            <div className="name-input-buttons">
              <button type="submit" className="submit-button">Continue</button>
            </div>
          </form>
        </div>
      )}

      {/* Save score prompt - shows when game ends */}
      {showSavePrompt && currentScore > 0 && teamName && (
        <div className="name-input-overlay">
          <div className="name-input-form">
            <h3>Want to save score?</h3>
            {deathMessage && (
              <p style={{ color: '#ff6b6b', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                {deathMessage}
              </p>
            )}
            <p>Score: {currentScore.toLocaleString()}</p>
            {existingScore && (
              <p className="existing-score-info">
                Your current best: {existingScore.score.toLocaleString()}<br />
                {currentScore > existingScore.score ?  'New best!' : '(Not better than your best)'}
              </p>
            )}
            {!existingScore && (
              <p className="existing-score-info" style={{ color: '#fff' }}>
                This will be your first saved score!
              </p>
            )}
            <div className="name-input-buttons">
              <button 
                type="button" 
                onClick={handleSaveScore}
                className="submit-button"
                disabled={existingScore && currentScore <= existingScore.score}
                style={existingScore && currentScore <= existingScore.score ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                {existingScore && currentScore <= existingScore.score ? 'Score Not Better' : 'Yes, Save'}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setShowSavePrompt(false)
                  setExistingScore(null)
                }}
                className="cancel-button"
              >
                No, Skip
              </button>
            </div>
          </div>
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

