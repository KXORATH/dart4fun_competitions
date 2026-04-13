import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import MatchFlow from './MatchFlow';

export default function StatsView({ players, globalHistory, onBack, settings }) {
  const [activeTab, setActiveTab] = useState('stats');

  // Compile stats per player
  const playerStats = players.map(player => {
      const pThrows = globalHistory.filter(h => h.playerId === player.id);
      
      const scoreThrows = pThrows.filter(h => h.type !== 'LEG_WIN');
      const legWins = pThrows.filter(h => h.type === 'LEG_WIN');
      
      const totalScore = scoreThrows.reduce((sum, h) => sum + h.score, 0);
      const numVisits = scoreThrows.length;
      const totalDarts = scoreThrows.reduce((sum, h) => sum + (h.dartsThrown || 3), 0);
      const average3Dart = totalDarts > 0 ? ((totalScore / totalDarts) * 3).toFixed(2) : '0.00';
      
      const sixtyPlus = scoreThrows.filter(h => h.score >= 60 && h.score < 100).length;
      const tonPlus = scoreThrows.filter(h => h.score >= 100 && h.score < 140).length;
      const tonFortyPlus = scoreThrows.filter(h => h.score >= 140 && h.score < 180).length;
      const oneEighty = scoreThrows.filter(h => h.score === 180).length;
      
      const minDarts = legWins.length > 0 ? Math.min(...legWins.map(w => w.numDarts)) : '-';
      const highestCheckout = legWins.length > 0 ? Math.max(...legWins.map(w => w.checkout || 0)) : '-';
      
      return {
          id: player.id,
          name: player.name,
          numVisits,
          average3Dart,
          sixtyPlus,
          tonPlus,
          tonFortyPlus,
          oneEighty,
          minDarts,
          highestCheckout
      };
  });

  // Sort by average descending
  playerStats.sort((a, b) => parseFloat(b.average3Dart) - parseFloat(a.average3Dart));

  return (
    <div className="animate-slide-up" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button className="secondary" onClick={onBack}>
          <ArrowLeft size={18} /> Back
        </button>
        <h2 style={{ margin: 0 }}>Tournament Statistics</h2>
        <div style={{ width: '80px' }}></div>
      </div>

      <div className="flex" style={{ justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button className={activeTab === 'stats' ? 'primary' : 'secondary'} onClick={() => setActiveTab('stats')}>
          Statistics
        </button>
        <button className={activeTab === 'flow' ? 'primary' : 'secondary'} onClick={() => setActiveTab('flow')}>
          Match Flow (Throw by Throw)
        </button>
      </div>

      {activeTab === 'stats' ? (
      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '1rem' }}>Player</th>
              <th style={{ padding: '1rem' }}>Throws</th>
              <th style={{ padding: '1rem' }}>3-Dart Avg</th>
              <th style={{ padding: '1rem' }}>60+</th>
              <th style={{ padding: '1rem' }}>100+</th>
              <th style={{ padding: '1rem' }}>140+</th>
              <th style={{ padding: '1rem', color: 'var(--accent-color)' }}>180</th>
              <th style={{ padding: '1rem', color: 'var(--success-color)' }}>Best Leg</th>
              <th style={{ padding: '1rem', color: 'var(--danger-color)' }}>High Checkout</th>
            </tr>
          </thead>
          <tbody>
            {playerStats.map((p, i) => (
              <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{p.name}</td>
                <td style={{ padding: '1rem' }}>{p.numVisits}</td>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{p.average3Dart}</td>
                <td style={{ padding: '1rem' }}>{p.sixtyPlus}</td>
                <td style={{ padding: '1rem' }}>{p.tonPlus}</td>
                <td style={{ padding: '1rem' }}>{p.tonFortyPlus}</td>
                <td style={{ padding: '1rem', color: 'var(--accent-color)', fontWeight: 'bold' }}>{p.oneEighty}</td>
                <td style={{ padding: '1rem', color: 'var(--success-color)', fontWeight: 'bold' }}>{p.minDarts}{p.minDarts !== '-' ? ' darts' : ''}</td>
                <td style={{ padding: '1rem', color: 'var(--danger-color)', fontWeight: 'bold' }}>{p.highestCheckout}</td>
              </tr>
            ))}
            {playerStats.length === 0 && (
                <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        No darts have been thrown yet!
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
      ) : (
          <MatchFlow players={players} globalHistory={globalHistory} settings={settings} />
      )}
    </div>
  );
}
