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

  return Object.values(stats).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.legDiff !== a.legDiff) return b.legDiff - a.legDiff;
    return b.legsFor - a.legsFor;
  });
}

export function calculateAdvancementOdds(groupPlayers, groupMatches, numSimulations = 1000) {
    if (!groupMatches || groupMatches.length === 0) return {};
    
    const played = groupMatches.filter(m => m.isFinished && m.p1Legs !== null && m.p2Legs !== null);
    const unplayed = groupMatches.filter(m => !m.isFinished || m.p1Legs === null || m.p2Legs === null);
    
    if (unplayed.length === 0) {
        const finalStandings = calculateGroupStandings(groupPlayers, played);
        const result = {};
        finalStandings.forEach((p, i) => {
            result[p.id] = i < 2 ? 100 : 0;
        });
        return result;
    }
    
    const playerStats = {};
    groupPlayers.forEach(p => {
        playerStats[p.id] = { legsWon: 0, matchesPlayed: 0 };
    });
    
    played.forEach(m => {
        if (playerStats[m.player1.id]) {
            playerStats[m.player1.id].legsWon += m.p1Legs;
            playerStats[m.player1.id].matchesPlayed++;
        }
        if (playerStats[m.player2.id]) {
            playerStats[m.player2.id].legsWon += m.p2Legs;
            playerStats[m.player2.id].matchesPlayed++;
        }
    });
    
    const getWinProb = (p1, p2) => {
        let p1Skill = 50;
        let p2Skill = 50;
        
        if (p1.isBot && p1.botAverage) p1Skill = p1.botAverage;
        if (p2.isBot && p2.botAverage) p2Skill = p2.botAverage;

        const p1Score = (playerStats[p1.id] ? (playerStats[p1.id].legsWon / Math.max(1, playerStats[p1.id].matchesPlayed)) : 0) * 10 + p1Skill;
        const p2Score = (playerStats[p2.id] ? (playerStats[p2.id].legsWon / Math.max(1, playerStats[p2.id].matchesPlayed)) : 0) * 10 + p2Skill;
        return p1Score / (p1Score + p2Score);
    };

    let advancementCounts = {};
    groupPlayers.forEach(p => advancementCounts[p.id] = 0);

    for (let i = 0; i < numSimulations; i++) {
        const simulatedUnplayed = unplayed.map(m => {
            const p1WinProb = getWinProb(m.player1, m.player2);
            const p1Wins = Math.random() < p1WinProb;
            return {
                ...m,
                isFinished: true,
                p1Legs: p1Wins ? 2 : 0,
                p2Legs: p1Wins ? 0 : 2
            };
        });

        const allSimulatedMatches = [...played, ...simulatedUnplayed];
        const standings = calculateGroupStandings(groupPlayers, allSimulatedMatches);
        
        if (standings[0]) advancementCounts[standings[0].id]++;
        if (standings[1]) advancementCounts[standings[1].id]++;
    }

    const odds = {};
    groupPlayers.forEach(p => {
        odds[p.id] = Math.round((advancementCounts[p.id] / numSimulations) * 100);
    });
    
    return odds;
}

export function calculateGlobalStats(globalHistory, players) {
    let highestCheckout = { score: 0, player: null };
    let most60plus = { count: 0, player: null };
    let bestAverage = { avg: 0, player: null };
    
    if (!globalHistory || globalHistory.length === 0) return { highestCheckout, most60plus, bestAverage };

    const playerStats = {};
    players.forEach(p => {
        playerStats[p.id] = { totalScore: 0, totalDarts: 0, count60plus: 0, name: p.name };
    });

    globalHistory.forEach(h => {
        if (!playerStats[h.playerId]) return;
        
        if (h.type === 'LEG_WIN') {
            if (h.checkout > highestCheckout.score) {
                highestCheckout = { score: h.checkout, player: playerStats[h.playerId].name };
            }
        } else {
            if (!h.isBust) {
                playerStats[h.playerId].totalScore += (h.score || 0);
                if ((h.score || 0) >= 60) {
                    playerStats[h.playerId].count60plus++;
                }
            }
            playerStats[h.playerId].totalDarts += (h.dartsThrown || 3);
        }
    });

    let max60plusCount = 0;
    let max60plusPlayer = null;
    let maxAvg = 0;
    let maxAvgPlayer = null;

    Object.keys(playerStats).forEach(pid => {
        const stats = playerStats[pid];
        if (stats.count60plus > max60plusCount) {
            max60plusCount = stats.count60plus;
            max60plusPlayer = stats.name;
        }
        
        if (stats.totalDarts > 0) {
            const avg = (stats.totalScore / stats.totalDarts) * 3;
            if (avg > maxAvg) {
                maxAvg = avg;
                maxAvgPlayer = stats.name;
            }
        }
    });

    if (max60plusCount > 0) most60plus = { count: max60plusCount, player: max60plusPlayer };
    if (maxAvg > 0) bestAverage = { avg: maxAvg.toFixed(2), player: maxAvgPlayer };

    return { highestCheckout, most60plus, bestAverage };
}
