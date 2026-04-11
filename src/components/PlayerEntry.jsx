import React, { useState } from 'react';
import { UserPlus, UserMinus, ArrowRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function PlayerEntry({ players, setPlayers, onNext }) {
  const [newPlayerName, setNewPlayerName] = useState('');

  const handleAddPlayer = (e) => {
    e.preventDefault();
    if (newPlayerName.trim()) {
      setPlayers([...players, { id: uuidv4(), name: newPlayerName.trim() }]);
      setNewPlayerName('');
    }
  };

  const handleRemovePlayer = (id) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  return (
    <div className="glass-panel animate-slide-up" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Registration Phase</h2>
      
      <form onSubmit={handleAddPlayer} className="flex gap-2 mb-8">
        <input 
          type="text" 
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          placeholder="Enter player name..."
          autoFocus
        />
        <button type="submit">
          <UserPlus size={18} /> Add
        </button>
      </form>

      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
          Registered Players ({players.length})
        </h3>
        {players.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>
            No players added yet. Add at least 4 players to start.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {players.map(player => (
              <li key={player.id} className="flex items-center justify-between" style={{ 
                background: 'rgba(255, 255, 255, 0.05)', 
                padding: '0.75rem 1rem', 
                borderRadius: '8px',
                border: '1px solid var(--panel-border)'
              }}>
                <span>{player.name}</span>
                <button 
                  type="button"
                  className="danger" 
                  style={{ padding: '0.5rem' }}
                  onClick={() => handleRemovePlayer(player.id)}
                >
                  <UserMinus size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex" style={{ justifyContent: 'center' }}>
        <button onClick={onNext} disabled={players.length < 4}>
          Proceed to Group Setup <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
