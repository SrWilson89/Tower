import { GAME_CONFIG } from './gameConfig.js';

export class Enemy {
    constructor(type, gameState) {
        this.type = type;
        this.config = { ...GAME_CONFIG.enemies[type] };
        this.health = this.config.health;
        this.maxHealth = this.config.health;
        this.pathIndex = 0;
        this.x = GAME_CONFIG.path[0].x;
        this.y = GAME_CONFIG.path[0].y;
        this.progress = 0;
        this.gameState = gameState;
    }

    // Dibuja el enemigo en el canvas
    draw(ctx) {
        ctx.save();
        
        // Dibujar enemigo (rectángulo de 20x20)
        ctx.fillStyle = this.config.color;
        ctx.fillRect(this.x - 10, this.y - 10, 20, 20);
        
        // Dibujar borde
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - 10, this.y - 10, 20, 20);
        
        // Dibujar barra de vida
        const barWidth = 20;
        const barHeight = 4;
        const healthPercent = this.health / this.maxHealth;
        
        // Fondo de la barra
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(this.x - barWidth/2, this.y - 18, barWidth, barHeight);
        
        // Barra de vida actual
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(this.x - barWidth/2, this.y - 18, barWidth * healthPercent, barHeight);
        
        ctx.restore();
    }

    // Actualiza la posición del enemigo
    update(enemies, gameOver, updateUI) {
        if (this.gameState.isPaused) return;
        
        if (this.pathIndex >= GAME_CONFIG.path.length - 1) {
            // Enemigo llegó al final
            this.reachEnd(enemies, gameOver, updateUI);
            return;
        }
        
        const current = GAME_CONFIG.path[this.pathIndex];
        const next = GAME_CONFIG.path[this.pathIndex + 1];
        
        const dx = next.x - current.x;
        const dy = next.y - current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const moveX = (dx / distance) * this.config.speed;
            const moveY = (dy / distance) * this.config.speed;
            
            this.x += moveX;
            this.y += moveY;
            
            // Verificar si llegó al siguiente punto
            const distToNext = Math.sqrt((next.x - this.x) ** 2 + (next.y - this.y) ** 2);
            if (distToNext < 2) {
                this.pathIndex++;
                this.x = next.x;
                this.y = next.y;
            }
        }
    }

    // Enemigo recibe daño
    takeDamage(damage, enemies, updateUI) {
        this.health -= damage;
        if (this.health <= 0) {
            this.die(enemies, updateUI);
        }
    }

    // Enemigo muere
    die(enemies, updateUI) {
        this.gameState.gold += this.config.reward;
        this.gameState.score += this.config.reward * 2;
        this.gameState.enemiesKilled++;
        this.gameState.enemiesRemaining--;
        
        // Remover enemigo del array
        const index = enemies.indexOf(this);
        if (index > -1) {
            enemies.splice(index, 1);
        }
        
        updateUI();
    }

    // Enemigo llega al final de la ruta
    reachEnd(enemies, gameOver, updateUI) {
        this.gameState.life -= 10;
        this.gameState.enemiesRemaining--;
        
        // Remover enemigo del array
        const index = enemies.indexOf(this);
        if (index > -1) {
            enemies.splice(index, 1);
        }
        
        if (this.gameState.life <= 0) {
            gameOver();
        }
        
        updateUI();
    }
}