import { GAME_CONFIG, initialGameState } from './gameConfig.js';
import { Tower } from './tower.js';
import { Enemy } from './enemy.js';

// Variables globales
let canvas, ctx;
let gameState = { ...initialGameState };
let towers = [];
let enemies = [];
let projectiles = [];
let selectedTowerType = null;
let previewTower = null;
let showTowerMenu = false;
let towerMenuData = null;
let gameStartTime = Date.now();
let gameMessage = { text: '', time: 0 };
let mousePos = { x: 0, y: 0 };

/* Inicialización del juego */
function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Event listeners
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousemove', handleMouseMove);
    
    document.getElementById('playerNameInput').addEventListener('input', function(e) {
        gameState.playerName = e.target.value || 'Anónimo';
        updateUI();
    });
    
    // Event listeners para botones de torres
    document.querySelectorAll('.tower-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            selectTower(this.dataset.tower);
        });
    });
    
    // Event listeners para controles del juego
    document.getElementById('startWaveBtn').addEventListener('click', startWave);
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    document.getElementById('resetBtn').addEventListener('click', resetGame);
    
    updateUI();
    gameLoop();
}

/* Selecciona un tipo de torre */
function selectTower(type) {
    // Deseleccionar todos los botones
    document.querySelectorAll('.tower-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Seleccionar el botón clickeado
    document.querySelector(`[data-tower="${type}"]`).classList.add('selected');
    
    selectedTowerType = type;
    canvas.style.cursor = 'crosshair';
    console.log(`Torre seleccionada: ${GAME_CONFIG.towers[type].name}`);
}

/* Maneja los clics en el canvas */
function handleCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    console.log(`Clic en canvas: (${x}, ${y})`);
    
    // Si hay un menú de torre abierto, verificar si se hizo clic en él
    if (showTowerMenu && towerMenuData) {
        if (handleTowerMenuClick(x, y)) {
            return;
        }
        // Si se hizo clic fuera del menú, cerrarlo
        showTowerMenu = false;
        towerMenuData = null;
    }
    
    // Verificar si se hizo clic en una torre existente
    for (let tower of towers) {
        const dist = Math.sqrt((tower.x - x) ** 2 + (tower.y - y) ** 2);
        if (dist <= 15) { // Radio de la torre
            showTowerContextMenu(tower, x, y);
            return;
        }
    }
    
    // Si hay una torre seleccionada, intentar colocarla
    if (selectedTowerType) {
        placeTower(x, y);
    }
}

/* Maneja el movimiento del mouse para la vista previa */
function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mousePos.x = e.clientX - rect.left;
    mousePos.y = e.clientY - rect.top;
    
    if (selectedTowerType) {
        previewTower = {
            x: mousePos.x,
            y: mousePos.y,
            type: selectedTowerType,
            valid: isValidTowerPosition(mousePos.x, mousePos.y)
        };
    }
}

/* Coloca una torre en la posición especificada */
function placeTower(x, y) {
    const towerConfig = GAME_CONFIG.towers[selectedTowerType];
    
    // Verificar si hay suficiente oro
    if (gameState.gold < towerConfig.cost) {
        showMessage('Oro insuficiente');
        return;
    }
    
    // Verificar posición válida
    if (!isValidTowerPosition(x, y)) {
        showMessage('Posición inválida');
        return;
    }
    
    // Crear y colocar la torre
    const tower = new Tower(x, y, selectedTowerType, gameState, towers, projectiles);
    towers.push(tower);
    
    gameState.gold -= towerConfig.cost;
    gameState.towersBuilt++;
    
    // Deseleccionar torre
    selectedTowerType = null;
    previewTower = null;
    document.querySelectorAll('.tower-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    canvas.style.cursor = 'default';
    
    updateUI();
}

/* Verifica si una posición es válida para colocar una torre */
function isValidTowerPosition(x, y) {
    // Verificar límites del canvas
    if (x < 15 || x > canvas.width - 15 || y < 15 || y > canvas.height - 15) {
        return false;
    }
    
    // Verificar colisión con la ruta (ancho 20 píxeles)
    for (let i = 0; i < GAME_CONFIG.path.length - 1; i++) {
        const p1 = GAME_CONFIG.path[i];
        const p2 = GAME_CONFIG.path[i + 1];
        
        if (distanceToLineSegment(x, y, p1.x, p1.y, p2.x, p2.y) < 25) {
            return false;
        }
    }
    
    // Verificar colisión con otras torres
    for (let tower of towers) {
        const dist = Math.sqrt((tower.x - x) ** 2 + (tower.y - y) ** 2);
        if (dist < 35) { // Mínimo 35 píxeles entre torres
            return false;
        }
    }
    
    return true;
}

/* Calcula la distancia de un punto a un segmento de línea */
function distanceToLineSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (length * length)));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    
    return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
}

