// Configuración del juego
const CONFIG = {
    // Configuración de torres
    towers: {
        basic: {
            name: "Básica",
            cost: 20,
            damage: 25,
            range: 80,
            cooldown: 1000,
            color: "rgba(0, 100, 255, 0.7)",
            previewColor: "rgba(0, 100, 255, 0.3)"
        },
        strong: {
            name: "Fuerte",
            cost: 50,
            damage: 50,
            range: 70,
            cooldown: 1500,
            color: "rgba(255, 0, 0, 0.7)",
            previewColor: "rgba(255, 0, 0, 0.3)"
        },
        fast: {
            name: "Rápida",
            cost: 30,
            damage: 15,
            range: 90,
            cooldown: 500,
            color: "rgba(0, 255, 0, 0.7)",
            previewColor: "rgba(0, 255, 0, 0.3)"
        },
        sniper: {
            name: "Francotirador",
            cost: 80,
            damage: 100,
            range: 150,
            cooldown: 2500,
            color: "rgba(255, 255, 0, 0.7)",
            previewColor: "rgba(255, 255, 0, 0.3)"
        }
    },
    
    // Configuración de enemigos
    enemies: {
        goblin: {
            health: 50,
            speed: 1,
            reward: 10,
            color: "yellow",
            width: 20,
            height: 20
        },
        orc: {
            health: 100,
            speed: 0.8,
            reward: 20,
            color: "black",
            width: 25,
            height: 25
        },
        troll: {
            health: 200,
            speed: 0.5,
            reward: 40,
            color: "blue",
            width: 30,
            height: 30
        },
        dragon: {
            health: 500,
            speed: 0.3,
            reward: 100,
            color: "green",
            width: 40,
            height: 40
        }
    },
    
    // Configuración de oleadas
    waves: [
        { goblin: 5 },
        { goblin: 8, orc: 2 },
        { goblin: 10, orc: 5 },
        { orc: 8, troll: 2 },
        { goblin: 15, orc: 10, troll: 3 },
        { orc: 12, troll: 8, dragon: 1 },
        { goblin: 20, orc: 15, troll: 10, dragon: 2 },
        { troll: 15, dragon: 5 }
    ],
    
    // Ruta de los enemigos
    path: [
        { x: 0, y: 300 },
        { x: 200, y: 300 },
        { x: 200, y: 150 },
        { x: 400, y: 150 },
        { x: 400, y: 450 },
        { x: 600, y: 450 },
        { x: 600, y: 300 },
        { x: 800, y: 300 }
    ],
    
    // Configuración de proyectiles
    projectile: {
        speed: 5,
        radius: 3,
        color: "yellow"
    }
};

// Estado del juego
const gameState = {
    gold: 100,
    health: 100,
    score: 0,
    wave: 0,
    enemies: [],
    towers: [],
    projectiles: [],
    selectedTowerType: null,
    selectedTower: null,
    placingTower: false,
    waveActive: false,
    gamePaused: false,
    gameOver: false,
    enemiesKilled: 0,
    towersBuilt: 0,
    gameTime: 0,
    lastFrameTime: 0,
    enemySpawnInterval: null,
    waveEnemies: [],
    enemiesRemaining: 0,
    messages: []
};

// Elementos del DOM
const elements = {
    canvas: document.getElementById("gameCanvas"),
    ctx: document.getElementById("gameCanvas").getContext("2d"),
    goldDisplay: document.getElementById("gold"),
    healthDisplay: document.getElementById("health"),
    scoreDisplay: document.getElementById("score"),
    waveDisplay: document.getElementById("wave"),
    enemiesRemainingDisplay: document.getElementById("enemiesRemaining"),
    playerNameDisplay: document.getElementById("playerName"),
    nameInput: document.getElementById("nameInput"),
    gameTimeDisplay: document.getElementById("gameTime"),
    enemiesKilledDisplay: document.getElementById("enemiesKilled"),
    towersBuiltDisplay: document.getElementById("towersBuilt"),
    gameOverScreen: document.getElementById("gameOverScreen"),
    finalScoreDisplay: document.getElementById("finalScore"),
    finalWaveDisplay: document.getElementById("finalWave")
};

