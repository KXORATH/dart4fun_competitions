import React from 'react';
import { Target, Trophy } from 'lucide-react';

export default function MatchFlow({ players, globalHistory, settings }) {
  // Parse globalHistory into discrete legs
  const legs = [];
  let currentLeg = [];
  let p1LegWins = 0;
  let p2LegWins = 0;
  
  // Need to figure out who threw first in the leg.
  // The first throw in a leg belongs to the starter.
  let legStarterId = null;

  for (let i = 0; i < globalHistory.length; i++) {
    const throwData = globalHistory[i];
    
    if (currentLeg.length === 0 && throwData.type !== 'LEG_WIN') {
        legStarterId = throwData.playerId;
    }

    if (throwData.type === 'LEG_WIN') {
        if (throwData.playerId === players[0].id) p1LegWins++;
        else p2LegWins++;
        
        legs.push({
            p1Score: p1LegWins,
            p2Score: p2LegWins,
            starterId: legStarterId,
            throws: [...currentLeg],
            winnerId: throwData.playerId
        });
        currentLeg = [];
        legStarterId = null;
    } else {
        currentLeg.push(throwData);
    }
  }
  
  // If match in progress, push the current leg
  if (currentLeg.length > 0) {
      legs.push({
          p1Score: p1LegWins, // Score before this leg finishes
          p2Score: p2LegWins,
          starterId: legStarterId,
          throws: [...currentLeg],
          winnerId: null
      });
  }

  const renderBadge = (score) => {
      if (score === 180) {
          return <span className="badge badge-180">180</span>;
      } else if (score >= 140) {
          return <span className="badge badge-140">140+</span>;
      }
      return null;
  };

  return (
    <div className="animate-slide-up match-flow-container">
      <div className="glass-panel text-center mb-1">
        <h2 style={{ fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px', margin: 0 }}>Rzut por rzucie (Throw by Throw)</h2>
      </div>

      <div className="glass-panel" style={{ padding: '0' }}>
        {legs.map((leg, idx) => (
          <div key={idx} className="leg-flow-row" style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            
            <div className="flex" style={{ justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              {/* P1 Service Indicator */}
              <div style={{ width: '100px', textAlign: 'right' }}>
                  {leg.starterId !== players[0].id && leg.winnerId === players[0].id && (
                      <span className="badge badge-break">PRZEŁAMANIE</span>
                  )}
                  {leg.starterId === players[0].id && <Target size={16} color="var(--text-secondary)" />}
              </div>
              
              {/* Score display for this leg (e.g. 1 - 0) */}
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                  {leg.p1Score} - {leg.p2Score}
              </div>

               {/* P2 Service Indicator */}
               <div style={{ width: '100px', textAlign: 'left' }}>
                  {leg.starterId === players[1].id && <Target size={16} color="var(--text-secondary)" />}
                  {leg.starterId !== players[1].id && leg.winnerId === players[1].id && (
                      <span className="badge badge-break">PRZEŁAMANIE</span>
                  )}
              </div>
            </div>

            <div style={{ lineHeight: '2.5', textAlign: 'center', fontSize: '1.1rem', wordBreak: 'break-word' }}>
                {leg.throws.map((t, tIdx) => {
                    const isLast = tIdx === leg.throws.length - 1;
                    
                    // We need to calculate remaining score based on the throw.
                    // Instead of calculating backwards, we use p1Remaining and p2Remaining saved in state.
                    let p1Rem = t.p1Remaining;
                    let p2Rem = t.p2Remaining;
                    
                    // The throw state gets recorded *before* the score is subtracted in MatchView,
                    // wait, no, processThrow sets remaining to the actual remaining AFTER the throw.
                    // Our processThrow code: p1Remaining: p1Score, which is the score BEFORE this turn.
                    // Ah! processThrow does:
                    // `const currentScore = ... p1Score`
                    // `setHistory(..., p1Remaining: p1Score)`. Yes! p1Score hasn't been updated yet in the effect.
                    // Wait, so p1Remaining is the score BEFORE the throw!
                    // Let's actually recalculate it linearly just to be strictly accurate.
                    
                    return (
                        <React.Fragment key={tIdx}>
                            <span style={{ fontWeight: t.isBust ? 'normal' : 'bold', color: t.isBust ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                                {t.playerId === players[0].id ? `${t.p1Remaining - (t.isBust ? 0 : t.score)}:${t.p2Remaining}` : `${t.p1Remaining}:${t.p2Remaining - (t.isBust ? 0 : t.score)}`}
                            </span>
                            {renderBadge(t.score)}
                            {!isLast && <span style={{ color: 'var(--text-secondary)', margin: '0 4px' }}>,</span>}
                        </React.Fragment>
                    );
                })}
            </div>

          </div>
        ))}

        {legs.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No throws recorded yet.
            </div>
        )}
      </div>
    </div>
  );
}
