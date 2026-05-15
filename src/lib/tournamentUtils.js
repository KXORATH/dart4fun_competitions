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

export function getGuaranteedPlacements(groupPlayers, groupMatches) {
    const unplayed = groupMatches.filter(m => !m.isFinished || m.p1Legs === null || m.p2Legs === null);
    const played = groupMatches.filter(m => m.isFinished && m.p1Legs !== null && m.p2Legs !== null);
    
    if (unplayed.length === 0) {
        const standings = calculateGroupStandings(groupPlayers, played);
        return { 1: standings[0], 2: standings[1] };
    }
    
    const stats = {};
    groupPlayers.forEach(p => stats[p.id] = { points: 0, possiblePoints: 0, p });
    
    played.forEach(m => {
        if (m.p1Legs > m.p2Legs) { stats[m.player1.id].points += 3; }
        else if (m.p1Legs < m.p2Legs) { stats[m.player2.id].points += 3; }
        else { stats[m.player1.id].points += 1; stats[m.player2.id].points += 1; }
    });
    
    unplayed.forEach(m => {
        stats[m.player1.id].possiblePoints += 3;
        stats[m.player2.id].possiblePoints += 3;
    });

    groupPlayers.forEach(p => {
        stats[p.id].maxPoints = stats[p.id].points + stats[p.id].possiblePoints;
    });
    
    let guaranteedFirst = null;
    let guaranteedSecond = null;

    for (const p of groupPlayers) {
        let isFirst = true;
        for (const other of groupPlayers) {
            if (p.id !== other.id && stats[p.id].points <= stats[other.id].maxPoints) {
                isFirst = false;
                break;
            }
        }
        if (isFirst) {
            guaranteedFirst = p;
        }
    }
    
    if (guaranteedFirst) {
        for (const p of groupPlayers) {
            if (p.id === guaranteedFirst.id) continue;
            let isSecond = true;
            for (const other of groupPlayers) {
                if (p.id !== other.id && other.id !== guaranteedFirst.id && stats[p.id].points <= stats[other.id].maxPoints) {
                    isSecond = false;
                    break;
                }
            }
            if (isSecond) {
                guaranteedSecond = p;
            }
        }
    }

    return { 1: guaranteedFirst, 2: guaranteedSecond };
}

export function getMatchupProbability(p1, p2, globalHistory = [], allMatches = []) {
    if (p1.isBot && p2.isBot) {
        const p1Score = p1.botAverage || 50;
        const p2Score = p2.botAverage || 50;
        return p1Score / (p1Score + p2Score);
    }
    
    // Default 50% if no history at all
    if (!globalHistory || globalHistory.length === 0) {
        const p1Score = p1.isBot ? (p1.botAverage || 50) : 50;
        const p2Score = p2.isBot ? (p2.botAverage || 50) : 50;
        if (p1Score === p2Score) return 0.5;
        return p1Score / (p1Score + p2Score);
    }

    const getStats = (playerId) => {
        let totalScore = 0;
        let totalDarts = 0;
        let highestCheckout = 0;
        let legsWon = 0;
        
        globalHistory.forEach(h => {
            if (h.playerId !== playerId) return;
            if (h.type === 'LEG_WIN') {
                legsWon++;
                if (h.checkout > highestCheckout) highestCheckout = h.checkout;
            } else {
                if (!h.isBust) totalScore += (h.score || 0);
                totalDarts += (h.dartsThrown || 3);
            }
        });
        
        const average = totalDarts > 0 ? (totalScore / totalDarts) * 3 : 0;
        return { average, highestCheckout, legsWon };
    };

    const s1 = getStats(p1.id);
    const s2 = getStats(p2.id);

    // If neither has played enough darts, return fallback
    if (s1.average === 0 && s2.average === 0 && s1.legsWon === 0 && s2.legsWon === 0) {
        const p1Score = p1.isBot ? (p1.botAverage || 50) : 50;
        const p2Score = p2.isBot ? (p2.botAverage || 50) : 50;
        if (p1Score === p2Score) return 0.5;
        return p1Score / (p1Score + p2Score);
    }

    // 1. Average (Base 50%)
    const p1AvgScore = p1.isBot ? (p1.botAverage || 50) : (s1.average > 0 ? s1.average : 40);
    const p2AvgScore = p2.isBot ? (p2.botAverage || 50) : (s2.average > 0 ? s2.average : 40);
    
    // 2. Checkout (Finishing 20%)
    const p1CheckScore = p1.isBot ? p1AvgScore : (s1.highestCheckout > 0 ? Math.min(100, s1.highestCheckout) : p1AvgScore * 0.8);
    const p2CheckScore = p2.isBot ? p2AvgScore : (s2.highestCheckout > 0 ? Math.min(100, s2.highestCheckout) : p2AvgScore * 0.8);

    // 3. Head to Head (30%)
    let p1H2hWins = 0;
    let p2H2hWins = 0;
    
    if (allMatches && allMatches.length > 0) {
        allMatches.forEach(m => {
            if (m && m.isFinished && m.p1Legs !== null && m.p2Legs !== null && m.player1 && m.player2) {
                if (m.player1.id === p1.id && m.player2.id === p2.id) {
                    p1H2hWins += m.p1Legs;
                    p2H2hWins += m.p2Legs;
                } else if (m.player1.id === p2.id && m.player2.id === p1.id) {
                    p2H2hWins += m.p1Legs;
                    p1H2hWins += m.p2Legs;
                }
            }
        });
    }

    let p1H2hScore = p1AvgScore;
    let p2H2hScore = p2AvgScore;
    if (p1H2hWins > p2H2hWins) {
        p1H2hScore = p1AvgScore * 1.5;
    } else if (p2H2hWins > p1H2hWins) {
        p2H2hScore = p2AvgScore * 1.5;
    }

    // Exponent to make difference more pronounced
    const power1 = Math.pow((p1AvgScore * 0.5) + (p1CheckScore * 0.2) + (p1H2hScore * 0.3), 1.5);
    const power2 = Math.pow((p2AvgScore * 0.5) + (p2CheckScore * 0.2) + (p2H2hScore * 0.3), 1.5);

    if (power1 + power2 === 0) return 0.5;
    return power1 / (power1 + power2);
}

