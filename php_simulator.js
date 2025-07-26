// php_simulator.js: Simula la funcionalidad del backend PHP usando localStorage

// Configuración simulada de PHP
const phpConfig = {
    database: {
        host: 'localhost',
        user: 'game_user',
        password: 'game_pass',
        database: 'tower_defense'
    },
    game: {
        maxScores: 10,
        defaultGold: 100,
        defaultHealth: 100
    }
};

// Clase para simular el backend PHP
class PHPSimulator {
    // Guardar una puntuación en localStorage
    static async saveScore(playerName, score, wave) {
        let scores = this.getStoredScores();
        scores.push({
            player: playerName,
            score: score,
            wave: wave,
            date: new Date().toISOString().split('T')[0]
        });

        // Mantener solo las 10 mejores puntuaciones
        scores.sort((a, b) => b.score - a.score);
        scores = scores.slice(0, 10);

        localStorage.setItem('towerDefenseScores', JSON.stringify(scores));
        return { success: true, message: 'Puntuación guardada' };
    }

    // Obtener la tabla de clasificación
    static async getLeaderboard() {
        return new Promise(resolve => {
            setTimeout(() => {
                let scores = this.getStoredScores();
                resolve(scores);
            }, 500);
        });
    }

    // Obtener puntuaciones almacenadas o devolver valores predeterminados
    static getStoredScores() {
        let stored = localStorage.getItem('towerDefenseScores');
        return stored ? JSON.parse(stored) : [
            { player: 'Admin', score: 5000, wave: 8, date: '2025-01-01' },
            { player: 'Pro Player', score: 3500, wave: 6, date: '2025-01-02' },
            { player: 'Rookie', score: 1200, wave: 4, date: '2025-01-03' }
        ];
    }

    // Guardar el estado del juego en localStorage
    static async saveGame(gameData) {
        localStorage.setItem('towerDefenseSave', JSON.stringify(gameData));
        return { success: true, message: 'Juego guardado' };
    }

    // Cargar el estado del juego desde localStorage
    static async loadGame() {
        let saved = localStorage.getItem('towerDefenseSave');
        return saved ? JSON.parse(saved) : null;
    }
}

// Funciones para interactuar con el simulador de PHP
async function saveScore() {
    let result = await PHPSimulator.saveScore(gameState.playerName, gameState.score, gameState.wave);
    if (result.success) {
        alert('¡Puntuación guardada exitosamente!');
        loadLeaderboard();
    }
}

async function saveGame() {
    let gameData = {
        ...gameState,
        timestamp: Date.now()
    };
    let result = await PHPSimulator.saveGame(gameData);
    if (result.success) {
        alert('¡Juego guardado!');
    }
}

async function loadGame() {
    let savedGame = await PHPSimulator.loadGame();
    if (savedGame) {
        gameState.playerName = savedGame.playerName;
        gameState.gold = savedGame.gold;
        gameState.health = savedGame.health;
        gameState.score = savedGame.score;
        gameState.wave = savedGame.wave;
        gameState.enemiesKilled = savedGame.enemiesKilled;
        gameState.towersBuilt = savedGame.towersBuilt;

        updateUI();
        alert('¡Juego cargado!');
    } else {
        alert('No hay juegos guardados');
    }
}

async function loadLeaderboard() {
    document.getElementById('leaderboardList').innerHTML = '<div class="loading">Cargando...</div>';

    let scores = await PHPSimulator.getLeaderboard();
    let html = '';

    scores.forEach((score, index) => {
        html += `
            <div class="leaderboard-entry">
                <span>${index + 1}. ${score.player}</span>
                <span>${score.score} pts (Oleada ${score.wave})</span>
            </div>
        `;
    });

    document.getElementById('leaderboardList').innerHTML = html || '<p>No hay puntuaciones</p>';
}