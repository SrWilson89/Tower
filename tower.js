import { GAME_CONFIG } from './gameConfig.js';

export class Tower {
    constructor(x, y, type, gameState, towers, projectiles) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.level = 1;
        this.config = { ...GAME_CONFIG.towers[type] };
        this.lastFire = 0;
        this.target = null;
        this.gameState = gameState;
        this.towers = towers;
        this.projectiles = projectiles;
        
        console.log(`Torre creada: ${this.config.name}, nivel ${this.level}, en (${x}, ${y})`);
    }

    // Dibuja la torre en el canvas
    draw(ctx) {
        ctx.save();
        
        // Dibujar torre (rectángulo de 30x30)
        ctx.fillStyle = this.config.color;
        ctx.fillRect(this.x - 15, this.y - 15, 30, 30);
        
        // Dibujar borde
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - 15, this.y - 15, 30, 30);
        
        // Dibujar nivel
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`N${this.level}`, this.x, this.y);
        
        ctx.restore();
    }

    // Actualiza la torre (busca objetivos y dispara)
    update(enemies) {
        if (this.gameState.isPaused) return;
        
        const now = Date.now();
        const fireRate = this.getFireRate();
        
        if (now - this.lastFire >= fireRate) {
            this.findTarget(enemies);
            if (this.target) {
                this.fire();
                this.lastFire = now;
            }
        }
    }

    // Busca el enemigo más cercano dentro del rango
    findTarget(enemies) {
        let closest = null;
        let closestDist = this.config.range;
        
        for (let enemy of enemies) {
            const dist = Math.sqrt((enemy.x - this.x) ** 2 + (enemy.y - this.y) ** 2);
            if (dist <= this.config.range && dist < closestDist) {
                closest = enemy;
                closestDist = dist;
            }
        }
        
        this.target = closest;
    }

    // Dispara proyectiles hacia el objetivo
    fire() {
        if (!this.target) return;
        
        const bulletsCount = this.getBulletsCount();
        const angleOffset = bulletsCount > 1 ? 0.3 : 0;
        
        for (let i = 0; i < bulletsCount; i++) {
            const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
            const finalAngle = angle + (i - (bulletsCount - 1) / 2) * angleOffset;
            
            this.projectiles.push({
                x: this.x,
                y: this.y,
                dx: Math.cos(finalAngle) * 5,
                dy: Math.sin(finalAngle) * 5,
                damage: this.config.damage
            });
        }
    }

    // Calcula la velocidad de disparo según el nivel
    getFireRate() {
        let rate = this.config.fireRate;
        if (this.level >= 2) rate *= 0.8; // 20% más rápido en nivel 2
        if (this.level >= 4) rate *= 0.8; // 20% más rápido adicional en nivel 4
        return rate;
    }

    // Calcula el número de balas por disparo según el nivel
    getBulletsCount() {
        if (this.level >= 5) return 3; // Nivel 5: 3 balas
        if (this.level >= 3) return 2; // Nivel 3: 2 balas
        return 1; // Nivel 1-2: 1 bala
    }

    // Mejora la torre al siguiente nivel
    upgrade(showMessage, updateUI) {
        if (this.level >= 5) {
            showMessage('Torre al nivel máximo');
            return false;
        }
        
        const upgradeCost = this.getUpgradeCost();
        if (this.gameState.gold < upgradeCost) {
            showMessage('Oro insuficiente para mejorar');
            return false;
        }
        
        this.gameState.gold -= upgradeCost;
        this.level++;
        
        console.log(`Torre mejorada a nivel ${this.level}`);
        updateUI();
        return true;
    }

    // Calcula el costo de mejora
    getUpgradeCost() {
        return GAME_CONFIG.towers[this.type].cost * (this.level + 1);
    }

    // Calcula el precio de venta (70% del costo total)
    getSellPrice() {
        let totalCost = GAME_CONFIG.towers[this.type].cost;
        for (let i = 2; i <= this.level; i++) {
            totalCost += GAME_CONFIG.towers[this.type].cost * i;
        }
        return Math.floor(totalCost * 0.7);
    }

    // Vende la torre
    sell(updateUI) {
        const sellPrice = this.getSellPrice();
        this.gameState.gold += sellPrice;
        
        console.log(`Torre vendida por ${sellPrice} 💰`);
        
        // Remover torre del array
        const index = this.towers.indexOf(this);
        if (index > -1) {
            this.towers.splice(index, 1);
        }
        
        updateUI();
        return sellPrice;
    }
}