export function calculateAdvancementOdds(groupPlayers, groupMatches, numSimulations = 1000, globalHistory = [], allMatches = []) {
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
    
    const getWinProb = (p1, p2) => {
        return getMatchupProbability(p1, p2, globalHistory, allMatches);
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
    let most100plus = { count: 0, player: null };
    let most180s = { count: 0, player: null };
    let bestAverage = { avg: 0, player: null };
    
    if (!globalHistory || globalHistory.length === 0) return { highestCheckout, most60plus, most100plus, most180s, bestAverage };

    const playerStats = {};
    players.forEach(p => {
        playerStats[p.id] = { totalScore: 0, totalDarts: 0, count60plus: 0, count100plus: 0, count180: 0, name: p.name };
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
                if ((h.score || 0) >= 60 && (h.score || 0) < 100) {
                    playerStats[h.playerId].count60plus++;
                }
                if ((h.score || 0) >= 100 && (h.score || 0) < 180) {
                    playerStats[h.playerId].count100plus++;
                }
                if ((h.score || 0) === 180) {
                    playerStats[h.playerId].count180++;
                }
            }
            playerStats[h.playerId].totalDarts += (h.dartsThrown || 3);
        }
    });

    let max60plusCount = 0;
    let max60plusPlayer = null;
    let max100plusCount = 0;
    let max100plusPlayer = null;
    let max180Count = 0;
    let max180Player = null;
    let maxAvg = 0;
    let maxAvgPlayer = null;

    Object.keys(playerStats).forEach(pid => {
        const stats = playerStats[pid];
        if (stats.count60plus > max60plusCount) {
            max60plusCount = stats.count60plus;
            max60plusPlayer = stats.name;
        }
        if (stats.count100plus > max100plusCount) {
            max100plusCount = stats.count100plus;
            max100plusPlayer = stats.name;
        }
        if (stats.count180 > max180Count) {
            max180Count = stats.count180;
            max180Player = stats.name;
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
    if (max100plusCount > 0) most100plus = { count: max100plusCount, player: max100plusPlayer };
    if (max180Count > 0) most180s = { count: max180Count, player: max180Player };
    if (maxAvg > 0) bestAverage = { avg: maxAvg.toFixed(2), player: maxAvgPlayer };

    return { highestCheckout, most60plus, most100plus, most180s, bestAverage };
}
