// ==================== SUPER JARDINIER v2.0 ====================
// Version complète avec Pixel Art, Power-ups, Ennemis IA, Boss 6 phases, Audio

const gameHTML = `
<div id="easter-egg-game-container" class="fixed inset-0 bg-stone-950 z-[100] hidden flex-col items-center justify-center p-0 md:p-4 font-sans">
    <button id="close-game-btn" class="absolute top-4 right-4 md:top-6 md:right-6 text-white text-3xl focus:outline-none hover:text-botanic transition-colors z-[101]" aria-label="Fermer le jeu"><i class="fa-solid fa-times"></i></button>
    <div class="text-center mb-2 md:mb-4">
        <h2 class="font-serif text-3xl md:text-5xl text-white mb-1 md:mb-2" style="text-shadow: 0 0 15px rgba(114,138,100,0.8);"><span class="text-botanic-light">Super</span> Jardinier !</h2>
        <p class="text-stone-400 text-xs md:text-sm tracking-widest">ZQSD/FLÈCHES: Bouger | ESPACE: Sauter | CTRL: Power-up | E: Interagir</p>
    </div>
    <div class="relative bg-stone-900 p-1 md:p-2 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-stone-700 overflow-hidden w-full max-w-4xl">
        <div id="hud" class="absolute top-4 left-6 right-6 text-white font-bold tracking-widest z-10 drop-shadow-md flex justify-between text-xs md:text-sm">
            <div>❤️ <span id="hp-display">5/5</span></div>
            <div id="level-display">NIVEAU 1</div>
            <div id="power-display">POUVOIR: -</div>
        </div>
        <div id="task-display" class="absolute bottom-4 left-6 text-stone-300 text-xs md:text-sm drop-shadow-md z-10">TÂCHES: <span id="task-count">0/0</span></div>
        <div id="power-indicator" class="absolute bottom-4 right-6 text-yellow-300 text-xs md:text-sm drop-shadow-md z-10 hidden">⚡ <span id="power-bar"></span></div>
        <div id="game-over-screen" class="absolute inset-0 bg-stone-900/90 backdrop-blur-sm flex flex-col items-center justify-center hidden rounded-lg z-30 transition-all">
            <h3 id="game-end-title" class="font-serif text-4xl md:text-5xl text-white mb-4 drop-shadow-lg text-center">Victoire!</h3>
            <p id="game-end-text" class="text-stone-300 mb-8 text-lg md:text-xl text-center max-w-md font-light"></p>
            <button id="restart-game-btn" class="glow-btn px-8 py-4 bg-botanic text-white uppercase tracking-widest text-sm font-bold hover:bg-botanic-dark transition-all rounded-full shadow-[0_0_20px_rgba(114,138,100,0.5)]">Continuer</button>
        </div>
        <canvas id="gameCanvas" width="900" height="500" class="w-full h-auto rounded-lg shadow-inner block" style="image-rendering: pixelated; image-rendering: crisp-edges;"></canvas>
    </div>
</div>
`;
document.body.insertAdjacentHTML('beforeend', gameHTML);

// ==================== PIXEL ART SPRITE SYSTEM (CELESTE-STYLE) ====================
class CelestePixelRenderer {
    constructor() {
        this.frameCount = 0;
    }
    
    // Palette Celeste-inspired
    palette = {
        playerGreen: '#3bce0d',
        playerDark: '#1a5c0d',
        playerSkin: '#ffccaa',
        wallGreen: '#2d8659',
        platformBrown: '#8b5a3c',
        platformLight: '#b8860b',
        dash: '#ff3399',
        dashLight: '#ff66cc',
        beeYellow: '#ffd700',
        frogGreen: '#5dde5d',
        snailBrown: '#a0826d',
        butterflyPink: '#ff69b4',
        ladybugRed: '#dd0000',
        skyBlue: '#87ceeb',
        neon: '#00ffff'
    };
    
    drawPlayer(ctx, x, y, frame, facingRight, jumping, dashing) {
        ctx.save();
        ctx.translate(x + 10, y + 16);
        if (!facingRight) ctx.scale(-1, 1);
        
        // Animation de respiration
        const breathe = Math.sin(frame * 0.05) * 0.5;
        
        // Head
        ctx.fillStyle = this.palette.playerGreen;
        ctx.fillRect(-6, -14 + breathe, 12, 12);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(-6, -14 + breathe, 12, 12);
        
        // Eyes avec expression
        ctx.fillStyle = '#000';
        if (jumping) {
            // Yeux fermés en sautant
            ctx.fillRect(-4, -13, 2, 1);
            ctx.fillRect(2, -13, 2, 1);
        } else {
            // Yeux ouverts normaux
            ctx.fillRect(-4, -13, 2, 2);
            ctx.fillRect(2, -13, 2, 2);
            
            // Pupilles
            ctx.fillStyle = '#FFF';
            ctx.fillRect(-3.5, -12, 1, 1);
            ctx.fillRect(2.5, -12, 1, 1);
        }
        
        // Mouth
        if (dashing) {
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, -9, 2.5, 0, Math.PI);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(0, -9, 1, 0, Math.PI);
            ctx.fill();
        }
        
        // Body
        ctx.fillStyle = this.palette.playerDark;
        ctx.fillRect(-4, -2 + breathe, 8, 10);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(-4, -2 + breathe, 8, 10);
        
        // Arms (animation)
        const armOffset = jumping ? -6 : Math.sin(frame * 0.2) * 4;
        ctx.fillStyle = this.palette.playerGreen;
        ctx.fillRect(-8, -4 + armOffset, 4, 3);
        ctx.fillRect(4, -4 + armOffset, 4, 3);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(-8, -4 + armOffset, 4, 3);
        ctx.strokeRect(4, -4 + armOffset, 4, 3);
        
        // Legs (animation)
        const legOffset = !jumping ? Math.sin(frame * 0.15) * 2 : 0;
        ctx.fillStyle = this.palette.playerDark;
        ctx.fillRect(-4, 8, 3, 6 + legOffset);
        ctx.fillRect(1, 8, 3, 6 - legOffset);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(-4, 8, 3, 6 + legOffset);
        ctx.strokeRect(1, 8, 3, 6 - legOffset);
        
        // Shoes
        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(-5, 14, 3, 1);
        ctx.fillRect(2, 14, 3, 1);
        
