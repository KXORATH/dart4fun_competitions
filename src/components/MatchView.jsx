import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Check, Delete, Undo } from 'lucide-react';

export default function MatchView({ match, settings, onMatchFinish, onLiveUpdate, onBack }) {
  console.log('[MatchView] render, match.id:', match?.id, 'onLiveUpdate type:', typeof onLiveUpdate);

  const [p1Legs, setP1Legs] = useState(match.liveState?.p1Legs ?? match.p1Legs ?? 0);
  const [p2Legs, setP2Legs] = useState(match.liveState?.p2Legs ?? match.p2Legs ?? 0);
  
  const [p1Score, setP1Score] = useState(match.liveState?.p1Score ?? settings.startingScore);
  const [p2Score, setP2Score] = useState(match.liveState?.p2Score ?? settings.startingScore);
  
  const [currentPlayer, setCurrentPlayer] = useState(match.liveState?.currentPlayer ?? 1);
  const [inputValue, setInputValue] = useState(match.liveState?.inputValue ?? '');
  
  const [history, setHistory] = useState(match.liveState?.history ?? []);
  const [legHistory, setLegHistory] = useState(match.liveState?.legHistory ?? []);
  
  const [p1Visits, setP1Visits] = useState(match.liveState?.p1Visits ?? 0);
  const [p2Visits, setP2Visits] = useState(match.liveState?.p2Visits ?? 0);
  
  const [p1Darts, setP1Darts] = useState(match.liveState?.p1Darts ?? 0);
  const [p2Darts, setP2Darts] = useState(match.liveState?.p2Darts ?? 0);
  
  const [pendingDartPrompt, setPendingDartPrompt] = useState(match.liveState?.pendingDartPrompt ?? null);
  const lastRemoteSnapshotRef = useRef(null);
  
  const legsToWin = Math.ceil(settings.bestOf / 2);

  useEffect(() => {
    console.log('[MatchView] liveState effect uruchomiony, liveState:', match.liveState ? 'jest' : 'brak');
    if (!match.liveState) return;
    lastRemoteSnapshotRef.current = JSON.stringify(match.liveState);
    setP1Legs(match.liveState.p1Legs);
    setP2Legs(match.liveState.p2Legs);
    setP1Score(match.liveState.p1Score);
    setP2Score(match.liveState.p2Score);
    setCurrentPlayer(match.liveState.currentPlayer);
    setInputValue(match.liveState.inputValue);
    setHistory(match.liveState.history);
    setLegHistory(match.liveState.legHistory);
    setP1Visits(match.liveState.p1Visits);
    setP2Visits(match.liveState.p2Visits);
    setP1Darts(match.liveState.p1Darts ?? 0);
    setP2Darts(match.liveState.p2Darts ?? 0);
    setPendingDartPrompt(match.liveState.pendingDartPrompt ?? null);
  }, [match.liveState]);

  useEffect(() => {
    const snapshot = {
      p1Legs,
      p2Legs,
      p1Score,
      p2Score,
      currentPlayer,
      inputValue,
      history,
      legHistory,
      p1Visits,
      p2Visits,
      p1Darts,
      p2Darts,
      pendingDartPrompt
    };
    const serializedSnapshot = JSON.stringify(snapshot);

    console.log('[MatchView] onLiveUpdate effect uruchomiony');
    console.log('[MatchView] snapshot === lastRemote?', serializedSnapshot === lastRemoteSnapshotRef.current);

    if (serializedSnapshot === lastRemoteSnapshotRef.current) {
      console.log('[MatchView] snapshot bez zmian, pomijam onLiveUpdate');
      return;
    }

    console.log('[MatchView] wywołuję onLiveUpdate, p1Score:', p1Score, 'p2Score:', p2Score);
    onLiveUpdate(snapshot);
    lastRemoteSnapshotRef.current = serializedSnapshot;
  }, [p1Legs, p2Legs, p1Score, p2Score, currentPlayer, inputValue, history, legHistory, p1Visits, p2Visits, p1Darts, p2Darts, pendingDartPrompt, onLiveUpdate]);
  
  const handleInput = (val) => {
    if (inputValue.length < 3) {
      setInputValue(prev => prev + val);
    }
  };

  const handleBackspace = () => {
    setInputValue(prev => prev.slice(0, -1));
  };

  const handleEnter = () => {
    let scoreVal = 0;
    if (inputValue !== '') {
        scoreVal = parseInt(inputValue, 10);
        if (scoreVal > 180 || scoreVal < 0) {
            alert("Invalid score (must be 0-180)");
            setInputValue('');
            return;
        }
    }

    const currentScore = currentPlayer === 1 ? p1Score : p2Score;
    let newScore = currentScore - scoreVal;
    
    let isBust = false;
    let wonLeg = false;

    if (inputValue === '') {
        if (currentScore > 180) {
            isBust = false;
            scoreVal = 0;
            // Won't trigger the modal, will just process as 0 score with 3 darts
        } else {
            isBust = true;
            scoreVal = 0;
        }
    } else if (newScore < 0) {
        isBust = true;
    } else if (settings.checkoutType === 'double' && newScore === 1) {
        isBust = true;
    } else if (newScore === 0) {
        wonLeg = true;
    }

    if (isBust || wonLeg) {
        setPendingDartPrompt({ type: wonLeg ? 'win' : 'bust', score: scoreVal, isBust });
        return;
    }

    processThrow(scoreVal, false, 3);
  };

  const processThrow = (scoreVal, isBust, dartsThrown) => {
    const currentScore = currentPlayer === 1 ? p1Score : p2Score;
    let newScore = currentScore - scoreVal;
    if (isBust) newScore = currentScore;
    
    const wonLeg = (!isBust && newScore === 0);

    setLegHistory(prev => [...prev, { p1Score, p2Score, currentPlayer, p1Visits, p2Visits, p1Darts, p2Darts }]);

    if (currentPlayer === 1) {
        setP1Visits(v => v + 1);
        setP1Darts(d => d + dartsThrown);
    } else {
        setP2Visits(v => v + 1);
        setP2Darts(d => d + dartsThrown);
    }

    setHistory(prev => [...prev, {
      playerId: currentPlayer === 1 ? match.player1.id : match.player2.id,
      score: isBust ? 0 : scoreVal,
      isBust,
      p1Remaining: p1Score,
      p2Remaining: p2Score,
      dartsThrown
    }]);

    if (wonLeg) {
        setHistory(prev => [...prev, {
            playerId: currentPlayer === 1 ? match.player1.id : match.player2.id,
            type: 'LEG_WIN',
            numDarts: (currentPlayer === 1 ? p1Darts : p2Darts) + dartsThrown,
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
    setPendingDartPrompt(null);
  };

  const handleLegWin = (winnerNum) => {
      const newP1Legs = winnerNum === 1 ? p1Legs + 1 : p1Legs;
      const newP2Legs = winnerNum === 2 ? p2Legs + 1 : p2Legs;
      
      setP1Legs(newP1Legs);
      setP2Legs(newP2Legs);
      
      if (newP1Legs >= legsToWin || newP2Legs >= legsToWin) {
          onMatchFinish(newP1Legs, newP2Legs, history);
      } else {
          setP1Score(settings.startingScore);
          setP2Score(settings.startingScore);
          setP1Visits(0);
          setP2Visits(0);
          setP1Darts(0);
          setP2Darts(0);
          setLegHistory([]);
          const totalLegsPlayed = newP1Legs + newP2Legs;
          setCurrentPlayer((totalLegsPlayed % 2) === 0 ? 1 : 2);
      }
  };

  const handleUndo = () => {
      if (legHistory.length === 0) return;
      setPendingDartPrompt(null);
      const lastState = legHistory[legHistory.length - 1];
      setP1Score(lastState.p1Score);
      setP2Score(lastState.p2Score);
      setCurrentPlayer(lastState.currentPlayer);
      setP1Visits(lastState.p1Visits);
      setP2Visits(lastState.p2Visits);
      setP1Darts(lastState.p1Darts);
      setP2Darts(lastState.p2Darts);
      
      setLegHistory(prev => prev.slice(0, -1));
      setHistory(prev => prev.slice(0, -1));
      setInputValue('');
  };

  const calculateAverage = (playerNum) => {
      const playerId = playerNum === 1 ? match.player1.id : match.player2.id;
      let totalScore = 0;
      let totalDarts = 0;
      
      history.forEach(h => {
          if (h.playerId === playerId && h.type !== 'LEG_WIN') {
              totalScore += h.score || 0;
              totalDarts += h.dartsThrown || 0;
          }
      });
      
      if (totalDarts === 0) return 0;
      return (totalScore / totalDarts) * 3;
  };

  const getLastScore = (playerNum) => {
      const playerId = playerNum === 1 ? match.player1.id : match.player2.id;
      for (let i = history.length - 1; i >= 0; i--) {
          if (history[i].playerId === playerId && history[i].type !== 'LEG_WIN') {
              return history[i].score;
          }
      }
      return '-';
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
      <div className="glass-panel" style={{ marginBottom: '0.5rem', padding: '2rem' }}>
        {/* Top Row: Names */}
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '1rem' }}>
          <h3 style={{ width: '40%', textAlign: 'center', fontSize: '1.5rem', margin: 0, color: currentPlayer === 1 ? 'var(--accent-color)' : 'inherit', opacity: currentPlayer === 1 ? 1 : 0.5, transition: 'var(--transition)' }}>
            {match.player1.name}
          </h3>
          <div style={{ width: '20%' }}></div>
          <h3 style={{ width: '40%', textAlign: 'center', fontSize: '1.5rem', margin: 0, color: currentPlayer === 2 ? 'var(--accent-color)' : 'inherit', opacity: currentPlayer === 2 ? 1 : 0.5, transition: 'var(--transition)' }}>
            {match.player2.name}
          </h3>
        </div>

        {/* Middle Row: Scores and Legs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          {/* P1 Score */}
          <div style={{ width: '40%', textAlign: 'center', fontSize: 'var(--score-font-size, 5rem)', fontWeight: 'bold', fontVariantNumeric: 'tabular-nums', textShadow: currentPlayer === 1 ? '0 0 20px rgba(99, 102, 241, 0.4)' : 'none', opacity: currentPlayer === 1 ? 1 : 0.5, transition: 'var(--transition)' }}>
            {p1Score}
          </div>
          
          {/* Legs */}
          <div style={{ width: '20%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid var(--panel-border)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '3rem', fontWeight: 'bold', padding: '0.2rem 0.8rem' }}>
              {p1Legs}
            </div>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>-</div>
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid var(--panel-border)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '3rem', fontWeight: 'bold', padding: '0.2rem 0.8rem' }}>
              {p2Legs}
            </div>
          </div>

          {/* P2 Score */}
          <div style={{ width: '40%', textAlign: 'center', fontSize: 'var(--score-font-size, 5rem)', fontWeight: 'bold', fontVariantNumeric: 'tabular-nums', textShadow: currentPlayer === 2 ? '0 0 20px rgba(99, 102, 241, 0.4)' : 'none', opacity: currentPlayer === 2 ? 1 : 0.5, transition: 'var(--transition)' }}>
            {p2Score}
          </div>
        </div>
      </div>

      {/* Statistics under scoreboard */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', padding: '0 1rem' }}>
        <div style={{ textAlign: 'left', fontSize: '0.9rem' }}>
          <div style={{ color: 'var(--text-secondary)' }}>3 dart average : {(calculateAverage(1) || 0).toFixed(2)}</div>
          <div style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Darts: <strong style={{ color: 'white' }}>{p1Darts}</strong></div>
          <div style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Last score: <span style={{ color: 'white' }}>{getLastScore(1)}</span></div>
        </div>

        <div style={{ textAlign: 'right', fontSize: '0.9rem' }}>
          <div style={{ color: 'var(--text-secondary)' }}>3 dart average : {(calculateAverage(2) || 0).toFixed(2)}</div>
          <div style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Darts: <strong style={{ color: 'white' }}>{p2Darts}</strong></div>
          <div style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Last score: <span style={{ color: 'white' }}>{getLastScore(2)}</span></div>
        </div>
      </div>

      {pendingDartPrompt ? (
        <div className="glass-panel text-center" style={{ maxWidth: '400px', margin: '0 auto', animation: 'fade-in 0.2s' }}>
            <h3 style={{ marginBottom: '1rem', color: pendingDartPrompt.type === 'win' ? 'var(--success-color)' : 'var(--danger-color)' }}>
                {pendingDartPrompt.type === 'win' ? 'Leg Shot!' : 'Bust!'}
            </h3>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                How many darts did you throw?
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                <button className="primary" onClick={() => processThrow(pendingDartPrompt.score, pendingDartPrompt.isBust, 1)}>1 Dart</button>
                <button className="primary" onClick={() => processThrow(pendingDartPrompt.score, pendingDartPrompt.isBust, 2)}>2 Darts</button>
                <button className="primary" onClick={() => processThrow(pendingDartPrompt.score, pendingDartPrompt.isBust, 3)}>3 Darts</button>
            </div>
            <button className="secondary" style={{ width: '100%' }} onClick={() => setPendingDartPrompt(null)}>
                Cancel
            </button>
        </div>
      ) : (
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
          <button className="secondary" style={{ fontSize: '1.5rem', padding: '1rem', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }} onClick={handleBackspace}>
            <Delete size={32} strokeWidth={1.5} />
          </button>
        </div>
        
        <button 
            style={{ width: '100%', marginTop: '1rem', padding: '1.25rem', fontSize: '1.5rem' }} 
            onClick={handleEnter}
        >
          {inputValue === '' ? ((currentPlayer === 1 ? p1Score : p2Score) > 180 ? 'Submit 0' : 'Bust') : 'Submit Score'} <Check size={24} style={{ marginLeft: '0.5rem' }} />
        </button>
      </div>
      )}

    </div>
  );
}