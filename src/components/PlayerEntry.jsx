import React, { useState } from 'react';
import { UserPlus, UserMinus, ArrowRight, ArrowLeft } from 'lucide-react';
import { generateId } from '../lib/idUtils';

export default function PlayerEntry({ players, setPlayers, settings, onNext, onBack }) {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  const [botAverage, setBotAverage] = useState(40);
  const [hasInitializedBot, setHasInitializedBot] = useState(false);

  React.useEffect(() => {
    if (settings && settings.mode === '1v1_bot' && players.length === 2 && !players[1].isBot && !hasInitializedBot) {
      setHasInitializedBot(true);
      const newPlayers = [...players];
      newPlayers[1] = { 
        id: generateId(), 
        name: `DartBot (avg: 40)`, 
        isBot: true, 
        botAverage: 40 
      };
      setPlayers(newPlayers);
    }
  }, [settings, players, setPlayers, hasInitializedBot]);

  const handleAddPlayer = (e) => {
    e.preventDefault();
    if (newPlayerName.trim()) {
      setPlayers([...players, { id: generateId(), name: newPlayerName.trim() }]);
      setNewPlayerName('');
    }
  };

  const handleAddBot = () => {
    setPlayers([...players, { 
      id: generateId(), 
      name: `DartBot (avg: ${botAverage})`, 
      isBot: true, 
      botAverage 
    }]);
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
      
      <form onSubmit={handleAddPlayer} className="flex gap-2 mb-4">
        <input 
          type="text" 
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          placeholder="Enter player name..."
          autoFocus
        />
        <button type="submit">
          <UserPlus size={18} /> Add Player
        </button>
      </form>

      <div className="flex gap-2 mb-8 items-center" style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>DartBot</span>
                <span style={{ fontWeight: 'bold', color: 'var(--accent-color)' }}>Avg: {botAverage}</span>
            </div>
            <input 
                type="range" 
                min="20" 
                max="100" 
                step="5" 
                value={botAverage} 
                onChange={(e) => setBotAverage(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-color)' }}
            />
        </div>
        <button type="button" onClick={handleAddBot} className="secondary" style={{ whiteSpace: 'nowrap', alignSelf: 'center' }}>
          <UserPlus size={18} /> Add Bot
        </button>
      </div>

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
                  background: draggedItemIndex === index ? 'var(--accent-soft)' : 'rgba(255, 255, 255, 0.05)', 
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