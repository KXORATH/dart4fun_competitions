import React, { useState, useEffect, useMemo } from 'react';
import { X, Trophy, Target, Activity } from 'lucide-react';
import { calculateGroupStandings, calculateAdvancementOdds, calculateGlobalStats } from '../lib/tournamentUtils';
import { PHASES } from '../lib/useTournamentState';

export default function Screensaver({ players, groups, groupMatches, knockouts, phase, settings, globalHistory, onClose }) {
    const [activeSlideIndex, setActiveSlideIndex] = useState(0);

    const slides = useMemo(() => {
        let s = [];
        if (settings && settings.mode === '1v1') {
            s.push({ type: 'IDLE' });
            s.push({ type: 'STATS' });
            return s;
        }

        if (phase === PHASES.KNOCKOUT_STAGE || (phase === PHASES.STATS_VIEW && knockouts && knockouts.length > 0)) {
            s.push({ type: 'KNOCKOUTS' });
            s.push({ type: 'STATS' });
        } else if (groups && groups.length > 0) {
            groups.forEach((g, idx) => {
                s.push({ type: 'GROUP', groupIndex: idx });
            });
            s.push({ type: 'UPCOMING' });
            s.push({ type: 'STATS' });
        } else {
            s.push({ type: 'IDLE' });
        }
        return s;
    }, [groups, phase, knockouts, settings]);

    useEffect(() => {
        if (slides.length <= 1) return;
        const interval = setInterval(() => {
            setActiveSlideIndex(prev => (prev + 1) % slides.length);
        }, 6000); // 6 seconds per slide
        return () => clearInterval(interval);
    }, [slides.length]);

    const globalStats = useMemo(() => calculateGlobalStats(globalHistory, players), [globalHistory, players]);

    const renderGroupStandings = (groupIndex) => {
        const group = groups[groupIndex];
        const matches = groupMatches[group.id];
        const standings = calculateGroupStandings(group.players, matches);
        const odds = calculateAdvancementOdds(group.players, matches);

        return (
            <div className="glass-panel" style={{ width: '90%', maxWidth: '1000px', margin: '0 auto', animation: 'fadeIn 0.5s' }} key={`group-${group.id}`}>
                <h2 style={{ textAlign: 'center', fontSize: '3rem', marginBottom: '2rem', color: 'var(--accent-color)' }}>{group.name}</h2>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '1.5rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--panel-border)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '1rem' }}>Pos</th>
                      <th style={{ padding: '1rem' }}>Player</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>P</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Pts</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Advance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((p, i) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: i < 2 ? 'rgba(16, 185, 129, 0.15)' : 'transparent' }}>
                        <td style={{ padding: '1rem' }}>{i + 1}</td>
                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{p.name}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>{p.played}</td>
                        <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--accent-color)', textAlign: 'center' }}>{p.points}</td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: (odds[p.id] > 50) ? 'var(--success-color)' : ((odds[p.id] > 0) ? 'var(--warning-color)' : 'var(--danger-color)') }}>
                            {odds[p.id] !== undefined ? `${odds[p.id]}%` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
        );
    };

    const renderUpcoming = () => {
        let upcoming = [];
        if (groups && groups.length > 0) {
            Object.keys(groupMatches).forEach(gId => {
                const groupName = groups.find(g => g.id === gId)?.name || 'Group';
                groupMatches[gId].forEach(m => {
                    if (!m.isFinished) upcoming.push({ roundName: groupName, ...m });
                });
            });
        }
        
        if (upcoming.length === 0) return <div style={{textAlign: 'center', fontSize: '3rem', color: 'var(--success-color)'}}>Group Stage Finished!</div>;

        return (
            <div className="glass-panel" style={{ width: '90%', maxWidth: '1000px', margin: '0 auto', animation: 'fadeIn 0.5s' }}>
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

    const renderKnockouts = () => {
        if (!knockouts || knockouts.length === 0) return <div style={{textAlign: 'center', fontSize: '2rem'}}>No knockouts yet.</div>;
        let upcoming = [];
        knockouts.forEach(round => {
            round.matches.forEach(m => {
                if (!m.isFinished && !m.isBye && m.player1 && m.player2) {
                    upcoming.push({ roundName: round.name, ...m });
                }
            });
        });

        if (upcoming.length === 0) return <div style={{textAlign: 'center', fontSize: '3rem', color: 'var(--success-color)'}}>Tournament Finished!</div>;

        return (
            <div className="glass-panel" style={{ width: '90%', maxWidth: '1000px', margin: '0 auto', animation: 'fadeIn 0.5s' }}>
                <h2 style={{ textAlign: 'center', fontSize: '3rem', marginBottom: '2rem', color: 'var(--accent-color)' }}>Knockout Stage</h2>
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

    const renderStats = () => {
        return (
            <div className="glass-panel" style={{ width: '90%', maxWidth: '1000px', margin: '0 auto', animation: 'fadeIn 0.5s' }}>
                <h2 style={{ textAlign: 'center', fontSize: '3rem', marginBottom: '3rem', color: 'var(--accent-color)' }}>Tournament Leaders</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
                    
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '16px', textAlign: 'center', border: '1px solid var(--panel-border)' }}>
                        <Target size={48} color="var(--accent-color)" style={{ margin: '0 auto 1rem auto' }} />
                        <h3 style={{ fontSize: '1.5rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Highest Checkout</h3>
                        <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>{globalStats.highestCheckout.score || '-'}</div>
                        <div style={{ fontSize: '1.2rem', color: 'var(--accent-color)' }}>{globalStats.highestCheckout.player || 'No checkouts yet'}</div>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '16px', textAlign: 'center', border: '1px solid var(--panel-border)' }}>
                        <Trophy size={48} color="#f59e0b" style={{ margin: '0 auto 1rem auto' }} />
                        <h3 style={{ fontSize: '1.5rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Most 180s</h3>
                        <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#f59e0b', marginBottom: '0.5rem' }}>{globalStats.most180s.count || '0'}</div>
                        <div style={{ fontSize: '1.2rem', color: '#f59e0b' }}>{globalStats.most180s.player || 'None yet'}</div>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '16px', textAlign: 'center', border: '1px solid var(--panel-border)' }}>
                        <Activity size={48} color="var(--success-color)" style={{ margin: '0 auto 1rem auto' }} />
                        <h3 style={{ fontSize: '1.5rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Best Average</h3>
                        <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>{globalStats.bestAverage.avg || '-'}</div>
                        <div style={{ fontSize: '1.2rem', color: 'var(--success-color)' }}>{globalStats.bestAverage.player || 'Not enough data'}</div>
                    </div>

                </div>
            </div>
        );
    };

    const currentSlide = slides[activeSlideIndex];

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
            >
                <X size={32} />
            </button>

            {currentSlide.type === 'GROUP' && renderGroupStandings(currentSlide.groupIndex)}
            {currentSlide.type === 'UPCOMING' && renderUpcoming()}
            {currentSlide.type === 'KNOCKOUTS' && renderKnockouts()}
            {currentSlide.type === 'STATS' && renderStats()}
            {currentSlide.type === 'IDLE' && <div style={{textAlign: 'center', fontSize: '2rem', color: 'var(--text-secondary)'}}>Waiting for tournament to start...</div>}
            
            <div style={{ position: 'absolute', bottom: '2rem', opacity: 0.5, fontSize: '1.2rem', letterSpacing: '2px', display: 'flex', width: '100%', justifyContent: 'center', gap: '1rem' }}>
                {slides.map((s, i) => (
                    <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: i === activeSlideIndex ? 'white' : 'rgba(255,255,255,0.2)' }}></div>
                ))}
            </div>
        </div>
    );
}
