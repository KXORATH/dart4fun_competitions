import React, { useState, useEffect } from 'react';
import { Target, ArrowRight } from 'lucide-react';

const DartboardSVG = ({ animate }) => (
  <svg 
    viewBox="0 0 100 100" 
    className={`dartboard-wrapper ${animate ? 'board-hit' : ''}`} 
    style={{ width: '280px', height: '280px', filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.5))', zIndex: 1, position: 'relative' }}
  >
    <circle cx="50" cy="50" r="48" fill="#0a0a0b" />
    
    {/* Base sectors using alternating colors - approximated by a backplate and segments */}
    <circle cx="50" cy="50" r="38" fill="#f5b800" stroke="#0a0a0b" strokeWidth="0.5" />
    <circle cx="50" cy="50" r="38" fill="none" stroke="#26262e" strokeWidth="76" strokeDasharray="11.9 11.9" opacity="0.9" />

    {/* Outer ring - Doubles */}
    <circle cx="50" cy="50" r="36" fill="none" stroke="#ff5350" strokeWidth="4" strokeDasharray="11.3 11.3" />
    <circle cx="50" cy="50" r="36" fill="none" stroke="#4a8bff" strokeWidth="4" strokeDasharray="0 11.3 11.3 0" />
    
    {/* Inner ring - Trebles */}
    <circle cx="50" cy="50" r="20" fill="none" stroke="#ff5350" strokeWidth="4" strokeDasharray="6.28 6.28" />
    <circle cx="50" cy="50" r="20" fill="none" stroke="#4a8bff" strokeWidth="4" strokeDasharray="0 6.28 6.28 0" />
    
    {/* Bullseyes */}
    <circle cx="50" cy="50" r="8" fill="#4a8bff" stroke="#0a0a0b" strokeWidth="1" />
    <circle cx="50" cy="50" r="4" fill="#ff5350" />
    
    {/* Wireframe */}
    {Array.from({length: 10}).map((_, i) => {
      const angle = i * Math.PI / 10;
      return (
       <line 
          key={i} 
          x1={50 + 4 * Math.cos(angle)} 
          y1={50 + 4 * Math.sin(angle)} 
          x2={50 + 48 * Math.cos(angle)} 
          y2={50 + 48 * Math.sin(angle)} 
          stroke="#fff" 
          strokeWidth="0.5" 
          opacity="0.4" 
        />
      );
    })}
    
    {/* Outer border numbers (simplified dots for aesthetics) */}
    {Array.from({length: 20}).map((_, i) => {
      const angle = (i + 0.5) * Math.PI / 10;
      return (
        <circle 
          key={`dot-${i}`}
          cx={50 + 44 * Math.cos(angle)} 
          cy={50 + 44 * Math.sin(angle)} 
          r="1"
          fill="#cbd5e1"
          opacity="0.5"
        />
      );
    })}
  </svg>
);

