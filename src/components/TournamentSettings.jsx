import React, { useState } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export default function TournamentSettings({ settings, setSettings, onNext, onBack }) {

  const updateSetting = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  return (
    <div className="glass-panel animate-slide-up" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Tournament Rules</h2>
      
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
          Game Mode
        </label>
        <select 
          value={settings.mode || '1v1'} 
          onChange={(e) => updateSetting('mode', e.target.value)}
        >
          <option value="1v1">1v1 Quick Match</option>
          <option value="tournament">Tournament (Groups & Knockout)</option>
        </select>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
          Starting Score
        </label>
        <select 
          value={settings.startingScore} 
          onChange={(e) => updateSetting('startingScore', parseInt(e.target.value, 10))}
        >
          <option value={201}>201</option>
          <option value={301}>301</option>
          <option value={401}>401</option>
          <option value={501}>501</option>
          <option value={701}>701</option>
        </select>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
          Checkout Type
        </label>
        <select 
          value={settings.checkoutType} 
          onChange={(e) => updateSetting('checkoutType', e.target.value)}
        >
          <option value="straight">Straight Out (Any checkout)</option>
          <option value="double">Double Out (Must finish on a double)</option>
        </select>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
          Group Stage Format (Best of X Legs)
        </label>
        <select 
          value={settings.bestOf} 
          onChange={(e) => updateSetting('bestOf', parseInt(e.target.value, 10))}
        >
          <option value={1}>Best of 1 (First to 1)</option>
          <option value={3}>Best of 3 (First to 2)</option>
          <option value={5}>Best of 5 (First to 3)</option>
          <option value={7}>Best of 7 (First to 4)</option>
          <option value={9}>Best of 9 (First to 5)</option>
        </select>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
          Knockout Stage Format (Best of X Legs)
        </label>
        <select 
          value={settings.knockoutBestOf} 
          onChange={(e) => updateSetting('knockoutBestOf', parseInt(e.target.value, 10))}
        >
          <option value={1}>Best of 1 (First to 1)</option>
          <option value={3}>Best of 3 (First to 2)</option>
          <option value={5}>Best of 5 (First to 3)</option>
          <option value={7}>Best of 7 (First to 4)</option>
          <option value={9}>Best of 9 (First to 5)</option>
        </select>
      </div>

      <div className="flex" style={{ justifyContent: 'space-between' }}>
        <button className="secondary" onClick={onBack}>
          <ArrowLeft size={18} /> Back
        </button>
        <button onClick={onNext}>
          {settings.mode === '1v1' ? 'Start Match' : 'Proceed to Group Setup'} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
