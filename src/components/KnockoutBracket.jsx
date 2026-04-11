import React from 'react';
import { Trophy } from 'lucide-react';

export default function KnockoutBracket({ matches, onUpdateMatch, winner, onRematch }) {
  
  const handleScoreChange = (roundId, matchId, playerNum, value) => {
    const num = value === '' ? null : parseInt(value, 10);
    onUpdateMatch(roundId, matchId, playerNum, num);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Knockout Stage</h2>

      {winner && (
        <div className="glass-panel" style={{ 
          textAlign: 'center', 
          marginBottom: '3rem',
          background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(245, 158, 11, 0.1))',
          borderColor: 'rgba(234, 179, 8, 0.4)',
          animation: 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          <Trophy size={64} color="#fbbf24" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ margin: 0, color: '#fbbf24' }}>Tournament Champion</h2>
          <h1 style={{ fontSize: '3rem', margin: '1rem 0' }}>{winner.name}</h1>
          <button onClick={onRematch} style={{ marginTop: '1rem', background: '#fbbf24', color: '#000' }}>
            Start Another Tournament
          </button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
        {matches.map((round) => (
          <div key={round.id} style={{ display: 'flex', flexDirection: 'column', gap: '2rem', minWidth: '300px' }}>
            <h3 style={{ textAlign: 'center', color: 'var(--accent-color)' }}>{round.name}</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', justifyContent: 'center', flex: 1 }}>
              {round.matches.map(m => (
                <div key={m.id} className="glass-panel" style={{ padding: '1rem', position: 'relative' }}>
                  {m.isBye ? (
                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--success-color)', fontWeight: 'bold' }}>
                      {m.player1.name} (Bye)
                    </div>
                  ) : !m.player1 || !m.player2 ? (
                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>
                      Waiting for players...
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {/* Player 1 Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold' }}>{m.player1.name}</span>
                        <input 
                          type="number" 
                          min="0"
                          value={m.p1Legs !== null ? m.p1Legs : ''}
                          onChange={(e) => handleScoreChange(round.id, m.id, 1, e.target.value)}
                          style={{ width: '60px', padding: '0.25rem', textAlign: 'center' }}
                        />
                      </div>
                      
                      {/* Divider */}
                      <div style={{ height: '1px', background: 'var(--panel-border)', margin: '0.5rem 0' }}></div>
                      
                      {/* Player 2 Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold' }}>{m.player2.name}</span>
                        <input 
                          type="number" 
                          min="0"
                          value={m.p2Legs !== null ? m.p2Legs : ''}
                          onChange={(e) => handleScoreChange(round.id, m.id, 2, e.target.value)}
                          style={{ width: '60px', padding: '0.25rem', textAlign: 'center' }}
                        />
                      </div>
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
