const K = 32;

export function eloChange(ratingA, ratingB, aWon) {
  const expectedA = 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
  const scoreA = aWon ? 1 : 0;
  return Math.round(K * (scoreA - expectedA));
}

export function applyElo(player1, player2, winnerId) {
  const change1 = eloChange(player1.elo, player2.elo, winnerId === player1.id);
  return {
    player1_elo_change: change1,
    player2_elo_change: -change1,
    player1_new_elo: player1.elo + change1,
    player2_new_elo: player2.elo - change1,
  };
}
