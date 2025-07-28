// ==================== CONFIGURACIÓN DEL JUEGO ====================
const GAME_CONFIG = {
    canvas: {
        width: 800,
        height: 600
    },
    path: [
        { x: 0, y: 300 },
        { x: 150, y: 300 },
        { x: 150, y: 150 },
        { x: 400, y: 150 },
        { x: 400, y: 450 },
        { x: 650, y: 450 },
        { x: 650, y: 300 },
        { x: 800, y: 300 }
    ],
    towers: {
        basic: {
            cost: 30,
            damage: 20,
            range: 80,
            fireRate: 1000,
            color: '#3498db',
            upgradeCost: 25
        },
        strong: {
            cost: 60,
            damage: 50,
            range: 70,
            fireRate: 1500,
            color: '#e74c3c',
            upgradeCost: 40
        },
        fast: {
            cost: 45,
            damage: 15,
            range: 90,
            fireRate: 600,
            color: '#f39c12',
            upgradeCost: 30
        }
    },
    enemies: {
        basic: { health: 50, speed: 1, reward: 5, color: '#8e44ad' },
        strong: { health: 120, speed: 0.7, reward: 12, color: '#c0392b' },
        fast: { health: 30, speed: 1.5, reward: 8, color: '#16a085' },
        boss: { health: 300, speed: 0.5, reward: 30, color: '#2c3e50' }
    },
    waves: [
        { basic: 10 },
        { basic: 15 },
        { basic: 12, fast: 3 },
        { basic: 15, fast: 5 },
        { basic: 10, strong: 2 },
        { basic: 18, fast: 7 },
        { basic: 15, strong: 4, fast: 5 },
        { basic: 20, strong: 3 },
        { basic: 25, fast: 10 },
        { basic: 20, strong: 6, fast: 8 },
        { basic: 30, strong: 5, fast: 10 },
        { basic: 25, strong: 8, fast: 12 },
        { basic: 35, strong: 10, boss: 1 },
        { basic: 30, strong: 12, fast: 15 },
        { basic: 40, strong: 8, fast: 20, boss: 1 },
        { basic: 35, strong: 15, fast: 18, boss: 2 },
        { basic: 45, strong: 12, fast: 25, boss: 2 },
        { basic: 50, strong: 20, fast: 20, boss: 3 },
        { basic: 60, strong: 25, fast: 30, boss: 3 },
        { basic: 50, strong: 30, fast: 35, boss: 5 }
    ],
    localStorageKey: 'towerDefenseGameSave' // Clave para localStorage
};

// ==================== CLASES DEL JUEGO ====================
class Tower {
    constructor(x, y, type, level = 1, totalCost = null, lastShot = 0) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.level = level;
        this.lastShot = lastShot; // Puede ser útil para cargar estado
        this.target = null;

