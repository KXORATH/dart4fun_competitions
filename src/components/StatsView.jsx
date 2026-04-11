import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function StatsView({ players, globalHistory, onBack }) {

  // Compile stats per player
  const playerStats = players.map(player => {
      const pThrows = globalHistory.filter(h => h.playerId === player.id);
      
      const totalScore = pThrows.reduce((sum, h) => sum + h.score, 0);
      const numVisits = pThrows.length;
      const average3Dart = numVisits > 0 ? (totalScore / numVisits).toFixed(2) : '0.00';
      
      const sixtyPlus = pThrows.filter(h => h.score >= 60 && h.score < 100).length;
      const tonPlus = pThrows.filter(h => h.score >= 100 && h.score < 140).length;
      const tonFortyPlus = pThrows.filter(h => h.score >= 140 && h.score < 180).length;
      const oneEighty = pThrows.filter(h => h.score === 180).length;
      
      return {
          id: player.id,
          name: player.name,
          numVisits,
          average3Dart,
          sixtyPlus,
          tonPlus,
          tonFortyPlus,
          oneEighty
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
              </tr>
            ))}
            {playerStats.length === 0 && (
                <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        No darts have been thrown yet!
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