// Botones
const buttons = {
    basicTower: document.getElementById("basicTower"),
    strongTower: document.getElementById("strongTower"),
    fastTower: document.getElementById("fastTower"),
    sniperTower: document.getElementById("sniperTower"),
    startWave: document.getElementById("startWave"),
    pauseGame: document.getElementById("pauseGame"),
    restartGame: document.getElementById("restartGame"),
    updateName: document.getElementById("updateName"),
    restartFromGameOver: document.getElementById("restartFromGameOver")
};

// Clase Torre
class Tower {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.level = 1;
        this.lastShot = 0;
        this.config = CONFIG.towers[type];
        this.upgradeCost = this.config.cost * (this.level + 1);
        this.sellValue = Math.floor(this.config.cost * 0.7);
        this.totalCost = this.config.cost;
    }
    
    draw(ctx) {
        // Dibujar rango (solo si es la torre seleccionada)
        if (gameState.selectedTower === this) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x + 15, this.y + 15, this.getRange(), 0, Math.PI * 2);
            ctx.fillStyle = "rgba(0, 255, 0, 0.2)";
            ctx.fill();
            ctx.restore();
        }
        
        // Dibujar torre
        ctx.save();
        ctx.fillStyle = this.config.color;
        ctx.fillRect(this.x, this.y, 30, 30);
        
        // Dibujar nivel
        ctx.fillStyle = "white";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`N${this.level}`, this.x + 15, this.y + 15);
        ctx.restore();
    }
    
    update(currentTime, enemies) {
        if (gameState.gamePaused || gameState.gameOver) return;
        
        // Encontrar el enemigo más cercano dentro del rango
        const target = this.findTarget(enemies);
        
        if (target && currentTime - this.lastShot > this.getCooldown()) {
            this.shoot(target);
            this.lastShot = currentTime;
        }
    }
    
    findTarget(enemies) {
        let closestEnemy = null;
        let minDistance = Infinity;
        
        for (const enemy of enemies) {
            const distance = Math.sqrt(
                Math.pow(enemy.x - (this.x + 15), 2) + 
                Math.pow(enemy.y - (this.y + 15), 2)
            );
            
            if (distance < this.getRange() && distance < minDistance) {
                closestEnemy = enemy;
                minDistance = distance;
            }
        }
        
        return closestEnemy;
    }
    
    shoot(target) {
        const numProjectiles = this.getNumProjectiles();
        
        for (let i = 0; i < numProjectiles; i++) {
            // Pequeña variación en la posición inicial para múltiples proyectiles
            const offsetX = i * 5 - (numProjectiles - 1) * 2.5;
            const offsetY = i * 5 - (numProjectiles - 1) * 2.5;
            
            gameState.projectiles.push({
                x: this.x + 15 + offsetX,
                y: this.y + 15 + offsetY,
                targetX: target.x + target.width / 2,
                targetY: target.y + target.height / 2,
                damage: this.getDamage(),
                enemy: target
            });
        }
    }
    
    upgrade() {
        this.level++;
        this.totalCost += this.upgradeCost;
        this.upgradeCost = this.config.cost * (this.level + 1);
        this.sellValue = Math.floor(this.totalCost * 0.7);
    }
    
    getDamage() {
        return this.config.damage;
    }
    
    getRange() {
        return this.config.range;
    }
    
    getCooldown() {
        let cooldown = this.config.cooldown;
        
        // Reducir cooldown en niveles 2 y 4
        if (this.level >= 2) cooldown *= 0.8;
        if (this.level >= 4) cooldown *= 0.8;
        
        return cooldown;
    }
    
    getNumProjectiles() {
        if (this.level >= 5) return 3;
        if (this.level >= 3) return 2;
        return 1;
    }
}

