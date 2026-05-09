import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Check, Delete, Undo, Eye, EyeOff, Keyboard } from 'lucide-react';

export default function MatchView({ match, settings, onMatchFinish, onLiveUpdate, onBack }) {
  console.log('[MatchView] render, match.id:', (match && match.id), 'onLiveUpdate type:', typeof onLiveUpdate);

  const [p1Legs, setP1Legs] = useState((match.liveState && match.liveState.p1Legs !== undefined && match.liveState.p1Legs !== null) ? match.liveState.p1Legs : (match.p1Legs !== undefined && match.p1Legs !== null ? match.p1Legs : 0));
  const [p2Legs, setP2Legs] = useState((match.liveState && match.liveState.p2Legs !== undefined && match.liveState.p2Legs !== null) ? match.liveState.p2Legs : (match.p2Legs !== undefined && match.p2Legs !== null ? match.p2Legs : 0));
  
  const [p1Score, setP1Score] = useState((match.liveState && match.liveState.p1Score !== undefined) ? match.liveState.p1Score : settings.startingScore);
  const [p2Score, setP2Score] = useState((match.liveState && match.liveState.p2Score !== undefined) ? match.liveState.p2Score : settings.startingScore);

  const [bullseyeWinner, setBullseyeWinner] = useState(() => {
    if (match.liveState && match.liveState.bullseyeWinner) return match.liveState.bullseyeWinner;
    const hasHistory = (match.liveState && match.liveState.history && match.liveState.history.length > 0) || (match.p1Legs > 0) || (match.p2Legs > 0);
    return hasHistory ? 1 : null;
  });
  
  const [currentPlayer, setCurrentPlayer] = useState((match.liveState && match.liveState.currentPlayer !== undefined) ? match.liveState.currentPlayer : 1);
  const [inputValue, setInputValue] = useState((match.liveState && match.liveState.inputValue !== undefined) ? match.liveState.inputValue : '');
  
  const [history, setHistory] = useState((match.liveState && match.liveState.history) || []);
  const [legHistory, setLegHistory] = useState((match.liveState && match.liveState.legHistory) || []);
  
  const [p1Visits, setP1Visits] = useState((match.liveState && match.liveState.p1Visits !== undefined) ? match.liveState.p1Visits : 0);
  const [p2Visits, setP2Visits] = useState((match.liveState && match.liveState.p2Visits !== undefined) ? match.liveState.p2Visits : 0);
  
  const [p1Darts, setP1Darts] = useState((match.liveState && match.liveState.p1Darts !== undefined) ? match.liveState.p1Darts : 0);
  const [p2Darts, setP2Darts] = useState((match.liveState && match.liveState.p2Darts !== undefined) ? match.liveState.p2Darts : 0);
  
  const [pendingDartPrompt, setPendingDartPrompt] = useState((match.liveState && match.liveState.pendingDartPrompt !== undefined) ? match.liveState.pendingDartPrompt : null);
  const lastRemoteSnapshotRef = useRef(null);
  const lastLocalSnapshotRef = useRef(null);
  
  const [isSpectator, setIsSpectator] = useState(false);
  const [keyboardType, setKeyboardType] = useState('standard');
  const [matchFinishedState, setMatchFinishedState] = useState(null);
  
  const holdTimeoutRef = useRef(null);
  const [isHoldingSubmit, setIsHoldingSubmit] = useState(false);
  
  const legsToWin = Math.ceil(settings.bestOf / 2);

  useEffect(() => {
    console.log('[MatchView] liveState effect uruchomiony, liveState:', match.liveState ? 'jest' : 'brak');
    if (!match.liveState) return;
    
    const remoteStr = JSON.stringify(match.liveState);
    if (remoteStr === lastLocalSnapshotRef.current || remoteStr === lastRemoteSnapshotRef.current) {
        return; // We already processed this or it came from us
    }
    lastRemoteSnapshotRef.current = remoteStr;
    
    setP1Legs(match.liveState.p1Legs !== null ? match.liveState.p1Legs : 0);
    setP2Legs(match.liveState.p2Legs !== null ? match.liveState.p2Legs : 0);
    setP1Score(match.liveState.p1Score);
    setP2Score(match.liveState.p2Score);
    setCurrentPlayer(match.liveState.currentPlayer);
    setInputValue(match.liveState.inputValue);
    setHistory(match.liveState.history);
    setLegHistory(match.liveState.legHistory);
    setP1Visits(match.liveState.p1Visits);
    setP2Visits(match.liveState.p2Visits);
    setP1Darts(match.liveState.p1Darts !== undefined ? match.liveState.p1Darts : 0);
    setP2Darts(match.liveState.p2Darts !== undefined ? match.liveState.p2Darts : 0);
    setPendingDartPrompt(match.liveState.pendingDartPrompt !== undefined ? match.liveState.pendingDartPrompt : null);
    setBullseyeWinner(match.liveState.bullseyeWinner !== undefined ? match.liveState.bullseyeWinner : null);
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
      pendingDartPrompt,
      bullseyeWinner
    };
    const serializedSnapshot = JSON.stringify(snapshot);

    console.log('[MatchView] onLiveUpdate effect uruchomiony');

    if (serializedSnapshot === lastLocalSnapshotRef.current || serializedSnapshot === lastRemoteSnapshotRef.current) {
      console.log('[MatchView] snapshot bez zmian lub z remote, pomijam onLiveUpdate');
      return;
    }

    console.log('[MatchView] wywołuję onLiveUpdate, p1Score:', p1Score, 'p2Score:', p2Score);
    lastLocalSnapshotRef.current = serializedSnapshot;
    onLiveUpdate(snapshot);
  }, [p1Legs, p2Legs, p1Score, p2Score, currentPlayer, inputValue, history, legHistory, p1Visits, p2Visits, p1Darts, p2Darts, pendingDartPrompt, bullseyeWinner, onLiveUpdate]);
  
  const handleInput = (val) => {
    if (inputValue.length < 3) {
      setInputValue(prev => prev + val);
    }
  };

  const handleBackspace = () => {
    setInputValue(prev => prev.slice(0, -1));
  };

  const handleEnter = (isRemaining = false, forceVal = null) => {
    let scoreVal = 0;
    const valToUse = forceVal !== null ? forceVal : inputValue;
    const currentScore = currentPlayer === 1 ? p1Score : p2Score;
    
    if (valToUse !== '') {
        let parsedVal = parseInt(valToUse, 10);
        if (isRemaining) {
            scoreVal = currentScore - parsedVal;
            if (scoreVal < 0 || scoreVal > 180) {
                 alert("Invalid remaining score (calculated throw must be 0-180)");
                 setInputValue('');
                 return;
            }
        } else {
            scoreVal = parsedVal;
            if (scoreVal > 180 || scoreVal < 0) {
                alert("Invalid score (must be 0-180)");
                setInputValue('');
                return;
            }
        }
    }

    let newScore = currentScore - scoreVal;
    
    let isBust = false;
    let wonLeg = false;

    if (valToUse === '') {
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

    const matchNameText = match.name || (match.player1 && match.player2 ? `${match.player1.name} vs ${match.player2.name}` : 'Match');
    const currentLegNum = p1Legs + p2Legs + 1;

    setHistory(prev => [...prev, {
      playerId: currentPlayer === 1 ? match.player1.id : match.player2.id,
      score: isBust ? 0 : scoreVal,
      isBust,
      p1Remaining: p1Score,
      p2Remaining: p2Score,
      dartsThrown,
      matchId: match.id,
      matchName: matchNameText,
      legNumber: currentLegNum
    }]);

    if (wonLeg) {
        setHistory(prev => [...prev, {
            playerId: currentPlayer === 1 ? match.player1.id : match.player2.id,
            type: 'LEG_WIN',
            numDarts: (currentPlayer === 1 ? p1Darts : p2Darts) + dartsThrown,
            checkout: scoreVal,
            matchId: match.id,
            matchName: matchNameText,
            legNumber: currentLegNum
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
          setMatchFinishedState({ p1Legs: newP1Legs, p2Legs: newP2Legs });
      } else {
          setP1Score(settings.startingScore);
          setP2Score(settings.startingScore);
          setP1Visits(0);
          setP2Visits(0);
          setP1Darts(0);
          setP2Darts(0);
          setLegHistory([]);
          const totalLegsPlayed = newP1Legs + newP2Legs;
          setCurrentPlayer((totalLegsPlayed % 2) === 0 ? bullseyeWinner : (bullseyeWinner === 1 ? 2 : 1));
      }
  };

  const confirmMatchFinish = () => {
      if (matchFinishedState) {
          onMatchFinish(matchFinishedState.p1Legs, matchFinishedState.p2Legs, history);
      }
  };

  const undoMatchFinish = () => {
      setMatchFinishedState(null);
      handleUndo();
  };

  const handleQuickScore = (val) => {
      setInputValue(val.toString());
      handleEnter(false, val.toString());
  };

  const startHoldSubmit = (e) => {
      if (e) { e.preventDefault(); }
      if (inputValue === '') return;
      setIsHoldingSubmit(true);
      holdTimeoutRef.current = setTimeout(() => {
          setIsHoldingSubmit(false);
          handleEnter(true);
          holdTimeoutRef.current = null;
      }, 1000);
  };

  const endHoldSubmit = (e) => {
      if (e) { e.preventDefault(); }
      if (holdTimeoutRef.current) {
          clearTimeout(holdTimeoutRef.current);
          holdTimeoutRef.current = null;
          if (isHoldingSubmit) {
              setIsHoldingSubmit(false);
              handleEnter(false);
          }
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

  if (!bullseyeWinner) {
      return (
        <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <button className="secondary" onClick={onBack}>
              <ArrowLeft size={18} /> Back
            </button>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ margin: 0 }}>Match Setup</h2>
            </div>
            <div style={{ width: '80px' }}></div>
          </div>
          <div className="glass-panel text-center" style={{ maxWidth: '400px', margin: '2rem auto' }}>
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Who was closer to the bull?</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <button className="primary" onClick={() => { setBullseyeWinner(1); setCurrentPlayer(1); }}>{match.player1.name}</button>
                  <button className="primary" onClick={() => { setBullseyeWinner(2); setCurrentPlayer(2); }}>{match.player2.name}</button>
              </div>
          </div>
        </div>
      );
  }

  return (
    <div className="animate-fade-in match-view-wrapper" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="flex match-view-header" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <button className="secondary" onClick={onBack}>
          <ArrowLeft size={18} /> Back
        </button>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ margin: 0 }}>Match View</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Best of {settings.bestOf}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="secondary" style={{ padding: '0.5rem' }} onClick={() => setIsSpectator(!isSpectator)} title="Spectator View">
                {isSpectator ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        </div>
      </div>

      {matchFinishedState && (
        <div className="glass-panel text-center" style={{ width: '100%', maxWidth: '400px', margin: '2rem auto', animation: 'fade-in 0.2s', zIndex: 10 }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--success-color)' }}>Match Finished!</h3>
            <p style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>
                {match.player1.name} <strong style={{color: 'white'}}>{matchFinishedState.p1Legs}</strong> - <strong style={{color: 'white'}}>{matchFinishedState.p2Legs}</strong> {match.player2.name}
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button className="secondary" onClick={undoMatchFinish}>
                    <Undo size={18} style={{ marginRight: '0.5rem' }} /> Undo
                </button>
                <button className="primary" onClick={confirmMatchFinish}>
                    Confirm Result <Check size={18} style={{ marginLeft: '0.5rem' }} />
                </button>
            </div>
        </div>
      )}

      {/* Scoreboard */}
      <div className="glass-panel scoreboard-panel">
        {/* Top Row: Names */}
        <div className="player-name-row">
          <h3 className="player-name" style={{ color: currentPlayer === 1 ? 'var(--accent-color)' : 'inherit', opacity: currentPlayer === 1 ? 1 : 0.5 }}>
            {match.player1.name}
          </h3>
          <div className="player-name-spacer"></div>
          <h3 className="player-name" style={{ color: currentPlayer === 2 ? 'var(--accent-color)' : 'inherit', opacity: currentPlayer === 2 ? 1 : 0.5 }}>
            {match.player2.name}
          </h3>
        </div>

        {/* Middle Row: Scores and Legs */}
        <div className="scoreboard-row">
          {/* P1 Score */}
          <div className="score-cell" style={{ textShadow: currentPlayer === 1 ? '0 0 20px rgba(99, 102, 241, 0.4)' : 'none', opacity: currentPlayer === 1 ? 1 : 0.5 }}>
            {p1Score}
          </div>
          
          {/* Legs */}
          <div className="legs-cell">
            <div className="leg-box">
              {p1Legs}
            </div>
            <div className="leg-divider">-</div>
            <div className="leg-box">
              {p2Legs}
            </div>
          </div>

          {/* P2 Score */}
          <div className="score-cell" style={{ textShadow: currentPlayer === 2 ? '0 0 20px rgba(99, 102, 241, 0.4)' : 'none', opacity: currentPlayer === 2 ? 1 : 0.5 }}>
            {p2Score}
          </div>
        </div>
      </div>

      {/* Statistics under scoreboard */}
      <div className="match-stats-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '0 1rem' }}>
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

      {!isSpectator && !matchFinishedState && (
          pendingDartPrompt ? (
            <div className="glass-panel text-center pending-panel" style={{ width: '100%', maxWidth: '400px', margin: '0 auto', animation: 'fade-in 0.2s', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
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
          <div className="glass-panel input-panel" style={{ width: '100%', maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
            <div className="input-prompt" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ color: 'var(--text-secondary)' }}>
                Enter Score for <strong style={{ color: 'var(--text-primary)' }}>
                  {currentPlayer === 1 ? match.player1.name : match.player2.name}
                </strong>
              </div>
              <button className="secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => setKeyboardType(t => t === 'standard' ? 'quick' : 'standard')} title="Switch Keyboard">
                 <Keyboard size={16} />
              </button>
            </div>

            <div className="input-display-box" style={{ 
              background: 'rgba(0,0,0,0.3)', 
              borderRadius: '12px', 
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--panel-border)',
              marginBottom: '1rem',
              height: '50px',
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}>
              {inputValue || <span style={{ opacity: 0.3 }}>0</span>}
            </div>

            {keyboardType === 'standard' ? (
                <div className="numpad-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {[1,2,3,4,5,6,7,8,9].map(num => (
                    <button key={num} className="secondary numpad-btn" onClick={() => handleInput(num.toString())}>
                      {num}
                    </button>
                  ))}
                  <button className="secondary numpad-btn" onClick={handleUndo}>
                    <Undo size={24} />
                  </button>
                  <button className="secondary numpad-btn" onClick={() => handleInput('0')}>
                    0
                  </button>
                  <button className="secondary numpad-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={handleBackspace}>
                    <Delete size={32} strokeWidth={1.5} />
                  </button>
                </div>
            ) : (
                <div className="numpad-grid quick-scores-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  {[26, 41, 45, 60, 81, 85, 100, 140].map(num => (
                    <button key={num} className="secondary numpad-btn" onClick={() => handleQuickScore(num)}>
                      {num}
                    </button>
                  ))}
                  <button className="secondary numpad-btn" style={{ gridColumn: '1 / -1' }} onClick={handleUndo}>
                      <Undo size={24} style={{ marginRight: '0.5rem' }} /> Undo
                  </button>
                </div>
            )}
            
            <button 
                className={`submit-btn ${isHoldingSubmit ? 'holding' : ''}`}
                style={{ width: '100%', marginTop: '1rem', position: 'relative', overflow: 'hidden' }} 
                onMouseDown={startHoldSubmit}
                onMouseUp={endHoldSubmit}
                onMouseLeave={endHoldSubmit}
                onTouchStart={startHoldSubmit}
                onTouchEnd={endHoldSubmit}
            >
              <span style={{ position: 'relative', zIndex: 2, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isHoldingSubmit ? 'Sending Remaining...' : (inputValue === '' ? ((currentPlayer === 1 ? p1Score : p2Score) > 180 ? 'Submit 0' : 'Bust') : 'Submit Score')} <Check size={24} style={{ marginLeft: '0.5rem' }} />
              </span>
            </button>
          </div>
          )
      )}

    </div>
  );
}