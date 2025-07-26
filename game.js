// game.js: Lógica principal del juego Defender la Torre

// Estado inicial del juego
let gameState = {
    playerName: 'Anónimo',
    gold: 100,
    health: 100,
    score: 0,
    wave: 1,
    selectedTower: null,
    towers: [],
    enemies: [],
    projectiles: [],
    isWaveActive: false,
    gameRunning: true,
    startTime: Date.now(),
    enemiesKilled: 0,
    towersBuilt: 0,
    previewX: null,
    previewY: null
};

// Ruta de los enemigos en el lienzo
const path = [
    {x: 0, y: 300},
    {x: 200, y: 300},
    {x: 200, y: 150},
    {x: 400, y: 150},
    {x: 400, y: 450},
    {x: 600, y: 450},
    {x: 600, y: 300},
    {x: 800, y: 300}
];

// Inicializar lienzo y contexto
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Configuración de la fuente para iconos de enemigos
ctx.font = '24px "Font Awesome 6 Free"';

// Mapa de iconos de Font Awesome para enemigos
const enemyIcons = {
    goblin: '\uf6e2', // fa-ghost
    orc: '\uf714', // fa-skull-crossbones
    troll: '\uf7ed', // fa-dragon
    dragon: '\uf7e4' // fa-fire-alt
};

// Cargar configuración del juego desde game_data.json
let gameConfig;
async function loadGameConfig() {
    try {
        const response = await fetch('game_data.json');
        gameConfig = await response.json();
    } catch (error) {
        console.error('Error al cargar game_data.json:', error);
        alert('No se pudo cargar la configuración del juego. Usando valores predeterminados.');
        gameConfig = {
            towers: {
                basic: {cost: 20, damage: 25, range: 80, speed: 1000, color: "#4834d4"},
                strong: {cost: 50, damage: 50, range: 70, speed: 1500, color: "#ff6b6b"},
                fast: {cost: 30, damage: 15, range: 90, speed: 500, color: "#2ed573"},
                sniper: {cost: 80, damage: 100, range: 150, speed: 2500, color: "#ffa502"}
            },
            enemies: {
                goblin: {health: 50, speed: 1, reward: 10, color: "#FFD700"},
                orc: {health: 100, speed: 0.8, reward: 20, color: "#000000"},
                troll: {health: 200, speed: 0.5, reward: 40, color: "#0000FF"},
                dragon: {health: 500, speed: 0.3, reward: 100, color: "#00FF00"}
            },
            waves: [
                {goblin: 5},
                {goblin: 8, orc: 2},
                {goblin: 10, orc: 5},
                {orc: 8, troll: 2},
                {goblin: 15, orc: 10, troll: 3},
                {orc: 12, troll: 8, dragon: 1},
                {goblin: 20, orc: 15, troll: 10, dragon: 2},
                {troll: 15, dragon: 5}
            ]
        };
    }
}

// Verificar si una posición es válida para colocar una torre
function canPlaceTower(x, y) {
    let canPlace = true;

    // Verificar colisión con otras torres
    gameState.towers.forEach(tower => {
        if (Math.sqrt(Math.pow(x - tower.x, 2) + Math.pow(y - tower.y, 2)) < 40) {
            canPlace = false;
        }
    });

    // Verificar colisión con la ruta
    for (let i = 0; i < path.length - 1; i++) {
        let current = path[i];
        let next = path[i + 1];
        let distance = distancePointToLine(x, y, current, next);
        if (distance < 30) {
            canPlace = false;
            break;
        }
    }

    return canPlace;
}

// Dibujar la vista previa de la torre
function drawTowerPreview() {
    if (gameState.selectedTower && gameState.previewX !== null && gameState.previewY !== null) {
        ctx.save();
        let canPlace = canPlaceTower(gameState.previewX, gameState.previewY);
        let config = gameConfig.towers[gameState.selectedTower];

        // Dibujar el rango de la torre
        ctx.strokeStyle = canPlace ? 'green' : 'red';
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(gameState.previewX, gameState.previewY, config.range, 0, Math.PI * 2);
        ctx.stroke();

        // Dibujar la torre
        ctx.fillStyle = canPlace ? config.color + '80' : '#ff000080'; // Añadir opacidad
        ctx.fillRect(gameState.previewX - 15, gameState.previewY - 15, 30, 30);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(gameState.previewX - 15, gameState.previewY - 15, 30, 30);
        ctx.restore();
    }
}

