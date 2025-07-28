export const GAME_CONFIG = {
    // Configuración de torres con sus estadísticas por tipo
    towers: {
        basic: {
            name: 'Básica',
            cost: 20,
            damage: 25,
            range: 80,
            fireRate: 1000, // milisegundos
            color: '#8B4513' // marrón
        },
        strong: {
            name: 'Fuerte',
            cost: 50,
            damage: 50,
            range: 70,
            fireRate: 1500, // milisegundos
            color: '#696969' // gris
        },
        fast: {
            name: 'Rápida',
            cost: 30,
            damage: 15,
            range: 90,
            fireRate: 500, // milisegundos
            color: '#4169E1' // azul
        },
        sniper: {
            name: 'Francotirador',
            cost: 80,
            damage: 100,
            range: 150,
            fireRate: 2500, // milisegundos
            color: '#800080' // púrpura
        }
    },
    
    // Configuración de enemigos con sus estadísticas por tipo
    enemies: {
        goblin: {
            name: 'Goblin',
            health: 50,
            speed: 1,
            reward: 10,
            color: '#FFD700' // amarillo
        },
        orc: {
            name: 'Orc',
            health: 100,
            speed: 0.8,
            reward: 20,
            color: '#000000' // negro
        },
        troll: {
            name: 'Troll',
            health: 200,
            speed: 0.5,
            reward: 40,
            color: '#0000FF' // azul
        },
        dragon: {
            name: 'Dragon',
            health: 500,
            speed: 0.3,
            reward: 100,
            color: '#228B22' // verde
        }
    },
    
    // Configuración de las 8 oleadas predefinidas
    waves: [
        [{ type: 'goblin', count: 5 }], // Oleada 1
        [{ type: 'goblin', count: 8 }, { type: 'orc', count: 2 }], // Oleada 2
        [{ type: 'goblin', count: 10 }, { type: 'orc', count: 5 }], // Oleada 3
        [{ type: 'orc', count: 8 }, { type: 'troll', count: 2 }], // Oleada 4
        [{ type: 'goblin', count: 15 }, { type: 'orc', count: 10 }, { type: 'troll', count: 3 }], // Oleada 5
        [{ type: 'orc', count: 12 }, { type: 'troll', count: 8 }, { type: 'dragon', count: 1 }], // Oleada 6
        [{ type: 'goblin', count: 20 }, { type: 'orc', count: 15 }, { type: 'troll', count: 10 }, { type: 'dragon', count: 2 }], // Oleada 7
        [{ type: 'troll', count: 15 }, { type: 'dragon', count: 5 }] // Oleada 8
    ],
    
    // Ruta fija que deben seguir los enemigos
    path: [
        {x: 0, y: 300},
        {x: 200, y: 300},
        {x: 200, y: 150},
        {x: 400, y: 150},
        {x: 400, y: 450},
        {x: 600, y: 450},
        {x: 600, y: 300},
        {x: 800, y: 300}
    ]
};

// Estado inicial del juego
export const initialGameState = {
    gold: 100,
    life: 100,
    score: 0,
    wave: 1,
    enemiesKilled: 0,
    towersBuilt: 0,
    gameTime: 0,
    playerName: 'Anónimo',
    isPaused: false,
    isGameOver: false,
    waveInProgress: false,
    enemiesInWave: 0,
    enemiesRemaining: 0
};