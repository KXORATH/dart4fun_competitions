import React, { useState } from 'react';
import { Network, Users } from 'lucide-react';

export default function Lobby({ onHost, onJoin }) {
  const [joinCode, setJoinCode] = useState('');

  return (
    <div className="animate-slide-up" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <h2 style={{ marginBottom: '2rem' }}>Welcome to Dart4fun</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem' }}>
        Play locally or connect devices to share the scoreboard!
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <Network size={48} color="var(--accent-color)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ marginBottom: '1rem' }}>Host a Tournament</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Create a new tournament and get a room code for others to join and sync scores.
          </p>
          <button onClick={onHost} style={{ width: '100%' }}>
            Create New Tournament
          </button>
        </div>

        <div className="glass-panel" style={{ padding: '2rem' }}>
          <Users size={48} color="var(--success-color)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ marginBottom: '1rem' }}>Join a Tournament</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            Enter a room code to view the bracket and input live scores.
          </p>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="e.g. DART-XYZ" 
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              style={{ flex: 1, textTransform: 'uppercase' }}
            />
            <button 
              onClick={() => onJoin(joinCode)} 
              disabled={!joinCode.trim()}
              style={{ background: joinCode.trim() ? 'var(--success-color)' : 'var(--panel-border)' }}
            >
              Join Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
