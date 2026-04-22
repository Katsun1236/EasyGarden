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

// ==================== PIXEL ART SPRITE SYSTEM ====================
class SpriteSheet {
    constructor() {
        this.sprites = {};
        this.createPlayerSprites();
        this.createEnemySprites();
        this.createEffectSprites();
    }
    
    createPlayerSprites() {
        this.sprites.player = {
            idle: this.drawPixelChar([0,1,0,1,0,0,1,1,1,1,0,1,1,1,0,1], '#2d5016', 16),
            walk: [
                this.drawPixelChar([0,1,0,1,0,0,1,1,1,0,0,1,0,1,1,1], '#2d5016', 16),
                this.drawPixelChar([0,1,0,1,0,0,1,1,1,1,0,0,0,1,1,1], '#2d5016', 16)
            ],
            jump: this.drawPixelChar([0,1,0,1,0,0,1,1,1,1,0,0,0,0,1,1], '#2d5016', 16),
            dash: this.drawPixelChar([1,1,1,1,0,1,1,0,1,0,1,1,0,1,1,1], '#3b7a2d', 16),
            wall: this.drawPixelChar([0,1,0,1,0,1,1,1,1,1,0,1,1,1,0,1], '#3b7a2d', 16),
        };
    }
    
    createEnemySprites() {
        this.sprites.enemies = {
            snail: [
                this.drawPixelChar([0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0], '#8b7355', 16),
                this.drawPixelChar([0,1,1,0,1,0,0,1,1,0,1,0,0,1,1,0], '#8b7355', 16)
            ],
            frog: [
                this.drawPixelChar([0,1,1,0,1,0,0,1,1,0,0,0,1,1,1,0], '#228B22', 16),
                this.drawPixelChar([0,1,1,0,0,1,1,0,1,1,1,0,1,1,1,0], '#228B22', 16)
            ],
            bee: [
                this.drawPixelChar([0,1,1,0,0,1,0,1,1,0,1,0,0,1,1,0], '#FFD700', 14),
                this.drawPixelChar([0,1,1,0,1,0,0,1,0,1,0,1,0,1,1,0], '#FFD700', 14)
            ],
            butterfly: [
                this.drawPixelChar([1,1,0,1,1,0,0,1,0,1,0,1,1,1,0,1], '#FF69B4', 16),
                this.drawPixelChar([1,0,1,1,0,1,0,1,1,0,0,1,0,1,1,1], '#FF69B4', 16)
            ],
            ladybug: [
                this.drawPixelChar([0,1,1,0,1,0,1,1,1,0,1,1,0,1,1,0], '#DC143C', 16),
                this.drawPixelChar([0,1,1,0,1,1,0,1,0,1,0,1,0,1,1,0], '#DC143C', 16)
            ]
        };
    }
    
    createEffectSprites() {
        this.sprites.effects = {
            dust: this.drawPixelChar([0,0,1,0,1,0,1,1,0,1,0,1,0,0,1,0], '#888888', 12),
            spark: this.drawPixelChar([1,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1], '#FFD700', 8),
            heal: this.drawPixelChar([0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0], '#FF69B4', 12),
        };
    }
    
