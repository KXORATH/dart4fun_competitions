import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, X, Undo } from 'lucide-react';

export default function MatchView({ match, settings, onMatchFinish, onBack }) {
  const [p1Legs, setP1Legs] = useState(match.p1Legs || 0);
  const [p2Legs, setP2Legs] = useState(match.p2Legs || 0);
  
  const [p1Score, setP1Score] = useState(settings.startingScore);
  const [p2Score, setP2Score] = useState(settings.startingScore);
  
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [inputValue, setInputValue] = useState('');
  
  const [history, setHistory] = useState([]);
  const [legHistory, setLegHistory] = useState([]); // to track states for Undo
  
  const [p1Visits, setP1Visits] = useState(0);
  const [p2Visits, setP2Visits] = useState(0);
  
  const legsToWin = Math.ceil(settings.bestOf / 2);
  
  // Numpad input handler
  const handleInput = (val) => {
    if (inputValue.length < 3) {
      setInputValue(prev => prev + val);
    }
  };

  const handleBackspace = () => {
    setInputValue(prev => prev.slice(0, -1));
  };

  const handleEnter = () => {
    if (inputValue === '') return;
    const scoreVal = parseInt(inputValue, 10);
    if (scoreVal > 180 || scoreVal < 0) {
        alert("Invalid score (must be 0-180)");
        setInputValue('');
        return;
    }

    const currentScore = currentPlayer === 1 ? p1Score : p2Score;
    let newScore = currentScore - scoreVal;
    
    let isBust = false;
    let wonLeg = false;

    if (newScore < 0) {
        isBust = true;
    } else if (settings.checkoutType === 'double' && newScore === 1) {
        isBust = true;
    } else if (newScore === 0) {
        wonLeg = true;
    }

    // Save previous state to history
    setLegHistory(prev => [...prev, { p1Score, p2Score, currentPlayer, p1Visits, p2Visits }]);

    const newP1Visits = currentPlayer === 1 ? p1Visits + 1 : p1Visits;
    const newP2Visits = currentPlayer === 2 ? p2Visits + 1 : p2Visits;
    
    if (currentPlayer === 1) setP1Visits(newP1Visits);
    else setP2Visits(newP2Visits);

    // Record the throw stats
    setHistory(prev => [...prev, {
      playerId: currentPlayer === 1 ? match.player1.id : match.player2.id,
      score: isBust ? 0 : scoreVal,
      isBust
    }]);

    if (wonLeg) {
        setHistory(prev => [...prev, {
            playerId: currentPlayer === 1 ? match.player1.id : match.player2.id,
            type: 'LEG_WIN',
            numDarts: (currentPlayer === 1 ? newP1Visits : newP2Visits) * 3,
            checkout: scoreVal
        }]);
        handleLegWin(currentPlayer);
    } else {
        if (!isBust) {
            if (currentPlayer === 1) setP1Score(newScore); else setP2Score(newScore);
        }
        setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    }
    
    setInputValue('');
  };

  const handleLegWin = (winnerNum) => {
      const newP1Legs = winnerNum === 1 ? p1Legs + 1 : p1Legs;
      const newP2Legs = winnerNum === 2 ? p2Legs + 1 : p2Legs;
      
      setP1Legs(newP1Legs);
      setP2Legs(newP2Legs);
      
      if (newP1Legs >= legsToWin || newP2Legs >= legsToWin) {
          // Match is over!
          onMatchFinish(newP1Legs, newP2Legs, history);
      } else {
          // Next leg
          setP1Score(settings.startingScore);
          setP2Score(settings.startingScore);
          setP1Visits(0);
          setP2Visits(0);
          setLegHistory([]);
          // Alternate who starts the next leg
          const totalLegsPlayed = newP1Legs + newP2Legs;
          setCurrentPlayer((totalLegsPlayed % 2) === 0 ? 1 : 2);
      }
  };

  const handleUndo = () => {
      if (legHistory.length === 0) return;
      const lastState = legHistory[legHistory.length - 1];
      setP1Score(lastState.p1Score);
      setP2Score(lastState.p2Score);
      setCurrentPlayer(lastState.currentPlayer);
      setP1Visits(lastState.p1Visits);
      setP2Visits(lastState.p2Visits);
      
      setLegHistory(prev => prev.slice(0, -1));
      setHistory(prev => prev.slice(0, -1));
      setInputValue('');
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <button className="secondary" onClick={onBack}>
          <ArrowLeft size={18} /> Back
        </button>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ margin: 0 }}>Match View</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Best of {settings.bestOf}</p>
        </div>
        <div style={{ width: '80px' }}></div>
      </div>

      {/* Scoreboard */}
      <div className="glass-panel" style={{ display: 'flex', marginBottom: '2rem', padding: '2rem' }}>
        
        {/* Player 1 */}
        <div style={{ flex: 1, textAlign: 'center', opacity: currentPlayer === 1 ? 1 : 0.5, transition: 'var(--transition)' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: currentPlayer === 1 ? 'var(--accent-color)' : 'inherit' }}>
            {match.player1.name}
          </h3>
          <div style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            Legs: <strong style={{ color: 'var(--text-primary)' }}>{p1Legs}</strong>
          </div>
          <div style={{ 
            fontSize: '5rem', 
            fontWeight: 'bold', 
            fontVariantNumeric: 'tabular-nums',
            textShadow: currentPlayer === 1 ? '0 0 20px rgba(99, 102, 241, 0.4)' : 'none'
          }}>
            {p1Score}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', background: 'var(--panel-border)', margin: '0 2rem' }}></div>

        {/* Player 2 */}
        <div style={{ flex: 1, textAlign: 'center', opacity: currentPlayer === 2 ? 1 : 0.5, transition: 'var(--transition)' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: currentPlayer === 2 ? 'var(--accent-color)' : 'inherit' }}>
            {match.player2.name}
          </h3>
          <div style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            Legs: <strong style={{ color: 'var(--text-primary)' }}>{p2Legs}</strong>
          </div>
          <div style={{ 
            fontSize: '5rem', 
            fontWeight: 'bold', 
            fontVariantNumeric: 'tabular-nums',
            textShadow: currentPlayer === 2 ? '0 0 20px rgba(99, 102, 241, 0.4)' : 'none'
          }}>
            {p2Score}
          </div>
        </div>

      </div>

      {/* Input Area */}
      <div className="glass-panel" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--text-secondary)' }}>
          Enter Score for <strong style={{ color: 'var(--text-primary)' }}>
            {currentPlayer === 1 ? match.player1.name : match.player2.name}
          </strong>
        </div>

        <div style={{ 
          background: 'rgba(0,0,0,0.3)', 
          padding: '1rem', 
          borderRadius: '12px', 
          fontSize: '2.5rem', 
          textAlign: 'center',
          marginBottom: '1rem',
          minHeight: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--panel-border)'
        }}>
          {inputValue || <span style={{ opacity: 0.3 }}>0</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
          {[1,2,3,4,5,6,7,8,9].map(num => (
            <button key={num} className="secondary" style={{ fontSize: '1.5rem', padding: '1rem' }} onClick={() => handleInput(num.toString())}>
              {num}
            </button>
          ))}
          <button className="secondary" style={{ fontSize: '1.5rem', padding: '1rem' }} onClick={handleUndo}>
            <Undo size={24} />
          </button>
          <button className="secondary" style={{ fontSize: '1.5rem', padding: '1rem' }} onClick={() => handleInput('0')}>
            0
          </button>
          <button className="danger" style={{ fontSize: '1.5rem', padding: '1rem' }} onClick={handleBackspace}>
            <X size={24} />
          </button>
        </div>
        
        <button 
            style={{ width: '100%', marginTop: '1rem', padding: '1.25rem', fontSize: '1.5rem' }} 
            onClick={handleEnter}
            disabled={inputValue === ''}
        >
          Submit Score <Check size={24} style={{ marginLeft: '0.5rem' }} />
        </button>
      </div>

    </div>
  );
}