// Clase Enemigo
class Enemy {
    constructor(type) {
        this.type = type;
        this.config = CONFIG.enemies[type];
        this.health = this.config.health;
        this.maxHealth = this.config.health;
        this.speed = this.config.speed;
        this.reward = this.config.reward;
        this.color = this.config.color;
        this.width = this.config.width;
        this.height = this.config.height;
        this.pathIndex = 0;
        this.x = CONFIG.path[0].x - this.width / 2;
        this.y = CONFIG.path[0].y - this.height / 2;
        this.angle = 0;
    }
    
    draw(ctx) {
        // Dibujar enemigo
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Dibujar barra de vida
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? "green" : healthPercent > 0.25 ? "orange" : "red";
        const healthWidth = this.width * healthPercent;
        ctx.fillRect(this.x, this.y - 5, healthWidth, 3);
        ctx.restore();
    }
    
    update() {
        if (gameState.gamePaused || gameState.gameOver) return;
        
        const target = CONFIG.path[this.pathIndex];
        const targetX = target.x - this.width / 2;
        const targetY = target.y - this.height / 2;
        
        // Calcular dirección
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Mover hacia el objetivo
        if (distance > 1) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
            this.angle = Math.atan2(dy, dx);
        } else {
            this.pathIndex++;
            
            // Si llegó al final del camino
            if (this.pathIndex >= CONFIG.path.length) {
                gameState.health -= 10;
                updateUI();
                
                // Eliminar enemigo
                const index = gameState.enemies.indexOf(this);
                if (index !== -1) {
                    gameState.enemies.splice(index, 1);
                    gameState.enemiesRemaining--;
                    elements.enemiesRemainingDisplay.textContent = gameState.enemiesRemaining;
                }
                
                // Verificar game over
                if (gameState.health <= 0) {
                    gameState.health = 0;
                    gameOver();
                }
            }
        }
    }
    
    takeDamage(damage) {
        this.health -= damage;
        
        if (this.health <= 0) {
            // Recompensa por matar enemigo
            gameState.gold += this.reward;
            gameState.score += this.reward * 2;
            gameState.enemiesKilled++;
            
            // Eliminar enemigo
            const index = gameState.enemies.indexOf(this);
            if (index !== -1) {
                gameState.enemies.splice(index, 1);
                gameState.enemiesRemaining--;
                elements.enemiesRemainingDisplay.textContent = gameState.enemiesRemaining;
            }
            
            updateUI();
            
            // Verificar si la oleada terminó
            if (gameState.waveActive && gameState.enemies.length === 0 && gameState.enemiesRemaining === 0) {
                endWave();
            }
        }
    }
}

// Funciones del juego
function initGame() {
    // Reiniciar estado del juego
    gameState.gold = 100;
    gameState.health = 100;
    gameState.score = 0;
    gameState.wave = 0;
    gameState.enemies = [];
    gameState.towers = [];
    gameState.projectiles = [];
    gameState.selectedTowerType = null;
    gameState.selectedTower = null;
    gameState.placingTower = false;
    gameState.waveActive = false;
    gameState.gamePaused = false;
    gameState.gameOver = false;
    gameState.enemiesKilled = 0;
    gameState.towersBuilt = 0;
    gameState.gameTime = 0;
    gameState.enemiesRemaining = 0;
    gameState.messages = [];
    
    // Actualizar UI
    updateUI();
    
    // Ocultar pantalla de game over
    elements.gameOverScreen.style.display = "none";
    
    // Reiniciar bucle del juego
    if (!gameState.gameLoopRunning) {
        gameState.gameLoopRunning = true;
        gameLoop();
    }
}

