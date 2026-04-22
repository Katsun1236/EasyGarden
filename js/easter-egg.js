// Injection de l'interface du jeu dans le body
const gameHTML = `
<div id="easter-egg-game-container" class="fixed inset-0 bg-stone-950 z-[100] hidden flex-col items-center justify-center p-0 md:p-4 font-sans select-none touch-none">
    <button id="close-game-btn" class="absolute top-4 right-4 md:top-6 md:right-6 text-white text-3xl focus:outline-none hover:text-botanic transition-colors z-[101]" aria-label="Fermer le jeu"><i class="fa-solid fa-times"></i></button>
    
    <div class="text-center mb-1 md:mb-4">
        <h2 class="font-serif text-2xl md:text-5xl text-white mb-1 md:mb-2" style="text-shadow: 0 0 15px rgba(114,138,100,0.8);"><span class="text-botanic-light">Super</span> Jardinier !</h2>
        <p class="text-stone-400 text-[10px] md:text-sm tracking-widest hidden md:block">FLÈCHES/ZQSD: Bouger | ESPACE: Sauter (Double Saut !) | MAJ: Dash | E: Interagir</p>
    </div>

    <div class="relative bg-stone-900 p-1 md:p-2 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-stone-700 overflow-hidden w-full max-w-4xl max-h-[85vh] md:max-h-none flex flex-col">
        
        <!-- UI Superposée -->
        <div class="absolute top-4 left-6 text-white font-bold tracking-widest z-10 drop-shadow-md text-sm md:text-base" id="game-ui-score">TÂCHES: <span id="game-score" class="text-botanic-light text-xl">0/0</span></div>
        <div class="absolute top-4 right-6 text-white font-bold tracking-widest z-10 text-right drop-shadow-md text-sm md:text-base" id="game-ui-level">NIVEAU 1</div>
        <div class="absolute top-10 left-6 text-yellow-300 font-bold tracking-widest z-10 drop-shadow-md text-xs md:text-sm" id="game-ui-powerup"></div>
        
        <!-- Boss HP Bar -->
        <div id="boss-hp-container" class="absolute top-16 left-1/2 transform -translate-x-1/2 w-3/4 max-w-lg hidden z-10 opacity-0 transition-opacity duration-500">
            <div class="text-white text-center font-serif text-lg md:text-xl mb-1 tracking-widest" id="boss-name" style="text-shadow: 2px 2px 0 #000;">BOSS</div>
            <div class="w-full h-4 bg-stone-800 border-2 border-stone-400 rounded-sm overflow-hidden">
                <div id="boss-hp-fill" class="h-full bg-red-600 transition-all duration-300 ease-out" style="width: 100%;"></div>
            </div>
        </div>

        <!-- Ecrans de fin -->
        <div id="game-over-screen" class="absolute inset-0 bg-stone-900/90 backdrop-blur-md flex flex-col items-center justify-center hidden rounded-lg z-30 transition-all">
            <h3 id="game-end-title" class="font-serif text-3xl md:text-5xl text-white mb-4 drop-shadow-lg text-center px-4">Chantier terminé !</h3>
            <p id="game-end-text" class="text-stone-300 mb-8 text-base md:text-xl text-center max-w-md font-light px-4">Le jardin est parfait.</p>
            <button id="restart-game-btn" class="glow-btn px-6 py-3 md:px-8 md:py-4 bg-botanic text-white uppercase tracking-widest text-sm font-bold hover:bg-botanic-dark transition-all rounded-full shadow-[0_0_20px_rgba(114,138,100,0.5)]">Rejouer</button>
        </div>

        <!-- Canvas -->
        <canvas id="gameCanvas" width="900" height="500" class="w-full h-auto max-h-[60vh] md:max-h-none bg-[#87CEEB] rounded-lg shadow-inner block" style="image-rendering: auto;"></canvas>

        <!-- Contrôles Tactiles (Mobiles uniquement) -->
        <div id="touch-controls" class="absolute bottom-4 left-0 right-0 flex justify-between px-6 z-20 md:hidden opacity-80">
            <div class="flex gap-2">
                <button id="btn-left" class="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-white text-2xl backdrop-blur-sm active:bg-white/40">◄</button>
                <button id="btn-right" class="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-white text-2xl backdrop-blur-sm active:bg-white/40">►</button>
            </div>
            <div class="flex gap-2">
                <button id="btn-dash" class="w-12 h-12 bg-blue-500/40 rounded-full flex items-center justify-center text-white font-bold backdrop-blur-sm active:bg-blue-500/70 hidden">D</button>
                <button id="btn-interact" class="w-12 h-12 bg-yellow-400/30 rounded-full flex items-center justify-center text-white font-bold backdrop-blur-sm active:bg-yellow-400/60">E</button>
                <button id="btn-jump" class="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-white text-2xl backdrop-blur-sm active:bg-white/40">▲</button>
            </div>
        </div>
    </div>
</div>
`;

if (!document.getElementById('easter-egg-game-container')) {
    document.body.insertAdjacentHTML('beforeend', gameHTML);
}

