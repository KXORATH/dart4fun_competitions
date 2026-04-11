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
    // Basic logic for creating matches. We'll support Semi/Final logic dynamically based on length
    // advancingPlayers is an array of player objects
    
    // Shuffle slightly to avoid predictable brackets if groups were unbalanced
    // But ideal is 1st vs 2nd, which we did in our collection logic
    
    let rounds = [];
    let currentPlayers = advancingPlayers;
    let roundIndex = 0;

    // Build the initial round (e.g., Semis if 4 players, Quarters if 8)
    const initialMatches = [];
    for (let i = 0; i < currentPlayers.length; i += 2) {
      initialMatches.push({
        id: uuidv4(),
        player1: currentPlayers[i],
        player2: currentPlayers[i + 1] || null, // bye if odd
        p1Legs: null,
        p2Legs: null,
        isFinished: false,
        winner: null
      });
    }

    let numMatches = initialMatches.length;
    let roundName = 'Round of ' + currentPlayers.length;
    if (currentPlayers.length === 4) roundName = 'Semi Finals';
    if (currentPlayers.length === 2) roundName = 'Final';
    
    rounds.push({
      id: `r_${roundIndex}`,
      name: roundName,
      matches: initialMatches
    });
    
    // Pre-calculate empty following rounds
    while (numMatches > 1) {
      roundIndex++;
      numMatches = Math.ceil(numMatches / 2);
      const nextMatches = [];
      for(let i=0; i<numMatches; i++) {
        nextMatches.push({
          id: uuidv4(),
          player1: null,
          player2: null,
          p1Legs: null,
          p2Legs: null,
          isFinished: false,
          winner: null
        });
      }
      
      let nName = 'Round';
      if (numMatches === 2) nName = 'Semi Finals';
      if (numMatches === 1) nName = 'Final';
      
      rounds.push({
        id: `r_${roundIndex}`,
        name: nName,
        matches: nextMatches
      });
    }

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

  return (
    <>
      <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Dart Tournament Manager</h1>
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
          />
        )}
      </main>
    </>
  );
}

export default App;
