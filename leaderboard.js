/**
 * GameZone Leaderboard Helper
 * Speichert Highscores im localStorage.
 * Format: leaderboard_<gameId> = [{name, score, date}]
 */

const Leaderboard = {
  /**
   * Einen Score eintragen.
   * @param {string} gameId  - z.B. 'snake'
   * @param {number} score   - Punktzahl
   * @param {boolean} lowerIsBetter - true für Reaktionszeit etc.
   */
  save(gameId, score, lowerIsBetter = false) {
    const name = localStorage.getItem('playerName') || 'Anonym';
    const key = 'leaderboard_' + gameId;
    let entries = JSON.parse(localStorage.getItem(key) || '[]');

    entries.push({
      name,
      score,
      date: new Date().toLocaleDateString('de-DE')
    });

    // Sortieren: höher = besser (oder niedriger = besser)
    entries.sort((a, b) => lowerIsBetter ? a.score - b.score : b.score - a.score);

    // Nur Top 10 behalten
    entries = entries.slice(0, 10);

    localStorage.setItem(key, JSON.stringify(entries));
  },

  /**
   * Top-Einträge für ein Spiel laden.
   */
  get(gameId) {
    return JSON.parse(localStorage.getItem('leaderboard_' + gameId) || '[]');
  },

  /**
   * Alle Spiel-IDs mit Einträgen.
   */
  getAllGames() {
    const games = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('leaderboard_')) {
        games.push(key.replace('leaderboard_', ''));
      }
    }
    return games;
  }
};