        // Dash effect (traînée)
        if (dashing) {
            ctx.strokeStyle = this.palette.dashLight;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.6;
            for (let i = 1; i <= 3; i++) {
                ctx.beginPath();
                ctx.arc(0, 0, 12 + i * 2, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }
        
        // Wall jump effect
        if (false) { // À implémenter
            ctx.strokeStyle = '#3bce0d';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        ctx.restore();
    }
    
    drawEnemy(ctx, x, y, type, frame) {
        switch(type) {
            case 'snail':
                this.drawSnail(ctx, x, y, frame);
                break;
            case 'frog':
                this.drawFrog(ctx, x, y, frame);
                break;
            case 'bee':
                this.drawBee(ctx, x, y, frame);
                break;
            case 'butterfly':
                this.drawButterfly(ctx, x, y, frame);
                break;
            case 'ladybug':
                this.drawLadybug(ctx, x, y, frame);
                break;
        }
    }
    
    drawSnail(ctx, x, y, frame) {
        // Coquille spirale
        ctx.fillStyle = this.palette.snailBrown;
        ctx.beginPath();
        ctx.arc(x + 8, y + 8, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#d4a574';
        // Spirale
        ctx.beginPath();
        ctx.arc(x + 8, y + 8, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x + 8, y + 8, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Corps avec animation
        const bodyWave = Math.sin(frame * 0.1) * 1.5;
        ctx.fillStyle = this.palette.snailBrown;
        ctx.beginPath();
        ctx.ellipse(x + 12 + bodyWave, y + 14, 6, 4, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Yeux sur tentacules
        ctx.strokeStyle = this.palette.snailBrown;
        ctx.lineWidth = 1;
        const eyeOffset = Math.sin(frame * 0.12) * 2;
        ctx.beginPath();
        ctx.moveTo(x + 12, y + 8);
        ctx.lineTo(x + 14, y + 5 + eyeOffset);
        ctx.stroke();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + 14, y + 4 + eyeOffset, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawFrog(ctx, x, y, frame) {
        // Corps
        ctx.fillStyle = this.palette.frogGreen;
        ctx.beginPath();
        ctx.ellipse(x + 8, y + 10, 7, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Patterns sur le dos
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.arc(x + 5, y + 8, 2, 0, Math.PI * 2);
        ctx.arc(x + 11, y + 8, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Pattes (animation de saut)
        const jumpPhase = Math.sin(frame * 0.2);
        const legY = y + 15 + jumpPhase * 3;
        ctx.fillStyle = '#3a9d3a';
        ctx.beginPath();
        ctx.ellipse(x + 3, legY, 3, 2, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 13, legY, 3, 2, -0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Pattes arrière
        ctx.fillStyle = this.palette.frogGreen;
        ctx.beginPath();
        ctx.ellipse(x + 2, legY + 2, 2, 1.5, 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 14, legY + 2, 2, 1.5, -0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Yeux bombés
        ctx.fillStyle = this.palette.frogGreen;
        ctx.beginPath();
        ctx.arc(x + 5, y + 5, 3, 0, Math.PI * 2);
        ctx.arc(x + 11, y + 5, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + 5, y + 5, 1.5, 0, Math.PI * 2);
        ctx.arc(x + 11, y + 5, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(x + 5.5, y + 4, 0.5, 0, Math.PI * 2);
        ctx.arc(x + 11.5, y + 4, 0.5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawBee(ctx, x, y, frame) {
        // Corps rayé
        ctx.fillStyle = this.palette.beeYellow;
        ctx.beginPath();
        ctx.ellipse(x + 8, y + 8, 6, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Rayures noires
        ctx.fillStyle = '#000';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(x + 5, y + 5 + i * 2.5, 6, 1);
        }
        
        // Tête
        ctx.fillStyle = this.palette.beeYellow;
        ctx.beginPath();
        ctx.arc(x + 5, y + 7, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Yeux
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + 4, y + 6, 1, 0, Math.PI * 2);
        ctx.arc(x + 6, y + 6, 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Ailes (animation rapide)
        const wingFlap = Math.sin(frame * 0.5) * 3;
        ctx.strokeStyle = 'rgba(200, 200, 255, 0.7)';
        ctx.lineWidth = 1.5;
        // Aile gauche
        ctx.beginPath();
        ctx.arc(x + 6, y + 5 - wingFlap, 4, 0, Math.PI * 2);
        ctx.stroke();
        // Aile droite
        ctx.beginPath();
        ctx.arc(x + 10, y + 5 + wingFlap, 4, 0, Math.PI * 2);
        ctx.stroke();
        
        // Stinger
        ctx.strokeStyle = '#FF3333';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 8, y + 13);
        ctx.lineTo(x + 8 + Math.sin(frame * 0.08) * 1, y + 15);
        ctx.stroke();
    }
    
    drawButterfly(ctx, x, y, frame) {
        // Ailes (animation)
        const flapAngle = Math.sin(frame * 0.3) * 0.6;
        
        ctx.save();
        ctx.translate(x + 8, y + 8);
        
        // Ailes haut
        ctx.fillStyle = this.palette.butterflyPink;
        ctx.beginPath();
        ctx.ellipse(-5, -4, 4, 6, flapAngle + 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(5, -4, 4, 6, -flapAngle - 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Ailes bas
        ctx.fillStyle = '#FF1493';
        ctx.beginPath();
        ctx.ellipse(-4, 4, 3, 5, flapAngle + 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(4, 4, 3, 5, -flapAngle - 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Corps
        ctx.fillStyle = '#333';
        ctx.fillRect(-1, -3, 2, 12);
        
        // Tête
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(0, -4, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    drawLadybug(ctx, x, y, frame) {
        // Coque rouge
        ctx.fillStyle = this.palette.ladybugRed;
        ctx.beginPath();
        ctx.ellipse(x + 8, y + 8, 6, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Ligne du milieu
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 8, y + 1);
        ctx.lineTo(x + 8, y + 15);
        ctx.stroke();
        
        // Points noirs avec relief
        ctx.fillStyle = '#000';
        const points = [[4, 3], [12, 3], [3, 8], [13, 8], [4, 13], [12, 13]];
        points.forEach(([px, py]) => {
            ctx.beginPath();
            ctx.arc(x + px, y + py, 1.8, 0, Math.PI * 2);
            ctx.fill();
            
            // Highlight
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            ctx.arc(x + px - 0.5, y + py - 0.5, 0.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
        });
        
        // Antennes
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 8, y + 1);
        ctx.lineTo(x + 7, y - 1);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 8, y + 1);
        ctx.lineTo(x + 9, y - 1);
        ctx.stroke();
    }
    
    drawPlatform(ctx, x, y, w, h, type = 'normal') {
        // Couleurs selon le type
        let colors = {
            fill: this.palette.platformBrown,
            shadow: 'rgba(0,0,0,0.4)',
            highlight: 'rgba(255,255,255,0.25)'
        };
        
        if (type === 'moving') {
            colors.fill = '#FF8C00';
            colors.highlight = 'rgba(255,215,0,0.3)';
        } else if (type === 'bouncy') {
            colors.fill = '#FF3366';
            colors.highlight = 'rgba(255,100,150,0.4)';
        } else if (type === 'fragile') {
            colors.fill = '#CD853F';
            colors.highlight = 'rgba(255,255,255,0.15)';
        } else {
            colors.fill = this.palette.platformBrown;
        }
        
        // Plateforme principale
        ctx.fillStyle = colors.fill;
        ctx.fillRect(x, y, w, h);
        
        // Ombre interne
        ctx.fillStyle = colors.shadow;
        ctx.fillRect(x, y + h - 3, w, 3);
        
        // Relief (highlight top)
        ctx.fillStyle = colors.highlight;
        ctx.fillRect(x, y, w, 2);
        
        // Pattern détail (tuiles)
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 0.5;
        const tileSize = 16;
        for (let i = 0; i < w; i += tileSize) {
            // Lignes verticales
            ctx.beginPath();
            ctx.moveTo(x + i, y);
            ctx.lineTo(x + i, y + h);
            ctx.stroke();
        }
        for (let i = 0; i < h; i += tileSize) {
            // Lignes horizontales
            ctx.beginPath();
            ctx.moveTo(x, y + i);
            ctx.lineTo(x + w, y + i);
            ctx.stroke();
        }
        
        // Icône de type sur les plateforme spéciales
        if (type === 'moving') {
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = 'bold 8px Arial';
            ctx.fillText('→', x + w / 2 - 3, y + h / 2 + 2);
        } else if (type === 'bouncy') {
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = 'bold 10px Arial';
            ctx.fillText('↑', x + w / 2 - 4, y + h / 2 + 3);
        }
    }
    
    drawParticle(ctx, x, y, type, life, maxLife) {
        const alpha = life / maxLife;
        ctx.globalAlpha = alpha;
        
        switch(type) {
            case 'dust':
                ctx.fillStyle = 'rgba(200, 200, 200, 0.6)';
                ctx.fillRect(x - 2, y - 2, 4, 4);
                break;
            case 'dash':
                ctx.fillStyle = this.palette.dashLight;
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'jump':
                ctx.fillStyle = this.palette.playerGreen;
                ctx.fillRect(x - 1, y - 1, 2, 2);
                break;
            case 'powerup':
                ctx.fillStyle = this.palette.neon;
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
        
        ctx.globalAlpha = 1;
    }
    
    drawBackground(ctx, level, cameraX, width, height) {
        // Dégradés de ciel par niveau
        const gradients = [
            // Niveau 1: Matin pêche/bleu
            { top: '#87CEEB', mid: '#E0F4FF', bottom: '#B0E0E6' },
            // Niveau 2: Midi vert
            { top: '#90EE90', mid: '#F0FFF0', bottom: '#98FB98' },
            // Niveau 3: Après-midi or
            { top: '#FFD700', mid: '#FFFFE0', bottom: '#FFA500' },
            // Niveau 4: Crépuscule violet
            { top: '#696969', mid: '#A9A9A9', bottom: '#483D8B' },
            // Niveau 5: Nuit
            { top: '#0a0a1a', mid: '#1a0a2e', bottom: '#16213e' }
        ];
        
        const grad = gradients[Math.min(level, 4)];
        
        // Fond dégradé
        const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
        skyGradient.addColorStop(0, grad.top);
        skyGradient.addColorStop(0.6, grad.mid);
        skyGradient.addColorStop(1, grad.bottom);
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, width, height);
        
        // Parallaxe - Montagnes/Collines lointaines
        ctx.fillStyle = level < 4 ? 'rgba(0,100,0,0.1)' : 'rgba(100,0,150,0.1)';
        const parallaxOffset1 = cameraX * 0.1;
        for (let i = -1; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 300 - parallaxOffset1, height * 0.4);
            ctx.quadraticCurveTo(i * 300 + 75 - parallaxOffset1, height * 0.2, i * 300 + 150 - parallaxOffset1, height * 0.4);
            ctx.fill();
        }
        
        // Parallaxe - Nuages moyens
        ctx.fillStyle = level < 4 ? 'rgba(255,255,255,0.2)' : 'rgba(200,150,255,0.1)';
        const parallaxOffset2 = cameraX * 0.3;
        for (let i = -1; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(i * 400 - parallaxOffset2, height * 0.25 + Math.sin(i) * 20, 60, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(i * 400 + 150 - parallaxOffset2, height * 0.3 + Math.sin(i + 1) * 20, 50, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Parallaxe - Élements au premier plan
        ctx.fillStyle = level < 4 ? 'rgba(0,120,0,0.15)' : 'rgba(150,0,200,0.1)';
        const parallaxOffset3 = cameraX * 0.5;
        for (let i = -1; i < 4; i++) {
            // Arbres/Formes
            ctx.fillRect(i * 350 - parallaxOffset3, height * 0.6, 40, height * 0.4);
            ctx.fillRect(i * 350 + 80 - parallaxOffset3, height * 0.65, 30, height * 0.35);
        }
        
        // Couche d'atmosphère finale
        const atmosphereGradient = ctx.createLinearGradient(0, height * 0.7, 0, height);
        atmosphereGradient.addColorStop(0, 'rgba(0,0,0,0)');
        atmosphereGradient.addColorStop(1, level === 4 ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)');
        ctx.fillStyle = atmosphereGradient;
        ctx.fillRect(0, 0, width, height);
    }
}

// ==================== AUDIO SYSTEM ====================
class AudioManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterVolume = 0.3;
    }
    
    playJump() {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2 * this.masterVolume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.1);
    }
    
    playDash() {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'square';
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.frequency.setValueAtTime(600, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.08);
        gain.gain.setValueAtTime(0.15 * this.masterVolume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.08);
        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.08);
    }
    
    playHit() {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2 * this.masterVolume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.15);
    }
    
    playPowerUp() {
        for (let i = 0; i < 3; i++) {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            const freq = 400 + (i * 150);
            osc.frequency.setValueAtTime(freq, this.audioContext.currentTime + i * 0.1);
            gain.gain.setValueAtTime(0.15 * this.masterVolume, this.audioContext.currentTime + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.1 + 0.2);
            osc.start(this.audioContext.currentTime + i * 0.1);
            osc.stop(this.audioContext.currentTime + i * 0.1 + 0.2);
        }
    }
    
    playVictory() {
        const frequencies = [523, 659, 784, 1047]; // Do Mi Sol Do
        frequencies.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.frequency.setValueAtTime(freq, this.audioContext.currentTime + i * 0.2);
            gain.gain.setValueAtTime(0.2 * this.masterVolume, this.audioContext.currentTime + i * 0.2);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.2 + 0.5);
            osc.start(this.audioContext.currentTime + i * 0.2);
            osc.stop(this.audioContext.currentTime + i * 0.2 + 0.5);
        });
    }
    
    playBackgroundMusic(level) {
        // Musique loopée selon le niveau
        // Pour démo, on crée juste une tonalité constante
        if (this.musicOsc) return;
        
        const baseFreq = [261.63, 329.63, 392.00, 493.88, 523.25][Math.min(level, 4)]; // Do, Mi, Sol, Si, Do
        this.musicOsc = this.audioContext.createOscillator();
        this.musicGain = this.audioContext.createGain();
        this.musicOsc.type = 'sine';
        this.musicOsc.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);
        this.musicOsc.connect(this.musicGain);
        this.musicGain.connect(this.audioContext.destination);
        this.musicGain.gain.setValueAtTime(0.05 * this.masterVolume, this.audioContext.currentTime);
        this.musicOsc.start();
    }
    
    stopBackgroundMusic() {
        if (this.musicOsc) {
            this.musicOsc.stop();
            this.musicOsc = null;
        }
    }
}

// ==================== MAIN GAME ENGINE ====================
document.addEventListener('DOMContentLoaded', () => {
    const leaf = document.getElementById('easter-egg-leaf');
    if(!leaf) return;

    let clickCount = 0;
    let clickTimeout;

    leaf.addEventListener('click', () => {
        clickCount++;
        clearTimeout(clickTimeout);
        if (clickCount >= 7) {
            clickCount = 0;
            startGameUI();
        } else {
            clickTimeout = setTimeout(() => { clickCount = 0; }, 1500);
        }
    });

    const gameContainer = document.getElementById('easter-egg-game-container');
    const closeBtn = document.getElementById('close-game-btn');
    const restartBtn = document.getElementById('restart-game-btn');
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const gameOverScreen = document.getElementById('game-over-screen');

    // Initialisation
    let gameActive = false;
    let currentLevelIdx = 0;
    let gameLoop;
    const audio = new AudioManager();
    
    // État du jeu
    const keys = { left: false, right: false, jump: false, power: false, jumpPressed: false, powerPressed: false };
    const groundY = 420;
    
    const player = {
        x: 50, y: 200, w: 20, h: 28,
        vx: 0, vy: 0, speed: 4, jumpPower: -11,
        grounded: false, facingRight: true,
        hp: 5, maxHp: 5, invincibleTimer: 0,
        jumpsLeft: 1, maxJumps: 1,
        dashCooldown: 0, wallJumpCooldown: 0,
        onWall: false, wallSide: 0,
        powers: { doubleJump: false, dash: false, wallJump: false, crouch: false, slowTime: false },
        activePower: null, powerCooldown: 0,
        crouching: false,
        spawnX: 50, spawnY: 200,
        animFrame: 0, animCounter: 0
    };
    
    let cameraX = 0, cameraY = 0;
    let particles = [];
    let enemies = [];
    let tasks = [];
    let levelData = {};
    let completedTasks = 0;
    let frameCount = 0;
    let screenShake = 0;
    
    // ==================== POWER-UPS SYSTEM ====================
    const powerUpSequence = [
        { name: 'doubleJump', label: 'DOUBLE SAUT', icon: '⇧⇧' },
        { name: 'dash', label: 'DASH RAPIDE', icon: '→→' },
        { name: 'wallJump', label: 'SAUT MURAL', icon: '|→' },
        { name: 'crouch', label: 'ACCROUPIR', icon: '⬇' },
        { name: 'slowTime', label: 'TEMPS LENT', icon: '⏱' }
    ];
    
    function activatePowerUp(powerName) {
        if (player[powerName] === false) return;
        if (player.powerCooldown > 0) return;
        
        player.activePower = powerName;
        
        switch(powerName) {
            case 'doubleJump':
                if (player.jumpsLeft > 0 && !player.grounded) {
                    player.vy = player.jumpPower;
                    player.jumpsLeft--;
                    audio.playJump();
                }
                break;
            case 'dash':
                if (player.dashCooldown <= 0) {
                    player.vx = player.facingRight ? 10 : -10;
                    player.dashCooldown = 20;
                    audio.playDash();
                }
                break;
            case 'wallJump':
                if (player.onWall && player.wallJumpCooldown <= 0) {
                    player.vy = player.jumpPower * 0.8;
                    player.vx = -player.wallSide * 6;
                    player.wallJumpCooldown = 10;
                    audio.playJump();
                }
                break;
            case 'crouch':
                player.crouching = !player.crouching;
                if (player.crouching) player.h = 14;
                else player.h = 28;
                break;
            case 'slowTime':
                player.powerCooldown = 15; // Durée du ralenti
                break;
        }
    }
    
    // ==================== LEVELS DATA ====================
    const levels = [
        {
            name: "Le Jardin Paisible - TUTORIEL",
            width: 2500,
            bgColor: '#87CEEB',
            goalX: 2350,
            tasks: [
                { x: 400, y: groundY, task: 'Tondre l\'herbe' },
                { x: 800, y: groundY, task: 'Tailler la haie' },
                { x: 1300, y: groundY, task: 'Élaguer l\'arbre' }
            ],
            powerUpZone: { x: 1600, y: 350, label: 'DOUBLE SAUT obtenu!' },
            enemies: [
                { x: 600, y: groundY - 24, type: 'snail', vx: 1, ai: 'patrol' },
                { x: 1200, y: groundY - 24, type: 'snail', vx: -1, ai: 'patrol' }
            ],
            platforms: [
                { x: 0, y: groundY, w: 2500, h: 60 },
                { x: 400, y: 350, w: 120, h: 20 },
                { x: 1200, y: 300, w: 120, h: 20 }
            ]
        },
        {
            name: "L'Invasion des Grenouilles",
            width: 3500,
            bgColor: '#90EE90',
            goalX: 3350,
            tasks: [
                { x: 300, y: groundY, task: 'Arrêter les grenouilles' },
                { x: 1500, y: groundY, task: 'Protéger les plantes' },
                { x: 2800, y: groundY, task: 'Sécuriser le terrain' }
            ],
            powerUpZone: { x: 2000, y: 250, label: 'DASH obtenu!' },
            enemies: [
                { x: 800, y: groundY - 24, type: 'frog', vx: 2, ai: 'jump' },
                { x: 1600, y: groundY - 24, type: 'frog', vx: -2, ai: 'jump' },
                { x: 2400, y: groundY - 24, type: 'frog', vx: 1.5, ai: 'jump' }
            ],
            platforms: [
                { x: 0, y: groundY, w: 3500, h: 60 },
                { x: 600, y: 320, w: 100, h: 20 },
                { x: 1400, y: 280, w: 100, h: 20 },
                { x: 2200, y: 320, w: 100, h: 20 }
            ]
        },
        {
            name: "Le Ruché Agité",
            width: 4000,
            bgColor: '#FFD700',
            goalX: 3800,
            tasks: [
                { x: 400, y: groundY, task: 'Calmer les abeilles' },
                { x: 1800, y: groundY, task: 'Nettoyer le secteur' },
                { x: 3200, y: groundY, task: 'Finaliser le nettoyage' }
            ],
            powerUpZone: { x: 2200, y: 200, label: 'SAUT MURAL obtenu!' },
            enemies: [
                { x: 700, y: 150, type: 'bee', vx: 2, ai: 'hover' },
                { x: 1500, y: groundY - 24, type: 'frog', vx: 2, ai: 'jump' },
                { x: 2300, y: 200, type: 'butterfly', vx: 3, ai: 'erratic' },
                { x: 3100, y: 150, type: 'bee', vx: -2, ai: 'hover' }
            ],
            platforms: [
                { x: 0, y: groundY, w: 2000, h: 60 },
                { x: 2100, y: groundY, w: 1900, h: 60 },
                { x: 600, y: 280, w: 100, h: 20 },
                { x: 1400, y: 250, w: 100, h: 20 },
                { x: 2200, y: 180, w: 80, h: 20 },
                { x: 3000, y: 280, w: 100, h: 20 }
            ]
        },
        {
            name: "La Lisière Sombre - CHALLENGE",
            width: 4500,
            bgColor: '#696969',
            goalX: 4300,
            tasks: [
                { x: 400, y: groundY, task: 'Maîtriser le terrain' },
                { x: 1800, y: groundY, task: 'Affronter le danger' },
                { x: 3200, y: groundY, task: 'Préparer la finale' }
            ],
            powerUpZone: { x: 2500, y: 200, label: 'ACCROUPIR obtenu!' },
            enemies: [
                { x: 800, y: 150, type: 'bee', vx: 3, ai: 'hover' },
                { x: 1600, y: groundY - 24, type: 'ladybug', vx: 2, ai: 'patrol' },
                { x: 2400, y: groundY - 24, type: 'frog', vx: -2, ai: 'jump' },
                { x: 3200, y: 200, type: 'butterfly', vx: -3, ai: 'erratic' },
                { x: 4000, y: 150, type: 'bee', vx: 2, ai: 'hover' }
            ],
            platforms: [
                { x: 0, y: groundY, w: 1500, h: 60 },
                { x: 1700, y: groundY, w: 2800, h: 60 },
                { x: 500, y: 300, w: 100, h: 20 },
                { x: 1300, y: 280, w: 100, h: 20 },
                { x: 2100, y: 250, w: 100, h: 20, type: 'moving', speed: 2 },
                { x: 3000, y: 300, w: 100, h: 20 },
                { x: 3800, y: 280, w: 100, h: 20 }
            ]
        },
        {
            name: "L'ANTRE DE LA RONCE - BOSS FINAL",
            width: 5000,
            bgColor: '#1a1a1a',
            goalX: -1000,
            isBoss: true,
            tasks: [],
            enemies: [],
            platforms: [
                { x: 0, y: groundY, w: 1200, h: 60 },
                { x: 200, y: 300, w: 80, h: 20 },
                { x: 900, y: 280, w: 80, h: 20 },
                { x: 1300, y: groundY, w: 1500, h: 60 },
                { x: 1600, y: 300, w: 100, h: 20, type: 'moving', speed: 3 },
                { x: 2200, y: 250, w: 100, h: 20 },
                { x: 2900, y: groundY, w: 2100, h: 60 },
                { x: 3200, y: 300, w: 100, h: 20 },
                { x: 3800, y: 280, w: 100, h: 20 },
                { x: 4300, y: 320, w: 80, h: 20 }
            ],
            boss: {
                x: 900, y: 250, w: 80, h: 100, hp: 40, maxHp: 40,
                phase: 1, maxPhase: 6, state: 'spawn',
                vx: 0, vy: 0, speed: 2, attackTimer: 0,
                projectiles: [], shield: false
            }
        }
    ];
    
    function loadLevel(idx) {
        currentLevelIdx = idx;
        levelData = JSON.parse(JSON.stringify(levels[idx]));
        
        player.x = 50;
        player.y = 200;
        player.vx = 0;
        player.vy = 0;
        player.grounded = false;
        player.jumpsLeft = player.maxJumps;
        player.hp = player.maxHp;
        player.invincibleTimer = 0;
        player.crouching = false;
        player.h = 28;
        
        // Donner les power-ups des niveaux précédents
        for (let i = 0; i <= idx && i < 5; i++) {
            player.powers[powerUpSequence[i].name] = true;
        }
        
        enemies = levelData.enemies.map(e => ({
            ...e, originalX: e.x, originalY: e.y, hp: 3, maxHp: 3, 
            animFrame: 0, animCounter: 0, direction: e.vx > 0 ? 1 : -1
        }));
        
        tasks = levelData.tasks.map(t => ({ ...t, completed: false }));
        completedTasks = 0;
        cameraX = 0;
        particles = [];
        frameCount = 0;
        
        if (levelData.isBoss) {
            levelData.boss.phase = 1;
            levelData.boss.state = 'spawn';
            audio.stopBackgroundMusic();
        }
        
        document.getElementById('level-display').innerText = `NIVEAU ${idx + 1} - ${levelData.name}`;
        document.getElementById('task-count').innerText = `${completedTasks}/${tasks.length}`;
        document.getElementById('power-display').innerText = `POUVOIR: ${player.powers[powerUpSequence[idx]?.name] ? powerUpSequence[idx]?.label : '-'}`;
        
        gameActive = true;
        cancelAnimationFrame(gameLoop);
        update();
    }
    
    function update() {
        if (!gameActive) return;
        frameCount++;
        
        // Mise à jour du joueur
        updatePlayer();
        
        // Mise à jour des ennemis
        updateEnemies();
        
        // Mise à jour du boss
        if (levelData.isBoss) updateBoss();
        
        // Vérifications des collisions
        checkCollisions();
        
        // Mise à jour de la caméra
        cameraX = Math.max(0, Math.min(player.x - 200, levelData.width - 900));
        
        // Rendu
        render();
        
        gameLoop = requestAnimationFrame(update);
    }
    
    function updatePlayer() {
        // Mouvements
        player.vx = 0;
        if (keys.left) { player.vx = -player.speed; player.facingRight = false; }
        if (keys.right) { player.vx = player.speed; player.facingRight = true; }
        
        // Gravité
        const timeMultiplier = (player.activePower === 'slowTime' && player.powerCooldown > 0) ? 0.3 : 1;
        player.vy += 0.5 * timeMultiplier;
        player.vy = Math.min(player.vy, 15);
        
        player.x += player.vx;
        player.y += player.vy * timeMultiplier;
        
        // Limites du monde
        player.x = Math.max(0, Math.min(player.x, levelData.width - player.w));
        
        // Détection des plateformes
        player.grounded = false;
        player.onWall = false;
        
        for (let platform of levelData.platforms) {
            // Collision du bas
            if (player.vy > 0 && player.y + player.h <= platform.y + 5 &&
                player.y + player.h + player.vy >= platform.y &&
                player.x + player.w > platform.x && player.x < platform.x + platform.w) {
                player.y = platform.y - player.h;
                player.vy = 0;
                player.grounded = true;
                player.jumpsLeft = player.maxJumps;
            }
            
            // Collision des murs
            if (player.powers.wallJump && player.vy > 0) {
                if (player.x + player.w > platform.x - 5 && player.x < platform.x && player.y + player.h > platform.y) {
                    player.onWall = true;
                    player.wallSide = -1;
                }
                if (player.x < platform.x + platform.w + 5 && player.x + player.w > platform.x + platform.w && player.y + player.h > platform.y) {
                    player.onWall = true;
                    player.wallSide = 1;
                }
            }
        }
        
        if (player.y > groundY + 200) {
            playerDeath();
        }
        
        // Sauts
        if (keys.jumpPressed) {
            if (player.grounded) {
                player.vy = player.jumpPower;
                player.jumpsLeft--;
                audio.playJump();
            } else if (player.powers.doubleJump && player.jumpsLeft > 0) {
                player.vy = player.jumpPower;
                player.jumpsLeft--;
                audio.playJump();
            }
            keys.jumpPressed = false;
        }
        
        // Power-ups
        if (keys.powerPressed) {
            if (player.activePower) activatePowerUp(player.activePower);
            keys.powerPressed = false;
        }
        
        player.dashCooldown = Math.max(0, player.dashCooldown - 1);
        player.wallJumpCooldown = Math.max(0, player.wallJumpCooldown - 1);
        player.powerCooldown = Math.max(0, player.powerCooldown - 1);
        player.invincibleTimer = Math.max(0, player.invincibleTimer - 1);
    }
    
    function updateEnemies() {
        enemies.forEach(enemy => {
            enemy.animCounter++;
            if (enemy.animCounter > 10) {
                enemy.animFrame = (enemy.animFrame + 1) % 2;
                enemy.animCounter = 0;
            }
            
            switch(enemy.ai) {
                case 'patrol':
                    enemy.x += enemy.vx;
                    if (enemy.x < enemy.originalX - 200 || enemy.x > enemy.originalX + 200) enemy.vx *= -1;
                    break;
                case 'jump':
                    enemy.x += enemy.vx;
                    if (frameCount % 60 === 0) enemy.vy = -10;
                    enemy.vy += 0.5;
                    enemy.y += enemy.vy;
                    if (enemy.y >= groundY - 24) {
                        enemy.y = groundY - 24;
                        if (Math.random() > 0.5) enemy.vx *= -1;
                    }
                    break;
                case 'hover':
                    enemy.x += enemy.vx;
                    enemy.y = enemy.originalY + Math.sin(frameCount * 0.05) * 20;
                    if (enemy.x < enemy.originalX - 300 || enemy.x > enemy.originalX + 300) enemy.vx *= -1;
                    break;
                case 'erratic':
                    if (frameCount % 40 === 0) {
                        enemy.vx = (Math.random() - 0.5) * 6;
                        enemy.vy = (Math.random() - 0.5) * 4;
                    }
                    enemy.x += enemy.vx;
                    enemy.y += enemy.vy;
                    break;
            }
        });
    }
    
    function updateBoss() {
        const boss = levelData.boss;
        boss.attackTimer++;
        
        if (boss.state === 'spawn') {
            if (boss.attackTimer > 60) boss.state = 'phase' + boss.phase;
        }
        
        // Phases du boss
        const distToPlayer = Math.abs(boss.x - player.x);
        
        if (boss.state.startsWith('phase')) {
            switch(boss.phase) {
                case 1:
                    // Phase 1: DOUBLE JUMP requis - Boss saute
                    if (boss.attackTimer % 80 === 0) {
                        boss.vy = -12;
                    }
                    boss.vy += 0.5;
                    boss.y += boss.vy;
                    if (boss.y >= groundY - boss.h) {
                        boss.y = groundY - boss.h;
                        boss.vy = 0;
                    }
                    boss.x += boss.vx;
                    if (boss.x < 100 || boss.x > 1100) boss.vx *= -1;
                    break;
                    
                case 2:
                    // Phase 2: DASH requis - Boss charge rapidement
                    boss.speed = 4;
                    if (distToPlayer < 500) {
                        boss.vx = player.x > boss.x ? boss.speed * 1.5 : -boss.speed * 1.5;
                    }
                    boss.x += boss.vx;
                    if (boss.attackTimer % 120 === 0) boss.vx *= -1;
                    break;
                    
                case 3:
                    // Phase 3: WALL JUMP requis - Boss crée des murs
                    boss.x += boss.vx * 0.7;
                    boss.y = groundY - boss.h - 30;
                    if (boss.x < 200 || boss.x > 1100) boss.vx *= -1;
                    if (boss.attackTimer % 100 === 0) {
                        boss.projectiles.push({ x: boss.x, y: boss.y, vx: (Math.random() - 0.5) * 8, type: 'thorn' });
                    }
                    break;
                    
                case 4:
                    // Phase 4: CROUCH requis - Boss attaque bas
                    boss.x += boss.vx;
                    if (frameCount % 60 === 0) {
                        boss.projectiles.push({ x: boss.x, y: groundY - 30, vx: (Math.random() - 0.5) * 6, type: 'vine' });
                    }
                    if (boss.x < 100 || boss.x > 1100) boss.vx *= -1;
                    break;
                    
                case 5:
                    // Phase 5: Combinaison - Multi-attaque
                    boss.x += boss.vx;
                    boss.vy += 0.4;
                    boss.y += boss.vy;
                    if (boss.y >= groundY - boss.h) {
                        boss.y = groundY - boss.h;
                        boss.vy = -8;
                    }
                    if (frameCount % 50 === 0) {
                        boss.projectiles.push({ x: boss.x, y: boss.y, vx: Math.random() * 8 - 4, type: 'thorn' });
                    }
                    if (boss.x < 100 || boss.x > 1100) boss.vx *= -1;
                    break;
                    
                case 6:
                    // Phase 6: SLOW TIME requis - Boss invulnérable sans ralenti
                    boss.shield = player.activePower !== 'slowTime' || player.powerCooldown <= 0;
                    if (!boss.shield) {
                        boss.hp -= 0.2;
                        boss.x += boss.vx;
                    }
                    boss.y = groundY - boss.h - 50 + Math.sin(frameCount * 0.08) * 30;
                    if (boss.x < 100 || boss.x > 1100) boss.vx *= -1;
                    
                    if (boss.hp <= 0) {
                        gameActive = false;
                        audio.playVictory();
                        showGameOver('VICTOIRE!', 'Vous avez vaincu la Ronce Mutante!', 'Continuer');
                    }
                    break;
            }
            
            // Passage à la phase suivante
            if (boss.hp <= boss.maxHp * (1 - boss.phase / 6)) {
                boss.phase++;
                boss.state = 'phase' + boss.phase;
                boss.attackTimer = 0;
                spawnParticles(boss.x, boss.y, '#ff0000', 20);
            }
        }
    }
    
    function checkCollisions() {
        // Ennemis vs Joueur
        enemies = enemies.filter(enemy => {
            if (player.invincibleTimer <= 0 &&
                player.x < enemy.x + 24 && player.x + player.w > enemy.x &&
                player.y < enemy.y + 24 && player.y + player.h > enemy.y) {
                player.hp--;
                player.invincibleTimer = 120;
                audio.playHit();
                spawnParticles(player.x, player.y, '#ff0000', 10);
                if (player.hp <= 0) playerDeath();
                return false;
            }
            return true;
        });
        
        // Tâches complétées
        tasks.forEach(task => {
            if (!task.completed &&
                player.x < task.x + 60 && player.x + player.w > task.x &&
                player.y < task.y + 40 && player.y + player.h > task.y) {
                task.completed = true;
                completedTasks++;
                audio.playPowerUp();
                spawnParticles(task.x, task.y, '#00ff00', 15);
                document.getElementById('task-count').innerText = `${completedTasks}/${tasks.length}`;
            }
        });
        
        // Power-up Zone
        if (levelData.powerUpZone && !player.powers[powerUpSequence[currentLevelIdx].name]) {
            if (player.x < levelData.powerUpZone.x + 40 && player.x + player.w > levelData.powerUpZone.x &&
                player.y < levelData.powerUpZone.y + 40 && player.y + player.h > levelData.powerUpZone.y) {
                player.powers[powerUpSequence[currentLevelIdx].name] = true;
                player.activePower = powerUpSequence[currentLevelIdx].name;
                audio.playPowerUp();
                spawnParticles(levelData.powerUpZone.x, levelData.powerUpZone.y, '#ffff00', 20);
                document.getElementById('power-display').innerText = `POUVOIR: ${powerUpSequence[currentLevelIdx].label}`;
            }
        }
        
        // Objectif
        if (completedTasks === tasks.length &&
            player.x < levelData.goalX + 60 && player.x + player.w > levelData.goalX &&
            player.y < groundY) {
            if (currentLevelIdx < 4) {
                loadLevel(currentLevelIdx + 1);
            } else {
                gameActive = false;
                audio.playVictory();
                showGameOver('VICTOIRE FINALE!', 'Vous avez accompli votre mission!', 'Recommencer');
            }
        }
    }
    
    function spawnParticles(x, y, color, count, type = 'normal') {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 2 + Math.random() * 4;
            
            let particleType;
            if (color === '#3bce0d' || color.includes('green')) particleType = 'jump';
            else if (color === '#ff3399' || color === '#ff66cc') particleType = 'dash';
            else if (color === '#ffff00' || color === '#00ffff') particleType = 'powerup';
            else particleType = 'normal';
            
            particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 2,
                vy: Math.sin(angle) * speed + (Math.random() - 0.5) * 2 - 1,
                color: color,
                life: 50,
                maxLife: 50,
                type: particleType
            });
        }
    }
    
    function playerDeath() {
        spawnParticles(player.x, player.y, '#FF0000', 15, 'death');
        loadLevel(currentLevelIdx);
    }
    
    const renderer = new CelestePixelRenderer();
    
    function render() {
        // Background avec parallaxe
        renderer.drawBackground(ctx, currentLevelIdx, cameraX, canvas.width, canvas.height);
        
        // Applier shake et caméra
        ctx.save();
        if (screenShake > 0) {
            ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
            screenShake *= 0.9;
        }
        ctx.translate(-cameraX, 0);
        
        // Platformes avec relief
        levelData.platforms.forEach(p => {
            if (p.type === 'moving') {
                p.x += p.speed || 0;
                if (p.x > levelData.width) p.x = -p.w;
            }
            renderer.drawPlatform(ctx, p.x, p.y, p.w, p.h, p.type);
        });
        
        // Tâches (objectives)
        tasks.forEach(t => {
            if (!t.completed) {
                // Coffre/objectif
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(t.x - 20, t.y - 40, 40, 40);
                ctx.fillStyle = '#FFA500';
                ctx.fillRect(t.x - 15, t.y - 35, 30, 25);
                
                // Couvercle
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.ellipse(t.x, t.y - 35, 20, 8, 0, 0, Math.PI);
                ctx.fill();
                
                // Glow
                ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.ellipse(t.x, t.y - 35, 22 + Math.sin(frameCount * 0.1) * 3, 10, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
        });
        
        // Power-up Zone
        if (levelData.powerUpZone && !player.powers[powerUpSequence[currentLevelIdx].name]) {
            const py = levelData.powerUpZone.y + Math.sin(frameCount * 0.05) * 3;
            
            // Cristal
            ctx.fillStyle = '#00FFFF';
            ctx.beginPath();
            ctx.moveTo(levelData.powerUpZone.x + 20, py - 15);
            ctx.lineTo(levelData.powerUpZone.x + 30, py);
            ctx.lineTo(levelData.powerUpZone.x + 20, py + 15);
            ctx.lineTo(levelData.powerUpZone.x + 10, py);
            ctx.fill();
            
            // Glow
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Particules autour
            for (let i = 0; i < 4; i++) {
                const angle = (frameCount * 0.08 + i * Math.PI / 2);
                const px = levelData.powerUpZone.x + 20 + Math.cos(angle) * 30;
                const py2 = levelData.powerUpZone.y + Math.sin(angle) * 30;
                ctx.fillStyle = '#00FFFF';
                ctx.beginPath();
                ctx.arc(px, py2, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Objectif final
        ctx.fillStyle = '#FF1493';
        ctx.fillRect(levelData.goalX, groundY - 100, 80, 100);
        ctx.fillStyle = 'rgba(255, 20, 147, 0.3)';
        ctx.fillRect(levelData.goalX - 5, groundY - 105, 90, 110);
        
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🏁', levelData.goalX + 40, groundY - 30);
        ctx.textAlign = 'left';
        
        // Ennemis avec nouveau rendu
        enemies.forEach(e => {
            if (e.hp > 0) {
                renderer.drawEnemy(ctx, e.x, e.y, e.type, frameCount + e.x);
                
                // Barre de vie des ennemis
                ctx.fillStyle = '#FF0000';
                ctx.fillRect(e.x, e.y - 8, 20, 2);
                ctx.fillStyle = '#00FF00';
                ctx.fillRect(e.x, e.y - 8, 20 * (e.hp / e.maxHp), 2);
                ctx.strokeStyle = '#FFF';
                ctx.lineWidth = 1;
                ctx.strokeRect(e.x, e.y - 8, 20, 2);
            }
        });
        
        // Joueur avec nouveau rendu
        ctx.save();
        const isDashing = player.activePower === 'dash' && player.dashCooldown > 0;
        ctx.globalAlpha = player.invincibleTimer > 0 && frameCount % 10 < 5 ? 0.5 : 1;
        renderer.drawPlayer(ctx, player.x, player.y, frameCount, player.facingRight, !player.grounded, isDashing);
        ctx.restore();
        
        // Boss
        if (levelData.isBoss && levelData.boss.hp > 0) {
            const boss = levelData.boss;
            
            // Boss visuel (Ronce Mutante)
            ctx.fillStyle = boss.shield ? '#FFD700' : '#8B0000';
            ctx.beginPath();
            ctx.arc(boss.x + boss.w / 2, boss.y + boss.h / 2, boss.w / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Tentacules animées
            ctx.strokeStyle = '#DC143C';
            ctx.lineWidth = 3;
            for (let i = 0; i < 6; i++) {
                const angle = (frameCount * 0.05 + i * Math.PI / 3);
                const len = 40 + Math.sin(frameCount * 0.1) * 10;
                ctx.beginPath();
                ctx.moveTo(boss.x + boss.w / 2, boss.y + boss.h / 2);
                const endX = boss.x + boss.w / 2 + Math.cos(angle) * len;
                const endY = boss.y + boss.h / 2 + Math.sin(angle) * len;
                ctx.lineTo(endX, endY);
                ctx.stroke();
                
                // Épines
                ctx.fillStyle = '#FF0000';
                ctx.beginPath();
                ctx.arc(endX, endY, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Yeux menaçants
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(boss.x + boss.w / 3, boss.y + boss.h / 3, 5, 0, Math.PI * 2);
            ctx.arc(boss.x + boss.w * 2 / 3, boss.y + boss.h / 3, 5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(boss.x + boss.w / 3, boss.y + boss.h / 3, 2, 0, Math.PI * 2);
            ctx.arc(boss.x + boss.w * 2 / 3, boss.y + boss.h / 3, 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Barre de vie du boss
            ctx.fillStyle = '#FF0000';
            const bossHPWidth = Math.max(0, (boss.hp / boss.maxHp) * 100);
            ctx.fillRect(boss.x - 20, boss.y - 20, bossHPWidth, 8);
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 2;
            ctx.strokeRect(boss.x - 20, boss.y - 20, 100, 8);
            
            // Aura si shield
            if (boss.shield) {
                ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
                ctx.lineWidth = 3;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.arc(boss.x + boss.w / 2, boss.y + boss.h / 2, boss.w / 2 + 10, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }
            
            // Projectiles du boss
            boss.projectiles.forEach(proj => {
                proj.x += proj.vx;
                proj.y += (proj.vy || 0) + 0.2;
                
                if (proj.type === 'thorn') {
                    ctx.fillStyle = '#DC143C';
                    ctx.beginPath();
                    ctx.moveTo(proj.x, proj.y - 6);
                    ctx.lineTo(proj.x + 4, proj.y + 6);
                    ctx.lineTo(proj.x - 4, proj.y + 6);
                    ctx.fill();
                } else {
                    ctx.fillStyle = '#228B22';
                    ctx.fillRect(proj.x - 3, proj.y - 3, 6, 6);
                }
            });
        }
        
        // Particules améliorées
        particles.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15;
            p.life--;
            
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            
            // Rendu selon le type
            if (p.color === '#ff3399' || p.color === '#ff66cc') {
                // Dash particles - étoile
                ctx.fillStyle = p.color;
                ctx.beginPath();
                for (let i = 0; i < 4; i++) {
                    const angle = (i * Math.PI / 2);
                    const x = Math.cos(angle) * 3;
                    const y = Math.sin(angle) * 3;
                    if (i === 0) ctx.moveTo(p.x + x, p.y + y);
                    else ctx.lineTo(p.x + x, p.y + y);
                }
                ctx.fill();
            } else {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2 + Math.random() * 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        particles = particles.filter(p => p.life > 0);
        ctx.globalAlpha = 1;
        
        ctx.restore();
        
        // UI - Barre de vie améliorée
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(10, 10, 150, 40);
        ctx.strokeStyle = '#3bce0d';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, 150, 40);
        
        for (let i = 0; i < player.maxHp; i++) {
            if (i < player.hp) {
                ctx.fillStyle = '#FF0000';
            } else {
                ctx.fillStyle = '#660000';
            }
            ctx.fillRect(20 + i * 14, 20, 12, 12);
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 1;
            ctx.strokeRect(20 + i * 14, 20, 12, 12);
        }
        
        ctx.fillStyle = '#3bce0d';
        ctx.font = 'bold 10px Arial';
        ctx.fillText(`${player.hp}/${player.maxHp} HP`, 20, 38);
        
        document.getElementById('hp-display').innerText = `${player.hp}/${player.maxHp}`;
    }
    
    function showGameOver(title, text, btn) {
        document.getElementById('game-end-title').innerText = title;
        document.getElementById('game-end-text').innerText = text;
        document.getElementById('restart-game-btn').innerText = btn;
        gameOverScreen.classList.remove('hidden');
    }
    
    // Input
    document.addEventListener('keydown', (e) => {
        if (e.key === 'z' || e.key === 'Z' || e.key === 'w' || e.key === 'W') { keys.left = true; e.preventDefault(); }
        if (e.key === 'ArrowLeft') { keys.left = true; e.preventDefault(); }
        if (e.key === 'd' || e.key === 'D') { keys.right = true; e.preventDefault(); }
        if (e.key === 'ArrowRight') { keys.right = true; e.preventDefault(); }
        if (e.code === 'Space') { keys.jumpPressed = true; e.preventDefault(); }
        if (e.key === 'Control') { keys.powerPressed = true; e.preventDefault(); }
    });
    
    document.addEventListener('keyup', (e) => {
        if (e.key === 'z' || e.key === 'Z' || e.key === 'w' || e.key === 'W') { keys.left = false; }
        if (e.key === 'ArrowLeft') { keys.left = false; }
        if (e.key === 'd' || e.key === 'D') { keys.right = false; }
        if (e.key === 'ArrowRight') { keys.right = false; }
    });
    
    function startGameUI() {
        gameContainer.classList.remove('hidden');
        gameContainer.classList.add('flex');
        document.body.style.overflow = 'hidden';
        loadLevel(0);
    }
    
    closeBtn.addEventListener('click', () => {
        gameContainer.classList.add('hidden');
        gameContainer.classList.remove('flex');
        document.body.style.overflow = '';
        gameActive = false;
        cancelAnimationFrame(gameLoop);
        audio.stopBackgroundMusic();
    });
    
    restartBtn.addEventListener('click', () => {
        loadLevel(currentLevelIdx < 5 ? currentLevelIdx + 1 : 0);
        gameOverScreen.classList.add('hidden');
    });
});
