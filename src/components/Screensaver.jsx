import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { calculateGroupStandings } from '../lib/tournamentUtils';
import { PHASES } from '../lib/useTournamentState';

export default function Screensaver({ groups, groupMatches, knockouts, phase, settings, onClose }) {
    const [activeGroupIndex, setActiveGroupIndex] = useState(0);

    useEffect(() => {
        if (!groups || groups.length === 0) return;
        const interval = setInterval(() => {
            setActiveGroupIndex(prev => (prev + 1) % groups.length);
        }, 10000); // 10 seconds per group
        return () => clearInterval(interval);
    }, [groups]);

    const renderGroupStandings = () => {
        if (settings && settings.mode === '1v1') {
             return <div style={{textAlign: 'center', fontSize: '2rem', color: 'var(--text-secondary)'}}>1v1 Match Mode - Idle</div>;
        }

        if (!groups || groups.length === 0) {
             return <div style={{textAlign: 'center', fontSize: '2rem', color: 'var(--text-secondary)'}}>Waiting for tournament to start...</div>;
        }
        
        const group = groups[activeGroupIndex];
        const matches = groupMatches[group.id];
        const standings = calculateGroupStandings(group.players, matches);

        return (
            <div className="glass-panel" style={{ width: '90%', maxWidth: '1000px', margin: '0 auto', animation: 'fadeIn 1s' }} key={group.id}>
                <h2 style={{ textAlign: 'center', fontSize: '3rem', marginBottom: '2rem', color: 'var(--accent-color)' }}>{group.name}</h2>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '1.5rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--panel-border)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '1rem' }}>Pos</th>
                      <th style={{ padding: '1rem' }}>Player</th>
                      <th style={{ padding: '1rem' }}>P</th>
                      <th style={{ padding: '1rem' }}>W</th>
                      <th style={{ padding: '1rem' }}>+/–</th>
                      <th style={{ padding: '1rem' }}>Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((p, i) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: i < 2 ? 'rgba(16, 185, 129, 0.15)' : 'transparent' }}>
                        <td style={{ padding: '1rem' }}>{i + 1}</td>
                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{p.name}</td>
                        <td style={{ padding: '1rem' }}>{p.played}</td>
                        <td style={{ padding: '1rem' }}>{p.won}</td>
                        <td style={{ padding: '1rem' }}>{p.legDiff > 0 ? `+${p.legDiff}` : p.legDiff}</td>
                        <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>{p.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
        );
    };

    const renderKnockouts = () => {
        if (!knockouts || knockouts.length === 0) return renderGroupStandings();
        
        // Show current active/upcoming matches
        let upcoming = [];
        knockouts.forEach(round => {
            round.matches.forEach(m => {
                if (!m.isFinished && !m.isBye && m.player1 && m.player2) {
                    upcoming.push({ roundName: round.name, ...m });
                }
            });
        });

        if (upcoming.length === 0) {
            return <div style={{textAlign: 'center', fontSize: '3rem', color: 'var(--success-color)'}}>Tournament Finished!</div>;
        }

        return (
            <div className="glass-panel" style={{ width: '90%', maxWidth: '1000px', margin: '0 auto', animation: 'fadeIn 1s' }}>
                <h2 style={{ textAlign: 'center', fontSize: '3rem', marginBottom: '2rem', color: 'var(--accent-color)' }}>Upcoming Matches</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {upcoming.slice(0, 4).map(m => (
                        <div key={m.id} style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', width: '40%', textAlign: 'right' }}>{m.player1.name}</div>
                            <div style={{ fontSize: '1.5rem', color: 'var(--text-secondary)', padding: '0 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem', color: 'var(--accent-color)' }}>{m.roundName}</span>
                                vs
                            </div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', width: '40%', textAlign: 'left' }}>{m.player2.name}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            backgroundColor: '#050505',
            backgroundImage: 'radial-gradient(circle at 50% 50%, #151820 0%, #000 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden'
        }}>
            <button 
                onClick={onClose}
                style={{
                    position: 'absolute',
                    top: '2rem',
                    right: '2rem',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    padding: '1rem',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s'
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.transform = 'scale(1)';
                }}
            >
                <X size={32} />
            </button>

            {phase === PHASES.KNOCKOUT_STAGE || (phase === PHASES.STATS_VIEW && knockouts && knockouts.length > 0) ? renderKnockouts() : renderGroupStandings()}
            
            <div style={{ position: 'absolute', bottom: '2rem', opacity: 0.5, fontSize: '1.2rem', letterSpacing: '2px' }}>
                DART4FUN COMPETITIONS
            </div>
        </div>
    );
}