// Clase Torre para gestionar el comportamiento de las torres
class Tower {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.config = gameConfig.towers[type];
        this.lastShot = 0;
        this.target = null;
    }

    // Actualizar el estado de la torre, incluyendo selección de objetivos y disparos
    update() {
        if (!this.target || this.getDistance(this.target) > this.config.range || this.target.health <= 0) {
            this.findTarget();
        }

        if (this.target && Date.now() - this.lastShot > this.config.speed) {
            this.shoot();
            this.lastShot = Date.now();
        }
    }

    // Encontrar el enemigo más cercano dentro del rango
    findTarget() {
        this.target = null;
        let minDistance = this.config.range;

        gameState.enemies.forEach(enemy => {
            let distance = this.getDistance(enemy);
            if (distance < minDistance) {
                minDistance = distance;
                this.target = enemy;
            }
        });
    }

    // Crear un proyectil dirigido al enemigo
    shoot() {
        if (this.target) {
            gameState.projectiles.push({
                x: this.x,
                y: this.y,
                targetX: this.target.x,
                targetY: this.target.y,
                target: this.target,
                damage: this.config.damage,
                speed: 5
            });
        }
    }

    // Calcular la distancia a un objetivo
    getDistance(target) {
        return Math.sqrt(Math.pow(this.x - target.x, 2) + Math.pow(this.y - target.y, 2));
    }

    // Dibujar la torre y su rango si tiene un objetivo
    draw() {
        ctx.fillStyle = this.config.color;
        ctx.fillRect(this.x - 15, this.y - 15, 30, 30);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - 15, this.y - 15, 30, 30);

        if (this.target) {
            ctx.strokeStyle = this.config.color;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.config.range, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }
}

// Clase Enemigo para gestionar el comportamiento de los enemigos
class Enemy {
    constructor(type) {
        this.type = type;
        this.config = gameConfig.enemies[type];
        this.health = this.config.health;
        this.maxHealth = this.config.health;
        this.pathIndex = 0;
        this.x = path[0].x;
        this.y = path[0].y;
        this.progress = 0;
    }

    // Actualizar la posición del enemigo a lo largo de la ruta
    update() {
        if (this.pathIndex < path.length - 1) {
            let current = path[this.pathIndex];
            let next = path[this.pathIndex + 1];

            let dx = next.x - current.x;
            let dy = next.y - current.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            let moveX = (dx / distance) * this.config.speed;
            let moveY = (dy / distance) * this.config.speed;

            this.x += moveX;
            this.y += moveY;

            this.progress += this.config.speed / distance;

            if (this.progress >= 1) {
                this.pathIndex++;
                this.progress = 0;
            }
        } else {
            gameState.health -= 10;
            this.health = 0;
            updateUI();

            if (gameState.health <= 0) {
                endGame();
            }
        }
    }

    // Aplicar daño al enemigo
    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            gameState.gold += this.config.reward;
            gameState.score += this.config.reward * 2;
            gameState.enemiesKilled++;
            updateUI();
        }
    }

    // Dibujar el enemigo con icono de Font Awesome y su barra de salud
    draw() {
        ctx.save();
        ctx.fillStyle = this.config.color;
        ctx.font = '24px "Font Awesome 6 Free"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(enemyIcons[this.type], this.x, this.y);

        let healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - 12, this.y - 18, 24, 4);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x - 12, this.y - 18, 24 * healthPercent, 4);
        ctx.restore();
    }
}

// Establecer el nombre del jugador
function setPlayerName() {
    let name = document.getElementById('playerNameInput').value.trim();
    if (name) {
        gameState.playerName = name;
        updateUI();
    }
}

// Seleccionar un tipo de torre para colocar
function selectTower(type) {
    if (gameConfig.towers[type].cost <= gameState.gold) {
        gameState.selectedTower = type;
        canvas.style.cursor = 'crosshair';
    }
}

// Colocar una torre en el lienzo
function placeTower(x, y) {
    if (gameState.selectedTower && gameConfig.towers[gameState.selectedTower].cost <= gameState.gold) {
        if (canPlaceTower(x, y)) {
            gameState.towers.push(new Tower(x, y, gameState.selectedTower));
            gameState.gold -= gameConfig.towers[gameState.selectedTower].cost;
            gameState.towersBuilt++;
            gameState.selectedTower = null;
            canvas.style.cursor = 'default';
            updateUI();
        }
    }
}

