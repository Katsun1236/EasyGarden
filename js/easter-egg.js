// Injection de l'interface du jeu dans le body
const gameHTML = `
<div id="easter-egg-game-container" class="fixed inset-0 bg-stone-950 z-[100] hidden flex-col items-center justify-center p-0 md:p-4 font-sans select-none touch-none">
    <button id="close-game-btn" class="absolute top-4 right-4 md:top-6 md:right-6 text-white text-3xl focus:outline-none hover:text-botanic transition-colors z-[101]" aria-label="Fermer le jeu"><i class="fa-solid fa-times"></i></button>
    
    <div class="text-center mb-1 md:mb-4">
        <h2 class="font-serif text-2xl md:text-5xl text-white mb-1 md:mb-2" style="text-shadow: 0 0 15px rgba(114,138,100,0.8);"><span class="text-botanic-light">Super</span> Jardinier !</h2>
        <p class="text-stone-400 text-[10px] md:text-sm tracking-widest hidden md:block">FLÈCHES/ZQSD: Bouger | ESPACE: Sauter | MAJ: Dash | E: Interagir</p>
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
        } else if (type === 'dash') {
            osc.type = 'triangle'; osc.frequency.setValueAtTime(400, now); osc.frequency.linearRampToValueAtTime(100, now + 0.2);
            gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now); osc.stop(now + 0.2);
        } else if (type === 'hit') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
            gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now); osc.stop(now + 0.15);
        } else if (type === 'coin') {
            osc.type = 'square'; osc.frequency.setValueAtTime(800, now); osc.frequency.setValueAtTime(1200, now + 0.05);
            gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now); osc.stop(now + 0.2);
        } else if (type === 'boss_hit') {
            osc.type = 'square'; osc.frequency.setValueAtTime(80, now); osc.frequency.exponentialRampToValueAtTime(20, now + 0.3);
            gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now); osc.stop(now + 0.3);
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
    let globalTicks = 0; // Remplace frameCount
    let screenShake = 0;
    let gameState = 'playing'; // 'playing', 'transition_in', 'transition_out'
    let transitionRadius = 0;
    
    // Fixed Time Step
    let lastTime = 0;
    let accumulator = 0;
    const timeStep = 1000 / 60; // 60 FPS constant pour la physique
    
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
        
        coyoteTimer: 0, jumpBufferTimer: 0,
        touchingWallDir: 0, wallSliding: false,
        
        // Power-Ups
        hasWallJump: false,
        hasDash: false, canDash: true, isDashing: false, dashTimer: 0, dashDir: 1
    };

    let entities = { particles: [], texts: [], enemies: [], items: [], npcs: [], crates: [], spikes: [], weather: [], projectiles: [] };
    let levelTasks = 0, completedTasks = 0;
    let levelData = {};
    let activeDialog = null, nearNPC = null;

    // --- LEVELS DESIGN ---
    const levels = [
        {   // NIVEAU 1 : Matin (Tutoriel étendu + Boss)
            name: "Les Plaines d'Entraînement", time: "morning", width: 4200, height: 1000,
            goal: { x: 3950, y: 750, w: 80, h: 100 },
            checkpoints: [{ x: 1800, y: 740, w: 20, h: 60, active: false }],
            platforms: [
                { x: 0, y: 800, w: 1200, h: 200 }, 
                { x: 1200, y: 700, w: 100, h: 300 }, // Mur pour caisse
                { x: 1300, y: 800, w: 800, h: 200 }, 
                { x: 1500, y: 650, w: 100, h: 20 }, // Plateforme air
                { x: 2100, y: 800, w: 300, h: 200 }, // Faux Mur Secret
                { x: 2100, y: 600, w: 300, h: 400, type: 'secret' }, 
                { x: 2400, y: 800, w: 1800, h: 200 }, // Arène Boss
            ],
            crates: [ { x: 800, y: 750, w: 40, h: 40, vx: 0, vy: 0 } ],
            spikes: [ { x: 1350, y: 780, w: 100, h: 20, dir: 'up' } ],
            tasks: [
                { x: 400, y: 780, w: 80, h: 20, type: 'grass', done: false, name: 'Tonte' },
                { x: 1700, y: 755, w: 50, h: 45, type: 'hedge', done: false, name: 'Taille' },
            ],
            npcs: [
                { x: 200, y: 764, w: 20, h: 36, color: '#f87171', name: "Mme. Rose", dialogs: ["Bienvenue au boulot !", "Utilise ZQSD ou Flèches. Espace pour sauter.", "Pousse les caisses en bois pour monter."] },
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
        {   // NIVEAU 2 : Midi (Puits, Plateformes Mouvantes)
            name: "L'Ascension Pénible", time: "midday", width: 3000, height: 2000,
            goal: { x: 2700, y: 300, w: 80, h: 100 },
            checkpoints: [ { x: 1500, y: 1140, w: 20, h: 60, active: false }, { x: 800, y: 440, w: 20, h: 60, active: false } ],
            platforms: [
                { x: 0, y: 1800, w: 800, h: 200 }, // Départ
                { x: 800, y: 1200, w: 50, h: 800 }, // Mur G
                { x: 1100, y: 1000, w: 50, h: 1000 }, // Mur D
                { x: 1150, y: 1200, w: 600, h: 200 }, // Palier 1
                { x: 1900, y: 1200, w: 150, h: 20, type: 'moving', vx: 2, minX: 1800, maxX: 2300 }, // Plat Mouvante
                { x: 2500, y: 1000, w: 500, h: 200 }, // Palier 2
                { x: 2450, y: 500, w: 50, h: 700 }, // Mur G Haut
                { x: 2800, y: 400, w: 50, h: 600 }, // Mur D Haut
                { x: 600, y: 500, w: 1850, h: 200 }, // Arène Boss Crapaud
            ],
            crates: [],
            spikes: [
                { x: 1200, y: 1180, w: 200, h: 20, dir: 'up' },
                { x: 2600, y: 980, w: 200, h: 20, dir: 'up' }
            ],
            tasks: [
                { x: 1300, y: 1155, w: 50, h: 45, type: 'hedge', done: false, name: 'Taille' },
            ],
            npcs: [
                { x: 100, y: 1764, w: 20, h: 36, color: '#60a5fa', name: "M. Tulipe", dialogs: ["Tu as les Crampons d'Élagage !", "Saute contre un mur, maintiens la flèche VERS le mur...", "Puis appuie sur SAUT pour bondir !"] }
            ],
            enemies: [
                { x: 600, y: 1776, w: 24, h: 24, type: 'frog', vx: 2, vy: 0, baseY: 1776, minX: 400, maxX: 700, dead: false },
                { x: 1400, y: 1176, w: 24, h: 24, type: 'snail', vx: 1, minX: 1300, maxX: 1600, dead: false }
            ],
            boss: {
                x: 1200, y: 350, w: 150, h: 150, hp: 8, maxHp: 8, type: 'toad', state: 'idle', timer: 0, dead: false,
                name: "CRAPAUD-BUFFLE", reward: "dash", arenaMin: 700, arenaMax: 2300
            },
            items: [ { x: 2100, y: 1000, w: 20, h: 20, type: 'hp', collected: false } ]
        },
        {   // NIVEAU 3 : Nuit (Boss Final Ronce)
            name: "L'Antre de la Ronce", time: "night", width: 4000, height: 1000,
            goal: { x: -1000, y: 0, w: 1, h: 1 }, 
            isBoss: true,
            checkpoints: [],
            platforms: [
                { x: 0, y: 800, w: 800, h: 200 },
                { x: 1000, y: 800, w: 100, h: 20, type: 'fragile', timer: 0, state: 'idle' },
                { x: 1300, y: 800, w: 100, h: 20, type: 'fragile', timer: 0, state: 'idle' },
                { x: 1600, y: 800, w: 2400, h: 200 }, // Arène boss finale massive
            ],
            spikes: [{ x: 800, y: 980, w: 800, h: 20, dir: 'up' }], // Mer de piques sous les plateformes
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
        
        entities = {
            particles: [], texts: [], projectiles: [], weather: [],
            enemies: levelData.enemies || [],
            items: levelData.items || [],
            npcs: levelData.npcs || [],
            crates: levelData.crates || [],
            spikes: levelData.spikes || []
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
        if (dt > 100) dt = 100; // Capper le lag
        
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

        // Transitions
        if (gameState === 'transition_in') {
            transitionRadius += 25;
            if (transitionRadius > Math.max(canvas.width, canvas.height) * 1.5) gameState = 'playing';
            return; // Bloque le jeu pendant la transition
        }
        if (gameState === 'transition_out') {
            transitionRadius -= 25;
            if (transitionRadius <= 0) loadLevel(currentLevelIdx + 1);
            return;
        }

        // Timers
        if (player.coyoteTimer > 0) player.coyoteTimer--;
        if (player.jumpBufferTimer > 0) player.jumpBufferTimer--;
        if (player.invincibleTimer > 0) player.invincibleTimer--;
        player.squash += (1 - player.squash) * 0.2;
        player.stretch += (1 - player.stretch) * 0.2;

        // Interactions PNJ
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
        inputs.interactJustPressed = false;

        // --- DASH ---
        if (inputs.dashJustPressed && player.hasDash && player.canDash && !player.isDashing) {
            player.isDashing = true;
            player.dashTimer = 12; // Durée du dash
            player.canDash = false;
            player.dashDir = player.facingRight ? 1 : -1;
            player.vy = 0;
            playSound('dash');
            spawnParticles(player.x, player.y+10, '#3b82f6', 15);
        }
        inputs.dashJustPressed = false;

        // --- INPUTS & MOUVEMENT H ---
        let targetVx = 0;
        if (!player.isDashing) {
            if (keys.left) { targetVx = -player.speed; player.facingRight = false; }
            if (keys.right) { targetVx = player.speed; player.facingRight = true; }
            player.vx += (targetVx - player.vx) * (player.grounded ? 0.2 : 0.1); // Inertie
        } else {
            player.vx = player.dashDir * 14;
            player.dashTimer--;
            player.vy = 0; // Gravité annulée
            if (globalTicks % 3 === 0) spawnParticles(player.x, player.y+16, '#93c5fd', 2); // Traînée
            if (player.dashTimer <= 0) player.isDashing = false;
        }

        // Plateformes mouvantes & fragiles (Mise à jour avant le joueur)
        let platformDeltaX = 0;
        for (let p of levelData.platforms) {
            if (p.type === 'moving') {
                p.x += p.vx;
                if (p.x > p.maxX || p.x < p.minX) p.vx *= -1;
                // Si le joueur est SUR la plateforme, il bouge avec
                if (player.grounded && checkCollision({x:player.x, y:player.y+2, w:player.width, h:player.height}, p)) {
                    platformDeltaX = p.vx;
                }
            }
            if (p.type === 'fragile' && p.state === 'falling') p.y += 8;
        }
        player.x += platformDeltaX; // Applique le mouvement de la plateforme

        // --- MOTEUR AABB: RESOLUTION X ---
        player.x += player.vx;
        if (player.x < 0) { player.x = 0; player.vx = 0; }
        if (player.x + player.width > levelData.width) { player.x = levelData.width - player.width; player.vx = 0; }
        
        player.touchingWallDir = 0;
        let obstacles = [...levelData.platforms.filter(p=>p.type !== 'secret'), ...entities.crates];
        
        for (let o of obstacles) {
            if (checkCollision(player, o)) {
                if (player.vx > 0) { player.x = o.x - player.width; player.vx = 0; player.touchingWallDir = 1; if(o.vx !== undefined && player.grounded) o.vx = 2; } 
                else if (player.vx < 0) { player.x = o.x + (o.w || o.width); player.vx = 0; player.touchingWallDir = -1; if(o.vx !== undefined && player.grounded) o.vx = -2; }
                if (player.isDashing) player.isDashing = false; // Stoppe le dash contre un mur
            }
        }

        // --- SAUTS & WALL SLIDE ---
        if (inputs.jumpJustPressed) player.jumpBufferTimer = 8;
        inputs.jumpJustPressed = false;
        player.wallSliding = false;

        if (player.hasWallJump && !player.grounded && player.vy > 0 && player.touchingWallDir !== 0 && !player.isDashing) {
            if ((player.touchingWallDir === 1 && keys.right) || (player.touchingWallDir === -1 && keys.left)) {
                player.wallSliding = true; player.vy = 2; player.canDash = true; // Reset dash sur mur
                if (globalTicks % 5 === 0) spawnParticles(player.x + (player.touchingWallDir===1?player.width:0), player.y + 10, '#d4d4d8', 2);
            }
        }

        if (player.jumpBufferTimer > 0) {
            if (player.coyoteTimer > 0) {
                playSound('jump'); player.vy = player.jumpPower; player.coyoteTimer = 0; player.jumpBufferTimer = 0;
                player.squash = 0.6; player.stretch = 1.4; spawnParticles(player.x + 12, player.y + 32, '#d4d4d8', 8);
            } 
            else if (player.wallSliding || (player.hasWallJump && player.touchingWallDir !== 0 && !player.grounded)) {
                playSound('jump'); player.vy = player.jumpPower * 0.9; player.vx = player.touchingWallDir * -9; 
                player.facingRight = (player.touchingWallDir === -1);
                player.coyoteTimer = 0; player.jumpBufferTimer = 0;
                player.squash = 0.7; player.stretch = 1.3; spawnParticles(player.x + (player.touchingWallDir===1?player.width:0), player.y + 16, '#d4d4d8', 12);
            }
        }

        // --- MOTEUR AABB: RESOLUTION Y ---
        if (!player.isDashing && !player.wallSliding) player.vy += gravity;
        if (player.vy > terminalVelocity) player.vy = terminalVelocity;
        
        player.y += player.vy;
        const wasGrounded = player.grounded;
        player.grounded = false;

        for (let o of obstacles) {
            if (checkCollision(player, o)) {
                if (player.vy > 0) {
                    player.y = o.y - player.height; player.vy = 0; player.grounded = true;
                    player.coyoteTimer = 10; player.canDash = true; // Reset Coyote & Dash
                    // Trigger plateforme fragile
                    if(o.type === 'fragile' && o.state === 'idle') o.state = 'shaking';
                } else if (player.vy < 0) {
                    player.y = o.y + (o.h || o.height); player.vy = 0;
                }
            }
        }
        
        // Tremblement plateformes fragiles
        for (let p of levelData.platforms) {
            if(p.type === 'fragile' && p.state === 'shaking') {
                p.timer++;
                if(p.timer > 30) p.state = 'falling';
            }
        }

        if (wasGrounded && !player.grounded && player.vy >= 0) player.coyoteTimer = 8;
        if (!wasGrounded && player.grounded) { player.squash = 1.4; player.stretch = 0.6; spawnParticles(player.x + 12, player.y + 32, '#a8a29e', 6); }

        // Murs Secrets
        for (let p of levelData.platforms) {
            if (p.type === 'secret') p.opacity = checkCollision(player, p) ? 0.3 : 1;
        }

        // Physique des caisses
        for (let c of entities.crates) {
            c.vy += gravity; c.vx *= 0.8; c.x += c.vx;
            for (let p of obstacles) {
                if (p !== c && checkCollision(c, p) && c.vy > 0) { c.y = p.y - c.h; c.vy = 0; }
            }
        }

        // --- DANGERS & VIDE ---
        for (let s of entities.spikes) {
            // Hitbox réduite pour les piques
            if (checkCollision(player, {x: s.x+2, y: s.y+10, w: s.w-4, h: s.h-10}) && !player.isDashing) {
                handleDamage(1, s.x + s.w/2);
                player.vy = -12; // Propulse en l'air
            }
        }
        if (player.y > levelData.height + 200) {
            handleDamage(1, player.x);
            if (player.hp > 0) { player.x = player.spawnX; player.y = player.spawnY; player.vx = 0; player.vy = 0; cameraX = player.x-canvas.width/2; }
        }

        // --- CAMERA FLUIDE ---
        let targetCamX = player.x - canvas.width / 2 + player.width / 2;
        let targetCamY = player.y - canvas.height / 2 + 50;
        
        // Lock caméra sur les boss
        if (levelData.boss && levelData.boss.hp > 0 && player.x > levelData.boss.arenaMin) {
            targetCamX = levelData.boss.arenaMin + (levelData.boss.arenaMax - levelData.boss.arenaMin)/2 - canvas.width/2;
            if(!bossHpContainer.classList.contains('opacity-0') === false) activateBossUI(levelData.boss);
        }
        
        if (targetCamX < 0) targetCamX = 0; if (targetCamX > levelData.width - canvas.width) targetCamX = levelData.width - canvas.width;
        if (targetCamY < 0) targetCamY = 0; if (targetCamY > levelData.height - canvas.height) targetCamY = levelData.height - canvas.height;
        
        cameraX += (targetCamX - cameraX) * 0.1; cameraY += (targetCamY - cameraY) * 0.1;
        if (screenShake > 0) { cameraX += (Math.random()-0.5)*screenShake; cameraY += (Math.random()-0.5)*screenShake; screenShake *= 0.9; }

        // --- ITEMS & CHECKPOINTS ---
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
            }
        }

        // --- ENNEMIS DE BASE ---
        for (let e of entities.enemies) {
            if (e.dead) continue;
            if (e.type === 'snail') { e.x += e.vx; if (e.x < e.minX || e.x + e.w > e.maxX) e.vx *= -1; } 
            else if (e.type === 'frog') {
                e.x += e.vx; e.vy += gravity; e.y += e.vy;
                if (e.y >= e.baseY) { e.y = e.baseY; e.vy = 0; if (Math.random() < 0.02) e.vy = -14; } // Saute haut !
                if (e.x < e.minX || e.x + e.w > e.maxX) e.vx *= -1;
            }
            if (checkCollision(player, e) && player.invincibleTimer === 0 && !player.isDashing) {
                if (player.vy > 0 && player.y + player.height < e.y + e.h/2 + 10) { // Goomba stomp
                    e.dead = true; player.vy = -10; playSound('hit'); spawnParticles(e.x+e.w/2, e.y+e.h/2, '#fde047', 25);
                } else handleDamage(1, e.x + e.w/2);
            }
        }

        // --- BOSS LOGIC ---
        if (levelData.boss && !levelData.boss.dead && player.x > levelData.boss.arenaMin - 200) {
            let b = levelData.boss;
            b.timer++;
            
            // ÉPOUVANTAIL (Lvl 1)
            if (b.type === 'scarecrow') {
                b.x += b.vx || 0;
                if (b.state === 'idle') {
                    if(b.timer > 60) { b.state = 'attack'; b.timer = 0; b.vx = (player.x > b.x) ? 3 : -3; }
                } else if (b.state === 'attack') {
                    if (b.timer % 80 === 0) { // Tire des faux
                        entities.projectiles.push({ x: b.x+b.w/2, y: b.y + 40, vx: (player.x > b.x ? 6 : -6), vy: 0, size: 20, color: '#9ca3af', type: 'scythe', rot: 0 });
                        playSound('hit');
                    }
                    if (b.timer > 200 || b.x < b.arenaMin || b.x + b.w > b.arenaMax) { b.state = 'idle'; b.timer = 0; b.vx = 0; }
                }
            }
            // CRAPAUD (Lvl 2)
            else if (b.type === 'toad') {
                if (b.state === 'idle') {
                    if(b.timer > 90) { b.state = 'jump'; b.timer = 0; b.vy = -18; b.vx = (player.x - b.x) * 0.03; } // Saute vers joueur
                } else if (b.state === 'jump') {
                    b.vy += gravity; b.x += b.vx; b.y += b.vy;
                    if (b.x < b.arenaMin) b.x = b.arenaMin; if (b.x + b.w > b.arenaMax) b.x = b.arenaMax - b.w;
                    if (b.y >= 500 - b.h) { // Touche le sol de l'arène
                        b.y = 500 - b.h; b.vy = 0; b.state = 'idle'; b.timer = 0;
                        screenShake = 20; playSound('boss_hit');
                        entities.projectiles.push({ x: b.x+b.w/2, y: b.y+b.h-10, vx: 7, vy: 0, size: 15, color: '#4ade80', type: 'shockwave' });
                        entities.projectiles.push({ x: b.x+b.w/2, y: b.y+b.h-10, vx: -7, vy: 0, size: 15, color: '#4ade80', type: 'shockwave' });
                    }
                }
            }
            // RONCE (Lvl 3)
            else if (b.type === 'bramble') {
                b.x += b.vx || 0;
                if(b.state === 'intro') { if(b.timer > 60) { b.state = 'move'; b.vx = -4; } }
                else if (b.state === 'move') {
                    if (b.x < b.arenaMin || b.x + b.w > b.arenaMax) b.vx *= -1;
                    if (b.timer % 60 === 0) { // Pluie de piquants
                        entities.projectiles.push({ x: b.x + Math.random()*b.w, y: b.y, vx: (Math.random()-0.5)*4, vy: -10, size: 8, color: '#991b1b', type: 'thorn', grav: true });
                    }
                }
            }

            // Dégâts Boss
            if (checkCollision(player, b) && player.invincibleTimer === 0 && !player.isDashing) {
                if (player.vy > 0 && player.y + player.height < b.y + 40) { // Hit
                    b.hp--; player.vy = -16; screenShake = 25; playSound('boss_hit');
                    spawnParticles(b.x + b.w/2, b.y, '#fde047', 50);
                    updateBossUI(b);
                    if (b.hp <= 0) {
                        b.dead = true;
                        if(b.reward === 'walljump') { player.hasWallJump = true; powerupUI.innerText = "CRAMPONS D'ÉLAGAGE: Saute sur les murs !"; }
                        if(b.reward === 'dash') { player.hasDash = true; document.getElementById('btn-dash').classList.remove('hidden'); powerupUI.innerText = "SÉCATEUR-DASH: MAJ ou D pour foncer !"; }
                        if(b.type === 'bramble') {
                            gameActive = false; document.getElementById('game-end-title').innerText = "VICTOIRE !";
                            document.getElementById('game-end-text').innerText = "Tu as éradiqué la racine du mal.";
                            restartBtn.innerText = "Terminer"; restartBtn.onclick = closeGameUI; gameOverScreen.classList.remove('hidden');
                        }
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

        // Victoire (Fin de niveau normal)
        if (!levelData.isBoss && checkCollision(player, levelData.goal) && gameState === 'playing') {
            if (completedTasks >= levelTasks) {
                gameState = 'transition_out'; transitionRadius = Math.max(canvas.width, canvas.height) * 1.5; playSound('coin');
            } else {
                if (globalTicks % 60 === 0) spawnText(player.x, player.y - 40, "Il reste des tâches !", '#ef4444');
            }
        }
    }

    // --- RENDU GRAPHIQUE ---
    function draw() {
        const time = levelData.time;
        
        // 1. Fond (Ciel)
        let skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        if (time === 'morning') { skyGrad.addColorStop(0, '#0ea5e9'); skyGrad.addColorStop(1, '#e0f2fe'); }
        else if (time === 'midday') { skyGrad.addColorStop(0, '#0284c7'); skyGrad.addColorStop(1, '#bae6fd'); }
        else { skyGrad.addColorStop(0, '#0f172a'); skyGrad.addColorStop(1, '#312e81'); }
        ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Soleil / Lune
        let sunX = 700 - (cameraX * 0.05); 
        ctx.fillStyle = time === 'night' ? '#f8fafc' : '#fef08a';
        ctx.beginPath(); ctx.arc(sunX, 100 + cameraY*0.1, 50, 0, Math.PI*2); ctx.fill();

        ctx.save();
        
        // Parallax Complexe (V1 restaurée)
        // Montagnes lointaines (0.1)
        ctx.translate(-cameraX * 0.1, -cameraY * 0.05);
        ctx.fillStyle = time === 'night' ? '#1e1b4b' : '#7dd3fc';
        ctx.beginPath(); ctx.moveTo(-200, 1000); ctx.lineTo(400, 200); ctx.lineTo(1000, 1000); ctx.fill();
        ctx.beginPath(); ctx.moveTo(600, 1000); ctx.lineTo(1200, 300); ctx.lineTo(1800, 1000); ctx.fill();
        ctx.beginPath(); ctx.moveTo(1400, 1000); ctx.lineTo(2000, 250); ctx.lineTo(2600, 1000); ctx.fill();
        ctx.beginPath(); ctx.moveTo(2200, 1000); ctx.lineTo(3000, 150); ctx.lineTo(3800, 1000); ctx.fill();
        
        // Collines (0.3)
        ctx.translate(cameraX * 0.1 - cameraX * 0.3, cameraY * 0.05 - cameraY * 0.15);
        ctx.fillStyle = time === 'night' ? '#172554' : '#38bdf8';
        for(let i=-500; i<levelData.width; i+=600) {
            ctx.beginPath(); ctx.arc(i+300, 800, 400, Math.PI, 0); ctx.fill();
        }
        
        // Arbres lointains (0.5)
        ctx.translate(cameraX * 0.3 - cameraX * 0.5, cameraY * 0.15 - cameraY * 0.3);
        let treeColor = time === 'night' ? '#1e3a8a' : '#0369a1';
        for(let i=0; i<levelData.width; i+=250) {
            ctx.fillStyle = '#1e3a8a'; ctx.fillRect(i+90, 600, 20, 200); // Tronc
            ctx.fillStyle = treeColor; 
            ctx.beginPath(); ctx.arc(i+100, 580, 70, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(i+60, 620, 50, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(i+140, 620, 50, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();

        // 2. Monde du jeu (Caméra X & Y)
        ctx.save();
        ctx.translate(-cameraX, -cameraY);

        // Goal
        if(!levelData.isBoss) {
            let g = levelData.goal;
            ctx.fillStyle = '#fef08a'; ctx.fillRect(g.x, g.y + 40, g.w, 60);
            ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(g.x - 15, g.y + 40); ctx.lineTo(g.x + g.w/2, g.y - 10); ctx.lineTo(g.x + g.w + 15, g.y + 40); ctx.fill();
            if (completedTasks >= levelTasks) {
                ctx.fillStyle = '#22c55e'; ctx.font = "bold 24px Arial"; ctx.fillText("Ouvert !", g.x + 40, g.y - 20);
            }
        }

        // Checkpoints
        for (let c of (levelData.checkpoints || [])) {
            ctx.fillStyle = '#78350f'; ctx.fillRect(c.x + 8, c.y, 4, c.h);
            ctx.fillStyle = c.active ? '#22c55e' : '#ef4444';
            ctx.beginPath(); ctx.moveTo(c.x + 12, c.y + 2); ctx.lineTo(c.x + 35, c.y + 12); ctx.lineTo(c.x + 12, c.y + 22); ctx.fill();
        }

        // Ronces / Spikes
        ctx.fillStyle = '#b91c1c';
        for (let s of entities.spikes) {
            for(let i=0; i<s.w; i+=10) {
                ctx.beginPath(); ctx.moveTo(s.x + i, s.y + s.h); ctx.lineTo(s.x + i + 5, s.y); ctx.lineTo(s.x + i + 10, s.y + s.h); ctx.fill();
            }
        }

        // Plateformes
        for (let p of levelData.platforms) {
            ctx.globalAlpha = p.opacity || 1;
            if (p.type === 'fragile') {
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

        // Caisses
        ctx.fillStyle = '#b45309';
        for (let c of entities.crates) {
            ctx.fillRect(c.x, c.y, c.w, c.h);
            ctx.strokeStyle = '#78350f'; ctx.lineWidth = 3; ctx.strokeRect(c.x, c.y, c.w, c.h);
            ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x+c.w, c.y+c.h); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(c.x+c.w, c.y); ctx.lineTo(c.x, c.y+c.h); ctx.stroke();
        }

        // Tâches
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
        }

        // NPCs
        for(let npc of entities.npcs) {
            ctx.fillStyle = npc.color; ctx.fillRect(npc.x, npc.y, npc.w, npc.h);
            ctx.fillStyle = '#fff'; ctx.fillRect(npc.x + 4, npc.y + 8, 4, 4); ctx.fillRect(npc.x + 12, npc.y + 8, 4, 4);
        }

        // Ennemis 
        for(let e of entities.enemies) {
            if(e.dead) continue;
            ctx.fillStyle = e.type === 'snail' ? '#ca8a04' : '#4ade80';
            ctx.fillRect(e.x, e.y, e.w, e.h);
            ctx.fillStyle = '#000'; ctx.fillRect(e.x+4, e.y+4, 4,4);
        }

        // BOSSES (Design XL)
        if (levelData.boss && !levelData.boss.dead) {
            let b = levelData.boss;
            if (b.type === 'scarecrow') {
                ctx.fillStyle = '#451a03'; ctx.fillRect(b.x+b.w/2-10, b.y+50, 20, b.h-50); // Pieu
                ctx.fillStyle = '#fef08a'; ctx.fillRect(b.x+b.w/2-30, b.y, 60, 50); // Tête
                ctx.fillStyle = '#b45309'; ctx.fillRect(b.x, b.y+50, b.w, 20); // Bras
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
            } else {
                ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI*2); ctx.fill();
            }
            ctx.restore();
        }

        // Items
        for(let item of entities.items) { ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(item.x+10, item.y+10, 8, 0, Math.PI*2); ctx.fill(); }

        // Joueur
        if (player.invincibleTimer % 4 < 2) { 
            ctx.save();
            ctx.translate(player.x + player.width/2, player.y + player.height);
            if (!player.facingRight) ctx.scale(-1, 1);
            if (player.isDashing) { ctx.rotate(Math.PI/2); ctx.scale(1.5, 0.5); } // Étirement Dash
            else ctx.scale(player.squash, player.stretch);
            
            // Corps principal (Couleur change selon Power-Ups)
            ctx.fillStyle = player.hasDash ? '#f59e0b' : (player.hasWallJump ? '#0284c7' : '#84cc16'); 
            ctx.fillRect(-12, -28, 24, 20);
            
            ctx.fillStyle = '#fca5a5'; ctx.beginPath(); ctx.arc(0, -38, 10, 0, Math.PI*2); ctx.fill(); // Tête
            ctx.fillStyle = '#166534'; ctx.beginPath(); ctx.arc(0, -40, 10, Math.PI, 0); ctx.fill(); ctx.fillRect(0, -40, 15, 4); // Casquette

            if (player.hasWallJump && !player.isDashing) { ctx.fillStyle = '#94a3b8'; ctx.fillRect(-14, -8, 6, 8); } // Crampons
            if (player.wallSliding) ctx.rotate(-0.2); 

            ctx.restore();
        }

        // Particules & Météo
        for (let p of entities.particles) { ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); }
        ctx.fillStyle = time === 'morning' ? 'rgba(255,255,255,0.6)' : (time === 'night' ? 'rgba(253, 224, 71, 0.8)' : 'rgba(250, 204, 21, 0.5)');
        for (let wp of entities.weather) {
            wp.x += Math.sin(globalTicks*0.02 + wp.a) * 0.5;
            wp.y += (time === 'night' ? -0.5 : 0.5);
            if (wp.y > levelData.height) wp.y = 0; if (wp.y < 0) wp.y = levelData.height;
            ctx.beginPath(); ctx.arc(wp.x, wp.y, wp.s, 0, Math.PI*2); ctx.fill();
        }

        ctx.restore(); // Fin Caméra

        // 3. Post-Processing & UI
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

        // Transition Circle (Iris)
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