        const config = GAME_CONFIG.towers[type];
        this.baseDamage = config.damage;
        this.baseRange = config.range;
        this.baseFireRate = config.fireRate;
        this.color = config.color;
        this.upgradeCost = config.upgradeCost;
        this.totalCost = totalCost !== null ? totalCost : config.cost; // Usa totalCost si se proporciona
    }

    getDamage() {
        return Math.floor(this.baseDamage * (1 + (this.level - 1) * 0.3));
    }

    getRange() {
        return this.level >= 4 ? this.baseRange * 1.4 : this.baseRange;
    }

    getFireRate() {
        return this.level >= 2 ? this.baseFireRate * 0.6 : this.baseFireRate;
    }

    getProjectileCount() {
        if (this.level >= 5) return 3;
        if (this.level >= 3) return 2;
        return 1;
    }

    getUpgradeCost() {
        // El costo de mejora es incremental, pero el costo base es por nivel
        // Para que coincida con el cálculo de venta (70% del totalCost),
        // asegurémonos de que el costo inicial de la torre se incluya solo una vez.
        // Simplificado para este ejemplo, el costo de mejora es fijo y aumenta ligeramente.
        return Math.floor(GAME_CONFIG.towers[this.type].upgradeCost * Math.pow(1.5, this.level - 1));
    }

    getSellValue() {
        return Math.floor(this.totalCost * 0.7);
    }

    canUpgrade() {
        return this.level < 5;
    }

    upgrade() {
        if (this.canUpgrade()) {
            const cost = this.getUpgradeCost();
            this.totalCost += cost;
            this.level++;
            return cost;
        }
        return 0;
    }

    findTarget(enemies) {
        let closest = null;
        let closestDistance = Infinity;

        enemies.forEach(enemy => {
            const distance = Math.sqrt(
                Math.pow(enemy.x - this.x, 2) +
                Math.pow(enemy.y - this.y, 2)
            );

            if (distance <= this.getRange() && distance < closestDistance) {
                closest = enemy;
                closestDistance = distance;
            }
        });

        this.target = closest;
        return closest;
    }

    canShoot() {
        return Date.now() - this.lastShot >= this.getFireRate();
    }

    shoot() {
        if (!this.target || !this.canShoot()) return [];

        this.lastShot = Date.now();
        const projectiles = [];
        const projectileCount = this.getProjectileCount();

        for (let i = 0; i < projectileCount; i++) {
            const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
            // Pequeño offset para que los múltiples proyectiles no se superpongan perfectamente
            const angleOffset = projectileCount > 1 ? (i - (projectileCount - 1) / 2) * 0.05 : 0;

            projectiles.push(new Projectile(
                this.x, this.y,
                this.target.x, this.target.y,
                this.getDamage(),
                angle + angleOffset
            ));
        }

        return projectiles;
    }

    draw(ctx) {
        // Rango (cuando está seleccionada)
        if (game.selectedTower === this) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.getRange(), 0, Math.PI * 2);
            ctx.stroke();
        }

        // Torre
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Nivel
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.level.toString(), this.x, this.y + 4);

        // Cañón apuntando al objetivo
        if (this.target) {
            const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(
                this.x + Math.cos(angle) * 20,
                this.y + Math.sin(angle) * 20
            );
            ctx.stroke();
        }
    }
}

class Enemy {
    constructor(type, pathIndex = 0, progress = 0, health = null) {
        this.type = type;
        this.pathIndex = pathIndex;
        this.progress = progress;

        const config = GAME_CONFIG.enemies[type];
        this.maxHealth = config.health;
        this.health = health !== null ? health : this.maxHealth;
        this.speed = config.speed;
        this.reward = config.reward;
        this.color = config.color;

        this.updatePosition();
    }

    updatePosition() {
        const path = GAME_CONFIG.path;
        if (this.pathIndex >= path.length - 1) {
            this.x = path[path.length - 1].x;
            this.y = path[path.length - 1].y;
            return;
        }

        const current = path[this.pathIndex];
        const next = path[this.pathIndex + 1];

        this.x = current.x + (next.x - current.x) * this.progress;
        this.y = current.y + (next.y - current.y) * this.progress;
    }

    move() {
        const path = GAME_CONFIG.path;
        if (this.pathIndex >= path.length - 1) return false;

        const current = path[this.pathIndex];
        const next = path[this.pathIndex + 1];
        const distance = Math.sqrt(
            Math.pow(next.x - current.x, 2) +
            Math.pow(next.y - current.y, 2)
        );

        this.progress += this.speed / distance;

        if (this.progress >= 1) {
            this.progress = 0;
            this.pathIndex++;
        }

        this.updatePosition();
        return true;
    }

    takeDamage(damage) {
        this.health -= damage;
        return this.health <= 0;
    }

    hasReachedEnd() {
        return this.pathIndex >= GAME_CONFIG.path.length - 1 && this.progress >= 1;
    }

    draw(ctx) {
        // Enemigo
        const size = this.type === 'boss' ? 12 : 8;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Barra de vida
        const barWidth = 20;
        const barHeight = 4;
        const healthPercent = this.health / this.maxHealth;

        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - barWidth/2, this.y - size - 8, barWidth, barHeight);