    drawPixelChar(pattern, color, size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const pixelSize = size / 4;
        
        for (let i = 0; i < 16; i++) {
            if (pattern[i]) {
                ctx.fillStyle = color;
                ctx.fillRect((i % 4) * pixelSize, Math.floor(i / 4) * pixelSize, pixelSize, pixelSize);
            }
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 0.5;
            ctx.strokeRect((i % 4) * pixelSize, Math.floor(i / 4) * pixelSize, pixelSize, pixelSize);
        }
        
        return canvas;
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
    const sprites = new SpriteSheet();
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
    
    function spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            particles.push({
                x: x + (Math.random() - 0.5) * 40,
                y: y + (Math.random() - 0.5) * 40,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 2,
                color: color,
                life: 60,
                maxLife: 60
            });
        }
    }
    
    function playerDeath() {
        loadLevel(currentLevelIdx);
    }
    
    function render() {
        // Ciel
        ctx.fillStyle = levelData.bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Applier shake
        ctx.save();
        if (screenShake > 0) {
            ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
            screenShake *= 0.9;
        }
        
        // Appliquer caméra
        ctx.translate(-cameraX, 0);
        
        // Platformes
        ctx.fillStyle = '#8B7355';
        levelData.platforms.forEach(p => {
            if (p.type === 'moving') {
                p.x += p.speed;
                if (p.x > levelData.width) p.x = -p.w;
            }
            ctx.fillRect(p.x, p.y, p.w, p.h);
        });
        
        // Tâches
        ctx.fillStyle = '#FFD700';
        tasks.forEach(t => {
            if (!t.completed) {
                ctx.fillRect(t.x, t.y - 40, 60, 40);
                ctx.fillStyle = '#000';
                ctx.font = '12px Arial';
                ctx.fillText('📋', t.x + 22, t.y - 15);
                ctx.fillStyle = '#FFD700';
            }
        });
        
        // Power-up Zone
        if (levelData.powerUpZone && !player.powers[powerUpSequence[currentLevelIdx].name]) {
            ctx.fillStyle = '#00FF00';
            ctx.fillRect(levelData.powerUpZone.x, levelData.powerUpZone.y, 40, 40);
            ctx.fillStyle = '#000';
            ctx.font = 'bold 14px Arial';
            ctx.fillText('⚡', levelData.powerUpZone.x + 13, levelData.powerUpZone.y + 26);
        }
        
        // Objectif
        ctx.fillStyle = '#FF1493';
        ctx.fillRect(levelData.goalX, groundY - 100, 80, 100);
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('🏁', levelData.goalX + 25, groundY - 30);
        
        // Ennemis
        ctx.fillStyle = '#8B0000';
        enemies.forEach(e => {
            ctx.fillRect(e.x, e.y, 24, 24);
            ctx.fillStyle = '#FFF';
            ctx.font = '14px Arial';
            let emoji = '🐌';
            if (e.type === 'frog') emoji = '🐸';
            if (e.type === 'bee') emoji = '🐝';
            if (e.type === 'butterfly') emoji = '🦋';
            if (e.type === 'ladybug') emoji = '🐞';
            ctx.fillText(emoji, e.x + 5, e.y + 18);
            ctx.fillStyle = '#8B0000';
        });
        
        // Joueur
        ctx.save();
        ctx.globalAlpha = player.invincibleTimer > 0 && frameCount % 10 < 5 ? 0.5 : 1;
        ctx.fillStyle = '#2d5016';
        ctx.fillRect(player.x, player.y, player.w, player.h);
        ctx.fillStyle = '#FFF';
        ctx.font = '18px Arial';
        ctx.fillText(player.facingRight ? '🧑' : '🧑', player.x + 2, player.y + 20);
        ctx.restore();
        
        // Boss
        if (levelData.isBoss) {
            const boss = levelData.boss;
            ctx.fillStyle = boss.shield ? '#FFD700' : '#8B0000';
            ctx.fillRect(boss.x, boss.y, boss.w, boss.h);
            ctx.fillStyle = '#000';
            ctx.font = 'bold 20px Arial';
            ctx.fillText('🌹', boss.x + 30, boss.y + 60);
            
            // Barre de vie du boss
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(boss.x - 20, boss.y - 20, Math.max(0, (boss.hp / boss.maxHp) * boss.w + 40), 10);
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 2;
            ctx.strokeRect(boss.x - 20, boss.y - 20, boss.w + 40, 10);
            
            // Projectiles boss
            boss.projectiles.forEach((proj, i) => {
                proj.x += proj.vx;
                proj.y += proj.vy || 0;
                ctx.fillStyle = '#00AA00';
                ctx.fillRect(proj.x, proj.y, 12, 12);
            });
        }
        
        // Particules
        particles.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.life--;
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, 4, 4);
        });
        particles = particles.filter(p => p.life > 0);
        ctx.globalAlpha = 1;
        
        ctx.restore();
        
        // UI (barre de vie)
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(20, 20, player.hp * 20, 20);
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 20, player.maxHp * 20, 20);
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(`HP: ${player.hp}/${player.maxHp}`, 25, 35);
        
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
