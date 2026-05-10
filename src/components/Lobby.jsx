import React, { useState, useEffect } from 'react';
import { Target, Cpu, MonitorPlay, Smartphone, LogIn, PlaySquare } from 'lucide-react';

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

  const Card = ({ icon: Icon, title, desc, onClick, children }) => (
    <div 
      className="glass-panel" 
      onClick={onClick}
      style={{ 
        padding: '2rem', 
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        height: '100%',
        position: 'relative',
        border: '1px solid var(--panel-border)',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={(e) => {
        if(onClick) {
          e.currentTarget.style.borderColor = 'var(--accent-color)';
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 10px 25px rgba(245, 184, 0, 0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if(onClick) {
          e.currentTarget.style.borderColor = 'var(--panel-border)';
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      <Icon size={48} color="var(--accent-color)" style={{ marginBottom: '1rem' }} />
      <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: children ? '1.5rem' : 0, flex: 1 }}>{desc}</p>
      {children}
    </div>
  );

  return (
    <div className="animate-slide-up" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
            Choose your game mode and start playing!
          </p>
      </div>

      {hasSavedState && (
          <div className="glass-panel" style={{ padding: '1.5rem', borderColor: 'var(--warning-color)', boxShadow: '0 4px 20px rgba(245, 184, 0, 0.15)', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ textAlign: 'left' }}>
                      <h3 style={{ margin: 0, color: 'var(--warning-color)' }}>Resume Tournament</h3>
                      <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>We found an active tournament saved on this device.</p>
                  </div>
                  <button onClick={onResume}>
                      <PlaySquare size={20} /> Resume
                  </button>
              </div>
          </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        <Card 
            icon={Target} 
            title="1v1 Quick Match" 
            desc="Play a standard 1v1 match on a single device."
            onClick={() => onHost('1v1')} 
        />
        
        <Card 
            icon={Cpu} 
            title="Play vs Bot" 
            desc="Practice your skills against our AI DartBot."
            onClick={() => onHost('1v1_bot')} 
        />
        
        <Card 
            icon={MonitorPlay} 
            title="Local Tournament" 
            desc="Run a full tournament on a single large screen."
            onClick={() => onHost('tournament')} 
        />

        <Card 
            icon={Smartphone} 
            title="Multi-device Host" 
            desc="Host a tournament where players score on their own phones."
            onClick={() => onHost('multi_judge')} 
        />

        <Card 
            icon={LogIn} 
            title="Join Tournament" 
            desc="Enter a room code to connect your device and input scores."
        >
            <div className="flex gap-2" style={{ width: '100%', marginTop: 'auto' }} onClick={(e) => e.stopPropagation()}>
                <input 
                  type="text" 
                  placeholder="CODE" 
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  style={{ flex: 1, textTransform: 'uppercase', minWidth: 0, textAlign: 'center', fontSize: '1.2rem', letterSpacing: '2px' }}
                />
                <button 
                  onClick={() => {
                    if(!joinCode.trim()) return;
                    const btn = document.getElementById('join-btn-new');
                    if(btn) btn.innerText = '...';
                    onJoin(joinCode.trim());
                    setTimeout(() => {
                      if(btn && btn.innerText === '...') btn.innerText = 'Join';
                    }, 4000);
                  }} 
                  id="join-btn-new"
                  style={{ padding: '0.75rem 1.5rem' }}
                >
                  Join
                </button>
            </div>
        </Card>
      </div>
    </div>
  );
}