        ctx.fillStyle = 'green';
        ctx.fillRect(this.x - barWidth/2, this.y - size - 8, barWidth * healthPercent, barHeight);

        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - barWidth/2, this.y - size - 8, barWidth, barHeight);
    }
}

class Projectile {
    constructor(startX, startY, targetX, targetY, damage, angle) {
        this.x = startX;
        this.y = startY;
        this.damage = damage;
        this.speed = 5;
        this.radius = 3;

        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
    }

    isOutOfBounds() {
        return this.x < 0 || this.x > GAME_CONFIG.canvas.width ||
               this.y < 0 || this.y > GAME_CONFIG.canvas.height;
    }

    checkCollision(enemy) {
        const distance = Math.sqrt(
            Math.pow(enemy.x - this.x, 2) +
            Math.pow(enemy.y - this.y, 2)
        );
        return distance < this.radius + 8; // 8 es el tamaño base del enemigo
    }

    draw(ctx) {
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#f39c12';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

// ==================== CLASE PRINCIPAL DEL JUEGO ====================
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        // Asegúrate de que las dimensiones lógicas del canvas sean las de GAME_CONFIG
        this.canvas.width = GAME_CONFIG.canvas.width;
        this.canvas.height = GAME_CONFIG.canvas.height;
        
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.gold = 100;
        this.lives = 20;
        this.score = 0;
        this.currentWave = 1;
        this.isWaveActive = false;
        this.selectedTowerType = null;
        this.selectedTower = null;
        this.gameRunning = true;
        this.enemiesInWave = 0;
        this.enemiesSpawned = 0;
        this.lastEnemySpawn = 0;

        // Propiedades para la previsualización de la torre
        this.mousePos = { x: 0, y: 0 };
        this.isValidPlacement = false;

        this.setupEventListeners();
        this.loadGame(); // Intentar cargar una partida guardada al inicio
        this.updateUI();
        this.gameLoop();
    }