function updateUI() {
    elements.goldDisplay.textContent = gameState.gold;
    elements.healthDisplay.textContent = gameState.health;
    elements.scoreDisplay.textContent = gameState.score;
    elements.waveDisplay.textContent = gameState.wave;
    elements.enemiesKilledDisplay.textContent = gameState.enemiesKilled;
    elements.towersBuiltDisplay.textContent = gameState.towersBuilt;
    
    // Actualizar tiempo de juego
    const minutes = Math.floor(gameState.gameTime / 60);
    const seconds = Math.floor(gameState.gameTime % 60);
    elements.gameTimeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startWave() {
    if (gameState.wave >= CONFIG.waves.length || gameState.waveActive || gameState.gamePaused) return;
    
    gameState.waveActive = true;
    gameState.wave++;
    elements.waveDisplay.textContent = gameState.wave;
    
    // Configurar oleada actual
    const currentWave = CONFIG.waves[gameState.wave - 1];
    gameState.waveEnemies = [];
    
    for (const [type, count] of Object.entries(currentWave)) {
        for (let i = 0; i < count; i++) {
            gameState.waveEnemies.push(type);
        }
    }
    
    gameState.enemiesRemaining = gameState.waveEnemies.length;
    elements.enemiesRemainingDisplay.textContent = gameState.enemiesRemaining;
    
    // Deshabilitar botón de oleada
    buttons.startWave.disabled = true;
    
    // Generar enemigos cada segundo
    gameState.enemySpawnInterval = setInterval(() => {
        if (gameState.waveEnemies.length > 0) {
            const type = gameState.waveEnemies.shift();
            gameState.enemies.push(new Enemy(type));
        } else {
            clearInterval(gameState.enemySpawnInterval);
        }
    }, 1000);
}

function endWave() {
    gameState.waveActive = false;
    clearInterval(gameState.enemySpawnInterval);
    
    // Recompensa por completar oleada
    gameState.gold += 25;
    updateUI();
    
    // Habilitar botón de oleada
    buttons.startWave.disabled = false;
    
    // Verificar si se completaron todas las oleadas
    if (gameState.wave >= CONFIG.waves.length) {
        addMessage("¡Has ganado el juego!");
    }
}

function gameOver() {
    gameState.gameOver = true;
    gameState.waveActive = false;
    clearInterval(gameState.enemySpawnInterval);
    
    // Mostrar pantalla de game over
    elements.finalScoreDisplay.textContent = gameState.score;
    elements.finalWaveDisplay.textContent = gameState.wave;
    elements.gameOverScreen.style.display = "block";
}

function addMessage(text) {
    const message = {
        text,
        time: Date.now()
    };
    
    gameState.messages.push(message);
    
    // Eliminar mensaje después de 3 segundos
    setTimeout(() => {
        const index = gameState.messages.indexOf(message);
        if (index !== -1) {
            gameState.messages.splice(index, 1);
        }
    }, 3000);
}

function drawPath() {
    elements.ctx.save();
    elements.ctx.strokeStyle = "brown";
    elements.ctx.lineWidth = 20;
    elements.ctx.lineJoin = "round";
    elements.ctx.lineCap = "round";
    elements.ctx.beginPath();
    
    // Dibujar ruta
    elements.ctx.moveTo(CONFIG.path[0].x, CONFIG.path[0].y);
    for (let i = 1; i < CONFIG.path.length; i++) {
        elements.ctx.lineTo(CONFIG.path[i].x, CONFIG.path[i].y);
    }
    
    elements.ctx.stroke();
    elements.ctx.restore();
}

function drawTowerMenu(tower) {
    elements.ctx.save();
    
    // Posición del menú (ajustar para que no salga del canvas)
    let menuX = tower.x;
    let menuY = tower.y - 90;
    
    if (menuY < 0) {
        menuY = tower.y + 40;
    }
    
    if (menuX + 120 > elements.canvas.width) {
        menuX = elements.canvas.width - 120;
    }
    
    // Fondo del menú
    elements.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    elements.ctx.fillRect(menuX, menuY, 120, 80);
    
    // Texto del menú
    elements.ctx.fillStyle = "white";
    elements.ctx.font = "12px Arial";
    elements.ctx.textAlign = "center";
    elements.ctx.fillText(`Torre ${tower.config.name} N${tower.level}`, menuX + 60, menuY + 20);
    
    // Botón Mejorar
    const upgradeDisabled = tower.level >= 5 || gameState.gold < tower.upgradeCost;
    elements.ctx.fillStyle = upgradeDisabled ? "gray" : "green";
    elements.ctx.fillRect(menuX + 10, menuY + 30, 100, 20);
    elements.ctx.fillStyle = "white";
    elements.ctx.fillText(
        upgradeDisabled ? "Nivel máximo" : `Mejorar (${tower.upgradeCost}💰)`, 
        menuX + 60, 
        menuY + 45
    );
    
    // Botón Vender
    elements.ctx.fillStyle = "red";
    elements.ctx.fillRect(menuX + 10, menuY + 55, 100, 20);
    elements.ctx.fillStyle = "white";
    elements.ctx.fillText(`Vender (${tower.sellValue}💰)`, menuX + 60, menuY + 70);
    
    elements.ctx.restore();
    
    // Guardar posición del menú para detectar clics
    gameState.towerMenu = {
        x: menuX,
        y: menuY,
        upgradeButton: { x: menuX + 10, y: menuY + 30, width: 100, height: 20 },
        sellButton: { x: menuX + 10, y: menuY + 55, width: 100, height: 20 },
        tower: tower
    };
}

function handleTowerPlacement(x, y) {
    // Verificar si hay suficiente oro
    if (gameState.gold < CONFIG.towers[gameState.selectedTowerType].cost) {
        addMessage("¡No tienes suficiente oro!");
        return;
    }
    
    // Verificar colisión con la ruta
    if (isOnPath(x, y)) {
        addMessage("No puedes colocar torres en el camino");
        return;
    }
    
    // Verificar colisión con otras torres
    for (const tower of gameState.towers) {
        if (Math.abs(tower.x - x) < 30 && Math.abs(tower.y - y) < 30) {
            addMessage("No puedes colocar torres tan cerca");
            return;
        }
    }
    
    // Colocar torre
    const tower = new Tower(gameState.selectedTowerType, x, y);
    gameState.towers.push(tower);
    gameState.gold -= tower.config.cost;
    gameState.towersBuilt++;
    
    console.log(`Torre creada: ${tower.config.name}, nivel ${tower.level}, en (${x}, ${y})`);
    
    updateUI();
    gameState.placingTower = false;
    gameState.selectedTowerType = null;
}

function isOnPath(x, y) {
    // Verificar si el punto (x,y) está cerca de la ruta
    const pathWidth = 20;
    const margin = 15; // Margen adicional para evitar colisiones
    
    for (let i = 0; i < CONFIG.path.length - 1; i++) {
        const p1 = CONFIG.path[i];
        const p2 = CONFIG.path[i + 1];
        
        // Calcular distancia del punto al segmento de línea
        const dist = distanceToSegment(x, y, p1.x, p1.y, p2.x, p2.y);
        
        if (dist < (pathWidth / 2) + margin) {
            return true;
        }
    }
    
    return false;
}

function distanceToSegment(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;
    
    if (len_sq !== 0) {
        param = dot / len_sq;
    }
    
    let xx, yy;
    
    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }
    
    const dx = px - xx;
    const dy = py - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
}

