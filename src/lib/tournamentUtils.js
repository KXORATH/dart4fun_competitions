export function generateRoundRobin(players) {
  const matches = [];
  let matchId = 1;
  const judgeCounts = {};
  
  const ps = [...players];
  if (ps.length % 2 !== 0) {
    ps.push(null);
  }
  
  const numRounds = ps.length - 1;
  const halfSize = ps.length / 2;
  
  for (let round = 0; round < numRounds; round++) {
    for (let i = 0; i < halfSize; i++) {
      const p1 = ps[i];
      const p2 = ps[ps.length - 1 - i];
      
      if (p1 !== null && p2 !== null) {
        const potentialJudges = players.filter(p => p.id !== p1.id && p.id !== p2.id);
        let judge = null;
        if (potentialJudges.length > 0) {
            let minCount = Infinity;
            potentialJudges.forEach(p => {
                if ((judgeCounts[p.id] || 0) < minCount) minCount = (judgeCounts[p.id] || 0);
            });
            const bestJudges = potentialJudges.filter(p => (judgeCounts[p.id] || 0) === minCount);
            judge = bestJudges[Math.floor(Math.random() * bestJudges.length)];
            judgeCounts[judge.id] = (judgeCounts[judge.id] || 0) + 1;
        }
        matches.push({
          id: `m_${matchId++}`,
          player1: p1,
          player2: p2,
          judge: judge,
          p1Legs: null,
          p2Legs: null,
          isFinished: false
        });
      }
    }
    const last = ps.pop();
    ps.splice(1, 0, last);
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
