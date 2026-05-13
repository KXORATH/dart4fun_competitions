import React from 'react';
import { Trophy, ArrowLeft } from 'lucide-react';
import { getMatchupProbability } from '../lib/tournamentUtils';

export default function KnockoutBracket({ matches, isHost, settings, onPlayMatch, winner, onRematch, onBack, hideHeader, globalHistory = [], allMatches = [] }) {
  
  const isMultiGuest = (settings && settings.mode === 'multi_judge') && !isHost;
  
  // Score changes are now handled by MatchView
  
  const getFallbackName = (rIndex, mIndex, playerPos) => {
    if (rIndex === 0) return 'TBD';
    const prevRoundName = matches[rIndex - 1].name;
    let prefix = 'R-';
    if (prevRoundName === 'Semi Finals') prefix = 'S';
    else if (prevRoundName === 'Quarter Finals') prefix = 'Q';
    else if (prevRoundName === 'Round of 16') prefix = '1/8-';
    else if (prevRoundName === 'Round of 32') prefix = '1/16-';
    
    const sourceMatchNum = mIndex * 2 + playerPos;
    return `${prefix}${sourceMatchNum} Winner`;
  };

  const getMatchLabel = (roundName, mIndex) => {
      if (roundName === 'Final') return null;
      let prefix = 'R-';
      if (roundName === 'Semi Finals') prefix = 'S';
      else if (roundName === 'Quarter Finals') prefix = 'Q';
      else if (roundName === 'Round of 16') prefix = '1/8-';
      else if (roundName === 'Round of 32') prefix = '1/16-';
      return `${prefix}${mIndex + 1}`;
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {!hideHeader && (
        <div className="group-stage-header" style={{ marginBottom: '2rem' }}>
          <div className="group-stage-header-left">
            {!isMultiGuest && onBack && (
              <button className="secondary" onClick={onBack}>
                <ArrowLeft size={18} /> Back to Groups
              </button>
            )}
          </div>
          <h2 style={{ margin: 0, textAlign: 'center' }}>Knockout Stage</h2>
          <div className="group-stage-header-right"></div>
        </div>
      )}

      {winner && (
        <div className="glass-panel" style={{ 
          textAlign: 'center', 
          marginBottom: '3rem',
          background: 'linear-gradient(135deg, rgba(245, 184, 0, 0.2), rgba(255, 210, 74, 0.1))',
          borderColor: 'rgba(245, 184, 0, 0.4)',
          animation: 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          <Trophy size={64} color="var(--accent-color)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ margin: 0, color: 'var(--accent-color)' }}>Tournament Champion</h2>
          <div style={{ fontSize: '3rem', fontWeight: '800', margin: '1rem 0', color: 'var(--text-primary)', textShadow: '0 0 20px rgba(255,255,255,0.3)' }}>{winner.name}</div>
          {!isMultiGuest && (
            <button onClick={onRematch} style={{ marginTop: '1rem', background: 'var(--accent-color)', color: '#1a1300' }}>
              Start Another Tournament
            </button>
          )}
        </div>
      )}

      <div className="knockout-rounds">
        {matches.map((round, rIndex) => (
          <div key={round.id} className="knockout-round">
            <h3 style={{ textAlign: 'center', color: 'var(--accent-color)' }}>{round.name}</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', justifyContent: 'center', flex: 1 }}>
              {round.matches.map((m, mIndex) => (
                <div key={m.id} className="glass-panel" style={{ padding: '1rem', position: 'relative', overflow: 'hidden' }}>
                  {getMatchLabel(round.name, mIndex) && (
                    <div style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '0.2rem 0.5rem', borderBottomLeftRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {getMatchLabel(round.name, mIndex)}
                    </div>
                  )}
                  {m.isBye ? (
                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--success-color)', fontWeight: 'bold' }}>
                      {m.player1 ? m.player1.name : getFallbackName(rIndex, mIndex, 1)} (Bye)
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                         <span style={{ 
                            fontWeight: (!m.player1 || m.player1.isPlaceholder) ? 'normal' : 'bold', 
                            fontStyle: (!m.player1 || m.player1.isPlaceholder) ? 'italic' : 'normal', 
                            color: (!m.player1 || m.player1.isPlaceholder) ? 'var(--text-secondary)' : 'inherit' 
                         }}>
                            {m.player1 ? m.player1.name : getFallbackName(rIndex, mIndex, 1)}
                         </span>
                         {m.isFinished && m.player1 && <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>{m.p1Legs}</span>}
                      </div>
                      <div style={{ height: '1px', background: 'var(--panel-border)', width: '100%', margin: '0.25rem 0' }}></div>
                      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                         <span style={{ 
                            fontWeight: (!m.player2 || m.player2.isPlaceholder) ? 'normal' : 'bold', 
                            fontStyle: (!m.player2 || m.player2.isPlaceholder) ? 'italic' : 'normal', 
                            color: (!m.player2 || m.player2.isPlaceholder) ? 'var(--text-secondary)' : 'inherit' 
                         }}>
                            {m.player2 ? m.player2.name : getFallbackName(rIndex, mIndex, 2)}
                         </span>
                         {m.isFinished && m.player2 && <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>{m.p2Legs}</span>}
                      </div>

                      {!m.isFinished && m.liveState && m.player1 && m.player2 && !m.player1.isPlaceholder && !m.player2.isPlaceholder ? (
                        <button onClick={() => onPlayMatch(round.id, m.id)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', marginTop: '0.5rem', background: 'var(--blue-color)', color: '#fff' }}>
                          Continue
                        </button>
                      ) : !m.isFinished && m.player1 && m.player2 && !m.player1.isPlaceholder && !m.player2.isPlaceholder && (
                        <>
                          <button onClick={() => onPlayMatch(round.id, m.id)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                            Play Match
                          </button>
                          {(() => {
                            const p1prob = getMatchupProbability(m.player1, m.player2, globalHistory, allMatches);
                            const p2prob = 1 - p1prob;
                            const getColor = (p) => p >= 0.6 ? 'var(--blue-color)' : (p >= 0.4 ? 'var(--warning-color)' : 'var(--danger-color)');
                            return (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                                <span>[</span>
                                <span style={{ color: getColor(p1prob) }}>{Math.round(p1prob * 100)}%</span>
                                <span>-</span>
                                <span style={{ color: getColor(p2prob) }}>{Math.round(p2prob * 100)}%</span>
                                <span>]</span>
                              </div>
                            );
                          })()}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