function handleTowerUpgrade() {
    const tower = gameState.towerMenu.tower;
    
    if (tower.level >= 5) {
        addMessage("Esta torre ya está al nivel máximo");
        return;
    }
    
    if (gameState.gold < tower.upgradeCost) {
        addMessage("¡No tienes suficiente oro para mejorar!");
        return;
    }
    
    gameState.gold -= tower.upgradeCost;
    tower.upgrade();
    
    console.log(`Torre mejorada a nivel ${tower.level}`);
    
    updateUI();
    gameState.selectedTower = tower;
    gameState.towerMenu = null;
}

function handleTowerSell() {
    const tower = gameState.towerMenu.tower;
    const index = gameState.towers.indexOf(tower);
    
    if (index !== -1) {
        gameState.towers.splice(index, 1);
        gameState.gold += tower.sellValue;
        
        console.log(`Torre vendida por ${tower.sellValue}💰`);
        
        updateUI();
    }
    
    gameState.selectedTower = null;
    gameState.towerMenu = null;
}

function drawMessages() {
    elements.ctx.save();
    elements.ctx.fillStyle = "orange";
    elements.ctx.font = "20px Arial";
    elements.ctx.textAlign = "center";
    
    const centerX = elements.canvas.width / 2;
    let y = 50;
    
    for (const message of gameState.messages) {
        elements.ctx.fillText(message.text, centerX, y);
        y += 30;
    }
    
    elements.ctx.restore();
}

