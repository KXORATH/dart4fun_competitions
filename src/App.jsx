import React, { useState } from 'react';
import PlayerEntry from './components/PlayerEntry';
import GroupSetup from './components/GroupSetup';
import GroupMatches from './components/GroupMatches';
import KnockoutBracket from './components/KnockoutBracket';
import { calculateGroupStandings } from './lib/tournamentUtils';
import { v4 as uuidv4 } from 'uuid';

const PHASES = {
  SETUP_PLAYERS: 0,
  SETUP_GROUPS: 1,
  GROUP_STAGE: 2,
  KNOCKOUT_STAGE: 3
};

function App() {
  const [phase, setPhase] = useState(PHASES.SETUP_PLAYERS);
  const [players, setPlayers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupMatches, setGroupMatches] = useState({});
  const [knockouts, setKnockouts] = useState([]);
  const [winner, setWinner] = useState(null);

  const handleGroupsCreated = (newGroups, initialMatches) => {
    setGroups(newGroups);
    setGroupMatches(initialMatches);
    setPhase(PHASES.GROUP_STAGE);
  };

  const handleUpdateGroupMatch = (groupId, matchId, playerNum, legs) => {
    setGroupMatches(prev => {
      const updated = { ...prev };
      const matchIndex = updated[groupId].findIndex(m => m.id === matchId);
      if (matchIndex >= 0) {
        const match = updated[groupId][matchIndex];
        if (playerNum === 1) match.p1Legs = legs;
        if (playerNum === 2) match.p2Legs = legs;
        match.isFinished = match.p1Legs !== null && match.p2Legs !== null;
      }
      return updated;
    });
  };

  const generateKnockoutMatches = (advancingPlayers) => {
    let rounds = [];
    
    // Calculate P (next power of 2)
    const N = advancingPlayers.length;
    let P = 1;
    while(P < N) P *= 2;
    
    const byes = P - N;
    const initialMatches = [];
    
    let playerIndex = 0;
    const numInitialMatches = P / 2;
    
    for (let i = 0; i < numInitialMatches; i++) {
        if (i < byes) {
            // Bye match
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
            // Normal match
            const p1 = advancingPlayers[playerIndex++];
            const p2 = advancingPlayers[playerIndex++];
            initialMatches.push({
                id: uuidv4(),
                player1: p1,
                player2: p2,
                p1Legs: null,
                p2Legs: null,
                isFinished: false,
                winner: null,
                isBye: false
            });
        }
    }

    let roundName = 'Round of ' + P;
    if (P === 8) roundName = 'Quarter Finals';
    if (P === 4) roundName = 'Semi Finals';
    if (P === 2) roundName = 'Final';
    
    let roundIndex = 0;
    rounds.push({
      id: `r_${roundIndex}`,
      name: roundName,
      matches: initialMatches
    });

    let numMatches = numInitialMatches;
    
    while (numMatches > 1) {
      roundIndex++;
      numMatches = numMatches / 2;
      const nextMatches = [];
      for(let i=0; i<numMatches; i++) {
        nextMatches.push({
          id: uuidv4(),
          player1: null,
          player2: null,
          p1Legs: null,
          p2Legs: null,
          isFinished: false,
          winner: null,
          isBye: false
        });
      }
      
      let nName = 'Round of ' + (numMatches * 2);
      if (numMatches === 4) nName = 'Quarter Finals';
      if (numMatches === 2) nName = 'Semi Finals';
      if (numMatches === 1) nName = 'Final';
      
      rounds.push({
        id: `r_${roundIndex}`,
        name: nName,
        matches: nextMatches
      });
    }

    // Propagate byes to round 2
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
    // 1. Get top 2 from each group
    const firstPlaces = [];
    const secondPlaces = [];

    groups.forEach(g => {
      const standings = calculateGroupStandings(g.players, groupMatches[g.id]);
      if (standings[0]) firstPlaces.push(standings[0]);
      if (standings[1]) secondPlaces.push(standings[1]);
    });

    const advancing = [];
    // Cross-match 1st and 2nd places
    for(let i = 0; i < firstPlaces.length; i++) {
        advancing.push(firstPlaces[i]);
        advancing.push(secondPlaces[(i + 1) % secondPlaces.length] || secondPlaces[i]);
    }

    // fallback if no second places or just total power of 2 needed
    // In a robust system, we would pad with byes to next power of 2. 
    // We'll trust user follows basic 'power of 2' sizes (e.g. 2 groups -> 4 advance)

    const initialKnockouts = generateKnockoutMatches(advancing);
    setKnockouts(initialKnockouts);
    setPhase(PHASES.KNOCKOUT_STAGE);
  };

  const handleUpdateKnockoutMatch = (roundId, matchId, playerNum, legs) => {
    setKnockouts(prev => {
      const updatedRounds = [...prev];
      const rIndex = updatedRounds.findIndex(r => r.id === roundId);
      const mIndex = updatedRounds[rIndex].matches.findIndex(m => m.id === matchId);
      
      const match = updatedRounds[rIndex].matches[mIndex];
      if (playerNum === 1) match.p1Legs = legs;
      if (playerNum === 2) match.p2Legs = legs;
      
      match.isFinished = match.p1Legs !== null && match.p2Legs !== null && match.p1Legs !== match.p2Legs; // Must have winner
      
      if (match.isFinished) {
        match.winner = match.p1Legs > match.p2Legs ? match.player1 : match.player2;
        
        // Propagate winner to next round
        if (rIndex + 1 < updatedRounds.length) {
          const nextRound = updatedRounds[rIndex + 1];
          const nextMatchIndex = Math.floor(mIndex / 2);
          const nextPlayerPos = mIndex % 2 === 0 ? 'player1' : 'player2';
          nextRound.matches[nextMatchIndex][nextPlayerPos] = match.winner;
        } else {
            // Final winner
            setWinner(match.winner);
        }
      } else {
          match.winner = null;
          // Un-propagate if changed
          if (rIndex + 1 < updatedRounds.length) {
              // we don't handle complex un-propagate recursively for simplicity here, 
              // it's a simple path forwards.
          } else {
              setWinner(null);
          }
      }
      
      return updatedRounds;
    });
  };

  const handleRematch = () => {
    setGroups([]);
    setGroupMatches({});
    setKnockouts([]);
    setWinner(null);
    setPhase(PHASES.SETUP_GROUPS);
  };

  return (
    <>
      <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Dart4fun Competitions</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your competition with ease.</p>
      </header>

      <main>
        {phase === PHASES.SETUP_PLAYERS && (
          <PlayerEntry 
            players={players} 
            setPlayers={setPlayers} 
            onNext={() => setPhase(PHASES.SETUP_GROUPS)} 
          />
        )}
        
        {phase === PHASES.SETUP_GROUPS && (
          <GroupSetup 
            players={players} 
            onBack={() => setPhase(PHASES.SETUP_PLAYERS)}
            onGroupsCreated={handleGroupsCreated}
          />
        )}

        {phase === PHASES.GROUP_STAGE && (
          <GroupMatches 
            groups={groups}
            groupMatches={groupMatches}
            onUpdateMatch={handleUpdateGroupMatch}
            onProceedToKnockout={startKnockouts}
          />
        )}

        {phase === PHASES.KNOCKOUT_STAGE && (
          <KnockoutBracket
            matches={knockouts}
            onUpdateMatch={handleUpdateKnockoutMatch}
            winner={winner}
            onRematch={handleRematch}
          />
        )}
      </main>
    </>
  );
}

export default App;
