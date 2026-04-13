import React, { useState } from 'react';
import { UserPlus, UserMinus, ArrowRight, ArrowLeft } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function PlayerEntry({ players, setPlayers, onNext, onBack }) {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);

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

  const handleDragStart = (e, index) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === dropIndex) return;
    const newPlayers = [...players];
    const draggedPlayer = newPlayers[draggedItemIndex];
    newPlayers.splice(draggedItemIndex, 1);
    newPlayers.splice(dropIndex, 0, draggedPlayer);
    setPlayers(newPlayers);
    setDraggedItemIndex(null);
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
            No players added yet. Add at least 2 players to start.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {players.map((player, index) => (
              <li 
                key={player.id} 
                draggable={true}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className="flex items-center justify-between" 
                style={{ 
                  background: draggedItemIndex === index ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)', 
                  padding: '0.75rem 1rem', 
                  borderRadius: '8px',
                  border: draggedItemIndex === index ? '1px dashed var(--accent-color)' : '1px solid var(--panel-border)',
                  cursor: 'grab'
                }}>
                <span>{player.name}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    type="button"
                    className="danger" 
                    style={{ padding: '0.5rem' }}
                    onClick={() => handleRemovePlayer(player.id)}
                  >
                    <UserMinus size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex" style={{ justifyContent: 'space-between' }}>
        <button className="secondary" onClick={onBack}>
          <ArrowLeft size={18} /> Back
        </button>
        <button onClick={onNext} disabled={players.length < 2}>
          Proceed to Settings <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
