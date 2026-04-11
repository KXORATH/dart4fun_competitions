import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Shuffle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { generateRoundRobin } from '../lib/tournamentUtils';

export default function GroupSetup({ players, onBack, onGroupsCreated }) {
  const [numGroups, setNumGroups] = useState(1);

  const maxGroups = Math.max(1, Math.floor(players.length / 3)); // At least 3 players per group

  const handleCreateGroups = () => {
    // Shuffle players
    const shuffled = [...players].sort(() => 0.5 - Math.random());
    const groups = [];
    
    // Initialize groups
    for (let i = 0; i < numGroups; i++) {
        groups.push({
            id: uuidv4(),
            name: `Group ${String.fromCharCode(65 + i)}`,
            players: []
        });
    }

    // Distribute players
    shuffled.forEach((player, index) => {
        groups[index % numGroups].players.push(player);
    });

    // Generate matches for each group
    const initialMatches = {};
    groups.forEach(g => {
        initialMatches[g.id] = generateRoundRobin(g.players);
    });

    onGroupsCreated(groups, initialMatches);
  };

  return (
    <div className="glass-panel animate-slide-up" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Group Setup</h2>
      
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
          You have {players.length} players. How many groups do you want to create?
        </p>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <select 
            value={numGroups} 
            onChange={(e) => setNumGroups(Number(e.target.value))}
            style={{ maxWidth: '200px' }}
          >
            {Array.from({ length: maxGroups }, (_, i) => i + 1).map(n => (
              n >= 1 && <option key={n} value={n}>{n} {n === 1 ? 'Group' : 'Groups'}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex" style={{ justifyContent: 'space-between' }}>
        <button className="secondary" onClick={onBack}>
          <ArrowLeft size={18} /> Back
        </button>
        <button onClick={handleCreateGroups}>
          <Shuffle size={18} /> Generate Groups
        </button>
      </div>
    </div>
  );
}
