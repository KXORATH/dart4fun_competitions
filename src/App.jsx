import React, { useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { calculateGroupStandings } from './lib/tournamentUtils';
import { useTournamentState, PHASES } from './lib/useTournamentState';

import Lobby from './components/Lobby';
import PlayerEntry from './components/PlayerEntry';
import TournamentSettings from './components/TournamentSettings';
import GroupSetup from './components/GroupSetup';
import GroupMatches from './components/GroupMatches';
import KnockoutBracket from './components/KnockoutBracket';
import MatchView from './components/MatchView';
import StatsView from './components/StatsView';

function App() {
  const { state, updateState, peerId, isHost, initHost, joinHost, connectionsCount } = useTournamentState();
  const { phase, players, groups, groupMatches, knockouts, winner, settings, globalHistory, activeMatch } = state;

  const setPhase = (newPhase) => updateState({ phase: newPhase });

  const handleGroupsCreated = (newGroups, initialMatches) => {
    updateState({ groups: newGroups, groupMatches: initialMatches, phase: PHASES.GROUP_STAGE });
  };

  const generateKnockoutMatches = (advancingPlayers) => {
    let rounds = [];
    const N = advancingPlayers.length;
    let P = 1;
    while(P < N) P *= 2;
    
    const byes = P - N;
    const initialMatches = [];
    let playerIndex = 0;
    const numInitialMatches = P / 2;
    
    for (let i = 0; i < numInitialMatches; i++) {
        if (i < byes) {
            const p1 = advancingPlayers[playerIndex++];
            initialMatches.push({
                id: uuidv4(),
                player1: p1,
                player2: null,
                p1Legs: null,
                p2Legs: null,
                isFinished: true,
                winner: p1,
                isBye: true
            });
        } else {
            const p1 = advancingPlayers[playerIndex++];
            const p2 = advancingPlayers[playerIndex++];
            initialMatches.push({ id: uuidv4(), player1: p1, player2: p2, p1Legs: null, p2Legs: null, isFinished: false, winner: null, isBye: false });
        }
    }

    let roundName = 'Round of ' + P;
    if (P === 8) roundName = 'Quarter Finals';
    if (P === 4) roundName = 'Semi Finals';
    if (P === 2) roundName = 'Final';
    
    let roundIndex = 0;
    rounds.push({ id: `r_${roundIndex}`, name: roundName, matches: initialMatches });

    let numMatches = numInitialMatches;
    while (numMatches > 1) {
      roundIndex++;
      numMatches = numMatches / 2;
      const nextMatches = [];
      for(let i=0; i<numMatches; i++) {
        nextMatches.push({ id: uuidv4(), player1: null, player2: null, p1Legs: null, p2Legs: null, isFinished: false, winner: null, isBye: false });
      }
      let nName = 'Round of ' + (numMatches * 2);
      if (numMatches === 4) nName = 'Quarter Finals';
      if (numMatches === 2) nName = 'Semi Finals';
      if (numMatches === 1) nName = 'Final';
      rounds.push({ id: `r_${roundIndex}`, name: nName, matches: nextMatches });
    }

    initialMatches.forEach((m, idx) => {
        if(m.isBye && rounds.length > 1) {
            const nextRound = rounds[1];
            const nextMatchIndex = Math.floor(idx / 2);
            const nextPlayerPos = idx % 2 === 0 ? 'player1' : 'player2';
            nextRound.matches[nextMatchIndex][nextPlayerPos] = m.winner;
        }
    });
    return rounds;
  };

  const startKnockouts = () => {
    const firstPlaces = [];
    const secondPlaces = [];

    groups.forEach(g => {
      const standings = calculateGroupStandings(g.players, groupMatches[g.id]);
      if (standings[0]) firstPlaces.push(standings[0]);
      if (standings[1]) secondPlaces.push(standings[1]);
    });

    const advancing = [];
    for(let i = 0; i < firstPlaces.length; i++) {
        advancing.push(firstPlaces[i]);
        advancing.push(secondPlaces[(i + 1) % secondPlaces.length] || secondPlaces[i]);
    }

    const initialKnockouts = generateKnockoutMatches(advancing);
    updateState({ knockouts: initialKnockouts, phase: PHASES.KNOCKOUT_STAGE });
  };

  const handleRematch = () => {
    updateState({ groups: [], groupMatches: {}, knockouts: [], winner: null, globalHistory: [], phase: PHASES.SETUP_GROUPS });
  };

  const handlePlayGroupMatch = (groupId, matchId) => {
    updateState({ activeMatch: { type: 'group', groupId, matchId }, phase: PHASES.MATCH_VIEW });
  };

  const handlePlayKnockoutMatch = (roundId, matchId) => {
    updateState({ activeMatch: { type: 'knockout', roundId, matchId }, phase: PHASES.MATCH_VIEW });
  };

  const handleMatchFinish = (p1Legs, p2Legs, matchHistory) => {
      let newGroupsMatches = { ...groupMatches };
      let newKnockouts = [...knockouts];
      let newWinner = winner;
      let returnPhase = PHASES.GROUP_STAGE;
      
      if (activeMatch.type === 'group') {
          returnPhase = PHASES.GROUP_STAGE;
          const gId = activeMatch.groupId;
          const matchIndex = newGroupsMatches[gId].findIndex(m => m.id === activeMatch.matchId);
          if (matchIndex >= 0) {
              const m = newGroupsMatches[gId][matchIndex];
              const { liveState, ...matchWithoutLiveState } = m;
              newGroupsMatches[gId][matchIndex] = { ...matchWithoutLiveState, p1Legs, p2Legs, isFinished: true };
          }
      } else if (activeMatch.type === 'knockout') {
          returnPhase = PHASES.KNOCKOUT_STAGE;
          const { roundId, matchId } = activeMatch;
          const rIndex = newKnockouts.findIndex(r => r.id === roundId);
          const mIndex = newKnockouts[rIndex].matches.findIndex(m => m.id === matchId);
          
          const { liveState, ...matchWithoutLiveState } = newKnockouts[rIndex].matches[mIndex];
          let m = { ...matchWithoutLiveState, p1Legs, p2Legs, isFinished: true };
          m.winner = m.p1Legs > m.p2Legs ? m.player1 : m.player2;
          newKnockouts[rIndex].matches[mIndex] = m;
          
          if (rIndex + 1 < newKnockouts.length) {
              const nextRoundMatch = { ...newKnockouts[rIndex + 1] };
              const nextMatches = [...nextRoundMatch.matches];
              const nextMatchIndex = Math.floor(mIndex / 2);
              const nextPlayerPos = mIndex % 2 === 0 ? 'player1' : 'player2';
              nextMatches[nextMatchIndex] = { ...nextMatches[nextMatchIndex], [nextPlayerPos]: m.winner };
              nextRoundMatch.matches = nextMatches;
              newKnockouts[rIndex + 1] = nextRoundMatch;
          } else {
              newWinner = m.winner;
          }
      } else if (activeMatch.type === 'single') {
          returnPhase = PHASES.STATS_VIEW;
      }

      updateState({
          groupMatches: newGroupsMatches,
          knockouts: newKnockouts,
          winner: newWinner,
          globalHistory: [...globalHistory, ...matchHistory],
          activeMatch: null,
          phase: returnPhase
      });
  };

  // updateState is now stable (useCallback with no deps in useTournamentState),
  // so this callback won't be recreated on every render — breaking the update loop
  const handleMatchLiveUpdate = useCallback((liveState) => {
    updateState(prev => {
      const { activeMatch } = prev;
      if (!activeMatch) return prev;

      if (activeMatch.type === 'group') {
        const gId = activeMatch.groupId;
        const matches = prev.groupMatches[gId];
        if (!matches) return prev;

        const matchIndex = matches.findIndex(m => m.id === activeMatch.matchId);
        if (matchIndex < 0) return prev;

        if (JSON.stringify(matches[matchIndex].liveState ?? null) === JSON.stringify(liveState)) return prev;

        return {
          ...prev,
          groupMatches: {
            ...prev.groupMatches,
            [gId]: matches.map((m, idx) => idx === matchIndex ? { ...m, liveState } : m)
          }
        };
      }

      if (activeMatch.type === 'knockout') {
        const { roundId, matchId } = activeMatch;
        const roundIndex = prev.knockouts.findIndex(r => r.id === roundId);
        if (roundIndex < 0) return prev;

        const matchIndex = prev.knockouts[roundIndex].matches.findIndex(m => m.id === matchId);
        if (matchIndex < 0) return prev;

        if (JSON.stringify(prev.knockouts[roundIndex].matches[matchIndex].liveState ?? null) === JSON.stringify(liveState)) return prev;

        const updatedKnockouts = prev.knockouts.map((round, rIdx) =>
          rIdx !== roundIndex ? round : {
            ...round,
            matches: round.matches.map((m, mIdx) => mIdx !== matchIndex ? m : { ...m, liveState })
          }
        );

        return { ...prev, knockouts: updatedKnockouts };
      }

      if (activeMatch.type === 'single') {
          if (JSON.stringify(prev.activeMatch.liveState ?? null) === JSON.stringify(liveState)) return prev;
          return {
            ...prev,
            activeMatch: { ...prev.activeMatch, liveState }
          };
      }

      return prev;
    });
  }, [updateState]);

  const getActiveMatchData = () => {
      if (!activeMatch) return null;
      if (activeMatch.type === 'single') {
          return activeMatch;
      }
      if (activeMatch.type === 'group') {
          return groupMatches[activeMatch.groupId].find(m => m.id === activeMatch.matchId);
      } else {
          const round = knockouts.find(r => r.id === activeMatch.roundId);
          return round.matches.find(m => m.id === activeMatch.matchId);
      }
  };

  return (
    <>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Dart4fun Competitions</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Live Sync Engine</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {peerId && (
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8rem' }}>
                <div style={{ color: 'var(--text-secondary)' }}>{isHost ? 'Room Code' : 'Connected to Room'}</div>
                <div style={{ fontWeight: 'bold', letterSpacing: '2px', color: 'var(--accent-color)' }}>{peerId}</div>
              </div>
          )}

          {(phase > PHASES.SETUP_GROUPS || (settings?.mode === '1v1' && phase >= PHASES.MATCH_VIEW)) && phase !== PHASES.STATS_VIEW && (
              <button className="secondary" onClick={() => setPhase(PHASES.STATS_VIEW)}>View Stats</button>
          )}
        </div>
      </header>

      <main>
        {phase === PHASES.LOBBY && (
            <Lobby onHost={initHost} onJoin={joinHost} />
        )}
        
        {phase === PHASES.SETUP_PLAYERS && (
          <PlayerEntry 
            players={players} 
            setPlayers={(p) => updateState({ players: p })} 
            onNext={() => setPhase(PHASES.SETUP_SETTINGS)} 
            onBack={() => setPhase(PHASES.LOBBY)}
          />
        )}
        
        {phase === PHASES.SETUP_SETTINGS && (
          <TournamentSettings 
            settings={settings}
            setSettings={(s) => updateState({ settings: s })}
            onNext={() => {
                if (settings.mode === '1v1') {
                    updateState({ 
                        activeMatch: {
                           id: uuidv4(),
                           type: 'single',
                           player1: players[0],
                           player2: players[1],
                           p1Legs: 0,
                           p2Legs: 0,
                           isFinished: false,
                           winner: null
                        },
                        phase: PHASES.MATCH_VIEW 
                    });
                } else {
                    setPhase(PHASES.SETUP_GROUPS);
                }
            }}
            onBack={() => setPhase(PHASES.SETUP_PLAYERS)}
          />
        )}
        
        {phase === PHASES.SETUP_GROUPS && (
          <GroupSetup 
            players={players} 
            onBack={() => setPhase(PHASES.SETUP_SETTINGS)}
            onGroupsCreated={handleGroupsCreated}
          />
        )}

        {phase === PHASES.GROUP_STAGE && (
          <GroupMatches 
            groups={groups}
            groupMatches={groupMatches}
            onPlayMatch={handlePlayGroupMatch}
            onProceedToKnockout={startKnockouts}
            onBack={() => setPhase(PHASES.SETUP_GROUPS)}
          />
        )}

        {phase === PHASES.KNOCKOUT_STAGE && (
          <KnockoutBracket
            matches={knockouts}
            onPlayMatch={handlePlayKnockoutMatch}
            winner={winner}
            onRematch={handleRematch}
            onBack={() => setPhase(PHASES.GROUP_STAGE)}
          />
        )}

        {phase === PHASES.MATCH_VIEW && activeMatch && (
          <MatchView
            match={getActiveMatchData()}
            settings={{ ...settings, bestOf: activeMatch.type === 'knockout' ? settings.knockoutBestOf : settings.bestOf }}
            onMatchFinish={handleMatchFinish}
            onLiveUpdate={handleMatchLiveUpdate}
            onBack={() => setPhase(activeMatch.type === 'single' ? PHASES.SETUP_SETTINGS : (activeMatch.type === 'group' ? PHASES.GROUP_STAGE : PHASES.KNOCKOUT_STAGE))}
          />
        )}

        {phase === PHASES.STATS_VIEW && (
          <StatsView
            players={players}
            globalHistory={activeMatch && getActiveMatchData()?.liveState ? [...globalHistory, ...(getActiveMatchData()?.liveState?.history || [])] : globalHistory}
            settings={settings}
            onBack={() => setPhase(activeMatch ? PHASES.MATCH_VIEW : (settings?.mode === '1v1' ? PHASES.SETUP_SETTINGS : (knockouts.length > 0 ? PHASES.KNOCKOUT_STAGE : PHASES.GROUP_STAGE)))}
          />
        )}
      </main>
    </>
  );
}

export default App;