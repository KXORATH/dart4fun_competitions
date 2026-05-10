import React, { useState, useEffect } from 'react';
import { calculateGroupStandings, getMatchupProbability } from '../lib/tournamentUtils';
import { Trophy, ArrowRight, ArrowLeft } from 'lucide-react';
import KnockoutBracket from './KnockoutBracket';

export default function GroupMatches({ groups, groupMatches, isHost, settings, globalHistory = [], knockouts = [], winner, onPlayGroupMatch, onPlayKnockoutMatch, onRematch, onBack }) {
  const [viewMode, setViewMode] = useState('groups');

  const allMatches = [...Object.values(groupMatches || {}).flat(), ...(knockouts || []).flatMap(r => r.matches)];
  
  // handleScoreChange removed since we use MatchView now

  const isAllMatchesFinished = () => {
    return Object.values(groupMatches).flat().every(m => m.isFinished);
  };

  useEffect(() => {
    if (isAllMatchesFinished()) {
        setViewMode('knockouts');
    }
  }, [groupMatches]);

  const isMultiGuest = (settings && settings.mode === 'multi_judge') && !isHost;

  if (viewMode === 'knockouts' && knockouts && knockouts.length > 0) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <KnockoutBracket
          matches={knockouts}
          isHost={isHost}
          settings={settings}
          onPlayMatch={onPlayKnockoutMatch}
          winner={winner}
          onRematch={onRematch}
          onBack={() => setViewMode('groups')}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="group-stage-header">
        <div className="group-stage-header-left">
          {!isMultiGuest && (
            <button className="secondary" onClick={onBack}>
              <ArrowLeft size={18} /> Back
            </button>
          )}
        </div>
        <h2 style={{ margin: 0 }}>Group Stage</h2>
        <div className="group-stage-header-right">
          <button 
            onClick={() => setViewMode('knockouts')} 
            className="proceed-knockout-btn"
            style={{ background: 'var(--accent-color)', color: '#1a1300' }}
          >
            Go to Knockouts <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid-cols-2">
        {groups.map(group => {
          const matches = groupMatches[group.id];
          const standings = calculateGroupStandings(group.players, matches);
          
          return (
            <div key={group.id} className="glass-panel">
              <h3 style={{ marginBottom: '1rem', color: 'var(--accent-color)', borderBottom: '1px solid var(--panel-border)', paddingBottom: '0.5rem' }}>
                {group.name}
              </h3>
              
              {/* Standings Table */}
              <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.5rem' }}>Pos</th>
                      <th style={{ padding: '0.5rem' }}>Player</th>
                      <th style={{ padding: '0.5rem' }}>P</th>
                      <th style={{ padding: '0.5rem' }}>W</th>
                      <th style={{ padding: '0.5rem' }}>+/–</th>
                      <th style={{ padding: '0.5rem' }}>Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((p, i) => (
                      <tr key={p.id} style={{ 
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        backgroundColor: i < 2 ? 'rgba(74, 139, 255, 0.1)' : 'transparent' // Highlight top 2
                      }}>
                        <td style={{ padding: '0.5rem' }}>{i + 1}</td>
                        <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{p.name}</td>
                        <td style={{ padding: '0.5rem' }}>{p.played}</td>
                        <td style={{ padding: '0.5rem' }}>{p.won}</td>
                        <td style={{ padding: '0.5rem' }}>{p.legDiff > 0 ? `+${p.legDiff}` : p.legDiff}</td>
                        <td style={{ padding: '0.5rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>{p.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Matches List */}
              <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Matches</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {matches.map(m => (
                  <div key={m.id} className="group-match-card">
                    <div className="group-match-row">
                      <div className="group-match-player group-match-player-left">
                        {m.player1.name}
                      </div>
                      
                      <div className="group-match-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {m.isFinished ? (
                          <div style={{ fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--accent-color)' }}>
                            {m.p1Legs} - {m.p2Legs}
                          </div>
                        ) : m.liveState ? (
                          <button onClick={() => onPlayGroupMatch(group.id, m.id)} className="group-match-btn" style={{ background: 'var(--blue-color)', color: '#fff' }}>
                            Continue
                          </button>
                        ) : (
                          <>
                            <button onClick={() => onPlayGroupMatch(group.id, m.id)} className="group-match-btn">
                              Play Match
                            </button>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                              [ {Math.round(getMatchupProbability(m.player1, m.player2, globalHistory, allMatches) * 100)}% - {Math.round((1 - getMatchupProbability(m.player1, m.player2, globalHistory, allMatches)) * 100)}% ]
                            </div>
                          </>
                        )}
                      </div>

                      <div className="group-match-player group-match-player-right">
                        {m.player2.name}
                      </div>
                    </div>
                    {m.judge && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '0.5rem' }}>
                        ⚖️ Judge: {m.judge.name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