/* Muestra el menú contextual de una torre */
function showTowerContextMenu(tower, clickX, clickY) {
    console.log(`Menú mostrado para torre en (${tower.x}, ${tower.y})`);
    
    showTowerMenu = true;
    towerMenuData = {
        tower: tower,
        x: Math.min(clickX, canvas.width - 120), // Ajustar para no salirse
        y: Math.min(clickY, canvas.height - 80)
    };
}

/* Maneja los clics en el menú contextual de torres */
function handleTowerMenuClick(x, y) {
    if (!towerMenuData) return false;
    
    const menuX = towerMenuData.x;
    const menuY = towerMenuData.y;
    
    // Verificar si el clic está dentro del menú
    if (x >= menuX && x <= menuX + 120 && y >= menuY && y <= menuY + 80) {
        // Botón Mejorar
        if (x >= menuX + 10 && x <= menuX + 110 && y >= menuY + 10 && y <= menuY + 35) {
            if (towerMenuData.tower.level < 5) {
                towerMenuData.tower.upgrade(showMessage, updateUI);
            }
        }
        // Botón Vender
        else if (x >= menuX + 10 && x <= menuX + 110 && y >= menuY + 45 && y <= menuY + 70) {
            towerMenuData.tower.sell(updateUI);
        }
        
        showTowerMenu = false;
        towerMenuData = null;
        return true;
    }
    
    return false;
}

/* Inicia una nueva oleada */
function startWave() {
    if (gameState.waveInProgress || gameState.isPaused || gameState.isGameOver) {
        return;
    }
    
    if (gameState.wave > GAME_CONFIG.waves.length) {
        showMessage('¡Victoria! Has completado todas las oleadas');
        return;
    }
    
    gameState.waveInProgress = true;
    gameState.enemiesInWave = 0;
    gameState.enemiesRemaining = 0;
    
    // Calcular total de enemigos en la oleada
    const waveConfig = GAME_CONFIG.waves[gameState.wave - 1];
    for (let enemyGroup of waveConfig) {
        gameState.enemiesInWave += enemyGroup.count;
        gameState.enemiesRemaining += enemyGroup.count;
    }
    
    // Generar enemigos
    let spawnDelay = 0;
    for (let enemyGroup of waveConfig) {
        for (let i = 0; i < enemyGroup.count; i++) {
            setTimeout(() => {
                if (!gameState.isPaused && !gameState.isGameOver) {
                    enemies.push(new Enemy(enemyGroup.type, gameState));
                }
            }, spawnDelay);
            spawnDelay += 1000; // 1 segundo entre enemigos
        }
    }
    
    document.getElementById('startWaveBtn').disabled = true;
    updateUI();
}

/* Termina la oleada actual */
function endWave() {
    gameState.waveInProgress = false;
    gameState.gold += 25; // Bonificación por completar oleada
    gameState.wave++;
    
    document.getElementById('startWaveBtn').disabled = false;
    updateUI();
    
    // Verificar si quedan más oleadas
    if (gameState.wave > GAME_CONFIG.waves.length) {
        showMessage('¡Victoria! Has completado todas las oleadas');
    }
}

/* Pausa o reanuda el juego */
function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    
    const btn = document.getElementById('pauseBtn');
    btn.textContent = gameState.isPaused ? 'Reanudar' : 'Pausar';
    
    if (gameState.isPaused) {
        showMessage('Juego en pausa');
    }
}

/* Reinicia el juego */
export function resetGame() {
    // Mantener el nombre del jugador
    const playerName = gameState.playerName;
    
    gameState = { ...initialGameState, playerName };
    towers = [];
    enemies = [];
    projectiles = [];
    selectedTowerType = null;
    previewTower = null;
    showTowerMenu = false;
    towerMenuData = null;
    gameStartTime = Date.now();
    gameMessage = { text: '', time: 0 };
    
    // Resetear UI
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('startWaveBtn').disabled = false;
    document.getElementById('pauseBtn').textContent = 'Pausar';
    document.querySelectorAll('.tower-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    canvas.style.cursor = 'default';
    
    updateUI();
}

/* Termina el juego */
function gameOver() {
    gameState.isGameOver = true;
    
    // Mostrar pantalla de Game Over
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('finalWave').textContent = gameState.wave;
    document.getElementById('finalEnemiesKilled').textContent = gameState.enemiesKilled;
    document.getElementById('gameOverScreen').style.display = 'block';
}

/* Muestra un mensaje temporal */
function showMessage(text) {
    gameMessage.text = text;
    gameMessage.time = Date.now() + 3000; // Mostrar por 3 segundos
}

/* Actualiza la interfaz de usuario */
function updateUI() {
    document.getElementById('playerName').textContent = gameState.playerName;
    document.getElementById('goldDisplay').textContent = gameState.gold;
    document.getElementById('lifeDisplay').textContent = gameState.life;
    document.getElementById('scoreDisplay').textContent = gameState.score;
    document.getElementById('waveDisplay').textContent = gameState.wave;
    document.getElementById('enemiesLeftDisplay').textContent = gameState.enemiesRemaining;
    document.getElementById('enemiesKilled').textContent = gameState.enemiesKilled;
    document.getElementById('towersBuilt').textContent = gameState.towersBuilt;
    
    // Actualizar tiempo de juego
    const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    document.getElementById('gameTime').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/* Actualiza los proyectiles */
function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        
        projectile.x += projectile.dx;
        projectile.y += projectile.dy;
        
        // Verificar colisión con enemigos
        let hit = false;
        for (let enemy of enemies) {
            const dist = Math.sqrt((enemy.x - projectile.x) ** 2 + (enemy.y - projectile.y) ** 2);
            if (dist < 12) { // Radio de colisión
                enemy.takeDamage(projectile.damage, enemies, updateUI);
                hit = true;
                break;
            }
        }
        
        // Remover si salió del canvas o impactó
        if (hit || projectile.x < 0 || projectile.x > canvas.width || 
            projectile.y < 0 || projectile.y > canvas.height) {
            projectiles.splice(i, 1);
        }
    }
}

