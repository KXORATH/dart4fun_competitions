import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Shuffle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { generateRoundRobin } from '../lib/tournamentUtils';
import GroupDrawAnimation from './GroupDrawAnimation';

export default function GroupSetup({ players, settings, onBack, onGroupsCreated }) {
  const [numGroups, setNumGroups] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawData, setDrawData] = useState([]);
  const [initialGroups, setInitialGroups] = useState([]);
  const [initialMatches, setInitialMatches] = useState({});

  const maxGroups = Math.max(1, Math.floor(players.length / 3)); // At least 3 players per group

  const handleCreateGroups = () => {
    // Shuffle players
    const shuffled = [...players].sort(() => 0.5 - Math.random());
    const groups = [];
    
    // Initialize empty groups
    for (let i = 0; i < numGroups; i++) {
        groups.push({
            id: uuidv4(),
            name: `Group ${String.fromCharCode(65 + i)}`,
            players: []
        });
    }

    const drawSequence = [];

    // Distribute players unpredictably but balanced
    const slots = [];
    for (let i = 0; i < players.length; i++) {
        slots.push(i % numGroups);
    }
    // Shuffle slots
    slots.sort(() => 0.5 - Math.random());

    shuffled.forEach((player, index) => {
        const groupIndex = slots[index];
        const targetGroup = groups[groupIndex];
        
        targetGroup.players.push(player);
        
        drawSequence.push({
            player,
            groupId: targetGroup.id
        });
    });

    // Generate matches for each fully populated group
    const generatedMatches = {};
    groups.forEach(g => {
        generatedMatches[g.id] = generateRoundRobin(g.players);
    });

    setInitialGroups(groups);
    setInitialMatches(generatedMatches);
    setDrawData(drawSequence);
    setIsDrawing(true);
  };

  const handleFinishDraw = () => {
    onGroupsCreated(initialGroups, initialMatches);
  };

  if (isDrawing) {
    if (settings?.showGroupDrawAnimation === false) {
       // Avoid React warning about updating state during render by using effect or just immediately trigger
       // Actually rendering nothing and firing callback on mount is safer
       setTimeout(handleFinishDraw, 0);
       return <div className="glass-panel text-center">Generating Groups...</div>;
    }

    return (
      <GroupDrawAnimation 
        drawData={drawData} 
        initialGroups={initialGroups} 
        onFinish={handleFinishDraw} 
      />
    );
  }

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