function drawPauseScreen() {
    elements.ctx.save();
    elements.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    elements.ctx.fillRect(0, 0, elements.canvas.width, elements.canvas.height);
    
    elements.ctx.fillStyle = "white";
    elements.ctx.font = "30px Arial";
    elements.ctx.textAlign = "center";
    elements.ctx.fillText("Juego en pausa", elements.canvas.width / 2, elements.canvas.height / 2);
    
    elements.ctx.restore();
}

// Bucle principal del juego
function gameLoop(timestamp) {
    if (!gameState.lastFrameTime) {
        gameState.lastFrameTime = timestamp;
    }
    
    const deltaTime = timestamp - gameState.lastFrameTime;
    gameState.lastFrameTime = timestamp;
    
    // Actualizar tiempo de juego si no está pausado
    if (!gameState.gamePaused && !gameState.gameOver) {
        gameState.gameTime += deltaTime / 1000;
    }
    
    // Limpiar canvas
    elements.ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
    
    // Dibujar ruta
    drawPath();
    
    // Actualizar y dibujar enemigos
    for (const enemy of gameState.enemies) {
        enemy.update();
        enemy.draw(elements.ctx);
    }
    
    // Actualizar y dibujar proyectiles
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const projectile = gameState.projectiles[i];
        
        // Mover proyectil
        const dx = projectile.targetX - projectile.x;
        const dy = projectile.targetY - projectile.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < CONFIG.projectile.speed) {
            // Impacto
            projectile.enemy.takeDamage(projectile.damage);
            gameState.projectiles.splice(i, 1);
        } else {
            // Mover
            projectile.x += (dx / distance) * CONFIG.projectile.speed;
            projectile.y += (dy / distance) * CONFIG.projectile.speed;
            
            // Dibujar proyectil
            elements.ctx.save();
            elements.ctx.fillStyle = CONFIG.projectile.color;
            elements.ctx.beginPath();
            elements.ctx.arc(projectile.x, projectile.y, CONFIG.projectile.radius, 0, Math.PI * 2);
            elements.ctx.fill();
            elements.ctx.restore();
        }
    }
    
    // Actualizar y dibujar torres
    for (const tower of gameState.towers) {
        tower.update(timestamp, gameState.enemies);
        tower.draw(elements.ctx);
    }
    
    // Dibujar vista previa de torre
    if (gameState.placingTower) {
        const towerConfig = CONFIG.towers[gameState.selectedTowerType];
        
        // Dibujar rango
        elements.ctx.save();
        elements.ctx.beginPath();
        elements.ctx.arc(gameState.mouseX, gameState.mouseY, towerConfig.range, 0, Math.PI * 2);
        elements.ctx.fillStyle = isOnPath(gameState.mouseX - 15, gameState.mouseY - 15) ? 
            "rgba(255, 0, 0, 0.2)" : "rgba(0, 255, 0, 0.2)";
        elements.ctx.fill();
        elements.ctx.restore();
        
        // Dibujar torre
        elements.ctx.save();
        elements.ctx.fillStyle = towerConfig.previewColor;
        elements.ctx.fillRect(gameState.mouseX - 15, gameState.mouseY - 15, 30, 30);
        elements.ctx.restore();
    }
    
    // Dibujar menú de torre
    if (gameState.towerMenu) {
        drawTowerMenu(gameState.towerMenu.tower);
    }
    
    // Dibujar mensajes
    if (gameState.messages.length > 0) {
        drawMessages();
    }
    
    // Dibujar pantalla de pausa
    if (gameState.gamePaused && !gameState.gameOver) {
        drawPauseScreen();
    }
    
    // Continuar bucle
    requestAnimationFrame(gameLoop);
}

