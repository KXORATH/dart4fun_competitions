import React from 'react';
import { Target, Trophy } from 'lucide-react';

export default function MatchFlow({ players, globalHistory, settings }) {
  // Helper to get player info
  const getPlayer = (id) => players.find(p => p.id === id) || { id, name: 'Unknown' };

  // 1. Group by Match
  const matchesMap = {};
  
  globalHistory.forEach(throwData => {
     const mId = throwData.matchId || 'unknown_match';
     if (!matchesMap[mId]) {
         matchesMap[mId] = {
             matchId: mId,
             matchName: throwData.matchName || 'Match',
             legsMap: {}
         };
     }
     
     const lNum = throwData.legNumber || 1;
     if (!matchesMap[mId].legsMap[lNum]) {
         matchesMap[mId].legsMap[lNum] = {
             legNumber: lNum,
             throws: [],
             winnerId: null,
             starterId: null
         };
     }
     
     if (throwData.type === 'LEG_WIN') {
         matchesMap[mId].legsMap[lNum].winnerId = throwData.playerId;
     } else {
         if (matchesMap[mId].legsMap[lNum].throws.length === 0) {
             matchesMap[mId].legsMap[lNum].starterId = throwData.playerId;
         }
         matchesMap[mId].legsMap[lNum].throws.push(throwData);
     }
  });

  const renderBadge = (score) => {
      if (score === 180) {
          return <span className="badge badge-180">180</span>;
      } else if (score >= 140) {
          return <span className="badge badge-140">140+</span>;
      }
      return null;
  };

  const renderedMatches = Object.values(matchesMap).map(m => {
      // Find the two players involved in this match from throws
      const legKeys = Object.keys(m.legsMap);
      if (legKeys.length === 0) return null;
      
      const allThrows = Object.values(m.legsMap).flatMap(l => l.throws);
      const uniquePlayerIds = [...new Set(allThrows.map(t => t.playerId))];
      
      const p1Id = uniquePlayerIds[0];
      const p2Id = uniquePlayerIds[1] || 'no_p2';
      
      const p1 = getPlayer(p1Id);
      const p2 = getPlayer(p2Id);
      
      let p1Wins = 0;
      let p2Wins = 0;

      const sortedLegNums = legKeys.sort((a, b) => parseInt(a) - parseInt(b));
      
      return (
          <div key={m.matchId} style={{ marginBottom: '2rem' }}>
              <div style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--accent-color)' }}>{m.matchName}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {p1.name} vs {p2.name}
                  </span>
              </div>
              
              {sortedLegNums.map(lNum => {
                  const l = m.legsMap[lNum];
                  if (l.throws.length === 0) return null; // Skip empty legs
                  
                  const viewScore1 = p1Wins;
                  const viewScore2 = p2Wins;
                  
                  if (l.winnerId === p1Id) p1Wins++;
                  else if (l.winnerId === p2Id) p2Wins++;

                  return (
                      <div key={`${m.matchId}-leg-${lNum}`} className="leg-flow-row" style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="flex" style={{ justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                          <div style={{ width: '120px', textAlign: 'right' }}>
                              {l.starterId !== p1Id && l.winnerId === p1Id && (
                                  <span className="badge badge-break" style={{ marginRight: '4px' }}>PRZEŁAMANIE</span>
                              )}
                              <span style={{ fontWeight: l.starterId === p1Id ? 'bold' : 'normal', opacity: l.starterId === p1Id ? 1 : 0.5, marginRight: '4px' }}>{p1.name}</span>
                              {l.starterId === p1Id && <Target size={16} color="var(--text-secondary)" style={{ verticalAlign: 'middle' }} />}
                          </div>
                          
                          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', minWidth: '60px', textAlign: 'center' }}>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Leg {lNum}</span>
                              {viewScore1} - {viewScore2}
                          </div>

                          <div style={{ width: '120px', textAlign: 'left' }}>
                              {l.starterId === p2Id && <Target size={16} color="var(--text-secondary)" style={{ verticalAlign: 'middle', marginRight: '4px' }} />}
                              <span style={{ fontWeight: l.starterId === p2Id ? 'bold' : 'normal', opacity: l.starterId === p2Id ? 1 : 0.5, marginLeft: '4px' }}>{p2.name}</span>
                              {l.starterId !== p2Id && l.winnerId === p2Id && (
                                  <span className="badge badge-break" style={{ marginLeft: '4px' }}>PRZEŁAMANIE</span>
                              )}
                          </div>
                        </div>

                        <div style={{ lineHeight: '2.5', textAlign: 'center', fontSize: '1.1rem', wordBreak: 'break-word' }}>
                            {l.throws.map((t, tIdx) => {
                                const isLast = tIdx === l.throws.length - 1;
                                return (
                                    <React.Fragment key={tIdx}>
                                        <span style={{ fontWeight: t.isBust ? 'normal' : 'bold', color: t.isBust ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                                            {t.playerId === p1Id ? `${t.p1Remaining - (t.isBust ? 0 : t.score)}:${t.p2Remaining}` : `${t.p1Remaining}:${t.p2Remaining - (t.isBust ? 0 : t.score)}`}
                                        </span>
                                        {renderBadge(t.score)}
                                        {!isLast && <span style={{ color: 'var(--text-secondary)', margin: '0 4px' }}>,</span>}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                      </div>
                  );
              })}
          </div>
      );
  });

  return (
    <div className="animate-slide-up match-flow-container">
      <div className="glass-panel text-center mb-1">
        <h2 style={{ fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px', margin: 0 }}>Rzut por rzucie (Throw by Throw)</h2>
      </div>

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {renderedMatches.length > 0 ? renderedMatches : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No throws recorded yet.
            </div>
        )}
      </div>
    </div>
  );
}