/* Dibuja la ruta de los enemigos */
function drawPath() {
    ctx.save();
    ctx.strokeStyle = '#8B4513'; // Marrón
    ctx.lineWidth = 20;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(GAME_CONFIG.path[0].x, GAME_CONFIG.path[0].y);
    
    for (let i = 1; i < GAME_CONFIG.path.length; i++) {
        ctx.lineTo(GAME_CONFIG.path[i].x, GAME_CONFIG.path[i].y);
    }
    
    ctx.stroke();
    ctx.restore();
}

/* Dibuja la vista previa de la torre */
function drawTowerPreview() {
    if (!previewTower) return;
    
    ctx.save();
    
    // Dibujar rango
    ctx.beginPath();
    ctx.arc(previewTower.x, previewTower.y, GAME_CONFIG.towers[previewTower.type].range, 0, Math.PI * 2);
    ctx.strokeStyle = previewTower.valid ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Dibujar torre
    ctx.fillStyle = previewTower.valid ? 
        GAME_CONFIG.towers[previewTower.type].color + '80' : 
        'rgba(255, 0, 0, 0.5)';
    ctx.fillRect(previewTower.x - 15, previewTower.y - 15, 30, 30);
    
    ctx.restore();
}

/* Dibuja el menú contextual de torres */
function drawTowerMenu() {
    if (!showTowerMenu || !towerMenuData) return;
    
    ctx.save();
    
    const menuX = towerMenuData.x;
    const menuY = towerMenuData.y;
    const tower = towerMenuData.tower;
    
    // Fondo del menú
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(menuX, menuY, 120, 80);
    
    // Borde
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(menuX, menuY, 120, 80);
    
    // Botón Mejorar
    const canUpgrade = tower.level < 5 && gameState.gold >= tower.getUpgradeCost();
    ctx.fillStyle = canUpgrade ? '#00AA00' : '#666666';
    ctx.fillRect(menuX + 10, menuY + 10, 100, 25);
    
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
        tower.level < 5 ? `Mejorar (${tower.getUpgradeCost()}💰)` : 'Nivel Max',
        menuX + 60, menuY + 27
    );
    
    // Botón Vender
    ctx.fillStyle = '#AA0000';
    ctx.fillRect(menuX + 10, menuY + 45, 100, 25);
    
    ctx.fillStyle = 'white';
    ctx.fillText(`Vender (${tower.getSellPrice()}💰)`, menuX + 60, menuY + 62);
    
    ctx.restore();
}

/* Dibuja los proyectiles */
function drawProjectiles() {
    ctx.save();
    ctx.fillStyle = '#FFD700'; // Amarillo
    
    for (let projectile of projectiles) {
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
}

/* Dibuja mensajes temporales */
function drawMessages() {
    if (gameMessage.time > Date.now()) {
        ctx.save();
        ctx.fillStyle = '#FFA500'; // Naranja
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(gameMessage.text, canvas.width / 2, canvas.height / 2 - 50);
        ctx.restore();
    }
}

/* Bucle principal del juego */
function gameLoop() {
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar elementos del juego
    drawPath();
    
    // Actualizar y dibujar torres
    for (let tower of towers) {
        tower.update(enemies);
        tower.draw(ctx);
    }
    
    // Actualizar y dibujar enemigos
    for (let enemy of enemies) {
        enemy.update(enemies, gameOver, updateUI);
        enemy.draw(ctx);
    }
    
    // Actualizar y dibujar proyectiles
    updateProjectiles();
    drawProjectiles();
    
    // Dibujar vista previa de torre
    drawTowerPreview();
    
    // Dibujar menú contextual
    drawTowerMenu();
    
    // Dibujar mensajes
    drawMessages();
    
    // Verificar fin de oleada
    if (gameState.waveInProgress && gameState.enemiesRemaining <= 0 && enemies.length === 0) {
        endWave();
    }
    
    // Actualizar UI
    updateUI();
    
    // Continuar el bucle
    requestAnimationFrame(gameLoop);
}

/* Inicializar el juego cuando la página cargue */
window.addEventListener('load', initGame);