// Event listeners
elements.canvas.addEventListener("mousemove", (e) => {
    const rect = elements.canvas.getBoundingClientRect();
    gameState.mouseX = e.clientX - rect.left;
    gameState.mouseY = e.clientY - rect.top;
});

elements.canvas.addEventListener("click", (e) => {
    if (gameState.gamePaused || gameState.gameOver) return;
    
    const rect = elements.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    console.log(`Clic en canvas: (${x}, ${y})`);
    
    // Verificar clic en menú de torre
    if (gameState.towerMenu) {
        if (x >= gameState.towerMenu.upgradeButton.x && 
            x <= gameState.towerMenu.upgradeButton.x + gameState.towerMenu.upgradeButton.width &&
            y >= gameState.towerMenu.upgradeButton.y && 
            y <= gameState.towerMenu.upgradeButton.y + gameState.towerMenu.upgradeButton.height) {
            handleTowerUpgrade();
            return;
        }
        
        if (x >= gameState.towerMenu.sellButton.x && 
            x <= gameState.towerMenu.sellButton.x + gameState.towerMenu.sellButton.width &&
            y >= gameState.towerMenu.sellButton.y && 
            y <= gameState.towerMenu.sellButton.y + gameState.towerMenu.sellButton.height) {
            handleTowerSell();
            return;
        }
        
        // Clic fuera del menú - cerrar menú
        gameState.selectedTower = null;
        gameState.towerMenu = null;
        return;
    }
    
    // Verificar clic en una torre existente
    for (const tower of gameState.towers) {
        if (x >= tower.x && x <= tower.x + 30 && y >= tower.y && y <= tower.y + 30) {
            gameState.selectedTower = tower;
            gameState.towerMenu = { tower };
            console.log(`Menú mostrado para torre en (${tower.x}, ${tower.y})`);
            return;
        }
    }
    
    // Colocar nueva torre
    if (gameState.placingTower) {
        handleTowerPlacement(x - 15, y - 15);
    }
});

// Botones de torres
buttons.basicTower.addEventListener("click", () => {
    gameState.selectedTowerType = "basic";
    gameState.placingTower = true;
    gameState.selectedTower = null;
    gameState.towerMenu = null;
});

buttons.strongTower.addEventListener("click", () => {
    gameState.selectedTowerType = "strong";
    gameState.placingTower = true;
    gameState.selectedTower = null;
    gameState.towerMenu = null;
});

buttons.fastTower.addEventListener("click", () => {
    gameState.selectedTowerType = "fast";
    gameState.placingTower = true;
    gameState.selectedTower = null;
    gameState.towerMenu = null;
});

buttons.sniperTower.addEventListener("click", () => {
    gameState.selectedTowerType = "sniper";
    gameState.placingTower = true;
    gameState.selectedTower = null;
    gameState.towerMenu = null;
});

// Botón de oleada
buttons.startWave.addEventListener("click", startWave);

// Botón de pausa
buttons.pauseGame.addEventListener("click", () => {
    gameState.gamePaused = !gameState.gamePaused;
    buttons.pauseGame.textContent = gameState.gamePaused ? "Reanudar" : "Pausar";
    
    if (gameState.gamePaused) {
        addMessage("Juego en pausa");
    }
});

// Botón de reinicio
buttons.restartGame.addEventListener("click", initGame);
buttons.restartFromGameOver.addEventListener("click", initGame);

// Actualizar nombre del jugador
buttons.updateName.addEventListener("click", () => {
    const name = elements.nameInput.value.trim() || "Anónimo";
    elements.playerNameDisplay.textContent = name;
});

// Inicializar juego
initGame();