document.addEventListener('DOMContentLoaded', () => {
    const leaf = document.getElementById('easter-egg-leaf');
    if(!leaf) { console.warn("Bouton easter-egg introuvable."); }

    let clickCount = 0;
    let clickTimeout;

    if(leaf) {
        leaf.addEventListener('click', () => {
            clickCount++;
            clearTimeout(clickTimeout);
            if (clickCount >= 7) {
                clickCount = 0;
                initAudio();
                startGameUI();
            } else {
                clickTimeout = setTimeout(() => { clickCount = 0; }, 1500);
            }
        });
    }

    // --- AUDIO PROCÉDURAL ---
    let audioCtx;
    function initAudio() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
    }

    function playSound(type) {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        const now = audioCtx.currentTime;

        if (type === 'jump') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(300, now); osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
            gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now); osc.stop(now + 0.1);
        } else if (type === 'bounce') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
            gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now); osc.stop(now + 0.3);
        } else if (type === 'dash') {
            osc.type = 'triangle'; osc.frequency.setValueAtTime(400, now); osc.frequency.linearRampToValueAtTime(100, now + 0.2);
            gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now); osc.stop(now + 0.2);
        } else if (type === 'hit') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
            gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now); osc.stop(now + 0.15);
        } else if (type === 'water') {
            osc.type = 'square'; osc.frequency.setValueAtTime(100, now); osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
            gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now); osc.stop(now + 0.3);
        } else if (type === 'coin') {
            osc.type = 'square'; osc.frequency.setValueAtTime(800, now); osc.frequency.setValueAtTime(1200, now + 0.05);
            gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now); osc.stop(now + 0.2);
        } else if (type === 'boss_hit') {
            osc.type = 'square'; osc.frequency.setValueAtTime(80, now); osc.frequency.exponentialRampToValueAtTime(20, now + 0.3);
            gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now); osc.stop(now + 0.3);
        } else if (type === 'portal') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.5);
            gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            osc.start(now); osc.stop(now + 0.5);
        }
    }

    const gameContainer = document.getElementById('easter-egg-game-container');
    const closeBtn = document.getElementById('close-game-btn');
    const restartBtn = document.getElementById('restart-game-btn');
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const powerupUI = document.getElementById('game-ui-powerup');
    let scoreElement = document.getElementById('game-score');
    const gameOverScreen = document.getElementById('game-over-screen');
    const bossHpContainer = document.getElementById('boss-hp-container');
    const bossHpFill = document.getElementById('boss-hp-fill');
    const bossNameTxt = document.getElementById('boss-name');

    // --- GAME ENGINE ---
    const keys = { left: false, right: false, jump: false, interact: false, dash: false };
    const inputs = { jumpJustPressed: false, interactJustPressed: false, dashJustPressed: false };
    
    let gameActive = false;
    let reqAnimFrame;
    let currentLevelIdx = 0;
    
    // Caméra & États
    let cameraX = 0, cameraY = 0; 
    let globalTicks = 0; 
    let screenShake = 0;
    let gameState = 'playing'; 
    let transitionRadius = 0;
    
    // Fixed Time Step
    let lastTime = 0;
    let accumulator = 0;
    const timeStep = 1000 / 60; 
    
    // Physique
    const gravity = 0.6;
    const friction = 0.8;
    const terminalVelocity = 14;

    const player = {
        x: 50, y: 200, width: 24, height: 32,
        vx: 0, vy: 0, speed: 5.5, jumpPower: -11.5,
        grounded: false, facingRight: true,
        squash: 1, stretch: 1, hp: 5, maxHp: 5, invincibleTimer: 0,
        spawnX: 50, spawnY: 200,
        
        jumps: 0, maxJumps: 2, // Double saut ajouté
        coyoteTimer: 0, jumpBufferTimer: 0,
        touchingWallDir: 0, wallSliding: false,
        
        hasWallJump: false,
        hasDash: false, canDash: true, isDashing: false, dashTimer: 0, dashDir: 1
    };

    let entities = { particles: [], texts: [], enemies: [], items: [], npcs: [], crates: [], spikes: [], weather: [], projectiles: [], water: [] };
    let levelTasks = 0, completedTasks = 0;
    let levelData = {};
    let activeDialog = null, nearNPC = null;

    // --- NOUVELLES ARCHITECTURES DE NIVEAUX ---
    const levels = [
        {   
            name: "Les Plaines d'Entraînement", time: "morning", width: 4200, height: 1000,
            goal: { x: 3950, y: 720, w: 60, h: 80 }, // Ajustement Goal pour le portail
            checkpoints: [{ x: 1800, y: 740, w: 20, h: 60, active: false }],
            platforms: [
                { x: 0, y: 800, w: 1200, h: 200 }, 
                { x: 1200, y: 700, w: 100, h: 300 }, 
                { x: 1300, y: 800, w: 800, h: 200 }, 
                { x: 1500, y: 650, w: 100, h: 20 }, 
                { x: 1700, y: 500, w: 100, h: 20 }, 
                { x: 2100, y: 800, w: 300, h: 200 }, 
                { x: 2100, y: 600, w: 300, h: 400, type: 'secret' }, 
                { x: 2400, y: 800, w: 1800, h: 200 }, 
            ],
            crates: [ { x: 800, y: 750, w: 40, h: 40, vx: 0, vy: 0 } ],
            spikes: [ { x: 1350, y: 780, w: 100, h: 20, dir: 'up' } ],
            water: [],
            tasks: [
                { x: 400, y: 780, w: 80, h: 20, type: 'grass', done: false, name: 'Tonte' },
                { x: 1600, y: 755, w: 50, h: 45, type: 'hedge', done: false, name: 'Taille' },
                { x: 1850, y: 500 - 120, w: 40, h: 20, type: 'branch', done: false, trunkX: 1880, trunkY: 500, name: 'Élagage' },
            ],
            npcs: [
                { x: 200, y: 764, w: 20, h: 36, color: '#f87171', name: "Mme. Rose", dialogs: ["Bienvenue ! J'ai activé tes bottes à double saut.", "Utilise ZQSD/Flèches et appuie deux fois sur Espace pour sauter haut !"] },
                { x: 2250, y: 764, w: 20, h: 36, color: '#4ade80', name: "Jardinier Caché", dialogs: ["Bien joué pour avoir trouvé ce mur secret !", "Prends ce soin, le boss est devant !"] }
            ],
            enemies: [
                { x: 900, y: 776, w: 24, h: 24, type: 'snail', vx: 1, minX: 850, maxX: 1100, dead: false },
                { x: 1500, y: 626, w: 24, h: 24, type: 'snail', vx: 1, minX: 1450, maxX: 1580, dead: false }
            ],
            boss: {
                x: 3200, y: 650, w: 120, h: 150, hp: 6, maxHp: 6, type: 'scarecrow', state: 'idle', timer: 0, dead: false,
                name: "ÉPOUVANTAIL FOU", reward: "walljump", arenaMin: 2600, arenaMax: 3800
            },
            items: [ { x: 2250, y: 720, w: 20, h: 20, type: 'hp', collected: false } ]
        },
        {   
            name: "Le Lac Suspendu", time: "midday", width: 3400, height: 2000,
            goal: { x: 3100, y: 420, w: 60, h: 80 },
            checkpoints: [ { x: 1000, y: 1140, w: 20, h: 60, active: false }, { x: 2000, y: 740, w: 20, h: 60, active: false } ],
            platforms: [
                { x: 0, y: 1800, w: 600, h: 200 }, 
                { x: 800, y: 1200, w: 50, h: 800 }, 
                { x: 1100, y: 1000, w: 50, h: 1000 }, 
                { x: 1150, y: 1200, w: 300, h: 200 }, 
                
                { x: 1550, y: 1150, w: 80, h: 20, type: 'bouncy' },
                { x: 1800, y: 900, w: 80, h: 20, type: 'bouncy' },
                
                { x: 1950, y: 800, w: 400, h: 200 }, 
                
                { x: 2350, y: 800, w: 100, h: 20, type: 'moving', vx: 2, minX: 2350, maxX: 2650 }, 
                { x: 2800, y: 800, w: 600, h: 200 }, 
                { x: 2800, y: 600, w: 50, h: 200 }, 
                { x: 3100, y: 500, w: 300, h: 20 }, 
            ],
            water: [
                { x: 2350, y: 820, w: 450, h: 150 } 
            ],
            crates: [], spikes: [],
            tasks: [
                { x: 1200, y: 1155, w: 50, h: 45, type: 'hedge', done: false, name: 'Taille' },
                { x: 2000, y: 780, w: 80, h: 20, type: 'grass', done: false, name: 'Tonte' },
            ],
            npcs: [
                { x: 100, y: 1764, w: 20, h: 36, color: '#60a5fa', name: "M. Tulipe", dialogs: ["Fais attention à l'eau, elle est profonde !", "Mais tes Crampons d'Élagage vont t'aider.", "Et utilise les champignons rouges pour bondir !"] }
            ],
            enemies: [
                { x: 600, y: 1776, w: 24, h: 24, type: 'frog', vx: 2, vy: 0, baseY: 1776, minX: 400, maxX: 700, dead: false },
                { x: 2500, y: 700, w: 24, h: 24, type: 'bee', vx: 2, baseY: 700, minX: 2400, maxX: 2700, dead: false }
            ],
            boss: {
                x: 2900, y: 350, w: 150, h: 150, hp: 8, maxHp: 8, type: 'toad', state: 'idle', timer: 0, dead: false,
                name: "CRAPAUD-BUFFLE", reward: "dash", arenaMin: 2800, arenaMax: 3400 
            },
            items: [ { x: 1830, y: 750, w: 20, h: 20, type: 'hp', collected: false } ]
        },
        {   
            name: "L'Antre de la Ronce", time: "night", width: 4000, height: 1000,
            goal: { x: -1000, y: 0, w: 1, h: 1 }, 
            isBoss: true,
            checkpoints: [],
            platforms: [
                { x: 0, y: 800, w: 800, h: 200 },
                { x: 1000, y: 800, w: 100, h: 20, type: 'fragile', timer: 0, state: 'idle' },
                { x: 1300, y: 800, w: 100, h: 20, type: 'bouncy' }, 
                { x: 1600, y: 800, w: 2400, h: 200 }, 
            ],
            spikes: [{ x: 800, y: 980, w: 800, h: 20, dir: 'up' }], 
            water: [],
            crates: [], tasks: [], npcs: [], enemies: [], items: [],
            boss: {
                x: 2500, y: 650, w: 150, h: 150, hp: 15, maxHp: 15, type: 'bramble', state: 'intro', timer: 0, dead: false,
                name: "RONCE MUTANTE", phase: 1, invincible: false, arenaMin: 1700, arenaMax: 3800
            }
        }
    ];

    function startGameUI() {
        gameContainer.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        player.hasWallJump = false; player.hasDash = false;
        document.getElementById('btn-dash').classList.add('hidden');
        powerupUI.innerText = "";
        loadLevel(0);
        lastTime = performance.now();
        reqAnimFrame = requestAnimationFrame(loop);
    }

    function closeGameUI() {
        gameContainer.classList.add('hidden');
        document.body.style.overflow = '';
        gameActive = false;
        cancelAnimationFrame(reqAnimFrame);
    }

    closeBtn.addEventListener('click', closeGameUI);
    restartBtn.addEventListener('click', () => loadLevel(levelData.isBoss ? currentLevelIdx : 0));

    function loadLevel(idx) {
        currentLevelIdx = idx;
        levelData = JSON.parse(JSON.stringify(levels[idx])); 
        
        player.x = player.spawnX = 100; 
        player.y = player.spawnY = levelData.platforms[0].y - 50;
        player.vx = 0; player.vy = 0; player.facingRight = true;
        player.hp = player.maxHp; player.invincibleTimer = 0;
        player.isDashing = false; player.canDash = true;
        player.jumps = 0;
        
        entities = {
            particles: [], texts: [], projectiles: [], weather: [],
            enemies: levelData.enemies || [],
            items: levelData.items || [],
            npcs: levelData.npcs || [],
            crates: levelData.crates || [],
            spikes: levelData.spikes || [],
            water: levelData.water || []
        };
        
        completedTasks = 0; levelTasks = levelData.tasks ? levelData.tasks.length : 0;
        activeDialog = null; nearNPC = null;
        
        // Météo
        for(let i=0; i<60; i++) {
            entities.weather.push({
                x: Math.random() * levelData.width, y: Math.random() * levelData.height,
                s: Math.random() * 2 + 1, a: Math.random() * Math.PI * 2
            });
        }
        
        document.getElementById('game-ui-level').innerText = "NIVEAU " + (idx + 1) + " - " + levelData.name;
        document.getElementById('game-ui-score').innerHTML = levelData.isBoss ? "PURIFIE LA ZONE" : `TÂCHES: <span id="game-score" class="text-botanic-light text-xl">0/${levelTasks}</span>`;
        if(!levelData.isBoss) scoreElement = document.getElementById('game-score');
        
        gameOverScreen.classList.add('hidden');
        bossHpContainer.classList.add('opacity-0'); setTimeout(() => bossHpContainer.classList.add('hidden'), 500);
        
        cameraX = player.x - canvas.width/2; cameraY = player.y - canvas.height/2;
        
        gameState = 'transition_in';
        transitionRadius = 0;
        gameActive = true;
    }

    // --- GAME LOOP & FIXED TIME STEP ---
    function loop(timestamp) {
        if (!gameActive) return;
        
        let dt = timestamp - lastTime;
        lastTime = timestamp;
        if (dt > 100) dt = 100; 
        
        accumulator += dt;
        while (accumulator >= timeStep) {
            fixedUpdate();
            accumulator -= timeStep;
        }
        draw();
        reqAnimFrame = requestAnimationFrame(loop);
    }

    // --- UTILS ---
    function spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            entities.particles.push({
                x: x + Math.random() * 20 - 10, y: y + Math.random() * 20 - 10,
                vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 1) * 8,
                life: 1.0, size: Math.random() * 6 + 3, color: color
            });
        }
    }
    function spawnText(x, y, text, color = '#fff', size = '18px') {
        entities.texts.push({ x: x, y: y, text: text, life: 1.0, color: color, size: size });
    }
    function checkCollision(r1, r2) {
        let w1 = r1.w || r1.width; let h1 = r1.h || r1.height;
        let w2 = r2.w || r2.width; let h2 = r2.h || r2.height;
        return r1.x < r2.x + w2 && r1.x + w1 > r2.x && r1.y < r2.y + h2 && r1.y + h1 > r2.y;
    }
    function activateBossUI(boss) {
        bossHpContainer.classList.remove('hidden');
        bossNameTxt.innerText = boss.name;
        setTimeout(() => bossHpContainer.classList.remove('opacity-0'), 50);
        updateBossUI(boss);
    }
    function updateBossUI(boss) {
        let pct = Math.max(0, (boss.hp / boss.maxHp) * 100);
        bossHpFill.style.width = pct + '%';
        if(pct <= 0) {
            bossHpContainer.classList.add('opacity-0');
            setTimeout(() => bossHpContainer.classList.add('hidden'), 500);
        }
    }
    function handleDamage(amount, sourceX) {
        if (player.invincibleTimer > 0) return;
        player.hp -= amount;
        playSound('hit'); screenShake = 15;
        player.invincibleTimer = 60;
        player.vx = (player.x < sourceX) ? -10 : 10; player.vy = -6;
        player.isDashing = false;
        spawnParticles(player.x, player.y, '#ef4444', 20);
        
        if (player.hp <= 0) {
            gameActive = false;
            document.getElementById('game-end-title').innerText = "Game Over";
            document.getElementById('game-end-text').innerText = "Le jardin a repris ses droits.";
            restartBtn.innerText = "Réessayer";
            restartBtn.onclick = () => loadLevel(currentLevelIdx);
            gameOverScreen.classList.remove('hidden');
        } else {
            spawnText(player.x, player.y - 20, "-1 PV", '#ef4444', '24px');
        }
    }

    // --- MISE A JOUR PHYSIQUE (60x / sec) ---
    function fixedUpdate() {
        globalTicks++;

        if (gameState === 'transition_in') {
            transitionRadius += 25;
            if (transitionRadius > Math.max(canvas.width, canvas.height) * 1.5) gameState = 'playing';
            return; 
        }
        if (gameState === 'transition_out') {
            transitionRadius -= 25;
            if (transitionRadius <= 0) loadLevel(currentLevelIdx + 1);
            return;
        }

        if (player.coyoteTimer > 0) player.coyoteTimer--;
        if (player.jumpBufferTimer > 0) player.jumpBufferTimer--;
        if (player.invincibleTimer > 0) player.invincibleTimer--;
        player.squash += (1 - player.squash) * 0.2;
        player.stretch += (1 - player.stretch) * 0.2;

        nearNPC = null;
        for (let npc of entities.npcs) {
            if (Math.abs((player.x + player.width/2) - (npc.x + npc.w/2)) < 80 && Math.abs(player.y - npc.y) < 60) nearNPC = npc;
        }
        if (nearNPC) {
            if (!activeDialog || activeDialog.npc !== nearNPC) activeDialog = { npc: nearNPC, line: 0, showPrompt: true };
            if (inputs.interactJustPressed) {
                if(activeDialog.showPrompt) activeDialog.showPrompt = false;
                else {
                    activeDialog.line++;
                    if (activeDialog.line >= nearNPC.dialogs.length) activeDialog = null;
                }
            }
        } else activeDialog = null;

        // DASH
        if (inputs.dashJustPressed && player.hasDash && player.canDash && !player.isDashing) {
            player.isDashing = true;
            player.dashTimer = 12; 
            player.canDash = false;
            player.dashDir = player.facingRight ? 1 : -1;
            player.vy = 0;
            playSound('dash');
            spawnParticles(player.x, player.y+10, '#3b82f6', 15);
        }
        inputs.dashJustPressed = false;

        // MOUVEMENT H
        let targetVx = 0;
        if (!player.isDashing) {
            if (keys.left) { targetVx = -player.speed; player.facingRight = false; }
            if (keys.right) { targetVx = player.speed; player.facingRight = true; }
            player.vx += (targetVx - player.vx) * (player.grounded ? 0.2 : 0.1); 
        } else {
            player.vx = player.dashDir * 14;
            player.dashTimer--;
            player.vy = 0; 
            if (globalTicks % 3 === 0) spawnParticles(player.x, player.y+16, '#93c5fd', 2); 
            if (player.dashTimer <= 0) player.isDashing = false;
        }

        // Plateformes mouvantes & fragiles
        let platformDeltaX = 0;
        for (let p of levelData.platforms) {
            if (p.type === 'moving') {
                p.x += p.vx;
                if (p.x > p.maxX || p.x < p.minX) p.vx *= -1;
                if (player.grounded && checkCollision({x:player.x, y:player.y+2, w:player.width, h:player.height}, p)) {
                    platformDeltaX = p.vx;
                }
            }
            if (p.type === 'fragile' && p.state === 'falling') p.y += 8;
        }
        player.x += platformDeltaX;

        // COLLISIONS X
        player.x += player.vx;
        if (player.x < 0) { player.x = 0; player.vx = 0; }
        if (player.x + player.width > levelData.width) { player.x = levelData.width - player.width; player.vx = 0; }
        
        player.touchingWallDir = 0;
        let obstacles = [...levelData.platforms.filter(p=>p.type !== 'secret'), ...entities.crates];
        
        for (let o of obstacles) {
            if (checkCollision(player, o)) {
                if(o.type === 'bouncy') continue;

                if (player.vx > 0) { player.x = o.x - player.width; player.vx = 0; player.touchingWallDir = 1; if(o.vx !== undefined && player.grounded) o.vx = 2; } 
                else if (player.vx < 0) { player.x = o.x + (o.w || o.width); player.vx = 0; player.touchingWallDir = -1; if(o.vx !== undefined && player.grounded) o.vx = -2; }
                if (player.isDashing) player.isDashing = false; 
            }
        }

        // SAUTS & WALL SLIDE & DOUBLE SAUT
        if (inputs.jumpJustPressed) player.jumpBufferTimer = 8;
        inputs.jumpJustPressed = false;
        player.wallSliding = false;

        if (player.hasWallJump && !player.grounded && player.vy > 0 && player.touchingWallDir !== 0 && !player.isDashing) {
            if ((player.touchingWallDir === 1 && keys.right) || (player.touchingWallDir === -1 && keys.left)) {
                player.wallSliding = true; player.vy = 2; player.canDash = true; player.jumps = 1; 
                if (globalTicks % 5 === 0) spawnParticles(player.x + (player.touchingWallDir===1?player.width:0), player.y + 10, '#d4d4d8', 2);
            }
        }

        if (player.jumpBufferTimer > 0) {
            if (player.coyoteTimer > 0) {
                // Saut normal
                playSound('jump'); player.vy = player.jumpPower; player.coyoteTimer = 0; player.jumpBufferTimer = 0;
                player.jumps = 1;
                player.squash = 0.6; player.stretch = 1.4; spawnParticles(player.x + 12, player.y + 32, '#d4d4d8', 8);
            } 
            else if (player.wallSliding || (player.hasWallJump && player.touchingWallDir !== 0 && !player.grounded)) {
                // Wall jump
                playSound('jump'); player.vy = player.jumpPower * 0.9; player.vx = player.touchingWallDir * -9; 
                player.facingRight = (player.touchingWallDir === -1);
                player.coyoteTimer = 0; player.jumpBufferTimer = 0; player.jumps = 1;
                player.squash = 0.7; player.stretch = 1.3; spawnParticles(player.x + (player.touchingWallDir===1?player.width:0), player.y + 16, '#d4d4d8', 12);
            }
            else if (player.jumps > 0 && player.jumps < player.maxJumps && !player.wallSliding) {
                // Double saut
                playSound('jump'); player.vy = player.jumpPower * 0.8; player.jumpBufferTimer = 0;
                player.jumps++;
                player.squash = 0.7; player.stretch = 1.3; 
                spawnParticles(player.x + 12, player.y + 32, '#818cf8', 15); // Particules bleues
            }
        }

        // COLLISIONS Y
        if (!player.isDashing && !player.wallSliding) player.vy += gravity;
        if (player.vy > terminalVelocity) player.vy = terminalVelocity;
        
        player.y += player.vy;
        const wasGrounded = player.grounded;
        player.grounded = false;

        for (let o of obstacles) {
            if (checkCollision(player, o)) {
                if (player.vy > 0) {
                    player.y = o.y - player.height; player.vy = 0; player.grounded = true;
                    player.coyoteTimer = 10; player.canDash = true; player.jumps = 0; // Reset jumps
                    
                    if(o.type === 'fragile' && o.state === 'idle') o.state = 'shaking';
                    
                    if(o.type === 'bouncy') {
                        player.vy = -18; player.grounded = false; player.coyoteTimer = 0; player.jumps = 1;
                        player.squash = 0.5; player.stretch = 1.5;
                        spawnParticles(player.x + 12, player.y + 32, '#ef4444', 15);
                        playSound('bounce');
                    }

                } else if (player.vy < 0 && o.type !== 'bouncy') {
                    player.y = o.y + (o.h || o.height); player.vy = 0;
                }
            }
        }
        
        for (let p of levelData.platforms) {
            if(p.type === 'fragile' && p.state === 'shaking') { p.timer++; if(p.timer > 30) p.state = 'falling'; }
        }

        if (wasGrounded && !player.grounded && player.vy >= 0) player.coyoteTimer = 8;
        if (!wasGrounded && player.grounded) { player.squash = 1.4; player.stretch = 0.6; spawnParticles(player.x + 12, player.y + 32, '#a8a29e', 6); }

        for (let p of levelData.platforms) { if (p.type === 'secret') p.opacity = checkCollision(player, p) ? 0.3 : 1; }

        for (let c of entities.crates) {
            c.vy += gravity; c.vx *= 0.8; c.x += c.vx;
            for (let p of obstacles) {
                if (p !== c && checkCollision(c, p) && c.vy > 0) { c.y = p.y - c.h; c.vy = 0; }
            }
        }

        // --- DANGERS & VIDE ---
        for (let s of entities.spikes) {
            if (checkCollision(player, {x: s.x+2, y: s.y+10, w: s.w-4, h: s.h-10}) && !player.isDashing) {
                handleDamage(1, s.x + s.w/2); player.vy = -12; 
            }
        }

        for (let w of entities.water) {
            if (player.y + player.height > w.y + 20 && player.x + player.width > w.x && player.x < w.x + w.w) {
                playSound('water');
                handleDamage(1, player.x);
                player.vy = -14; 
                spawnParticles(player.x+12, w.y+10, '#3b82f6', 30);
                spawnText(player.x, player.y - 40, "PLOUF !", '#3b82f6');
            }
        }

        if (player.y > levelData.height + 200) {
            handleDamage(1, player.x);
            if (player.hp > 0) { player.x = player.spawnX; player.y = player.spawnY; player.vx = 0; player.vy = 0; cameraX = player.x-canvas.width/2; }
        }

        // CAMERA FLUIDE
        let targetCamX = player.x - canvas.width / 2 + player.width / 2;
        let targetCamY = player.y - canvas.height / 2 + 50;
        
        if (levelData.boss && levelData.boss.hp > 0 && player.x > levelData.boss.arenaMin) {
            targetCamX = levelData.boss.arenaMin + (levelData.boss.arenaMax - levelData.boss.arenaMin)/2 - canvas.width/2;
            if(!bossHpContainer.classList.contains('opacity-0') === false) activateBossUI(levelData.boss);
        }
        
        if (targetCamX < 0) targetCamX = 0; if (targetCamX > levelData.width - canvas.width) targetCamX = levelData.width - canvas.width;
        if (targetCamY < 0) targetCamY = 0; if (targetCamY > levelData.height - canvas.height) targetCamY = levelData.height - canvas.height;
        
        cameraX += (targetCamX - cameraX) * 0.1; cameraY += (targetCamY - cameraY) * 0.1;
        if (screenShake > 0) { cameraX += (Math.random()-0.5)*screenShake; cameraY += (Math.random()-0.5)*screenShake; screenShake *= 0.9; }

        // ITEMS & CHECKPOINTS
        for (let c of (levelData.checkpoints || [])) {
            if (!c.active && checkCollision(player, c)) {
                c.active = true; player.spawnX = c.x; player.spawnY = c.y - 20; playSound('coin');
                spawnParticles(c.x + 10, c.y, '#fde047', 30); spawnText(c.x, c.y - 30, "SAUVEGARDÉ !", '#fde047', '22px');
            }
        }
        for (let i = entities.items.length - 1; i >= 0; i--) {
            let item = entities.items[i]; item.y += Math.sin(globalTicks * 0.1) * 0.5;
            if (!item.collected && checkCollision(player, item)) {
                item.collected = true; playSound('coin');
                if (player.hp < player.maxHp) player.hp++;
                spawnParticles(item.x + 10, item.y + 10, '#ef4444', 25);
                entities.items.splice(i, 1);
            }
        }
        for (let t of levelData.tasks) {
            if (!t.done && checkCollision(player, t)) {
                t.done = true; completedTasks++; playSound('coin');
                if (scoreElement) scoreElement.innerText = `${completedTasks}/${levelTasks}`;
                spawnParticles(t.x + t.w/2, t.y + t.h/2, '#22c55e', 40);
                spawnText(t.x + t.w/2, t.y - 20, t.name, '#4ade80', '22px');
            }
        }

        // ENNEMIS DE BASE
        for (let e of entities.enemies) {
            if (e.dead) continue;
            if (e.type === 'snail') { e.x += e.vx; if (e.x < e.minX || e.x + e.w > e.maxX) e.vx *= -1; } 
            else if (e.type === 'frog') {
                e.x += e.vx; e.vy += gravity; e.y += e.vy;
                if (e.y >= e.baseY) { e.y = e.baseY; e.vy = 0; if (Math.random() < 0.02) e.vy = -14; } 
                if (e.x < e.minX || e.x + e.w > e.maxX) e.vx *= -1;
            } 
            else if (e.type === 'bee') {
                e.x += e.vx;
                e.y = e.baseY + Math.sin(globalTicks * 0.05 + e.x * 0.01) * 40; 
                if (e.x < e.minX || e.x + e.w > e.maxX) e.vx *= -1;
            }

            if (checkCollision(player, e) && player.invincibleTimer === 0 && !player.isDashing) {
                if (player.vy > 0 && player.y + player.height < e.y + e.h/2 + 10) { 
                    e.dead = true; player.vy = -10; playSound('hit'); spawnParticles(e.x+e.w/2, e.y+e.h/2, '#fde047', 25);
                } else handleDamage(1, e.x + e.w/2);
            }
        }

        // BOSS LOGIC AMÉLIORÉE (PATTERNS)
        if (levelData.boss && !levelData.boss.dead && player.x > levelData.boss.arenaMin - 200) {
            let b = levelData.boss;
            b.timer++;
            
            if (b.type === 'scarecrow') {
                b.x += b.vx || 0;
                if (b.state === 'idle') {
                    if(b.timer > 60) { 
                        b.attackType = Math.random() > 0.5 ? 'throw' : 'dash';
                        b.state = b.attackType; b.timer = 0; 
                    }
                } else if (b.state === 'throw') {
                    // Pattern: Lancer multiple
                    if (b.timer === 20 || b.timer === 40 || b.timer === 60) { 
                        entities.projectiles.push({ x: b.x+b.w/2, y: b.y + 40, vx: (player.x > b.x ? 6 : -6), vy: (b.timer-40)*-0.1, size: 20, color: '#9ca3af', type: 'scythe', rot: 0 });
                        playSound('hit');
                    }
                    if (b.timer > 120) { b.state = 'idle'; b.timer = 0; b.vx = 0; }
                } else if (b.state === 'dash') {
                    // Pattern: Dash rapide
                    if (b.timer === 20) b.vx = (player.x > b.x ? 12 : -12);
                    if (b.timer > 60 || b.x < b.arenaMin || b.x + b.w > b.arenaMax) { b.state = 'idle'; b.timer = 0; b.vx = 0; }
                }
            }
            else if (b.type === 'toad') {
                if (b.state === 'idle') {
                    if(b.timer > 90) { 
                        b.attackType = Math.random() > 0.6 ? 'summon' : 'jump';
                        b.state = b.attackType; b.timer = 0; 
                    } 
                } else if (b.state === 'jump') {
                    if(b.timer === 1) { b.vy = -18; b.vx = (player.x - b.x) * 0.03; }
                    b.vy += gravity; b.x += b.vx; b.y += b.vy;
                    if (b.x < b.arenaMin) b.x = b.arenaMin; if (b.x + b.w > b.arenaMax) b.x = b.arenaMax - b.w;
                    if (b.y >= 500 - b.h) { 
                        b.y = 500 - b.h; b.vy = 0; b.vx = 0; b.state = 'idle'; b.timer = 0;
                        screenShake = 20; playSound('boss_hit');
                        entities.projectiles.push({ x: b.x+b.w/2, y: b.y+b.h-10, vx: 7, vy: 0, size: 15, color: '#4ade80', type: 'shockwave', life: 100 });
                        entities.projectiles.push({ x: b.x+b.w/2, y: b.y+b.h-10, vx: -7, vy: 0, size: 15, color: '#4ade80', type: 'shockwave', life: 100 });
                    }
                } else if (b.state === 'summon') {
                    // Pattern: Invocation
                    if (b.timer === 30) {
                        playSound('water');
                        entities.enemies.push({ x: b.x, y: b.y+b.h-24, w: 24, h: 24, type: 'frog', vx: -3, vy: -10, baseY: 500-24, minX: b.arenaMin, maxX: b.arenaMax, dead: false });
                        entities.enemies.push({ x: b.x+b.w, y: b.y+b.h-24, w: 24, h: 24, type: 'frog', vx: 3, vy: -10, baseY: 500-24, minX: b.arenaMin, maxX: b.arenaMax, dead: false });
                    }
                    if (b.timer > 80) { b.state = 'idle'; b.timer = 0; }
                }
            }
            else if (b.type === 'bramble') {
                b.x += b.vx || 0;
                if(b.state === 'intro') { if(b.timer > 60) { b.state = 'move'; b.vx = -4; } }
                else if (b.state === 'move') {
                    if (b.x < b.arenaMin || b.x + b.w > b.arenaMax) b.vx *= -1;
                    if (b.timer % 60 === 0) { // Pluie
                        entities.projectiles.push({ x: b.x + Math.random()*b.w, y: b.y, vx: (Math.random()-0.5)*4, vy: -10, size: 8, color: '#991b1b', type: 'thorn', grav: true, life: 200 });
                    }
                    if (b.timer % 180 === 0) {
                        b.state = 'roots'; b.timer = 0; b.vx = 0; b.rootTargetX = player.x + player.width/2;
                    }
                } else if (b.state === 'roots') {
                    // Pattern: Racines mortelles
                    if (b.timer < 40) {
                        if (globalTicks % 5 === 0) spawnParticles(b.rootTargetX, 800, '#b91c1c', 5);
                    } else if (b.timer === 40) {
                        playSound('boss_hit'); screenShake = 15;
                        entities.projectiles.push({ x: b.rootTargetX, y: 800, vx: 0, vy: -20, size: 30, color: '#b91c1c', type: 'root', grav: false, life: 50 });
                    }
                    if (b.timer > 90) { b.state = 'move'; b.vx = -4; b.timer = 0; }
                }
            }

            if (checkCollision(player, b) && player.invincibleTimer === 0 && !player.isDashing) {
                if (player.vy > 0 && player.y + player.height < b.y + 40) { 
                    b.hp--; player.vy = -16; screenShake = 25; playSound('boss_hit');
                    spawnParticles(b.x + b.w/2, b.y, '#fde047', 50);
                    updateBossUI(b);
                    if (b.hp <= 0) {
                        b.dead = true;
                        let deathInterval = setInterval(() => {
                            b.w -= 4; b.h -= 4; b.x += 2; b.y += 4;
                            spawnParticles(b.x+b.w/2, b.y+b.h/2, '#166534', 5);
                            if(b.w <= 0) {
                                clearInterval(deathInterval);
                                if(b.reward === 'walljump') { player.hasWallJump = true; powerupUI.innerText = "CRAMPONS D'ÉLAGAGE: Saute sur les murs !"; }
                                if(b.reward === 'dash') { player.hasDash = true; document.getElementById('btn-dash').classList.remove('hidden'); powerupUI.innerText = "SÉCATEUR-DASH: MAJ ou D pour foncer !"; }
                                if(b.type === 'bramble') {
                                    gameActive = false; document.getElementById('game-end-title').innerText = "VICTOIRE !";
                                    document.getElementById('game-end-text').innerText = "Tu as éradiqué la racine du mal.";
                                    restartBtn.innerText = "Terminer"; restartBtn.onclick = closeGameUI; gameOverScreen.classList.remove('hidden');
                                }
                            }
                        }, 30);
                    }
                } else handleDamage(1, b.x + b.w/2);
            }
        }

        // Projectiles
        for (let i = entities.projectiles.length - 1; i >= 0; i--) {
            let p = entities.projectiles[i];
            p.x += p.vx; p.y += p.vy;
            if(p.type === 'scythe') p.rot += 0.2;
            if(p.grav) p.vy += gravity;
            if(p.type === 'root') {
                if (p.y < 650) p.vy = 0; // S'arrête à cette hauteur
            }
            if(p.life !== undefined) {
                p.life--;
                if(p.life <= 0) { entities.projectiles.splice(i, 1); continue; }
            }

            if (checkCollision(player, {x: p.x-p.size, y: p.y-p.size, w: p.size*2, h: p.size*2}) && player.invincibleTimer === 0 && !player.isDashing) {
                handleDamage(1, p.x); entities.projectiles.splice(i, 1);
            } else if (p.y > levelData.height || p.x < 0 || p.x > levelData.width) entities.projectiles.splice(i, 1);
        }

        for (let i = entities.particles.length - 1; i >= 0; i--) {
            let p = entities.particles[i]; p.x += p.vx; p.y += p.vy; p.vy += gravity * 0.5; p.life -= 0.02;
            if (p.life <= 0) entities.particles.splice(i, 1);
        }
        for (let i = entities.texts.length - 1; i >= 0; i--) {
            let ft = entities.texts[i]; ft.y -= 1.0; ft.life -= 0.015;
            if (ft.life <= 0) entities.texts.splice(i, 1);
        }

        // Victoire (Téléporteur Portal)
        if (inputs.interactJustPressed) inputs.interactJustPressed = false; // consume E key if not used by dialog
        if (!levelData.isBoss && checkCollision(player, levelData.goal) && gameState === 'playing') {
            if (completedTasks >= levelTasks) {
                if (globalTicks % 10 === 0) spawnText(levelData.goal.x + levelData.goal.w/2, levelData.goal.y - 20, "'E' POUR ENTRER", '#4ade80', '12px');
                if (keys.interact) {
                    gameState = 'transition_out'; transitionRadius = Math.max(canvas.width, canvas.height) * 1.5; playSound('portal');
                }
            } else {
                if (globalTicks % 60 === 0) spawnText(player.x, player.y - 40, "Il reste des tâches !", '#ef4444');
            }
        }
    }

    // --- RENDU GRAPHIQUE ---
    function draw() {
        const time = levelData.time;
        
        let skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        if (time === 'morning') { skyGrad.addColorStop(0, '#0ea5e9'); skyGrad.addColorStop(1, '#e0f2fe'); }
        else if (time === 'midday') { skyGrad.addColorStop(0, '#0284c7'); skyGrad.addColorStop(1, '#bae6fd'); }
        else { skyGrad.addColorStop(0, '#0f172a'); skyGrad.addColorStop(1, '#312e81'); }
        ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, canvas.width, canvas.height);

        let sunX = 700 - (cameraX * 0.05); 
        ctx.fillStyle = time === 'night' ? '#f8fafc' : '#fef08a';
        ctx.beginPath(); ctx.arc(sunX, 100 + cameraY*0.1, 50, 0, Math.PI*2); ctx.fill();

        ctx.save();
        ctx.translate(-cameraX * 0.1, -cameraY * 0.05);
        ctx.fillStyle = time === 'night' ? '#1e1b4b' : '#7dd3fc';
        ctx.beginPath(); ctx.moveTo(-200, 1000); ctx.lineTo(400, 200); ctx.lineTo(1000, 1000); ctx.fill();
        ctx.beginPath(); ctx.moveTo(600, 1000); ctx.lineTo(1200, 300); ctx.lineTo(1800, 1000); ctx.fill();
        ctx.beginPath(); ctx.moveTo(1400, 1000); ctx.lineTo(2000, 250); ctx.lineTo(2600, 1000); ctx.fill();
        ctx.beginPath(); ctx.moveTo(2200, 1000); ctx.lineTo(3000, 150); ctx.lineTo(3800, 1000); ctx.fill();
        
        ctx.translate(cameraX * 0.1 - cameraX * 0.3, cameraY * 0.05 - cameraY * 0.15);
        ctx.fillStyle = time === 'night' ? '#172554' : '#38bdf8';
        for(let i=-500; i<levelData.width; i+=600) {
            ctx.beginPath(); ctx.arc(i+300, 800, 400, Math.PI, 0); ctx.fill();
        }
        
        ctx.translate(cameraX * 0.3 - cameraX * 0.5, cameraY * 0.15 - cameraY * 0.3);
        let treeColor = time === 'night' ? '#1e3a8a' : '#0369a1';
        for(let i=0; i<levelData.width; i+=250) {
            ctx.fillStyle = '#1e3a8a'; ctx.fillRect(i+90, 600, 20, 200); 
            ctx.fillStyle = treeColor; 
            ctx.beginPath(); ctx.arc(i+100, 580, 70, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(i+60, 620, 50, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(i+140, 620, 50, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();

        ctx.save();
        ctx.translate(-cameraX, -cameraY);

        for (let w of entities.water) {
            let waveGrad = ctx.createLinearGradient(0, w.y, 0, w.y+w.h);
            waveGrad.addColorStop(0, time === 'midday' ? '#0284c7' : '#1e3a8a');
            waveGrad.addColorStop(1, time === 'midday' ? '#1e3a8a' : '#1e1b4b');
            ctx.fillStyle = waveGrad;
            ctx.beginPath(); ctx.moveTo(w.x, w.y + w.h);
            for(let i=0; i<=w.w; i+=15) { ctx.lineTo(w.x + i, w.y + 8 + Math.sin(globalTicks*0.05 + i*0.1)*6); }
            ctx.lineTo(w.x + w.w, w.y + w.h); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2;
            ctx.beginPath();
            for(let i=0; i<=w.w; i+=15) { ctx.lineTo(w.x + i, w.y + 8 + Math.sin(globalTicks*0.05 + i*0.1)*6); }
            ctx.stroke();
        }

        // TÉLÉPORTEUR (Goal)
        if(!levelData.isBoss) {
            let g = levelData.goal;
            let isOpen = (completedTasks >= levelTasks);
            
            // Base du portail
            ctx.fillStyle = '#1e293b';
            ctx.beginPath(); ctx.ellipse(g.x + g.w/2, g.y + g.h/2 + 20, g.w/2 + 5, g.h/2 + 15, 0, 0, Math.PI*2); ctx.fill();
            
            // Lueur du portail
            ctx.fillStyle = isOpen ? '#22c55e' : '#475569';
            ctx.beginPath(); ctx.ellipse(g.x + g.w/2, g.y + g.h/2 + 20, g.w/2, g.h/2 + 10, 0, 0, Math.PI*2); ctx.fill();
            
            // Intérieur vide/actif
            ctx.fillStyle = isOpen ? '#bbf7d0' : '#0f172a';
            ctx.beginPath(); ctx.ellipse(g.x + g.w/2, g.y + g.h/2 + 20, g.w/2 - 10, g.h/2, 0, 0, Math.PI*2); ctx.fill();

            if (isOpen) {
                ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(g.x + g.w/2, g.y + g.h/2 + 20, 20 + Math.sin(globalTicks*0.1)*5, 0, Math.PI*2); ctx.stroke();
            }
        }

        for (let c of (levelData.checkpoints || [])) {
            ctx.fillStyle = '#78350f'; ctx.fillRect(c.x + 8, c.y, 4, c.h);
            ctx.fillStyle = c.active ? '#22c55e' : '#ef4444';
            ctx.beginPath(); ctx.moveTo(c.x + 12, c.y + 2); ctx.lineTo(c.x + 35, c.y + 12); ctx.lineTo(c.x + 12, c.y + 22); ctx.fill();
        }

        ctx.fillStyle = '#b91c1c';
        for (let s of entities.spikes) {
            for(let i=0; i<s.w; i+=10) {
                ctx.beginPath(); ctx.moveTo(s.x + i, s.y + s.h); ctx.lineTo(s.x + i + 5, s.y); ctx.lineTo(s.x + i + 10, s.y + s.h); ctx.fill();
            }
        }

        for (let p of levelData.platforms) {
            ctx.globalAlpha = p.opacity || 1;
            
            if (p.type === 'bouncy') {
                ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(p.x + p.w/2, p.y + p.h, p.w/2, Math.PI, 0); ctx.fill();
                ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x + p.w*0.3, p.y + p.h*0.5, 4, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(p.x + p.w*0.7, p.y + p.h*0.7, 5, 0, Math.PI*2); ctx.fill();
            } 
            else if (p.type === 'fragile') {
                ctx.fillStyle = '#d97706'; ctx.fillRect(p.x, p.y, p.w, p.h);
                ctx.fillStyle = '#fde047'; ctx.fillRect(p.x, p.y, p.w, 4);
                if(p.state === 'shaking') { ctx.fillStyle = 'rgba(239, 68, 68, 0.4)'; ctx.fillRect(p.x, p.y, p.w, p.h); }
            } else if (p.type === 'moving') {
                ctx.fillStyle = '#b45309'; ctx.fillRect(p.x, p.y, p.w, p.h);
                ctx.fillStyle = '#78350f'; ctx.fillRect(p.x, p.y+p.h-4, p.w, 4);
            } else {
                ctx.fillStyle = time === 'night' ? '#1e293b' : '#78350f'; ctx.fillRect(p.x, p.y + 12, p.w, p.h - 12);
                ctx.fillStyle = time === 'night' ? '#0f172a' : '#451a03';
                for(let i=0; i<p.w; i+=40) { if(i+10<p.w) ctx.fillRect(p.x + i, p.y + 25, 10, p.h-30); }
                ctx.fillStyle = time === 'night' ? '#064e3b' : '#22c55e'; ctx.fillRect(p.x, p.y, p.w, 15);
            }
            ctx.globalAlpha = 1;
        }

        ctx.fillStyle = '#b45309';
        for (let c of entities.crates) {
            ctx.fillRect(c.x, c.y, c.w, c.h);
            ctx.strokeStyle = '#78350f'; ctx.lineWidth = 3; ctx.strokeRect(c.x, c.y, c.w, c.h);
            ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x+c.w, c.y+c.h); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(c.x+c.w, c.y); ctx.lineTo(c.x, c.y+c.h); ctx.stroke();
        }

        for (let t of levelData.tasks) {
            if (t.type === 'grass') {
                ctx.fillStyle = t.done ? '#4ade80' : '#166534';
                let sway = Math.sin(globalTicks * 0.05 + t.x) * (t.done ? 1 : 5);
                let yOff = t.done ? t.h - 8 : 0;
                for(let i=0; i<t.w; i+=12) {
                    ctx.beginPath(); ctx.moveTo(t.x + i, t.y + t.h); ctx.lineTo(t.x + i + 6 + sway, t.y + yOff); ctx.lineTo(t.x + i + 12, t.y + t.h); ctx.fill();
                }
            } else if (t.type === 'hedge') {
                ctx.fillStyle = t.done ? '#15803d' : '#14532d';
                ctx.fillRect(t.x, t.y + 20, t.w, t.h - 20);
                if (!t.done) { ctx.beginPath(); ctx.arc(t.x+25, t.y+20, 25, 0, Math.PI*2); ctx.fill(); }
            } 
            else if (t.type === 'branch') {
                ctx.fillStyle = '#451a03'; ctx.fillRect(t.trunkX, t.y, 18, t.trunkY - t.y);
                if (!t.done) {
                    ctx.fillRect(t.x, t.y + 5, t.trunkX - t.x, 10);
                    let sway = Math.sin(globalTicks * 0.05 + t.x) * 4;
                    ctx.fillStyle = '#166534';
                    ctx.beginPath(); ctx.arc(t.x + 10 + sway, t.y + 10, 28, 0, Math.PI*2); ctx.fill();
                    ctx.beginPath(); ctx.arc(t.x + 25 + sway, t.y, 23, 0, Math.PI*2); ctx.fill();
                }
                ctx.fillStyle = '#14532d'; ctx.beginPath(); ctx.arc(t.trunkX + 9, t.y - 15, 40, 0, Math.PI*2); ctx.fill();
            }
        }

        for(let npc of entities.npcs) {
            ctx.fillStyle = npc.color; ctx.fillRect(npc.x, npc.y, npc.w, npc.h);
            ctx.fillStyle = '#fff'; ctx.fillRect(npc.x + 4, npc.y + 8, 4, 4); ctx.fillRect(npc.x + 12, npc.y + 8, 4, 4);
        }

        for(let e of entities.enemies) {
            if(e.dead) continue;
            let dir = e.vx > 0 ? 1 : -1;
            if (e.type === 'snail' || e.type === 'frog') {
                ctx.fillStyle = e.type === 'snail' ? '#ca8a04' : '#4ade80';
                ctx.fillRect(e.x, e.y, e.w, e.h);
                ctx.fillStyle = '#000'; ctx.fillRect(e.x+4, e.y+4, 4,4);
            } 
            else if (e.type === 'bee') {
                ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(e.x + 12, e.y + 12, 10, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#000'; ctx.fillRect(e.x + 8, e.y + 2, 4, 20); ctx.fillRect(e.x + 16, e.y + 2, 4, 20);
                ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(e.x + 12 - 5*dir, e.y + 6 - Math.sin(globalTicks*0.5)*4, 6, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(e.x + 12 + 10*dir, e.y + 12, 2, 0, Math.PI*2); ctx.fill();
            }
        }

        if (levelData.boss && !levelData.boss.dead) {
            let b = levelData.boss;
            if (b.type === 'scarecrow') {
                ctx.fillStyle = '#451a03'; ctx.fillRect(b.x+b.w/2-10, b.y+50, 20, b.h-50); 
                ctx.fillStyle = '#fef08a'; ctx.fillRect(b.x+b.w/2-30, b.y, 60, 50); 
                ctx.fillStyle = '#b45309'; ctx.fillRect(b.x, b.y+50, b.w, 20); 
                ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(b.x+b.w/2-15, b.y+20, 5, 0, Math.PI*2); ctx.arc(b.x+b.w/2+15, b.y+20, 5, 0, Math.PI*2); ctx.fill();
            } else if (b.type === 'toad') {
                ctx.fillStyle = '#15803d'; ctx.beginPath(); ctx.arc(b.x+b.w/2, b.y+b.h, b.w/2, Math.PI, 0); ctx.fill();
                ctx.fillStyle = '#86efac'; ctx.beginPath(); ctx.arc(b.x+b.w/2, b.y+b.h, b.w/2.5, Math.PI, 0); ctx.fill();
                ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(b.x+30, b.y+b.h/2, 15, 0, Math.PI*2); ctx.arc(b.x+b.w-30, b.y+b.h/2, 15, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#000'; ctx.fillRect(b.x+25, b.y+b.h/2-2, 10, 4); ctx.fillRect(b.x+b.w-35, b.y+b.h/2-2, 10, 4);
            } else if (b.type === 'bramble') {
                ctx.fillStyle = '#064e3b';
                let pulse = Math.sin(globalTicks*0.1)*10;
                ctx.beginPath(); ctx.arc(b.x+b.w/2, b.y+b.h/2, b.w/2 + pulse, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#ef4444';
                ctx.beginPath(); ctx.ellipse(b.x+40, b.y+60, 10, 20, 0.2, 0, Math.PI*2); ctx.ellipse(b.x+b.w-40, b.y+60, 10, 20, -0.2, 0, Math.PI*2); ctx.fill();
                ctx.strokeStyle = '#022c22'; ctx.lineWidth = 8;
                for(let i=0; i<4; i++) {
                    ctx.beginPath(); ctx.moveTo(b.x+b.w/2, b.y+b.h/2); 
                    ctx.quadraticCurveTo(b.x+b.w/2 + (i%2===0?-100:100), b.y-50, b.x + (i*50), b.y - 100 - pulse*2); ctx.stroke();
                }
            }
        }

        for (let p of entities.projectiles) {
            ctx.save(); ctx.translate(p.x, p.y);
            if(p.type === 'scythe') {
                ctx.rotate(p.rot); ctx.fillStyle = p.color; ctx.fillRect(-2, -p.size, 4, p.size*2);
                ctx.fillStyle = '#cbd5e1'; ctx.beginPath(); ctx.moveTo(2, -p.size); ctx.lineTo(20, -p.size-10); ctx.lineTo(2, -p.size+10); ctx.fill();
            } else if (p.type === 'root') {
                ctx.fillStyle = p.color; ctx.beginPath(); ctx.moveTo(0, p.size); ctx.lineTo(p.size, p.size); ctx.lineTo(p.size/2, -p.size*2); ctx.fill();
            } else {
                ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI*2); ctx.fill();
            }
            ctx.restore();
        }

        for(let item of entities.items) { ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(item.x+10, item.y+10, 8, 0, Math.PI*2); ctx.fill(); }

        if (player.invincibleTimer % 4 < 2) { 
            ctx.save();
            ctx.translate(player.x + player.width/2, player.y + player.height);
            if (!player.facingRight) ctx.scale(-1, 1);
            if (player.isDashing) { ctx.rotate(Math.PI/2); ctx.scale(1.5, 0.5); } 
            else ctx.scale(player.squash, player.stretch);
            
            ctx.fillStyle = player.hasDash ? '#f59e0b' : (player.hasWallJump ? '#0284c7' : '#84cc16'); 
            ctx.fillRect(-12, -28, 24, 20);
            
            ctx.fillStyle = '#fca5a5'; ctx.beginPath(); ctx.arc(0, -38, 10, 0, Math.PI*2); ctx.fill(); 
            ctx.fillStyle = '#166534'; ctx.beginPath(); ctx.arc(0, -40, 10, Math.PI, 0); ctx.fill(); ctx.fillRect(0, -40, 15, 4); 

            if (player.hasWallJump && !player.isDashing) { ctx.fillStyle = '#94a3b8'; ctx.fillRect(-14, -8, 6, 8); } 
            if (player.wallSliding) ctx.rotate(-0.2); 

            ctx.restore();
        }

        for (let p of entities.particles) { ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); }
        ctx.fillStyle = time === 'morning' ? 'rgba(255,255,255,0.6)' : (time === 'night' ? 'rgba(253, 224, 71, 0.8)' : 'rgba(250, 204, 21, 0.5)');
        for (let wp of entities.weather) {
            wp.x += Math.sin(globalTicks*0.02 + wp.a) * 0.5;
            wp.y += (time === 'night' ? -0.5 : 0.5);
            if (wp.y > levelData.height) wp.y = 0; if (wp.y < 0) wp.y = levelData.height;
            ctx.beginPath(); ctx.arc(wp.x, wp.y, wp.s, 0, Math.PI*2); ctx.fill();
        }

        ctx.restore();

        if (time === 'night') {
            let screenPlayerX = player.x + player.width/2 - cameraX;
            let screenPlayerY = player.y + player.height/2 - cameraY;
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = 'destination-out';
            let grad = ctx.createRadialGradient(screenPlayerX, screenPlayerY, 50, screenPlayerX, screenPlayerY, 300);
            grad.addColorStop(0, 'rgba(255, 255, 255, 1)'); grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(screenPlayerX, screenPlayerY, 300, 0, Math.PI*2); ctx.fill();
            ctx.restore();
        }

        if (gameState !== 'playing') {
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(canvas.width/2, canvas.height/2, transitionRadius, 0, Math.PI*2);
            ctx.rect(canvas.width, 0, -canvas.width, canvas.height);
            ctx.fill('evenodd');
        }

        ctx.textAlign = "center";
        for (let ft of entities.texts) {
            ctx.font = `bold ${ft.size} Arial`; ctx.fillStyle = ft.color; ctx.globalAlpha = ft.life;
            ctx.fillText(ft.text, ft.x - cameraX, ft.y - cameraY); ctx.globalAlpha = 1.0;
        }

        if (activeDialog) {
            let npc = activeDialog.npc;
            let cx = (npc.x + npc.w/2) - cameraX; let cy = npc.y - 45 - cameraY;
            ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fillRect(cx - 140, cy - 50, 280, 60);
            ctx.fillStyle = '#1c1917'; ctx.font = "bold 14px Arial"; ctx.fillText(npc.name, cx, cy - 30);
            ctx.fillStyle = '#44403c'; ctx.font = "14px Arial"; 
            if (activeDialog.showPrompt) ctx.fillText("Appuyez sur 'E' pour parler", cx, cy - 10);
            else ctx.fillText(npc.dialogs[activeDialog.line], cx, cy - 10);
        }

        ctx.fillStyle = '#ef4444'; ctx.textAlign = "left"; ctx.font = "24px Arial";
        ctx.fillText("❤️".repeat(player.hp), 15, 30);
    }

    // --- CONTRÔLES ---
    function handleKey(key, isDown, e) {
        if (!gameActive) return;
        const k = key.toLowerCase();
        if(["arrowup","arrowdown","arrowleft","arrowright"," ","e","shift"].includes(k) || ["z","q","s","d"].includes(k)) if(e) e.preventDefault();
        
        if (k === 'arrowleft' || k === 'q') keys.left = isDown;
        if (k === 'arrowright' || k === 'd') keys.right = isDown;
        if (k === 'arrowup' || k === 'z' || k === ' ') { if (isDown && !keys.jump) inputs.jumpJustPressed = true; keys.jump = isDown; }
        if (k === 'e' || key === 'Enter') { if (isDown && !keys.interact) inputs.interactJustPressed = true; keys.interact = isDown; }
        if (k === 'shift') { if (isDown && !keys.dash) inputs.dashJustPressed = true; keys.dash = isDown; }
    }

    document.addEventListener('keydown', (e) => handleKey(e.key, true, e));
    document.addEventListener('keyup', (e) => handleKey(e.key, false, e));

    const btnMap = { 'btn-left': 'ArrowLeft', 'btn-right': 'ArrowRight', 'btn-jump': 'Space', 'btn-interact': 'e', 'btn-dash': 'Shift' };
    for (let id in btnMap) {
        let btn = document.getElementById(id);
        if(!btn) continue;
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); initAudio(); handleKey(btnMap[id], true, null); });
        btn.addEventListener('touchend', (e) => { e.preventDefault(); handleKey(btnMap[id], false, null); });
    }
});