// Calcular la distancia de un punto a un segmento de línea
function distancePointToLine(px, py, line1, line2) {
    let A = px - line1.x;
    let B = py - line1.y;
    let C = line2.x - line1.x;
    let D = line2.y - line1.y;

    let dot = A * C + B * D;
    let lenSq = C * C + D * D;
    let param = lenSq !== 0 ? dot / lenSq : -1;

    let xx, yy;

    if (param < 0) {
        xx = line1.x;
        yy = line1.y;
    } else if (param > 1) {
        xx = line2.x;
        yy = line2.y;
    } else {
        xx = line1.x + param * C;
        yy = line1.y + param * D;
    }

    let dx = px - xx;
    let dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

// Iniciar una nueva oleada de enemigos
function startWave() {
    if (!gameState.isWaveActive && gameState.wave <= gameConfig.waves.length) {
        gameState.isWaveActive = true;
        console.log('Iniciando oleada:', gameState.wave);
        let waveConfig = gameConfig.waves[gameState.wave - 1];

        let currentEnemies = [];
        for (let enemyType in waveConfig) {
            for (let i = 0; i < waveConfig[enemyType]; i++) {
                currentEnemies.push(enemyType);
            }
        }

        for (let i = currentEnemies.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [currentEnemies[i], currentEnemies[j]] = [currentEnemies[j], currentEnemies[i]];
        }

        let spawnIndex = 0;
        let spawnTimer = setInterval(() => {
            if (spawnIndex < currentEnemies.length) {
                let enemy = new Enemy(currentEnemies[spawnIndex]);
                gameState.enemies.push(enemy);
                console.log('Enemigo spawn:', enemy.type, 'at', enemy.x, enemy.y);
                spawnIndex++;
            } else {
                clearInterval(spawnTimer);

                let waveCheck = setInterval(() => {
                    if (gameState.enemies.length === 0) {
                        clearInterval(waveCheck);
                        gameState.isWaveActive = false;
                        gameState.wave++;
                        gameState.gold += 25;
                        console.log('Oleada completada:', gameState.wave);
                        updateUI();

                        if (gameState.wave > gameConfig.waves.length) {
                            alert('¡Felicidades! ¡Has completado todas las olas!');
                            endGame();
                        }
                    }
                }, 100);
            }
        }, 1000);
    }
}

// Actualizar la interfaz con el estado actual del juego
function updateUI() {
    document.getElementById('playerName').textContent = gameState.playerName;
    document.getElementById('gold').textContent = gameState.gold;
    document.getElementById('health').textContent = gameState.health;
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('wave').textContent = gameState.wave;
    document.getElementById('enemies').textContent = gameState.enemies.length;
    document.getElementById('enemiesKilled').textContent = gameState.enemiesKilled;
    document.getElementById('towersBuilt').textContent = gameState.towersBuilt;

    // Actualizar el tiempo de juego
    let gameTime = Math.floor((Date.now() - gameState.startTime) / 1000);
    let minutes = Math.floor(gameTime / 60);
    let seconds = gameTime % 60;
    document.getElementById('gameTime').textContent =
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Finalizar el juego y mostrar la pantalla de fin
function endGame() {
    gameState.gameRunning = false;
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('finalWave').textContent = gameState.wave;
    document.getElementById('gameOver').style.display = 'block';
}

// Reiniciar el juego al estado inicial
function resetGame() {
    gameState = {
        playerName: gameState.playerName,
        gold: 100,
        health: 100,
        score: 0,
        wave: 1,
        selectedTower: null,
        towers: [],
        enemies: [],
        projectiles: [],
        isWaveActive: false,
        gameRunning: true,
        startTime: Date.now(),
        enemiesKilled: 0,
        towersBuilt: 0,
        previewX: null,
        previewY: null
    };
    document.getElementById('gameOver').style.display = 'none';
    canvas.style.cursor = 'default';
    updateUI();
}

// Bucle principal del juego para actualizar y renderizar
function gameLoop() {
    if (!gameState.gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    console.log('Rendering frame - Towers:', gameState.towers.length, 'Enemies:', gameState.enemies.length);

    // Dibujar la ruta de los enemigos
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();

    // Dibujar la vista previa de la torre
    drawTowerPreview();

    // Actualizar y dibujar torres
    gameState.towers.forEach(tower => {
        tower.update();
        tower.draw();
    });

    // Actualizar y dibujar enemigos
    gameState.enemies = gameState.enemies.filter(enemy => {
        enemy.update();
        enemy.draw();
        return enemy.health > 0;
    });

    // Actualizar y dibujar proyectiles
    gameState.projectiles = gameState.projectiles.filter(projectile => {
        let dx = projectile.targetX - projectile.x;
        let dy = projectile.targetY - projectile.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < projectile.speed) {
            if (projectile.target && projectile.target.health > 0) {
                projectile.target.takeDamage(projectile.damage);
            }
            return false;
        } else {
            projectile.x += (dx / distance) * projectile.speed;
            projectile.y += (dy / distance) * projectile.speed;

            // Dibujar proyectil
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(projectile.x, projectile.y, 3, 0, Math.PI * 2);
            ctx.fill();

            return true;
        }
    });

    updateUI();
    requestAnimationFrame(gameLoop);
}

// Escuchar movimiento del ratón para la vista previa de la torre
canvas.addEventListener('mousemove', (e) => {
    if (gameState.selectedTower) {
        let rect = canvas.getBoundingClientRect();
        gameState.previewX = e.clientX - rect.left;
        gameState.previewY = e.clientY - rect.top;
    } else {
        gameState.previewX = null;
        gameState.previewY = null;
    }
});

// Escuchar clics en el lienzo para colocar torres
canvas.addEventListener('click', (e) => {
    let rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    if (gameState.selectedTower) {
        placeTower(x, y);
    }
});

// Inicializar el juego después de cargar la configuración
async function initGame() {
    await loadGameConfig();
    loadLeaderboard();
    updateUI();
    gameLoop();
}

// Iniciar el juego
initGame();

// Actualizar la interfaz cada segundo
setInterval(updateUI, 1000);