    setupEventListeners() {
        // Canvas click
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        // Evento para el movimiento del ratón para la previsualización
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));

        // Tower selection buttons
        document.querySelectorAll('.tower-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectTowerType(e.target.dataset.tower));
        });

        // Start wave button
        document.getElementById('startWave').addEventListener('click', () => this.startWave());

        // Tower menu buttons
        document.getElementById('upgradeBtn').addEventListener('click', () => this.upgradeTower());
        document.getElementById('sellBtn').addEventListener('click', () => this.sellTower());
        document.getElementById('cancelBtn').addEventListener('click', () => this.hideTowerMenu());

        // Botones de Guardar/Cargar (necesitas añadirlos a tu index.html si no están)
        const saveBtn = document.getElementById('saveGameBtn');
        const loadBtn = document.getElementById('loadGameBtn');
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveGame());
        if (loadBtn) loadBtn.addEventListener('click', () => this.loadGame());
    }

    // Nueva función para obtener coordenadas escaladas del ratón
    getCanvasMouseCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect(); // Obtiene el tamaño y posición visual del canvas
        const scaleX = this.canvas.width / rect.width;    // Factor de escala horizontal
        const scaleY = this.canvas.height / rect.height;  // Factor de escala vertical

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        return { x, y };
    }

    handleMouseMove(e) {
        // Usa la nueva función para obtener coordenadas escaladas
        const { x, y } = this.getCanvasMouseCoordinates(e);
        this.mousePos.x = x;
        this.mousePos.y = y;

        if (this.selectedTowerType) {
            this.isValidPlacement = this.canPlaceTower(this.mousePos.x, this.mousePos.y);
        }
    }

    handleCanvasClick(e) {
        // Usa la nueva función para obtener coordenadas escaladas
        const { x, y } = this.getCanvasMouseCoordinates(e);

        // Verificar si se clickeó en una torre existente
        const clickedTower = this.towers.find(tower => {
            const distance = Math.sqrt(Math.pow(tower.x - x, 2) + Math.pow(tower.y - y, 2));
            return distance <= 15; // 15 es el radio de la torre
        });

        if (clickedTower) {
            // Pasamos las coordenadas escaladas al menú para posicionarlo correctamente
            this.showTowerMenu(clickedTower, x, y); 
            return;
        }

        this.hideTowerMenu();

        // Colocar nueva torre
        if (this.selectedTowerType && this.isValidPlacement) { // Usamos isValidPlacement calculado en mousemove
            this.placeTower(x, y);
        }
    }

    selectTowerType(type) {
        // Deselecciona si se hace clic en el mismo tipo de torre
        this.selectedTowerType = this.selectedTowerType === type ? null : type;
        this.selectedTower = null; // Deseleccionar cualquier torre existente
        this.hideTowerMenu();
        this.updateTowerButtons();
    }

    updateTowerButtons() {
        document.querySelectorAll('.tower-btn').forEach(btn => {
            btn.classList.remove('selected');
            const towerType = btn.dataset.tower;
            const cost = GAME_CONFIG.towers[towerType].cost;
            btn.disabled = this.gold < cost; // Deshabilitar si no hay suficiente oro

            if (this.selectedTowerType === towerType) {
                btn.classList.add('selected');
            }
        });
    }

    canPlaceTower(x, y) {
        // Verificar que no esté en el camino
        if (this.isOnPath(x, y)) return false;

        // Verificar que no haya otra torre cerca
        return !this.towers.some(tower => {
            const distance = Math.sqrt(Math.pow(tower.x - x, 2) + Math.pow(tower.y - y, 2));
            return distance < 35; // Distancia de separación entre torres
        });
    }

    isOnPath(x, y) {
        const path = GAME_CONFIG.path;
        const pathWidth = 40; // Ancho del camino

        for (let i = 0; i < path.length - 1; i++) {
            const start = path[i];
            const end = path[i + 1];

            const distance = this.distanceToLineSegment(x, y, start.x, start.y, end.x, end.y);
            if (distance < pathWidth / 2 + 15) return true; // +15 es el radio de la torre
        }
        return false;
    }

    distanceToLineSegment(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);

        if (length === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);

        const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (length * length)));
        const projX = x1 + t * dx;
        const projY = y1 + t * dy;

        return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
    }

    placeTower(x, y) {
        const towerConfig = GAME_CONFIG.towers[this.selectedTowerType];
        if (this.gold >= towerConfig.cost) {
            this.towers.push(new Tower(x, y, this.selectedTowerType));
            this.gold -= towerConfig.cost;
            this.selectedTowerType = null; // Deseleccionar la torre después de colocarla
            this.updateUI();
        }
    }

    showTowerMenu(tower, x, y) {
        this.selectedTower = tower;
        const menu = document.getElementById('towerMenu');

        document.getElementById('towerLevel').textContent = tower.level;
        document.getElementById('upgradeCost').textContent = tower.getUpgradeCost();
        document.getElementById('sellValue').textContent = tower.getSellValue();

        const upgradeBtn = document.getElementById('upgradeBtn');
        upgradeBtn.disabled = !tower.canUpgrade() || this.gold < tower.getUpgradeCost();

        // Posicionar el menú usando las coordenadas escaladas
        menu.style.left = Math.min(x, this.canvas.width - 160) + 'px';
        menu.style.top = Math.min(y, this.canvas.height - 120) + 'px';
        menu.style.display = 'block';
    }

    hideTowerMenu() {
        document.getElementById('towerMenu').style.display = 'none';
        this.selectedTower = null;
    }

    upgradeTower() {
        if (this.selectedTower && this.selectedTower.canUpgrade()) {
            const cost = this.selectedTower.getUpgradeCost();
            if (this.gold >= cost) {
                this.gold -= this.selectedTower.upgrade();
                this.hideTowerMenu();
                this.updateUI();
            } else {
                alert("¡No tienes suficiente oro para mejorar esta torre!");
            }
        }
    }

    sellTower() {
        if (this.selectedTower) {
            this.gold += this.selectedTower.getSellValue();
            this.towers = this.towers.filter(tower => tower !== this.selectedTower);
            this.hideTowerMenu();
            this.updateUI();
        }
    }

    startWave() {
        if (!this.isWaveActive && this.currentWave <= GAME_CONFIG.waves.length) {
            this.isWaveActive = true;
            this.enemiesSpawned = 0;
            this.lastEnemySpawn = 0;

            // Calcular total de enemigos en la oleada
            const waveConfig = GAME_CONFIG.waves[this.currentWave - 1];
            this.enemiesInWave = Object.values(waveConfig).reduce((total, count) => total + count, 0);

            this.updateUI();
        }
    }

    spawnEnemies() {
        if (!this.isWaveActive || this.enemiesSpawned >= this.enemiesInWave) {
            return;
        }

        const timeSinceLastSpawn = Date.now() - this.lastEnemySpawn;
        const spawnInterval = 800; // Intervalo entre spawns de enemigos

        if (timeSinceLastSpawn >= spawnInterval) {
            const waveConfig = GAME_CONFIG.waves[this.currentWave - 1];
            const enemyTypes = [];

            // Crear array con todos los tipos de enemigos de la oleada
            Object.entries(waveConfig).forEach(([type, count]) => {
                for (let i = 0; i < count; i++) {
                    enemyTypes.push(type);
                }
            });

            // Mezclar array para orden aleatorio
            for (let i = enemyTypes.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [enemyTypes[i], enemyTypes[j]] = [enemyTypes[j], enemyTypes[i]];
            }

            if (this.enemiesSpawned < enemyTypes.length) {
                this.enemies.push(new Enemy(enemyTypes[this.enemiesSpawned]));
                this.enemiesSpawned++;
                this.lastEnemySpawn = Date.now();
            }
        }
    }

    updateEnemies() {
        // Usamos un bucle for inverso para poder eliminar elementos sin problemas
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (!enemy.move()) {
                // Enemigo llegó al final
                if (enemy.hasReachedEnd()) {
                    this.lives--;
                    this.enemies.splice(i, 1); // Eliminar enemigo que llegó al final
                    if (this.lives <= 0) {
                        this.gameOver();
                    }
                }
            }
        }
    }

    updateTowers() {
        this.towers.forEach(tower => {
            tower.findTarget(this.enemies);
            const newProjectiles = tower.shoot();
            this.projectiles.push(...newProjectiles);
        });
    }

    updateProjectiles() {
        // Usamos un bucle for inverso para poder eliminar elementos sin problemas
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.update();

            let hit = false;
            // Verificar colisiones con enemigos (también bucle inverso si se elimina el enemigo)
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                if (projectile.checkCollision(enemy)) {
                    if (enemy.takeDamage(projectile.damage)) {
                        // Enemigo eliminado
                        this.gold += enemy.reward;
                        this.score += enemy.reward * 10;
                        this.enemies.splice(j, 1); // Eliminar enemigo
                    }
                    this.projectiles.splice(i, 1); // Eliminar proyectil después de golpear
                    hit = true;
                    break; // Un proyectil solo golpea un enemigo
                }
            }

            // Eliminar proyectiles fuera de pantalla si no golpearon nada
            if (!hit && projectile.isOutOfBounds()) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    checkWaveComplete() {
        if (this.isWaveActive && this.enemiesSpawned >= this.enemiesInWave && this.enemies.length === 0) {
            this.isWaveActive = false;
            this.currentWave++;

            // Bonificación por completar oleada
            const bonus = 20 + (this.currentWave - 1) * 5;
            this.gold += bonus;
            this.score += bonus * 5;

            if (this.currentWave > GAME_CONFIG.waves.length) { // Si todas las oleadas están completas
                this.gameWin();
            }
        }
    }

    gameOver() {
        this.gameRunning = false;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalWave').textContent = this.currentWave - 1;
        document.getElementById('gameOver').style.display = 'flex';
        this.saveGame(); // Guardar el estado al finalizar la partida
    }

    gameWin() {
        this.gameRunning = false;
        document.getElementById('gameOver').querySelector('h2').textContent = '¡Victoria!';
        document.getElementById('gameOver').querySelector('h2').style.color = '#27ae60';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalWave').textContent = `${GAME_CONFIG.waves.length} (¡Completadas todas!)`;
        document.getElementById('gameOver').style.display = 'flex';
        this.saveGame(); // Guardar el estado al ganar
    }

    updateUI() {
        document.getElementById('goldAmount').textContent = this.gold;
        document.getElementById('livesAmount').textContent = this.lives;
        document.getElementById('scoreAmount').textContent = this.score;
        document.getElementById('waveNumber').textContent = this.currentWave;
        document.getElementById('enemiesLeft').textContent = this.enemies.length;

        const startWaveBtn = document.getElementById('startWave');
        startWaveBtn.disabled = this.isWaveActive || this.currentWave > GAME_CONFIG.waves.length || this.lives <= 0;

        if (this.currentWave > GAME_CONFIG.waves.length) {
            startWaveBtn.textContent = '¡Juego Completado!';
        } else if (this.lives <= 0) {
            startWaveBtn.textContent = '¡Juego Terminado!';
        }
        else if (this.isWaveActive) {
            startWaveBtn.textContent = 'Oleada en Progreso...';
        } else {
            startWaveBtn.textContent = '🚀 Iniciar Oleada';
        }

        this.updateTowerButtons();
    }

    drawPath() {
        const path = GAME_CONFIG.path;
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 40;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.ctx.beginPath();
        this.ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            this.ctx.lineTo(path[i].x, path[i].y);
        }
        this.ctx.stroke();

        // Bordes del camino
        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 44;
        this.ctx.beginPath();
        this.ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            this.ctx.lineTo(path[i].x, path[i].y);
        }
        this.ctx.stroke();

        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 36;
        this.ctx.beginPath();
        this.ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            this.ctx.lineTo(path[i].x, path[i].y);
        }
        this.ctx.stroke();

        // Punto de inicio
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.beginPath();
        this.ctx.arc(path[0].x, path[0].y, 20, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('INICIO', path[0].x, path[0].y + 4);

        // Punto final
        this.ctx.fillStyle = '#3498db';
        this.ctx.beginPath();
        this.ctx.arc(path[path.length - 1].x, path[path.length - 1].y, 20, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = 'white';
        this.ctx.fillText('BASE', path[path.length - 1].x, path[path.length - 1].y + 4);
    }

    drawTowerPreview() {
        if (!this.selectedTowerType) return; // No dibujar si no hay torre seleccionada

        const x = this.mousePos.x;
        const y = this.mousePos.y;
        const towerConfig = GAME_CONFIG.towers[this.selectedTowerType];

        // Determinar el color de la previsualización
        const previewColor = this.isValidPlacement ? towerConfig.color : 'rgba(255, 0, 0, 0.5)';
        const borderColor = this.isValidPlacement ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 0, 0, 0.8)';
        const rangeColor = this.isValidPlacement ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 0, 0, 0.2)';

        // Dibujar el rango de la torre
        this.ctx.strokeStyle = rangeColor;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, towerConfig.range, 0, Math.PI * 2); // Usa el rango base para la preview
        this.ctx.stroke();

        // Dibujar el cuerpo de la torre
        this.ctx.fillStyle = previewColor;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 15, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = borderColor;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Mostrar el costo de la torre
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`$${towerConfig.cost}`, x, y + 25);
    }

    render() {
        // Limpiar canvas
        this.ctx.fillStyle = '#27ae60';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Dibujar elementos
        this.drawPath();

        // Dibujar torres
        this.towers.forEach(tower => tower.draw(this.ctx));

        // Dibujar enemigos
        this.enemies.forEach(enemy => enemy.draw(this.ctx));

        // Dibujar proyectiles
        this.projectiles.forEach(projectile => projectile.draw(this.ctx));

        // Dibujar previsualización de la torre (si aplica)
        this.drawTowerPreview();

        // Información de oleada
        if (this.isWaveActive) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(10, 10, 200, 60);

            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`Oleada ${this.currentWave}`, 20, 30);
            this.ctx.font = '12px Arial';
            this.ctx.fillText(`Enemigos: ${this.enemies.length}/${this.enemiesInWave}`, 20, 45);
            this.ctx.fillText(`Aparecidos: ${this.enemiesSpawned}/${this.enemiesInWave}`, 20, 60);
        }
    }

    // ==================== FUNCIONES DE GUARDAR/CARGAR ====================
    saveGame() {
        const gameState = {
            gold: this.gold,
            lives: this.lives,
            score: this.score,
            currentWave: this.currentWave,
            isWaveActive: this.isWaveActive,
            enemiesInWave: this.enemiesInWave,
            enemiesSpawned: this.enemiesSpawned,
            lastEnemySpawn: this.lastEnemySpawn,
            // Guardar torres de forma serializable
            towers: this.towers.map(tower => ({
                x: tower.x,
                y: tower.y,
                type: tower.type,
                level: tower.level,
                totalCost: tower.totalCost
            })),
            // Guardar enemigos de forma serializable (opcional, podrías reiniciar enemigos al cargar)
            enemies: this.enemies.map(enemy => ({
                type: enemy.type,
                pathIndex: enemy.pathIndex,
                progress: enemy.progress,
                health: enemy.health
            }))
            // Proyectiles no se guardan ya que son temporales
        };
        try {
            localStorage.setItem(GAME_CONFIG.localStorageKey, JSON.stringify(gameState));
            console.log("Juego guardado exitosamente!");
            alert("¡Partida guardada!");
        } catch (e) {
            console.error("Error al guardar la partida:", e);
            alert("Error al guardar la partida. ¿Quizás el almacenamiento está lleno?");
        }
    }

    loadGame() {
        try {
            const savedState = localStorage.getItem(GAME_CONFIG.localStorageKey);
            if (savedState) {
                const gameState = JSON.parse(savedState);

                this.gold = gameState.gold;
                this.lives = gameState.lives;
                this.score = gameState.score;
                this.currentWave = gameState.currentWave;
                this.isWaveActive = gameState.isWaveActive;
                this.enemiesInWave = gameState.enemiesInWave || 0; // Por si no estaba en un guardado antiguo
                this.enemiesSpawned = gameState.enemiesSpawned || 0; // Por si no estaba en un guardado antiguo
                this.lastEnemySpawn = gameState.lastEnemySpawn || 0; // Por si no estaba en un guardado antiguo

                // Recrear objetos Tower
                this.towers = gameState.towers.map(tData =>
                    new Tower(tData.x, tData.y, tData.type, tData.level, tData.totalCost)
                );

                // Recrear objetos Enemy (si deseas reanudar con enemigos en pantalla)
                this.enemies = gameState.enemies.map(eData =>
                    new Enemy(eData.type, eData.pathIndex, eData.progress, eData.health)
                );

                // Limpiar proyectiles, ya que no se guardan
                this.projectiles = [];

                this.gameRunning = true; // Asegurarse de que el juego esté corriendo
                document.getElementById('gameOver').style.display = 'none'; // Ocultar pantalla de Game Over si estaba visible

                console.log("Juego cargado exitosamente!");
                alert("¡Partida cargada!");
                this.updateUI(); // Actualizar la interfaz después de cargar
            } else {
                console.log("No hay partida guardada.");
                // alert("No hay partida guardada."); // Descomentar si quieres notificar siempre
            }
        } catch (e) {
            console.error("Error al cargar la partida:", e);
            alert("Error al cargar la partida. El archivo guardado podría estar corrupto.");
        }
    }

    gameLoop() {
        if (!this.gameRunning) return;

        // Actualizar lógica del juego
        this.spawnEnemies();
        this.updateEnemies();
        this.updateTowers();
        this.updateProjectiles();
        this.checkWaveComplete();

        // Actualizar UI
        this.updateUI();

        // Renderizar
        this.render();

        // Continuar loop
        requestAnimationFrame(() => this.gameLoop());
    }
}

// ==================== INICIALIZACIÓN ====================
let game;

window.addEventListener('load', () => {
    game = new Game();
});