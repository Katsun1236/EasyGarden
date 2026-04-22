// Injection de l'interface du jeu dans le body
const gameHTML = `
<div id="easter-egg-game-container" class="fixed inset-0 bg-stone-950 z-[100] hidden flex-col items-center justify-center p-0 md:p-4 font-sans select-none touch-none">
    <button id="close-game-btn" class="absolute top-4 right-4 md:top-6 md:right-6 text-white text-3xl focus:outline-none hover:text-botanic transition-colors z-[101]" aria-label="Fermer le jeu"><i class="fa-solid fa-times"></i></button>
    
    <div class="text-center mb-1 md:mb-4">
        <h2 class="font-serif text-2xl md:text-5xl text-white mb-1 md:mb-2" style="text-shadow: 0 0 15px rgba(114,138,100,0.8);"><span class="text-botanic-light">Super</span> Jardinier !</h2>
        <p class="text-stone-400 text-[10px] md:text-sm tracking-widest hidden md:block">FLÈCHES ou ZQSD: Bouger | ESPACE: Sauter | E: Interagir</p>
    </div>

    <div class="relative bg-stone-900 p-1 md:p-2 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-stone-700 overflow-hidden w-full max-w-4xl max-h-[85vh] md:max-h-none flex flex-col">
        
        <!-- UI Superposée -->
        <div class="absolute top-4 left-6 text-white font-bold tracking-widest z-10 drop-shadow-md text-sm md:text-base" id="game-ui-score">TÂCHES: <span id="game-score" class="text-botanic-light text-xl">0/0</span></div>
        <div class="absolute top-4 right-6 text-white font-bold tracking-widest z-10 text-right drop-shadow-md text-sm md:text-base" id="game-ui-level">NIVEAU 1</div>
        <div class="absolute top-10 left-6 text-yellow-300 font-bold tracking-widest z-10 drop-shadow-md text-xs md:text-sm" id="game-ui-powerup"></div>
        
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
                <button id="btn-interact" class="w-14 h-14 bg-yellow-400/30 rounded-full flex items-center justify-center text-white font-bold backdrop-blur-sm active:bg-yellow-400/60">E</button>
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
    // Mettre un bouton factice si l'ID n'existe pas sur la page pour tester
    if(!leaf) {
        console.warn("Élément 'easter-egg-leaf' non trouvé. Créez-le pour lancer le jeu ou appelez startGameUI().");
    }

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

    // --- SYNTHÉTISEUR AUDIO PROCÉDURAL (Web Audio API) ---
    let audioCtx;
    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();
    }

    function playSound(type) {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        const now = audioCtx.currentTime;
        if (type === 'jump') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now); osc.stop(now + 0.1);
        } else if (type === 'hit') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now); osc.stop(now + 0.15);
        } else if (type === 'coin') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.setValueAtTime(1200, now + 0.05);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now); osc.stop(now + 0.2);
        } else if (type === 'boss_hit') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(100, now);
            osc.frequency.exponentialRampToValueAtTime(20, now + 0.3);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
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

    // --- GAME ENGINE ---
    const keys = { left: false, right: false, jump: false, interact: false };
    const inputs = { jumpJustPressed: false, interactJustPressed: false };
    
    let gameLoop;
    let gameActive = false;
    let currentLevelIdx = 0;
    
    // Caméra 2D
    let cameraX = 0;
    let cameraY = 0; 
    let frameCount = 0;
    let screenShake = 0;
    
    // Physique
    const gravity = 0.6;
    const friction = 0.8;
    const terminalVelocity = 12;

    const player = {
        x: 50, y: 200, width: 24, height: 32,
        vx: 0, vy: 0, speed: 5.5, jumpPower: -11.5,
        grounded: false, facingRight: true,
        squash: 1, stretch: 1, hp: 5, maxHp: 5, invincibleTimer: 0,
        jumps: 0, spawnX: 50, spawnY: 200,
        
        // Nouvelles mécaniques "Game Feel"
        coyoteTimer: 0, 
        jumpBufferTimer: 0,
        touchingWallDir: 0, // -1 (gauche), 1 (droite), 0 (non)
        wallSliding: false,
        
        // Power-Ups
        hasWallJump: false
    };

    let particles = [];
    let floatingTexts = [];
    let enemies = [];
    let items = [];
    let npcs = [];
    let crates = [];
    let spikes = [];
    let weatherParticles = [];
    
    let levelTasks = 0;
    let completedTasks = 0;
    let levelData = {};
    let activeDialog = null;
    let nearNPC = null;

    // --- LEVELS DESIGN (Verticalité, Puzzles & Boss) ---
    const levels = [
        {   // NIVEAU 1 : Matin (Tutoriel, Caisses, Boss Épouvantail)
            name: "Le Verger d'Entraînement", time: "morning", width: 2800, height: 800,
            goal: { x: 2650, y: 550, w: 80, h: 100 },
            checkpoints: [{ x: 1400, y: 540, w: 20, h: 60, active: false }],
            platforms: [
                { x: 0, y: 600, w: 1000, h: 200 }, // Sol initial
                { x: 1000, y: 500, w: 100, h: 300 }, // Mur qui nécessite une caisse
                { x: 1100, y: 600, w: 600, h: 200 }, // Arène Caisse
                { x: 1700, y: 600, w: 1100, h: 200 }, // Arène Boss
                { x: 500, y: 480, w: 120, h: 20 }, // Plateforme en l'air
            ],
            crates: [
                { x: 700, y: 550, w: 40, h: 40, vx: 0, vy: 0 } // Caisse à pousser
            ],
            spikes: [],
            tasks: [
                { x: 400, y: 580, w: 60, h: 20, type: 'grass', done: false, name: 'Tonte' },
                { x: 1300, y: 555, w: 50, h: 45, type: 'hedge', done: false, name: 'Taille' },
            ],
            npcs: [
                { x: 200, y: 564, w: 20, h: 36, color: '#f87171', name: "Mme. Rose", dialogs: ["Bonjour ! Bienvenue !", "Pour passer le grand mur, pousse la caisse.", "Marche simplement contre la caisse en bois !"] }
            ],
            enemies: [
                { x: 800, y: 576, w: 24, h: 24, type: 'snail', vx: 1, minX: 750, maxX: 950, dead: false }
            ],
            miniBoss: {
                x: 2000, y: 520, w: 40, h: 80, hp: 3, maxHp: 3, type: 'scarecrow', state: 'idle', timer: 0, dead: false,
                name: "L'ÉPOUVANTAIL", reward: "walljump"
            },
            items: []
        },
        {   // NIVEAU 2 : Midi (Puits, Wall-Jump, Ronces)
            name: "Les Falaises d'Argile", time: "midday", width: 2000, height: 1200,
            goal: { x: 1800, y: 200, w: 80, h: 100 }, // But tout en haut !
            checkpoints: [ { x: 800, y: 940, w: 20, h: 60, active: false } ],
            platforms: [
                { x: 0, y: 1000, w: 500, h: 200 }, // Sol bas
                { x: 500, y: 600, w: 50, h: 600 }, // Grand mur à escalader (Wall Jump)
                { x: 700, y: 400, w: 50, h: 800 }, // Mur opposé pour rebondir
                { x: 750, y: 1000, w: 500, h: 200 }, // Sol après le puits
                { x: 1300, y: 850, w: 100, h: 20 },
                { x: 1500, y: 700, w: 100, h: 20 },
                { x: 1700, y: 300, w: 300, h: 900 }, // Sol du Boss haut
            ],
            crates: [],
            spikes: [
                { x: 550, y: 1180, w: 150, h: 20, dir: 'up' } // Piques au fond du puits
            ],
            tasks: [
                { x: 300, y: 980, w: 80, h: 20, type: 'grass', done: false, name: 'Tonte' },
                { x: 1400, y: 805, w: 50, h: 45, type: 'hedge', done: false, name: 'Taille' },
            ],
            npcs: [
                { x: 100, y: 964, w: 20, h: 36, color: '#60a5fa', name: "M. Tulipe", dialogs: ["Félicitations pour tes Crampons !", "Saute vers un mur et maintiens la direction.", "Puis appuie sur SAUT pour rebondir !"] }
            ],
            enemies: [
                { x: 850, y: 976, w: 24, h: 24, type: 'frog', vx: 2, vy: 0, baseY: 976, minX: 800, maxX: 1200, dead: false }
            ],
            miniBoss: null,
            items: [ { x: 1340, y: 810, w: 20, h: 20, type: 'hp', collected: false } ]
        },
        {   // NIVEAU 3 : Nuit (Ambiance, Boss Final)
            name: "L'Antre de la Ronce", time: "night", width: 2500, height: 800,
            goal: { x: -1000, y: 0, w: 1, h: 1 }, 
            isBoss: true,
            platforms: [
                { x: 0, y: 600, w: 800, h: 200 },
                { x: 900, y: 600, w: 1600, h: 200 }, // Arène boss
                { x: 1200, y: 450, w: 100, h: 20 },
                { x: 1800, y: 450, w: 100, h: 20 },
            ],
            spikes: [{ x: 800, y: 780, w: 100, h: 20, dir: 'up' }],
            crates: [], tasks: [], npcs: [], enemies: [], items: [],
            boss: {
                x: 1500, y: 460, w: 100, h: 140, hp: 15, maxHp: 15, vx: -3, vy: 0, state: 'classic', timer: 0,
                name: "RONCE MUTANTE", phase: 1, invincible: false, arenaMin: 900, arenaMax: 2400
            }
        }
    ];

    function startGameUI() {
        gameContainer.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        currentLevelIdx = 0;
        player.hasWallJump = false;
        powerupUI.innerText = "";
        loadLevel(currentLevelIdx);
        gameLoop = requestAnimationFrame(update);
    }

    function closeGameUI() {
        gameContainer.classList.add('hidden');
        document.body.style.overflow = '';
        gameActive = false;
        cancelAnimationFrame(gameLoop);
    }

    closeBtn.addEventListener('click', closeGameUI);
    restartBtn.addEventListener('click', () => loadLevel(levelData.isBoss ? currentLevelIdx : 0));

    function loadLevel(idx) {
        currentLevelIdx = idx;
        levelData = JSON.parse(JSON.stringify(levels[idx])); 
        
        // On spawn le joueur au-dessus du sol
        player.x = player.spawnX = 50; 
        player.y = player.spawnY = levelData.platforms[0].y - 50;
        player.vx = 0; player.vy = 0;
        player.facingRight = true;
        player.hp = player.maxHp; player.invincibleTimer = 0;
        player.coyoteTimer = 0; player.jumpBufferTimer = 0;
        
        enemies = levelData.enemies || [];
        items = levelData.items || [];
        npcs = levelData.npcs || [];
        crates = levelData.crates || [];
        spikes = levelData.spikes || [];
        
        completedTasks = 0;
        levelTasks = levelData.tasks.length;
        particles = [];
        floatingTexts = [];
        weatherParticles = [];
        activeDialog = null; nearNPC = null;
        levelData.projectiles = [];
        
        // Initialisation Météo
        for(let i=0; i<50; i++) {
            weatherParticles.push({
                x: Math.random() * levelData.width,
                y: Math.random() * levelData.height,
                s: Math.random() * 2 + 0.5,
                a: Math.random() * Math.PI * 2
            });
        }
        
        if (levelData.isBoss) {
            levelData.boss.phase = 1;
            levelData.boss.state = 'classic';
        }
        
        document.getElementById('game-ui-level').innerText = "NIVEAU " + (idx + 1) + " - " + levelData.name;
        document.getElementById('game-ui-score').innerHTML = levelData.isBoss ? "BATTEZ LA RONCE !" : `TÂCHES: <span id="game-score" class="text-botanic-light text-xl">0/${levelTasks}</span>`;
        if(!levelData.isBoss) scoreElement = document.getElementById('game-score');
        
        gameOverScreen.classList.add('hidden');
        gameActive = true;
    }

    // --- UTILS ---
    function spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            particles.push({
                x: x + Math.random() * 20 - 10, y: y + Math.random() * 20 - 10,
                vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 1) * 8,
                life: 1.0, size: Math.random() * 6 + 3, color: color
            });
        }
    }

    function spawnText(x, y, text, color = '#fff', size = '18px') {
        floatingTexts.push({ x: x, y: y, text: text, life: 1.0, color: color, size: size });
    }

    function checkCollision(r1, r2) {
        return r1.x < r2.x + (r2.w || r2.width) && r1.x + (r1.width || r1.w) > r2.x &&
               r1.y < r2.y + (r2.h || r2.height) && r1.y + (r1.height || r1.h) > r2.y;
    }

    function showGameOver(title, desc, btnText, isWin = false) {
        gameActive = false;
        document.getElementById('game-end-title').innerText = title;
        document.getElementById('game-end-text').innerText = desc;
        restartBtn.innerText = btnText;
        
        if (isWin) {
            restartBtn.onclick = () => { closeGameUI(); };
        } else {
            restartBtn.onclick = () => loadLevel(currentLevelIdx);
        }
        gameOverScreen.classList.remove('hidden');
    }

    function handleDamage(amount, sourceX) {
        if (player.invincibleTimer > 0) return;
        player.hp -= amount;
        playSound('hit');
        screenShake = 10;
        player.invincibleTimer = 60;
        player.vx = (player.x < sourceX) ? -10 : 10;
        player.vy = -6;
        spawnParticles(player.x, player.y, '#ef4444', 15);
        
        if (player.hp <= 0) {
            showGameOver("Game Over", "Le jardin a repris ses droits.", "Réessayer");
        } else {
            spawnText(player.x, player.y - 20, "-1 PV", '#ef4444', '24px');
        }
    }

    // --- BOUCLE PRINCIPALE ---
    function update() {
        if (!gameActive) return;
        frameCount++;

        // Timers Game Feel
        if (player.coyoteTimer > 0) player.coyoteTimer--;
        if (player.jumpBufferTimer > 0) player.jumpBufferTimer--;
        if (player.invincibleTimer > 0) player.invincibleTimer--;
        
        player.squash += (1 - player.squash) * 0.2;
        player.stretch += (1 - player.stretch) * 0.2;

        // Interactions NPC (Touche E)
        nearNPC = null;
        for (let npc of npcs) {
            if (Math.abs((player.x + player.width/2) - (npc.x + npc.w/2)) < 80 && Math.abs(player.y - npc.y) < 60) nearNPC = npc;
        }
        
        if (nearNPC) {
            if (!activeDialog || activeDialog.npc !== nearNPC) {
                activeDialog = { npc: nearNPC, line: 0, showPrompt: true };
            }
            if (inputs.interactJustPressed) {
                if(activeDialog.showPrompt) activeDialog.showPrompt = false;
                else {
                    activeDialog.line++;
                    if (activeDialog.line >= nearNPC.dialogs.length) activeDialog = null;
                }
            }
        } else {
            activeDialog = null;
        }
        inputs.interactJustPressed = false;

        // --- PHYSIQUE DU JOUEUR (Mouvement H) ---
        let targetVx = 0;
        if (keys.left) { targetVx = -player.speed; player.facingRight = false; }
        if (keys.right) { targetVx = player.speed; player.facingRight = true; }
        
        // Inertie au sol, glissade en l'air
        player.vx += (targetVx - player.vx) * (player.grounded ? 0.2 : 0.1);
        player.x += player.vx;
        
        // Limites du niveau
        if (player.x < 0) { player.x = 0; player.vx = 0; }
        if (player.x + player.width > levelData.width) { player.x = levelData.width - player.width; player.vx = 0; }

        // --- COLLISIONS X ---
        player.touchingWallDir = 0;
        let obstacles = [...levelData.platforms, ...crates];
        
        for (let o of obstacles) {
            if (checkCollision(player, o)) {
                if (player.vx > 0) {
                    player.x = o.x - player.width; 
                    player.vx = 0;
                    player.touchingWallDir = 1;
                    // Pousser la caisse
                    if (o.vx !== undefined && player.grounded) o.vx = 2; 
                } else if (player.vx < 0) {
                    player.x = o.x + (o.w || o.width); 
                    player.vx = 0;
                    player.touchingWallDir = -1;
                    if (o.vx !== undefined && player.grounded) o.vx = -2;
                }
            }
        }

        // --- SAUT & WALL-JUMP ---
        if (inputs.jumpJustPressed) player.jumpBufferTimer = 8;
        inputs.jumpJustPressed = false;

        player.wallSliding = false;
        
        // Wall Slide
        if (player.hasWallJump && !player.grounded && player.vy > 0 && player.touchingWallDir !== 0) {
            // Doit presser la touche vers le mur pour glisser
            if ((player.touchingWallDir === 1 && keys.right) || (player.touchingWallDir === -1 && keys.left)) {
                player.wallSliding = true;
                player.vy = 2; // Glisse lentement
                if (frameCount % 5 === 0) spawnParticles(player.x + (player.touchingWallDir===1?player.width:0), player.y + 10, '#d4d4d8', 2);
            }
        }

        if (player.jumpBufferTimer > 0) {
            if (player.coyoteTimer > 0) {
                // Saut Normal
                playSound('jump');
                player.vy = player.jumpPower;
                player.coyoteTimer = 0; player.jumpBufferTimer = 0;
                player.squash = 0.6; player.stretch = 1.4;
                spawnParticles(player.x + 12, player.y + 32, '#d4d4d8', 8);
            } 
            else if (player.wallSliding || (player.hasWallJump && player.touchingWallDir !== 0 && !player.grounded)) {
                // Wall Jump
                playSound('jump');
                player.vy = player.jumpPower * 0.9;
                player.vx = player.touchingWallDir * -8; // Pousse dans la direction opposée
                player.facingRight = (player.touchingWallDir === -1);
                player.coyoteTimer = 0; player.jumpBufferTimer = 0;
                player.squash = 0.7; player.stretch = 1.3;
                spawnParticles(player.x + (player.touchingWallDir===1?player.width:0), player.y + 16, '#d4d4d8', 12);
            }
        }

        // --- PHYSIQUE DU JOUEUR (Mouvement V) ---
        if (!player.wallSliding) player.vy += gravity;
        if (player.vy > terminalVelocity) player.vy = terminalVelocity;
        
        player.y += player.vy;
        
        const wasGrounded = player.grounded;
        player.grounded = false;

        // --- COLLISIONS Y ---
        for (let o of obstacles) {
            if (checkCollision(player, o)) {
                if (player.vy > 0) {
                    player.y = o.y - player.height;
                    player.vy = 0;
                    player.grounded = true;
                    player.coyoteTimer = 10; // Reset Coyote Time au sol
                } else if (player.vy < 0) {
                    player.y = o.y + (o.h || o.height);
                    player.vy = 0;
                }
            }
        }

        // Gestion du Coyote Time en tombant d'un bord
        if (wasGrounded && !player.grounded && player.vy >= 0) {
            player.coyoteTimer = 10; 
        }

        if (!wasGrounded && player.grounded) {
            player.squash = 1.4; player.stretch = 0.6;
            spawnParticles(player.x + 12, player.y + 32, '#a8a29e', 6);
        }

        // --- PHYSIQUE DES CAISSES ---
        for (let c of crates) {
            c.vy += gravity;
            c.vx *= 0.8; // Friction au sol
            c.x += c.vx;
            // Collisions Caisse -> Plateformes (Y seulement pour simplifier)
            for (let p of levelData.platforms) {
                if (checkCollision(c, p) && c.vy > 0) {
                    c.y = p.y - c.h; c.vy = 0;
                }
            }
        }

        // --- DANGERS (Ronces/Spikes) & VIDE ---
        for (let s of spikes) {
            if (checkCollision(player, {x: s.x+4, y: s.y+4, w: s.w-8, h: s.h-8})) {
                handleDamage(1, s.x + s.w/2);
                // Propulse vers le haut
                player.vy = -12; 
            }
        }
        
        if (player.y > levelData.height + 200) {
            handleDamage(1, player.x);
            if (player.hp > 0) {
                player.x = player.spawnX; player.y = player.spawnY;
                player.vx = 0; player.vy = 0;
            }
        }

        // --- CAMERA 2D FLUIDE ---
        let targetCamX = player.x - canvas.width / 2 + player.width / 2;
        let targetCamY = player.y - canvas.height / 2 + 50; // Regarde un peu en bas
        
        // Blocage de la caméra aux bords du niveau
        if (targetCamX < 0) targetCamX = 0;
        if (targetCamX > levelData.width - canvas.width) targetCamX = levelData.width - canvas.width;
        if (targetCamY < 0) targetCamY = 0;
        if (targetCamY > levelData.height - canvas.height) targetCamY = levelData.height - canvas.height;
        
        cameraX += (targetCamX - cameraX) * 0.1;
        cameraY += (targetCamY - cameraY) * 0.1;

        if (screenShake > 0) {
            cameraX += (Math.random() - 0.5) * screenShake;
            cameraY += (Math.random() - 0.5) * screenShake;
            screenShake *= 0.9;
        }

        // --- PARTICULES ---
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += gravity * 0.5; p.life -= 0.02;
            if (p.life <= 0) particles.splice(i, 1);
        }
        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            let ft = floatingTexts[i];
            ft.y -= 1.0; ft.life -= 0.015;
            if (ft.life <= 0) floatingTexts.splice(i, 1);
        }

        // --- ITEMS & CHECKPOINTS ---
        for (let c of (levelData.checkpoints || [])) {
            if (!c.active && checkCollision(player, c)) {
                c.active = true;
                player.spawnX = c.x; player.spawnY = c.y - 20;
                playSound('coin');
                spawnParticles(c.x + 10, c.y, '#fde047', 30);
                spawnText(c.x, c.y - 30, "SAUVEGARDÉ !", '#fde047', '22px');
            }
        }

        for (let i = items.length - 1; i >= 0; i--) {
            let item = items[i];
            item.y += Math.sin(frameCount * 0.1) * 0.5;
            if (!item.collected && checkCollision(player, item)) {
                item.collected = true;
                playSound('coin');
                if (player.hp < player.maxHp) player.hp++;
                spawnParticles(item.x + 10, item.y + 10, '#ef4444', 25);
                items.splice(i, 1);
            }
        }

        // --- TÂCHES ---
        for (let t of levelData.tasks) {
            if (!t.done && checkCollision(player, t)) {
                t.done = true; completedTasks++;
                playSound('coin');
                if (scoreElement) scoreElement.innerText = `${completedTasks}/${levelTasks}`;
                spawnParticles(t.x + t.w/2, t.y + t.h/2, '#22c55e', 40);
            }
        }

        // --- ENNEMIS DE BASE ---
        for (let e of enemies) {
            if (e.dead) continue;
            
            if (e.type === 'snail') {
                e.x += e.vx;
                if (e.x < e.minX || e.x + e.w > e.maxX) e.vx *= -1;
            } else if (e.type === 'frog') {
                e.x += e.vx; e.vy += gravity; e.y += e.vy;
                if (e.y >= e.baseY) {
                    e.y = e.baseY; e.vy = 0;
                    if (Math.random() < 0.02) e.vy = -12;
                }
                if (e.x < e.minX || e.x + e.w > e.maxX) e.vx *= -1;
            }

            if (checkCollision(player, e) && player.invincibleTimer === 0) {
                // Sauter sur la tête
                if (player.vy > 0 && player.y + player.height < e.y + e.h/2 + 10) {
                    e.dead = true; player.vy = -10;
                    playSound('hit');
                    spawnParticles(e.x + e.w/2, e.y + e.h/2, '#fde047', 25);
                } else {
                    handleDamage(1, e.x + e.w/2);
                }
            }
        }

        // --- MINI-BOSS (Épouvantail) ---
        if (levelData.miniBoss && !levelData.miniBoss.dead) {
            let mb = levelData.miniBoss;
            mb.timer++;
            
            if (mb.state === 'idle') {
                if (Math.abs(player.x - mb.x) < 300) mb.state = 'attack';
            } else if (mb.state === 'attack') {
                // L'épouvantail lance une faux tournoyante
                if (mb.timer % 100 === 0) {
                    levelData.projectiles.push({ x: mb.x, y: mb.y + 40, vx: -5, vy: 0, size: 15, color: '#9ca3af', type: 'scythe' });
                    playSound('hit');
                }
            }
            
            if (checkCollision(player, mb) && player.invincibleTimer === 0) {
                if (player.vy > 0 && player.y + player.height < mb.y + 30) {
                    mb.hp--; player.vy = -12;
                    playSound('hit');
                    spawnParticles(mb.x + mb.w/2, mb.y, '#fde047', 30);
                    if (mb.hp <= 0) {
                        mb.dead = true;
                        screenShake = 15;
                        spawnText(mb.x, mb.y - 40, "VAINCU !", '#22c55e', '30px');
                        // Récompense Power-Up
                        if (mb.reward === 'walljump') {
                            player.hasWallJump = true;
                            powerupUI.innerText = "NOUVEAU: CRAMPONS D'ÉLAGAGE (Maintiens direction sur un mur + Saut)";
                            playSound('coin');
                        }
                    }
                } else {
                    handleDamage(1, mb.x + mb.w/2);
                }
            }
        }

        // --- BOSS FINAL ---
        if (levelData.isBoss && levelData.boss.hp > 0) {
            let b = levelData.boss;
            b.timer++;
            b.x += b.vx;
            if (b.x < b.arenaMin || b.x + b.w > b.arenaMax) b.vx *= -1;
            
            // Attaque saut + Onde de choc
            if (b.timer % 120 === 0 && b.y >= 600 - b.h - 10) {
                b.vy = -16;
            }
            if (b.y < 600 - b.h) {
                b.vy += gravity; b.y += b.vy;
            } else {
                if (b.vy > 5) {
                    screenShake = 15; playSound('boss_hit');
                    levelData.projectiles.push({ x: b.x + b.w/2, y: 600 - 10, vx: 5, vy: 0, size: 15, color: '#991b1b', type: 'shockwave' });
                    levelData.projectiles.push({ x: b.x + b.w/2, y: 600 - 10, vx: -5, vy: 0, size: 15, color: '#991b1b', type: 'shockwave' });
                }
                b.y = 600 - b.h; b.vy = 0;
            }

            if (checkCollision(player, b) && player.invincibleTimer === 0) {
                if (player.vy > 0 && player.y + player.height < b.y + 40) {
                    b.hp--; player.vy = -16;
                    screenShake = 20; playSound('boss_hit');
                    spawnParticles(b.x + b.w/2, b.y, '#dc2626', 50);
                    if (b.hp <= 0) return showGameOver("VICTOIRE !", "Tu as purifié le jardin.", "Terminer", true);
                } else {
                    handleDamage(1, b.x + b.w/2);
                }
            }
        }

        // Projectiles
        for (let i = levelData.projectiles.length - 1; i >= 0; i--) {
            let p = levelData.projectiles[i];
            p.x += p.vx; p.y += p.vy;
            if (checkCollision(player, {x: p.x-p.size, y: p.y-p.size, w: p.size*2, h: p.size*2}) && player.invincibleTimer === 0) {
                handleDamage(1, p.x);
                levelData.projectiles.splice(i, 1);
            }
        }

        // Condition de victoire du niveau
        if (!levelData.isBoss && checkCollision(player, levelData.goal)) {
            if (completedTasks >= levelTasks) {
                if (currentLevelIdx < levels.length - 1) return loadLevel(currentLevelIdx + 1);
            } else {
                if (frameCount % 60 === 0) spawnText(player.x, player.y - 40, "Il reste des tâches !", '#ef4444');
            }
        }

        draw();
        gameLoop = requestAnimationFrame(update);
    }

    // --- RENDU GRAPHIQUE ---
    function draw() {
        const time = levelData.time;
        
        // 1. Fond
        let skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        if (time === 'morning') { skyGrad.addColorStop(0, '#0ea5e9'); skyGrad.addColorStop(1, '#e0f2fe'); }
        else if (time === 'midday') { skyGrad.addColorStop(0, '#0284c7'); skyGrad.addColorStop(1, '#bae6fd'); }
        else { skyGrad.addColorStop(0, '#1e1b4b'); skyGrad.addColorStop(1, '#4c1d95'); }
        ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        
        // Parallax simple
        ctx.translate(-cameraX * 0.2, -cameraY * 0.1);
        ctx.fillStyle = time === 'night' ? '#312e81' : '#7dd3fc';
        for(let i=0; i<levelData.width; i+=400) {
            ctx.beginPath(); ctx.arc(i+200, 500, 150, 0, Math.PI, true); ctx.fill();
        }
        ctx.restore();

        // 2. Monde du jeu (Caméra X & Y)
        ctx.save();
        ctx.translate(-cameraX, -cameraY);

        // Checkpoints
        for (let c of (levelData.checkpoints || [])) {
            ctx.fillStyle = '#78350f'; ctx.fillRect(c.x + 8, c.y, 4, c.h);
            ctx.fillStyle = c.active ? '#22c55e' : '#ef4444';
            ctx.beginPath(); ctx.moveTo(c.x + 12, c.y + 2); ctx.lineTo(c.x + 35, c.y + 12); ctx.lineTo(c.x + 12, c.y + 22); ctx.fill();
        }

        // Ronces / Spikes
        ctx.fillStyle = '#b91c1c';
        for (let s of spikes) {
            for(let i=0; i<s.w; i+=10) {
                ctx.beginPath(); ctx.moveTo(s.x + i, s.y + s.h); ctx.lineTo(s.x + i + 5, s.y); ctx.lineTo(s.x + i + 10, s.y + s.h); ctx.fill();
            }
        }

        // Plateformes
        for (let p of levelData.platforms) {
            ctx.fillStyle = time === 'night' ? '#1e293b' : '#78350f'; 
            ctx.fillRect(p.x, p.y + 12, p.w, p.h - 12);
            ctx.fillStyle = time === 'night' ? '#0f172a' : '#451a03';
            for(let i=0; i<p.w; i+=40) { if(i+10<p.w) ctx.fillRect(p.x + i, p.y + 25, 10, p.h-30); }
            
            // Herbe au dessus
            ctx.fillStyle = time === 'night' ? '#064e3b' : '#22c55e';
            ctx.fillRect(p.x, p.y, p.w, 15);
        }

        // Caisses
        ctx.fillStyle = '#b45309';
        for (let c of crates) {
            ctx.fillRect(c.x, c.y, c.w, c.h);
            ctx.strokeStyle = '#78350f'; ctx.lineWidth = 3; ctx.strokeRect(c.x, c.y, c.w, c.h);
            ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x+c.w, c.y+c.h); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(c.x+c.w, c.y); ctx.lineTo(c.x, c.y+c.h); ctx.stroke();
        }

        // Tâches
        for (let t of levelData.tasks) {
            if (t.type === 'grass') {
                ctx.fillStyle = t.done ? '#4ade80' : '#166534';
                let sway = Math.sin(frameCount * 0.05 + t.x) * (t.done ? 1 : 5);
                let yOff = t.done ? t.h - 8 : 0;
                for(let i=0; i<t.w; i+=12) {
                    ctx.beginPath(); ctx.moveTo(t.x + i, t.y + t.h); ctx.lineTo(t.x + i + 6 + sway, t.y + yOff); ctx.lineTo(t.x + i + 12, t.y + t.h); ctx.fill();
                }
            } else if (t.type === 'hedge') {
                ctx.fillStyle = t.done ? '#15803d' : '#14532d';
                ctx.fillRect(t.x, t.y + 20, t.w, t.h - 20);
                if (!t.done) {
                    ctx.beginPath(); ctx.arc(t.x+25, t.y+20, 25, 0, Math.PI*2); ctx.fill();
                }
            }
        }

        // NPCs
        for(let npc of npcs) {
            ctx.fillStyle = npc.color; ctx.fillRect(npc.x, npc.y, npc.w, npc.h);
            ctx.fillStyle = '#fff'; ctx.fillRect(npc.x + 4, npc.y + 8, 4, 4); ctx.fillRect(npc.x + 12, npc.y + 8, 4, 4);
        }

        // Ennemis & Boss
        for(let e of enemies) {
            if(e.dead) continue;
            ctx.fillStyle = e.type === 'snail' ? '#ca8a04' : '#4ade80';
            ctx.fillRect(e.x, e.y, e.w, e.h);
            ctx.fillStyle = '#000'; ctx.fillRect(e.x+4, e.y+4, 4,4);
        }

        if (levelData.miniBoss && !levelData.miniBoss.dead) {
            let mb = levelData.miniBoss;
            ctx.fillStyle = '#d97706'; ctx.fillRect(mb.x+15, mb.y+30, 10, 50); // Bâton
            ctx.fillStyle = '#fef08a'; ctx.fillRect(mb.x, mb.y, mb.w, 30); // Tête
            ctx.fillStyle = '#000'; ctx.fillRect(mb.x+10, mb.y+10, 5,5); ctx.fillRect(mb.x+25, mb.y+10, 5,5);
        }

        if (levelData.isBoss && levelData.boss.hp > 0) {
            let b = levelData.boss;
            ctx.fillStyle = '#064e3b';
            ctx.beginPath(); ctx.arc(b.x+b.w/2, b.y+b.h/2, b.w/2, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#ef4444';
            ctx.beginPath(); ctx.arc(b.x+30, b.y+40, 10, 0, Math.PI*2); ctx.arc(b.x+b.w-30, b.y+40, 10, 0, Math.PI*2); ctx.fill();
        }

        for (let p of levelData.projectiles) {
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
        }

        // Items
        for(let item of items) {
            ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(item.x+10, item.y+10, 8, 0, Math.PI*2); ctx.fill();
        }

        // Joueur
        if (player.invincibleTimer % 4 < 2) { 
            ctx.save();
            ctx.translate(player.x + player.width/2, player.y + player.height);
            if (!player.facingRight) ctx.scale(-1, 1);
            ctx.scale(player.squash, player.stretch);
            
            // Corps principal (salopette)
            ctx.fillStyle = player.hasWallJump ? '#0284c7' : '#84cc16'; // Devient bleu avec l'upgrade
            ctx.fillRect(-12, -28, 24, 20);
            
            // Tête
            ctx.fillStyle = '#fca5a5';
            ctx.beginPath(); ctx.arc(0, -38, 10, 0, Math.PI*2); ctx.fill();
            
            // Casquette
            ctx.fillStyle = '#166534';
            ctx.beginPath(); ctx.arc(0, -40, 10, Math.PI, 0); ctx.fill(); 
            ctx.fillRect(0, -40, 15, 4);

            // Crampons visuels si wall jump possédé
            if (player.hasWallJump) {
                ctx.fillStyle = '#94a3b8';
                ctx.fillRect(-14, -8, 6, 8); // Crampon talon
            }

            // Effet de glissade
            if (player.wallSliding) {
                ctx.rotate(-0.2); // Se penche contre le mur
            }

            ctx.restore();
        }

        // Particules
        for (let p of particles) {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }

        // Météo dynamique
        ctx.fillStyle = time === 'morning' ? 'rgba(255,255,255,0.6)' : (time === 'night' ? 'rgba(253, 224, 71, 0.8)' : 'rgba(250, 204, 21, 0.5)');
        for (let wp of weatherParticles) {
            wp.x += Math.sin(frameCount*0.05 + wp.a) * 0.5;
            wp.y += (time === 'night' ? -0.5 : 0.5); // Lucioles montent, autres descendent
            if (wp.y > levelData.height) wp.y = 0;
            if (wp.y < 0) wp.y = levelData.height;
            ctx.beginPath(); ctx.arc(wp.x, wp.y, wp.s, 0, Math.PI*2); ctx.fill();
        }

        ctx.restore(); // Fin Caméra

        // 3. Post-Processing & UI
        
        // Masque de Nuit (Éclairage dynamique centré sur le joueur)
        if (time === 'night') {
            let screenPlayerX = player.x + player.width/2 - cameraX;
            let screenPlayerY = player.y + player.height/2 - cameraY;
            
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.globalCompositeOperation = 'destination-out';
            let grad = ctx.createRadialGradient(screenPlayerX, screenPlayerY, 50, screenPlayerX, screenPlayerY, 250);
            grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(screenPlayerX, screenPlayerY, 250, 0, Math.PI*2); ctx.fill();
            ctx.restore();
        }

        ctx.textAlign = "center";
        for (let ft of floatingTexts) {
            ctx.font = `bold ${ft.size} Arial`; ctx.fillStyle = ft.color; ctx.globalAlpha = ft.life;
            ctx.fillText(ft.text, ft.x - cameraX, ft.y - cameraY); ctx.globalAlpha = 1.0;
        }

        // Bulles de dialogue
        if (activeDialog) {
            let npc = activeDialog.npc;
            let cx = (npc.x + npc.w/2) - cameraX; let cy = npc.y - 45 - cameraY;
            ctx.fillStyle = 'rgba(255,255,255,0.95)';
            ctx.fillRect(cx - 120, cy - 50, 240, 60);
            ctx.fillStyle = '#1c1917'; ctx.font = "bold 14px Arial"; ctx.fillText(npc.name, cx, cy - 30);
            ctx.fillStyle = '#44403c'; ctx.font = "14px Arial"; 
            if (activeDialog.showPrompt) ctx.fillText("Appuyez sur 'E' pour parler", cx, cy - 10);
            else ctx.fillText(npc.dialogs[activeDialog.line], cx, cy - 10);
        }

        // HP UI
        ctx.fillStyle = '#ef4444'; ctx.textAlign = "left"; ctx.font = "24px Arial";
        ctx.fillText("❤️".repeat(player.hp), 15, 30);
    }

    // --- CONTRÔLES (Clavier & Tactile) ---
    function handleKey(key, isDown, e) {
        if (!gameActive) return;
        const k = key.toLowerCase();
        if(["arrowup","arrowdown","arrowleft","arrowright"," ","e"].includes(k) || ["z","q","s","d"].includes(k)) if(e) e.preventDefault();
        
        if (k === 'arrowleft' || k === 'q') keys.left = isDown;
        if (k === 'arrowright' || k === 'd') keys.right = isDown;
        if (k === 'arrowup' || k === 'z' || k === ' ') {
            if (isDown && !keys.jump) inputs.jumpJustPressed = true;
            keys.jump = isDown;
        }
        if (k === 'e' || key === 'Enter') {
            if (isDown && !keys.interact) inputs.interactJustPressed = true;
            keys.interact = isDown;
        }
    }

    document.addEventListener('keydown', (e) => handleKey(e.key, true, e));
    document.addEventListener('keyup', (e) => handleKey(e.key, false, e));

    // Contrôles Mobiles
    const btnMap = {
        'btn-left': 'ArrowLeft', 'btn-right': 'ArrowRight', 
        'btn-jump': 'Space', 'btn-interact': 'e'
    };

    for (let id in btnMap) {
        let btn = document.getElementById(id);
        if(!btn) continue;
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); initAudio(); handleKey(btnMap[id], true, null); });
        btn.addEventListener('touchend', (e) => { e.preventDefault(); handleKey(btnMap[id], false, null); });
    }
});