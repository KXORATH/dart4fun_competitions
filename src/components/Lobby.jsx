import React, { useState, useEffect } from 'react';
import { Network, Users, PlaySquare } from 'lucide-react';

export default function Lobby({ onHost, onJoin, onResume }) {
  const [joinCode, setJoinCode] = useState('');
  const [hasSavedState, setHasSavedState] = useState(false);

  useEffect(() => {
      try {
          const saved = localStorage.getItem('dart4fun_state');
          if (saved) {
              const parsed = JSON.parse(saved);
              if (parsed && parsed.phase > -1) {
                  setHasSavedState(true);
              }
          }
      } catch(e) {}
  }, []);

  return (
    <div className="animate-slide-up" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <h2 style={{ marginBottom: '2rem' }}>Welcome to Dart4fun</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem' }}>
        Play locally or connect devices to share the scoreboard!
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {hasSavedState && (
            <div className="glass-panel" style={{ padding: '1.5rem', borderColor: 'var(--warning-color)', boxShadow: '0 4px 20px rgba(245, 158, 11, 0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ textAlign: 'left' }}>
                        <h3 style={{ margin: 0, color: 'var(--warning-color)' }}>Resume Tournament</h3>
                        <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>We found an active tournament saved on this device.</p>
                    </div>
                    <button onClick={onResume} style={{ background: 'var(--warning-color)', color: 'black' }}>
                        <PlaySquare size={20} /> Resume
                    </button>
                </div>
            </div>
        )}

        <div className="glass-panel" style={{ padding: '2rem' }}>
          <Network size={48} color="var(--accent-color)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ marginBottom: '1rem' }}>Start Playing</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Choose a quick 1v1 or create a multi-player tournament.
          </p>
          <div className="flex gap-2" style={{ flexDirection: 'column' }}>
            <button onClick={() => onHost('1v1')} style={{ width: '100%', padding: '1rem', background: 'var(--accent-hover)' }}>
                Quick 1v1 Match
            </button>
            <button onClick={() => onHost('tournament')} className="secondary" style={{ width: '100%' }}>
                Create Tournament
            </button>
          </div>
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
              onClick={() => {
                if(!joinCode.trim()) {
                  alert("Pole kodu jest puste! Wpisz kod pokoju by dołaczyć.");
                  return;
                }
                const btn = document.getElementById('join-btn');
                if(btn) btn.innerText = 'Connecting...';
                onJoin(joinCode.trim());
                setTimeout(() => {
                  if(btn && btn.innerText === 'Connecting...') btn.innerText = 'Join Room';
                }, 4000);
              }} 
              id="join-btn"
              style={{ background: 'var(--success-color)' }}
            >
              Join Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
