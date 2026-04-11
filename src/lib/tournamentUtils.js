export function generateRoundRobin(players) {
  const matches = [];
  let matchId = 1;
  const numPlayers = players.length;
  
  for (let i = 0; i < numPlayers; i++) {
    for (let j = i + 1; j < numPlayers; j++) {
      matches.push({
        id: `m_${matchId++}`,
        player1: players[i],
        player2: players[j],
        p1Legs: null,
        p2Legs: null,
        isFinished: false
      });
    }
  }
  return matches;
}

export function calculateGroupStandings(groupPlayers, groupMatches) {
  // Initialize stats
  const stats = {};
  groupPlayers.forEach(p => {
    stats[p.id] = { ...p, played: 0, won: 0, lost: 0, drawn: 0, legsFor: 0, legsAgainst: 0, points: 0, legDiff: 0 };
  });

  // Calculate results
  groupMatches.forEach(m => {
    if (m.isFinished && m.p1Legs !== null && m.p2Legs !== null) {
      const p1 = stats[m.player1.id];
      const p2 = stats[m.player2.id];

      p1.played++; p2.played++;
      p1.legsFor += m.p1Legs; p2.legsFor += m.p2Legs;
      p1.legsAgainst += m.p2Legs; p2.legsAgainst += m.p1Legs;

      if (m.p1Legs > m.p2Legs) {
        p1.won++; p2.lost++; p1.points += 3;
      } else if (m.p1Legs < m.p2Legs) {
        p2.won++; p1.lost++; p2.points += 3;
      } else {
        p1.drawn++; p2.drawn++; p1.points += 1; p2.points += 1;
      }
      
      p1.legDiff = p1.legsFor - p1.legsAgainst;
      p2.legDiff = p2.legsFor - p2.legsAgainst;
    }
  });

  // Sort by points, then leg diff, then legs for
  return Object.values(stats).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.legDiff !== a.legDiff) return b.legDiff - a.legDiff;
    return b.legsFor - a.legsFor;
  });
}