const DartSVG = ({ phase }) => {
  let className = 'dart-hidden';
  if (phase === 'aiming') className = 'dart-hover';
  if (phase === 'flying') className = 'dart-fly';
  if (phase === 'hit' || phase === 'revealed') className = 'dart-embedded';

  return (
    <div className={`dart-container ${className}`} style={{ position: 'absolute', top: '50%', left: '50%', marginTop: '-30px', marginLeft: '-30px', zIndex: 10 }}>
      {/* Visual center of dart is around 45, 45 */}
      <svg viewBox="0 0 100 100" width="80" height="80">
        <defs>
            <filter id="dart-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="2" dy="5" stdDeviation="3" floodColor="#000" floodOpacity="0.6"/>
            </filter>
        </defs>
        <g filter="url(#dart-shadow)">
            {/* Flight */}
            <path d="M 5 5 L 35 15 L 40 40 L 15 35 Z" fill="#4a8bff" />
            <path d="M 5 5 L 15 35 L 40 40 L 35 15 Z" fill="#4a8bff" />
            {/* Shaft */}
            <path d="M 25 25 L 60 60" stroke="#a4a6ad" strokeWidth="6" strokeLinecap="round" />
            {/* Barrel */}
            <path d="M 50 50 L 70 70" stroke="#f5b800" strokeWidth="10" strokeLinecap="round" />
            <path d="M 54 54 L 66 66" stroke="#f5b800" strokeWidth="10" strokeDasharray="2 2" strokeLinecap="round" />
            {/* Point */}
            <path d="M 68 68 L 90 90 L 71 71 Z" fill="#9ca3af" stroke="#64748b" strokeWidth="2" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
}

export default function GroupDrawAnimation({ drawData, initialGroups, onFinish }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState('idle'); // idle, aiming, flying, hit, revealed, done
  const [groups, setGroups] = useState(initialGroups.map(g => ({ ...g, players: [] })));

  useEffect(() => {
    if (currentIndex >= drawData.length) {
      setTimeout(() => setPhase('done'), 1000);
      return;
    }

    const currentDraw = drawData[currentIndex];

    // Sequence for one player
    setPhase('aiming');
    
    // Dart flies
    const flyingTimer = setTimeout(() => {
      setPhase('flying');
    }, 1200); 

    // Dart hits board
    const hitTimer = setTimeout(() => {
        setPhase('hit');
    }, 1600); 

    // Reveal target group text
    const revealedTimer = setTimeout(() => {
        setPhase('revealed');
        
        // Add player to the group state to visually update the bottom list
        setGroups(prev => prev.map(g => {
            if (g.id === currentDraw.groupId) {
                return { ...g, players: [...g.players, currentDraw.player] };
            }
            return g;
        }));
    }, 2200); 

    // Wait and start next
    const nextTimer = setTimeout(() => {
        setCurrentIndex(c => c + 1);
    }, 3800); 

    return () => {
      clearTimeout(flyingTimer);
      clearTimeout(hitTimer);
      clearTimeout(revealedTimer);
      clearTimeout(nextTimer);
    };
  }, [currentIndex, drawData]);

  const isDrawing = currentIndex < drawData.length;
  const currentDraw = isDrawing ? drawData[currentIndex] : null;
  const targetGroupHighlight = (phase === 'hit' || phase === 'revealed') ? (currentDraw && currentDraw.groupId) : null;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* Top Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: 0 }}>
          <Target className={phase === 'hit' ? 'animate-bounce' : ''} />
          Group Draw
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          {isDrawing ? `Player ${currentIndex + 1} of ${drawData.length}` : 'All players drawn!'}
        </p>
      </div>

      {/* Main Animation Area */}
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden', marginBottom: '2rem', minHeight: '400px', paddingTop: '2rem' }}>
        
        {isDrawing && (
          <div style={{ textAlign: 'center', zIndex: 20, marginBottom: '2rem', background: 'rgba(15, 17, 23, 0.7)', padding: '1rem 3rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
            <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Drawing Group For...</div>
            <div className="reveal-text" style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-color)', textShadow: '0 4px 12px rgba(0,0,0,0.8)', marginTop: '0.5rem' }}>
              {currentDraw.player.name}
            </div>
          </div>
        )}

        {/* Dartboard and Dart setup */}
        <div style={{ position: 'relative' }}>
          <DartboardSVG animate={phase === 'hit'} />
          {isDrawing && <DartSVG phase={phase} />}
        </div>

        {/* Target Group Reveal */}
        {isDrawing && phase === 'revealed' && (
          <div className="reveal-text" style={{ position: 'absolute', bottom: '15%', zIndex: 20 }}>
             <div style={{ background: 'var(--blue-color)', color: '#fff', padding: '0.5rem 1.5rem', borderRadius: '50px', fontSize: '1.5rem', fontWeight: 'bold', boxShadow: '0 8px 24px rgba(74, 139, 255, 0.4)' }}>
               {(function() {
                 const g = groups.find(g => g.id === currentDraw.groupId);
                 return g ? g.name : '';
               })()}
             </div>
          </div>
        )}

        {phase === 'done' && (
          <div className="animate-slide-up" style={{ textAlign: 'center', position: 'absolute', top: '50%', transform: 'translateY(-50%)', zIndex: 20 }}>
             <h3 style={{ fontSize: '2.5rem', color: 'var(--success-color)', marginBottom: '1.5rem' }}>Draw Complete!</h3>
             <button onClick={onFinish} style={{ fontSize: '1.2rem', padding: '1rem 2.5rem' }}>
                Continue to Tournament <ArrowRight />
             </button>
          </div>
        )}
      </div>

      {/* Groups Display */}
      <div className="grid-cols-2 lg:grid-cols-4" style={{ gap: '1rem' }}>
        {groups.map(g => (
          <div 
            key={g.id} 
            className={`glass-panel group-card ${targetGroupHighlight === g.id ? 'highlight-group' : ''}`}
            style={{ padding: '1rem' }}
          >
            <h4 style={{ textAlign: 'center', marginBottom: '1rem', color: targetGroupHighlight === g.id ? 'var(--accent-color)' : 'white' }}>
              {g.name}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {g.players.map((p, idx) => (
                <div key={idx} className="animate-fade-in" style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '6px', textAlign: 'center', fontWeight: '500' }}>
                  {p.name}
                </div>
              ))}
              {g.players.length === 0 && (
                 <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '0.5rem' }}>Empty</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
