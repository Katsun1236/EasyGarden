// Injection de l'interface du jeu dans le body
const gameHTML = `
<div id="easter-egg-game-container" class="fixed inset-0 bg-stone-950 z-[100] hidden flex-col items-center justify-center p-0 md:p-4 font-sans">
    <button id="close-game-btn" class="absolute top-4 right-4 md:top-6 md:right-6 text-white text-3xl focus:outline-none hover:text-botanic transition-colors z-[101]" aria-label="Fermer le jeu"><i class="fa-solid fa-times"></i></button>
    <div class="text-center mb-2 md:mb-4">
        <h2 class="font-serif text-3xl md:text-5xl text-white mb-1 md:mb-2" style="text-shadow: 0 0 15px rgba(114,138,100,0.8);"><span class="text-botanic-light">Super</span> Jardinier !</h2>
        <p class="text-stone-400 text-xs md:text-sm tracking-widest">FLÈCHES ou ZQSD: Bouger | ESPACE/Z/HAUT: Sauter | E: Interagir</p>
    </div>
    <div class="relative bg-stone-900 p-1 md:p-2 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-stone-700 overflow-hidden w-full max-w-4xl">
        <div class="absolute top-4 left-6 text-white font-bold tracking-widest z-10 drop-shadow-md" id="game-ui-score">TÂCHES: <span id="game-score" class="text-botanic-light text-xl">0/0</span></div>
        <div class="absolute top-4 right-6 text-white font-bold tracking-widest z-10 text-right drop-shadow-md" id="game-ui-level">NIVEAU 1</div>
        <div id="game-over-screen" class="absolute inset-0 bg-stone-900/80 backdrop-blur-sm flex flex-col items-center justify-center hidden rounded-lg z-30 transition-all">
            <h3 id="game-end-title" class="font-serif text-4xl md:text-5xl text-white mb-4 drop-shadow-lg text-center">Chantier terminé !</h3>
            <p id="game-end-text" class="text-stone-300 mb-8 text-lg md:text-xl text-center max-w-md font-light">Le jardin est parfait.</p>
            <button id="restart-game-btn" class="glow-btn px-8 py-4 bg-botanic text-white uppercase tracking-widest text-sm font-bold hover:bg-botanic-dark transition-all rounded-full shadow-[0_0_20px_rgba(114,138,100,0.5)]">Rejouer</button>
        </div>
        <canvas id="gameCanvas" width="900" height="500" class="w-full h-auto bg-[#87CEEB] rounded-lg shadow-inner block" style="image-rendering: auto;"></canvas>
    </div>
</div>
`;
document.body.insertAdjacentHTML('beforeend', gameHTML);

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
    let scoreElement = document.getElementById('game-score');
    const gameOverScreen = document.getElementById('game-over-screen');

    // --- GAME ENGINE ---
    const keys = { left: false, right: false, jump: false, interact: false, jumpJustPressed: false, interactJustPressed: false };
    let gameLoop;
    let gameActive = false;
    let currentLevelIdx = 0;
    let cameraX = 0;
    let frameCount = 0;
    
    // Physics
    const gravity = 0.55;
    const friction = 0.8;
    const groundY = 450;

    const player = {
        x: 50, y: 200, width: 24, height: 32,
        vx: 0, vy: 0, speed: 6, jumpPower: -12.5,
        grounded: false, facingRight: true,
        squash: 1, stretch: 1, hp: 5, maxHp: 5, invincibleTimer: 0,
        jumps: 0, spawnX: 50, spawnY: 200
    };

    let particles = [];
    let floatingTexts = [];
    let enemies = [];
    let items = [];
    let npcs = [];
    let levelTasks = 0;
    let completedTasks = 0;
    let levelData = {};
    let activeDialog = null;
    let nearNPC = null;

    const clouds = Array.from({length: 15}, () => ({
        x: Math.random() * 4000, y: Math.random() * 200, s: Math.random() * 0.3 + 0.1, size: Math.random() * 15 + 20
    }));

    // --- LEVELS DESIGN (Less holes, more enemies) ---
    const levels = [
        {   // NIVEAU 1 : Matin (Tutoriel, aucun trou)
            name: "Le Jardin Paisible", time: "morning", width: 2500,
            goal: { x: 2350, y: groundY - 100, w: 80, h: 100 },
            checkpoints: [],
            platforms: [
                { x: 0, y: groundY, w: 2500, h: 60 }, // Sol continu
                { x: 500, y: 340, w: 150, h: 20 },
                { x: 1200, y: 310, w: 150, h: 20 },
                { x: 1800, y: 340, w: 150, h: 20 },
            ],
            water: [],
            tasks: [
                { x: 600, y: groundY - 20, w: 60, h: 20, type: 'grass', done: false, name: 'Tonte' },
                { x: 800, y: groundY - 45, w: 50, h: 45, type: 'hedge', done: false, name: 'Taille' },
                { x: 1250, y: 310 - 45, w: 50, h: 45, type: 'hedge', done: false, name: 'Taille' },
                { x: 1500, y: groundY - 20, w: 80, h: 20, type: 'grass', done: false, name: 'Tonte' },
                { x: 1850, y: 340 - 120, w: 40, h: 20, type: 'branch', done: false, trunkX: 1880, trunkY: 340, name: 'Élagage' },
            ],
            npcs: [
                { x: 200, y: groundY - 36, w: 20, h: 36, color: '#f87171', name: "Mme. Rose", dialogs: ["Bonjour ! Bienvenue dans mon jardin !", "Utilisez ZQSD ou les flèches pour bouger.", "ESPACE pour sauter, et appuyez deux fois pour le DOUBLE SAUT !", "Tondez l'herbe et taillez mes haies SVP !"] }
            ],
            enemies: [
                { x: 900, y: groundY - 24, w: 24, h: 24, type: 'snail', vx: 1, minX: 850, maxX: 1100, dead: false }
            ], items: []
        },
        {   // NIVEAU 2 : Midi (Nouveaux ennemis : Grenouilles)
            name: "L'invasion des Batraciens", time: "midday", width: 3500,
            goal: { x: 3350, y: groundY - 100, w: 80, h: 100 },
            checkpoints: [ { x: 1500, y: groundY - 60, w: 20, h: 60, active: false } ],
            platforms: [
                { x: 0, y: groundY, w: 1000, h: 60 },
                { x: 1100, y: groundY, w: 2400, h: 60 }, // Un seul petit trou de 100px
                { x: 600, y: 320, w: 150, h: 20, type: 'moving', minX: 550, maxX: 850, vx: 2.5 },
                { x: 1300, y: 290, w: 100, h: 20 },
                { x: 1800, y: groundY - 20, w: 80, h: 20, type: 'bouncy' },
                { x: 1850, y: 150, w: 150, h: 20 },
            ],
            water: [],
            tasks: [
                { x: 400, y: groundY - 20, w: 80, h: 20, type: 'grass', done: false, name: 'Tonte' },
                { x: 1350, y: 290 - 45, w: 50, h: 45, type: 'hedge', done: false, name: 'Taille' },
                { x: 1850, y: 150 - 120, w: 40, h: 20, type: 'branch', done: false, trunkX: 1880, trunkY: 150, name: 'Élagage' },
                { x: 2800, y: groundY - 45, w: 60, h: 45, type: 'hedge', done: false, name: 'Taille' }
            ],
            npcs: [
                { x: 100, y: groundY - 36, w: 20, h: 36, color: '#60a5fa', name: "M. Tulipe", dialogs: ["Il y a des grenouilles partout !", "Elles sautent haut, faites très attention.", "Sautez-leur sur la tête pour vous en débarrasser."] }
            ],
            enemies: [
                { x: 700, y: groundY - 24, w: 24, h: 24, type: 'snail', vx: 1.5, minX: 650, maxX: 950, dead: false },
                { x: 1500, y: groundY - 24, w: 24, h: 24, type: 'frog', vx: -1.5, vy: 0, baseY: groundY - 24, minX: 1300, maxX: 1700, dead: false },
                { x: 2200, y: groundY - 24, w: 24, h: 24, type: 'frog', vx: 2, vy: 0, baseY: groundY - 24, minX: 2000, maxX: 2500, dead: false },
                { x: 2600, y: groundY - 24, w: 24, h: 24, type: 'snail', vx: -2, minX: 2400, maxX: 2900, dead: false }
            ],
            items: [ { x: 1900, y: 110, w: 20, h: 20, type: 'hp', collected: false } ]
        },
        {   // NIVEAU 3 : Après-Midi (Abeilles et un peu d'eau)
            name: "Le Ruché Agité", time: "afternoon", width: 4000,
            goal: { x: 3800, y: groundY - 100, w: 80, h: 100 },
            checkpoints: [ { x: 1800, y: groundY - 60, w: 20, h: 60, active: false } ],
            platforms: [
                { x: 0, y: groundY, w: 1200, h: 60 },
                { x: 1200, y: 350, w: 200, h: 20, type: 'fragile', timer: 0, state: 'idle' }, // Pont sur l'eau
                { x: 1400, y: groundY, w: 2600, h: 60 },
                { x: 800, y: 250, w: 100, h: 20 },
                { x: 2200, y: 280, w: 100, h: 20, type: 'moving', minX: 2200, maxX: 2600, vx: 3 },
                { x: 2900, y: 220, w: 100, h: 20, type: 'bouncy' }
            ],
            water: [ { x: 1200, y: groundY + 10, w: 200, h: 50 } ], // Un seul bassin
            tasks: [
                { x: 1000, y: groundY - 20, w: 80, h: 20, type: 'grass', done: false, name: 'Tonte' },
                { x: 1600, y: groundY - 45, w: 60, h: 45, type: 'hedge', done: false, name: 'Taille' },
                { x: 2900, y: 220 - 120, w: 40, h: 20, type: 'branch', done: false, trunkX: 2930, trunkY: 220, name: 'Élagage' },
                { x: 3400, y: groundY - 45, w: 60, h: 45, type: 'hedge', done: false, name: 'Taille' }
            ],
            npcs: [
                { x: 200, y: groundY - 36, w: 20, h: 36, color: '#fcd34d', name: "L'Apprenti", dialogs: ["Chef ! J'ai laissé les ruches ouvertes !", "Des abeilles géantes volent partout.", "Esquivez-les ! Et attention au petit étang."] }
            ],
            enemies: [
                { x: 600, y: 200, w: 24, h: 24, type: 'bee', vx: 2, baseY: 200, minX: 500, maxX: 900, dead: false },
                { x: 1500, y: groundY - 24, w: 24, h: 24, type: 'frog', vx: -1.5, vy: 0, baseY: groundY - 24, minX: 1450, maxX: 1900, dead: false },
                { x: 2400, y: 150, w: 24, h: 24, type: 'bee', vx: -2.5, baseY: 150, minX: 2000, maxX: 2600, dead: false },
                { x: 3200, y: groundY - 24, w: 24, h: 24, type: 'snail', vx: -2, minX: 3000, maxX: 3600, dead: false }
            ],
            items: [ { x: 840, y: 200, w: 20, h: 20, type: 'hp', collected: false } ]
        },
        {   // NIVEAU 4 : Crépuscule (Danger)
            name: "La Lisière Sombre", time: "sunset", width: 4000,
            goal: { x: 3800, y: groundY - 100, w: 80, h: 100 },
            checkpoints: [ { x: 1800, y: groundY - 60, w: 20, h: 60, active: false } ],
            platforms: [
                { x: 0, y: groundY, w: 1500, h: 60 },
                { x: 1650, y: groundY, w: 2350, h: 60 }, // Un seul saut
                { x: 600, y: 340, w: 80, h: 20, type: 'moving', minX: 600, maxX: 900, vx: 3.5 },
                { x: 1200, y: 250, w: 80, h: 20, type: 'fragile', timer: 0, state: 'idle' },
                { x: 2400, y: groundY - 20, w: 80, h: 20, type: 'bouncy' },
                { x: 2600, y: 150, w: 100, h: 20 },
            ],
            water: [], // Plus d'eau au niveau 4 !
            tasks: [
                { x: 400, y: groundY - 20, w: 60, h: 20, type: 'grass', done: false, name: 'Tonte' },
                { x: 1400, y: groundY - 45, w: 50, h: 45, type: 'hedge', done: false, name: 'Taille' },
                { x: 2000, y: groundY - 120, w: 40, h: 20, type: 'branch', done: false, trunkX: 2030, trunkY: groundY, name: 'Élagage' },
                { x: 2630, y: 150 - 45, w: 50, h: 45, type: 'hedge', done: false, name: 'Taille' },
                { x: 3300, y: groundY - 120, w: 40, h: 20, type: 'branch', done: false, trunkX: 3330, trunkY: groundY, name: 'Élagage' }
            ],
            npcs: [
                { x: 100, y: groundY - 36, w: 20, h: 36, color: '#a78bfa', name: "Vieux Chêne", dialogs: ["La nuit tombe... Les bêtes sont nombreuses.", "Préparez votre meilleur sécateur, artisan !", "La Ronce Mutante est juste derrière."] }
            ],
            enemies: [
                { x: 800, y: 180, w: 24, h: 24, type: 'bee', vx: 3, baseY: 180, minX: 600, maxX: 1100, dead: false },
                { x: 1700, y: groundY - 24, w: 24, h: 24, type: 'frog', vx: 2, vy: 0, baseY: groundY - 24, minX: 1600, maxX: 2100, dead: false },
                { x: 2800, y: groundY - 24, w: 24, h: 24, type: 'snail', vx: -3, minX: 2700, maxX: 3200, dead: false },
                { x: 3400, y: 150, w: 24, h: 24, type: 'bee', vx: -3, baseY: 150, minX: 3000, maxX: 3600, dead: false }
            ],
            items: [ { x: 2640, y: 110, w: 20, h: 20, type: 'hp', collected: false } ]
        },
        {   // NIVEAU 5 : Nuit (BOSS)
            name: "L'Antre de la Ronce", time: "night", width: 1200,
            goal: { x: -1000, y: 0, w: 1, h: 1 }, 
            isBoss: true,
            platforms: [
                { x: 0, y: groundY, w: 1200, h: 60 },
                { x: 200, y: 300, w: 120, h: 20 },
                { x: 880, y: 300, w: 120, h: 20 },
                { x: 540, y: 200, w: 120, h: 20 }, 
            ],
            water: [], tasks: [], enemies: [], items: [], npcs: [],
            boss: {
                x: 900, y: groundY - 140, w: 100, h: 140, hp: 7, maxHp: 7, vx: -4, state: 'move', timer: 0,
                name: "RONCE MUTANTE"
            }
        }
    ];

    function startGameUI() {
        gameContainer.classList.remove('hidden');
        gameContainer.classList.add('flex');
        document.body.style.overflow = 'hidden';
        currentLevelIdx = 0;
        loadLevel(currentLevelIdx);
    }

    function closeGameUI() {
        gameContainer.classList.add('hidden');
        gameContainer.classList.remove('flex');
        document.body.style.overflow = '';
        gameActive = false;
        cancelAnimationFrame(gameLoop);
    }

    closeBtn.addEventListener('click', closeGameUI);
    restartBtn.addEventListener('click', () => loadLevel(levelData.isBoss ? currentLevelIdx : 0));

    function loadLevel(idx) {
        currentLevelIdx = idx;
        levelData = JSON.parse(JSON.stringify(levels[idx])); 
        player.x = player.spawnX = 50; 
        player.y = player.spawnY = 200;
        player.vx = 0; player.vy = 0;
        player.facingRight = true;
        player.hp = player.maxHp; player.invincibleTimer = 0;
        player.jumps = 0;
        
        enemies = levelData.enemies || [];
        items = levelData.items || [];
        npcs = levelData.npcs || [];
        completedTasks = 0;
        levelTasks = levelData.tasks.length;
        particles = [];
        floatingTexts = [];
        activeDialog = null;
        nearNPC = null;
        
        document.getElementById('game-ui-level').innerText = "NIVEAU " + (idx + 1) + " - " + levelData.name;
        document.getElementById('game-ui-score').innerHTML = levelData.isBoss ? "BATTEZ LA RONCE !" : `TÂCHES: <span id="game-score" class="text-botanic-light text-xl">0/${levelTasks}</span>`;
        if(!levelData.isBoss) scoreElement = document.getElementById('game-score');
        
        gameOverScreen.classList.add('hidden');
        gameActive = true;
        cancelAnimationFrame(gameLoop);
        update();
    }

    function spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            particles.push({
                x: x + Math.random() * 20 - 10, y: y + Math.random() * 20 - 10,
                vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 1) * 10,
                life: 1.0, size: Math.random() * 6 + 3, rot: Math.random() * Math.PI * 2, vrot: (Math.random() - 0.5) * 0.4,
                color: color
            });
        }
    }

    function spawnText(x, y, text, color = '#fff', size = '18px') {
        floatingTexts.push({ x: x, y: y, text: text, life: 1.0, color: color, size: size });
    }

    function checkCollision(r1, r2) {
        return r1.x < r2.x + r2.w && r1.x + r1.width > r2.x &&
               r1.y < r2.y + r2.h && r1.y + r1.height > r2.y;
    }

    function showGameOver(title, desc, btnText, isWin = false) {
        gameActive = false;
        document.getElementById('game-end-title').innerText = title;
        document.getElementById('game-end-text').innerText = desc;
        restartBtn.innerText = btnText;
        
        if (isWin) {
            restartBtn.onclick = () => {
                const cursorSVG = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' style='font-size:24px'><text y='24'>🚜</text></svg>"), auto`;
                document.body.style.cursor = cursorSVG;
                document.querySelectorAll('a, button, input, .cursor-pointer').forEach(el => {
                    el.style.cursor = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' style='font-size:24px'><text y='24'>✂️</text></svg>"), pointer`;
                });
                closeGameUI();
            };
        } else {
            restartBtn.onclick = () => loadLevel(currentLevelIdx);
        }
        gameOverScreen.classList.remove('hidden');
    }

    function handleFallDeath(title, desc) {
        player.hp--;
        if (player.hp <= 0) {
            showGameOver("Game Over", desc, "Réessayer");
            return true;
        }
        player.x = player.spawnX; player.y = player.spawnY;
        player.vx = 0; player.vy = 0; player.invincibleTimer = 60;
        cameraX = player.x - canvas.width / 2;
        spawnText(player.x, player.y - 20, "-1 PV", '#ef4444', '24px');
        return false;
    }

    function update() {
        if (!gameActive) return;
        frameCount++;

        // Interactions NPC (Touche E)
        nearNPC = null;
        for (let npc of npcs) {
            let dist = Math.abs((player.x + player.width/2) - (npc.x + npc.w/2));
            if (dist < 100 && Math.abs(player.y - npc.y) < 60) nearNPC = npc;
        }
        
        if (nearNPC) {
            if (!activeDialog || activeDialog.npc !== nearNPC) {
                activeDialog = { npc: nearNPC, line: 0, showPrompt: true };
            }
            if (keys.interactJustPressed) {
                if(activeDialog.showPrompt) {
                    activeDialog.showPrompt = false;
                } else {
                    activeDialog.line++;
                    if (activeDialog.line >= nearNPC.dialogs.length) activeDialog = null; // Fin du dialogue
                }
            }
        } else {
            activeDialog = null;
        }
        keys.interactJustPressed = false; // Reset immédiat

        // Clouds animation
        clouds.forEach(c => { c.x -= c.s; if(c.x < -200) c.x = levelData.width + 200; });

        // Player timers & physics
        if (player.invincibleTimer > 0) player.invincibleTimer--;
        player.squash += (1 - player.squash) * 0.2;
        player.stretch += (1 - player.stretch) * 0.2;

        if (keys.left) { player.vx -= 1.0; player.facingRight = false; }
        if (keys.right) { player.vx += 1.0; player.facingRight = true; }
        player.vx *= friction;
        player.vy += gravity;

        if (player.grounded) player.jumps = 0;
        
        // Double saut parfait via event de touche
        if (keys.jumpJustPressed) {
            if (player.grounded) {
                player.vy = player.jumpPower;
                player.grounded = false;
                player.jumps = 1;
                player.squash = 0.6; player.stretch = 1.4;
                spawnParticles(player.x + 12, player.y + 32, '#d4d4d8', 8);
            } else if (player.jumps === 1) {
                player.vy = player.jumpPower * 0.9;
                player.jumps = 2;
                player.squash = 0.7; player.stretch = 1.3;
                spawnParticles(player.x + 12, player.y + 32, '#d4d4d8', 15); // Gros nuage pour le double saut
            }
        }
        keys.jumpJustPressed = false; // Reset immédiat

        if (player.vx > player.speed) player.vx = player.speed;
        if (player.vx < -player.speed) player.vx = -player.speed;

        player.x += player.vx;
        if (player.x < 0) player.x = 0;
        if (player.x + player.width > levelData.width) player.x = levelData.width - player.width;

        player.y += player.vy;
        const wasGrounded = player.grounded;
        player.grounded = false;

        // Water Hazards
        for (let w of (levelData.water || [])) {
            if (player.y + player.height > w.y + 20 && player.x + player.width > w.x && player.x < w.x + w.w) {
                spawnParticles(player.x+12, w.y+10, '#3b82f6', 30);
                if(handleFallDeath("Plouf !", "Vous êtes tombé à l'eau.")) return;
            }
        }
        
        // Fall Death
        if (player.y > groundY + 200) {
            if(handleFallDeath("Tombé !", "Attention où vous mettez les pieds.")) return;
        }

        // Platforms Logic
        for (let p of levelData.platforms) {
            if (p.type === 'moving') {
                p.x += p.vx;
                if (p.x < p.minX || p.x + p.w > p.maxX) p.vx *= -1;
            }
            if (p.type === 'fragile' && p.state === 'falling') {
                p.y += 6; // Tombe vite
                continue;
            }

            // Top Collision
            if (player.vy > 0 && player.x + player.width > p.x + 5 && player.x < p.x + p.w - 5 &&
                player.y + player.height >= p.y && player.y + player.height <= p.y + player.vy + 3) {
                
                player.y = p.y - player.height;
                player.vy = 0;
                player.grounded = true;

                if (p.type === 'moving') player.x += p.vx;
                
                if (p.type === 'bouncy') {
                    player.vy = -17; player.grounded = false;
                    player.squash = 0.5; player.stretch = 1.5;
                    spawnParticles(player.x + 12, player.y + 32, '#ef4444', 15);
                }

                if (p.type === 'fragile') {
                    if(p.state === 'idle') p.state = 'shaking';
                    p.timer++;
                    if(p.timer > 25) p.state = 'falling';
                }
            }
        }

        if (!wasGrounded && player.grounded) {
            player.squash = 1.4; player.stretch = 0.6;
            spawnParticles(player.x + 12, player.y + 32, '#a8a29e', 6);
        }

        // Camera (Smooth follow)
        let targetCamX = player.x - canvas.width / 2 + player.width / 2;
        if (targetCamX < 0) targetCamX = 0;
        if (targetCamX > levelData.width - canvas.width) targetCamX = levelData.width - canvas.width;
        cameraX += (targetCamX - cameraX) * 0.08;

        // Particles & Texts
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += gravity * 0.5; p.rot += p.vrot; p.life -= 0.02;
            if (p.life <= 0) particles.splice(i, 1);
        }
        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            let ft = floatingTexts[i];
            ft.y -= 1.0; ft.life -= 0.015;
            if (ft.life <= 0) floatingTexts.splice(i, 1);
        }

        // Checkpoints
        for (let c of (levelData.checkpoints || [])) {
            if (!c.active && checkCollision(player, c)) {
                c.active = true;
                player.spawnX = c.x; player.spawnY = c.y - 20;
                spawnParticles(c.x + 10, c.y, '#fde047', 30);
                spawnText(c.x, c.y - 30, "SAUVEGARDÉ !", '#fde047', '22px');
            }
        }

        // Items (Health)
        for (let i = items.length - 1; i >= 0; i--) {
            let item = items[i];
            item.y += Math.sin(frameCount * 0.1) * 0.5;
            if (!item.collected && checkCollision(player, item)) {
                item.collected = true;
                if (player.hp < player.maxHp) player.hp++;
                spawnParticles(item.x + 10, item.y + 10, '#ef4444', 25);
                spawnText(item.x, item.y, "+1 PV", '#ef4444');
                items.splice(i, 1);
            }
        }

        // Enemies Updates
        for (let e of enemies) {
            if (e.dead) continue;
            
            // Comportement
            if (e.type === 'snail') {
                e.x += e.vx;
                if (e.x < e.minX || e.x + e.w > e.maxX) e.vx *= -1;
            } else if (e.type === 'bee') {
                e.x += e.vx;
                e.y = e.baseY + Math.sin(frameCount * 0.05 + e.x * 0.01) * 40; // Vole en vague
                if (e.x < e.minX || e.x + e.w > e.maxX) e.vx *= -1;
            } else if (e.type === 'frog') {
                e.x += e.vx;
                e.vy += gravity;
                e.y += e.vy;
                if (e.y >= e.baseY) {
                    e.y = e.baseY;
                    e.vy = 0;
                    if (Math.random() < 0.02) e.vy = -12; // Bond aléatoire et puissant
                }
                if (e.x < e.minX || e.x + e.w > e.maxX) e.vx *= -1;
            }

            // Dégats joueur
            if (player.invincibleTimer === 0 && checkCollision(player, e)) {
                if (player.vy > 0 && player.y + player.height < e.y + e.h/2 + 10) {
                    e.dead = true; player.vy = -10;
                    spawnParticles(e.x + e.w/2, e.y + e.h/2, '#fde047', 25);
                    spawnText(e.x, e.y - 10, "CRASH!", '#fde047', '20px');
                } else {
                    player.hp--; player.invincibleTimer = 60;
                    player.vx = (player.x < e.x) ? -12 : 12; player.vy = -7;
                    spawnParticles(player.x, player.y, '#ef4444', 15);
                    if (player.hp <= 0) return showGameOver("Game Over", "Les nuisibles ont gagné.", "Réessayer");
                }
            }
        }

        // Tasks
        for (let t of levelData.tasks) {
            if (!t.done && checkCollision(player, t)) {
                t.done = true; completedTasks++;
                if (scoreElement) scoreElement.innerText = `${completedTasks}/${levelTasks}`;
                spawnParticles(t.x + t.w/2, t.y + t.h/2, '#22c55e', 40);
                spawnText(t.x + t.w/2, t.y - 20, t.name, '#4ade80', '22px');
            }
        }

        // Goal
        if (!levelData.isBoss && checkCollision(player, levelData.goal)) {
            if (completedTasks >= levelTasks) {
                if (currentLevelIdx < levels.length - 1) return loadLevel(currentLevelIdx + 1);
            } else {
                if (frameCount % 60 === 0) spawnText(player.x, player.y - 40, "Il reste des tâches !", '#ef4444');
            }
        }

        // Boss
        if (levelData.isBoss) {
            let boss = levelData.boss;
            if (boss.hp > 0) {
                boss.timer++;
                boss.x += boss.vx;
                if (boss.x < 50 || boss.x + boss.w > levelData.width - 50) boss.vx *= -1;
                
                if (boss.timer % 90 === 0 && boss.y >= groundY - boss.h - 10) boss.vy = -17;
                if (boss.y < groundY - boss.h) {
                    boss.vy += gravity; boss.y += boss.vy;
                } else {
                    boss.y = groundY - boss.h; boss.vy = 0;
                }

                if (player.invincibleTimer === 0 && checkCollision(player, boss)) {
                    if (player.vy > 0 && player.y + player.height < boss.y + 40) {
                        boss.hp--; player.vy = -16;
                        spawnParticles(boss.x + boss.w/2, boss.y, '#65a30d', 60);
                        spawnText(boss.x + boss.w/2, boss.y - 30, "BAM!", '#fde047', '32px');
                        boss.vx *= 1.15; 
                        if(boss.hp === 1) boss.vx *= 1.5; // Enrage
                    } else {
                        player.hp--; player.invincibleTimer = 60;
                        player.vx = (player.x < boss.x) ? -16 : 16; player.vy = -9;
                        spawnText(player.x, player.y - 30, "Aïe!", '#ef4444', '24px');
                        if (player.hp <= 0) return showGameOver("Game Over", "La Ronce vous a écrasé.", "Réessayer");
                    }
                }
            } else {
                if (boss.w > 0) {
                    spawnParticles(boss.x + boss.w/2, boss.y + boss.h/2, '#166534', 30);
                    boss.w -= 3; boss.x += 1.5; boss.h -= 3; boss.y += 3;
                } else {
                    return showGameOver("VICTOIRE MAGISTRALE !", "Le Hainaut est sauvé. Voici votre récompense !", "Récupérer la tondeuse", true);
                }
            }
        }

        draw();
        gameLoop = requestAnimationFrame(update);
    }

    function draw() {
        const time = levelData.time;
        // Background Gradient
        let skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        if (time === 'morning') { skyGrad.addColorStop(0, '#0ea5e9'); skyGrad.addColorStop(1, '#e0f2fe'); }
        else if (time === 'midday') { skyGrad.addColorStop(0, '#0284c7'); skyGrad.addColorStop(1, '#bae6fd'); }
        else if (time === 'afternoon') { skyGrad.addColorStop(0, '#ea580c'); skyGrad.addColorStop(1, '#fef08a'); }
        else if (time === 'sunset') { skyGrad.addColorStop(0, '#9f1239'); skyGrad.addColorStop(1, '#fca5a5'); }
        else { skyGrad.addColorStop(0, '#1e1b4b'); skyGrad.addColorStop(1, '#4c1d95'); }
        ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Sun / Moon Glow
        let sunX = 700 - (cameraX * 0.03); 
        ctx.shadowColor = (time === 'night') ? 'rgba(255,255,255,0.8)' : 'rgba(253, 224, 71, 0.8)';
        ctx.shadowBlur = 40 + Math.sin(frameCount*0.05)*10;
        ctx.fillStyle = (time === 'night') ? '#fff' : (time === 'sunset' ? '#f87171' : '#fef08a');
        ctx.beginPath(); ctx.arc(sunX, 100, 60, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;

        ctx.save();
        
        // --- PARALLAX LAYERS ---
        // Layer 1: Far Mountains (0.15)
        ctx.translate(-cameraX * 0.15, 0);
        ctx.fillStyle = (time === 'sunset' || time === 'night') ? '#881337' : '#7dd3fc';
        ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(400, 100); ctx.lineTo(800, groundY); ctx.fill();
        ctx.beginPath(); ctx.moveTo(600, groundY); ctx.lineTo(1000, 150); ctx.lineTo(1400, groundY); ctx.fill();
        ctx.beginPath(); ctx.moveTo(1200, groundY); ctx.lineTo(1700, 100); ctx.lineTo(2200, groundY); ctx.fill();
        
        // Layer 2: Near Hills (0.3)
        ctx.translate(cameraX * 0.15 - cameraX * 0.3, 0);
        ctx.fillStyle = (time === 'sunset' || time === 'night') ? '#4c0519' : '#38bdf8';
        ctx.beginPath(); ctx.moveTo(-200, groundY); ctx.lineTo(150, 180); ctx.lineTo(600, groundY); ctx.fill();
        ctx.beginPath(); ctx.moveTo(500, groundY); ctx.lineTo(900, 220); ctx.lineTo(1300, groundY); ctx.fill();
        ctx.beginPath(); ctx.moveTo(1100, groundY); ctx.lineTo(1500, 160); ctx.lineTo(2100, groundY); ctx.fill();
        ctx.beginPath(); ctx.moveTo(1800, groundY); ctx.lineTo(2200, 200); ctx.lineTo(2800, groundY); ctx.fill();

        // Layer 3: Background Silhouette Trees (0.5)
        ctx.translate(cameraX * 0.3 - cameraX * 0.5, 0);
        let treeColor = (time === 'sunset' || time === 'night') ? '#1e3a8a' : '#0369a1';
        for(let i=0; i<levelData.width*2; i+=350) {
            ctx.fillStyle = '#1e3a8a'; ctx.fillRect(i+140, groundY-100, 20, 100);
            ctx.fillStyle = treeColor; 
            ctx.beginPath(); ctx.arc(i+150, groundY-120, 60, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(i+110, groundY-80, 50, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(i+190, groundY-80, 50, 0, Math.PI*2); ctx.fill();
        }

        // Layer 4: Main Gameplay (1.0)
        ctx.translate(cameraX * 0.5 - cameraX, 0);

        // Clouds (World Space)
        ctx.fillStyle = (time === 'sunset' || time === 'night') ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)';
        clouds.forEach(c => {
            let float = Math.sin(frameCount*0.02 + c.x)*5;
            ctx.beginPath();
            ctx.arc(c.x, c.y + float, c.size, 0, Math.PI*2);
            ctx.arc(c.x + c.size*1.3, c.y - c.size*0.7 + float, c.size*1.4, 0, Math.PI*2);
            ctx.arc(c.x + c.size*2.6, c.y + float, c.size, 0, Math.PI*2);
            ctx.fill();
        });

        // Water Hazards
        for (let w of (levelData.water || [])) {
            let waveGrad = ctx.createLinearGradient(0, w.y, 0, w.y+w.h);
            waveGrad.addColorStop(0, time === 'afternoon' ? '#b45309' : '#0284c7'); 
            waveGrad.addColorStop(1, time === 'afternoon' ? '#78350f' : '#1e3a8a');
            ctx.fillStyle = waveGrad;
            ctx.beginPath(); ctx.moveTo(w.x, w.y + w.h);
            for(let i=0; i<=w.w; i+=15) { ctx.lineTo(w.x + i, w.y + 8 + Math.sin(frameCount*0.1 + i*0.1)*6); }
            ctx.lineTo(w.x + w.w, w.y + w.h); ctx.fill();
            // Liseret d'écume
            ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2;
            ctx.beginPath();
            for(let i=0; i<=w.w; i+=15) { ctx.lineTo(w.x + i, w.y + 8 + Math.sin(frameCount*0.1 + i*0.1)*6); }
            ctx.stroke();
        }

        // Checkpoints
        for (let c of (levelData.checkpoints || [])) {
            ctx.fillStyle = '#78350f'; ctx.fillRect(c.x + 8, c.y, 4, c.h);
            ctx.fillStyle = c.active ? '#22c55e' : '#ef4444';
            ctx.shadowColor = c.active ? 'rgba(34,197,94,0.8)' : 'rgba(239,68,68,0.8)'; ctx.shadowBlur = 10;
            ctx.beginPath(); ctx.moveTo(c.x + 12, c.y + 2); ctx.lineTo(c.x + 35, c.y + 12); ctx.lineTo(c.x + 12, c.y + 22); ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Platforms
        for (let p of levelData.platforms) {
            if(p.type === 'fragile' && p.state === 'falling') ctx.globalAlpha = 0.5;

            if (p.type === 'bouncy') {
                ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(p.x + p.w/2, p.y + p.h, p.w/2, Math.PI, 0); ctx.fill();
                ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x + p.w*0.3, p.y + p.h*0.5, 6, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(p.x + p.w*0.7, p.y + p.h*0.7, 7, 0, Math.PI*2); ctx.fill();
            } else if (p.type === 'moving') {
                ctx.fillStyle = '#b45309'; ctx.fillRect(p.x, p.y, p.w, p.h);
                ctx.fillStyle = '#78350f'; ctx.fillRect(p.x, p.y+p.h-4, p.w, 4);
                ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.moveTo(p.x+15, p.y); ctx.lineTo(p.x+15, p.y-150); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(p.x+p.w-15, p.y); ctx.lineTo(p.x+p.w-15, p.y-150); ctx.stroke();
            } else if (p.type === 'fragile') {
                ctx.fillStyle = '#d97706'; ctx.fillRect(p.x, p.y, p.w, p.h);
                ctx.fillStyle = '#fde047'; ctx.fillRect(p.x, p.y, p.w, 4);
                ctx.strokeStyle = '#78350f'; ctx.lineWidth = 2;
                for(let i=10; i<p.w; i+=25) { ctx.beginPath(); ctx.moveTo(p.x+i, p.y); ctx.lineTo(p.x+i, p.y+p.h); ctx.stroke(); }
                if(p.state === 'shaking') { ctx.fillStyle = 'rgba(239, 68, 68, 0.4)'; ctx.fillRect(p.x, p.y, p.w, p.h); }
            } else {
                ctx.fillStyle = levelData.isBoss ? '#451a03' : '#78350f'; ctx.fillRect(p.x, p.y + 12, p.w, p.h - 12);
                ctx.fillStyle = levelData.isBoss ? '#290f02' : '#451a03';
                for(let i=0; i<p.w; i+=50) { ctx.fillRect(p.x + i + (p.y%20), p.y + 25 + (i%20), 10, 5); }

                ctx.fillStyle = levelData.isBoss ? '#7c2d12' : '#22c55e';
                ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(p.x - 6, p.y, p.w + 12, 18, 8); else ctx.fillRect(p.x - 6, p.y, p.w + 12, 18); ctx.fill();
                ctx.fillStyle = levelData.isBoss ? '#9a3412' : '#4ade80'; ctx.fillRect(p.x - 2, p.y + 2, p.w + 4, 5);
            }
            ctx.globalAlpha = 1.0;
        }

        // Goal (House)
        if (!levelData.isBoss) {
            let g = levelData.goal;
            ctx.fillStyle = '#fef08a'; ctx.fillRect(g.x, g.y + 40, g.w, 60);
            ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(g.x - 15, g.y + 40); ctx.lineTo(g.x + g.w/2, g.y - 10); ctx.lineTo(g.x + g.w + 15, g.y + 40); ctx.fill();
            ctx.fillStyle = '#3b82f6'; ctx.fillRect(g.x + 30, g.y + 60, 20, 40);
            if (completedTasks >= levelTasks) {
                ctx.shadowColor = '#22c55e'; ctx.shadowBlur = 15;
                ctx.fillStyle = '#22c55e'; ctx.font = "bold 24px 'Playfair Display', serif"; ctx.fillText("Ouvert !", g.x + 40, g.y - 20);
                ctx.shadowBlur = 0;
            }
        }

        // NPCs
        for(let npc of npcs) {
            ctx.fillStyle = npc.color; 
            ctx.beginPath(); ctx.roundRect ? ctx.roundRect(npc.x, npc.y, npc.w, npc.h, 6) : ctx.fillRect(npc.x, npc.y, npc.w, npc.h); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(npc.x + 6, npc.y + 10, 3, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(npc.x + 14, npc.y + 10, 3, 0, Math.PI*2); ctx.fill();
            if(activeDialog && activeDialog.npc === npc) {
                ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(npc.x + npc.w/2, npc.y - 20 + Math.sin(frameCount*0.1)*4, 5, 0, Math.PI*2); ctx.fill();
            }
        }

        // Tasks
        for (let t of levelData.tasks) {
            if (!t.done) { ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 15; }
            
            if (t.type === 'grass') {
                ctx.fillStyle = t.done ? '#4ade80' : '#166534';
                let sway = Math.sin(frameCount * 0.05 + t.x) * (t.done ? 1 : 5);
                let yOff = t.done ? t.h - 8 : 0;
                for(let i=0; i<t.w; i+=12) {
                    ctx.beginPath(); ctx.moveTo(t.x + i, t.y + t.h); ctx.lineTo(t.x + i + 6 + sway, t.y + yOff - Math.sin(i)*4); ctx.lineTo(t.x + i + 12, t.y + t.h); ctx.fill();
                }
            } else if (t.type === 'hedge') {
                if (!t.done) {
                    let sX = Math.sin(frameCount * 0.03 + t.x) * 3; let sY = Math.cos(frameCount * 0.04 + t.x) * 3;
                    ctx.fillStyle = '#14532d';
                    ctx.beginPath(); ctx.arc(t.x+15+sX, t.y+25+sY, 28, 0, Math.PI*2); ctx.fill();
                    ctx.beginPath(); ctx.arc(t.x+35-sX, t.y+20-sY, 33, 0, Math.PI*2); ctx.fill();
                    ctx.beginPath(); ctx.arc(t.x+45+sX, t.y+35+sY, 23, 0, Math.PI*2); ctx.fill();
                } else {
                    ctx.fillStyle = '#15803d'; ctx.fillRect(t.x, t.y + 20, t.w, t.h - 20);
                    ctx.strokeStyle = '#166534'; ctx.lineWidth = 4; ctx.strokeRect(t.x, t.y + 20, t.w, t.h - 20);
                }
            } else if (t.type === 'branch') {
                ctx.fillStyle = '#451a03'; ctx.fillRect(t.trunkX, t.y, 18, t.trunkY - t.y);
                if (!t.done) {
                    ctx.fillRect(t.x, t.y + 5, t.trunkX - t.x, 10);
                    let sway = Math.sin(frameCount * 0.05 + t.x) * 4;
                    ctx.fillStyle = '#166534';
                    ctx.beginPath(); ctx.arc(t.x + 10 + sway, t.y + 10, 28, 0, Math.PI*2); ctx.fill();
                    ctx.beginPath(); ctx.arc(t.x + 25 + sway, t.y, 23, 0, Math.PI*2); ctx.fill();
                }
                ctx.fillStyle = '#14532d'; ctx.beginPath(); ctx.arc(t.trunkX + 9, t.y - 15, 40, 0, Math.PI*2); ctx.fill();
            }
            ctx.shadowBlur = 0;
        }

        // Enemies
        for(let e of enemies) {
            if(e.dead) continue;
            let dir = e.vx > 0 ? 1 : -1;
            
            if (e.type === 'snail') {
                ctx.fillStyle = '#ca8a04'; ctx.beginPath(); ctx.arc(e.x + 12, e.y + 12, 12, 0, Math.PI*2); ctx.fill();
                ctx.strokeStyle = '#854d0e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(e.x + 12, e.y + 12, 7, 0, Math.PI); ctx.stroke();
                ctx.fillStyle = '#a3e635'; ctx.fillRect(e.x + 12, e.y + 16, 18 * dir, 8);
                ctx.beginPath(); ctx.moveTo(e.x + 12 + 14*dir, e.y + 16); ctx.lineTo(e.x + 12 + 18*dir, e.y + 6); ctx.stroke();
            } else if (e.type === 'frog') {
                ctx.fillStyle = '#4ade80'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(e.x, e.y + 10, 24, 14, 4) : ctx.fillRect(e.x, e.y + 10, 24, 14); ctx.fill();
                ctx.fillStyle = '#22c55e'; ctx.beginPath(); ctx.arc(e.x + 6, e.y + 10, 6, 0, Math.PI*2); ctx.arc(e.x + 18, e.y + 10, 6, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(e.x + 6 + 2*dir, e.y + 10, 2, 0, Math.PI*2); ctx.arc(e.x + 18 + 2*dir, e.y + 10, 2, 0, Math.PI*2); ctx.fill();
            } else if (e.type === 'bee') {
                ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(e.x + 12, e.y + 12, 10, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#000'; ctx.fillRect(e.x + 8, e.y + 2, 4, 20); ctx.fillRect(e.x + 16, e.y + 2, 4, 20);
                ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(e.x + 12 - 5*dir, e.y + 6 - Math.sin(frameCount*0.5)*4, 6, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(e.x + 12 + 10*dir, e.y + 12, 2, 0, Math.PI*2); ctx.fill();
            }
        }

        // Items
        for(let item of items) {
            ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 15; ctx.fillStyle = '#ef4444'; 
            ctx.beginPath(); ctx.arc(item.x + 5, item.y + 5, 7, Math.PI, 0); ctx.arc(item.x + 15, item.y + 5, 7, Math.PI, 0); ctx.lineTo(item.x + 10, item.y + 20); ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Boss
        if (levelData.isBoss && levelData.boss.hp > 0) {
            let b = levelData.boss;
            ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 30 + Math.sin(frameCount*0.1)*20;
            ctx.fillStyle = '#14532d'; let pulse = Math.sin(frameCount*0.1)*12;
            ctx.beginPath(); ctx.arc(b.x+b.w/2, b.y+b.h/2, b.w/2 + pulse, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#064e3b'; ctx.beginPath(); ctx.arc(b.x+b.w/2 - 10, b.y+b.h/2 - 10, b.w/3 + pulse, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.ellipse(b.x + 20, b.y + 30, 10, 15, 0.5, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(b.x + b.w - 20, b.y + 30, 10, 15, -0.5, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#78350f';
            for(let i=0; i<4; i++) {
                ctx.beginPath(); ctx.moveTo(b.x-20, b.y+20+i*25); ctx.lineTo(b.x, b.y+10+i*25); ctx.lineTo(b.x, b.y+35+i*25); ctx.fill();
                ctx.beginPath(); ctx.moveTo(b.x+b.w+20, b.y+20+i*25); ctx.lineTo(b.x+b.w, b.y+10+i*25); ctx.lineTo(b.x+b.w, b.y+35+i*25); ctx.fill();
            }
            ctx.fillStyle = '#451a03'; ctx.fillRect(b.x - 10, b.y - 40, b.w + 20, 12);
            ctx.fillStyle = '#ef4444'; ctx.fillRect(b.x - 9, b.y - 39, (b.w+18) * (b.hp/b.maxHp), 10);
        }

        // Player Drawing
        if (player.invincibleTimer % 4 < 2) { 
            ctx.save();
            ctx.translate(player.x + player.width/2, player.y + player.height);
            if (!player.facingRight) ctx.scale(-1, 1);
            ctx.scale(player.squash, player.stretch);
            
            let walkAnim = (Math.abs(player.vx) > 0.1 && player.grounded) ? Math.sin(frameCount * 0.5) * 25 : (!player.grounded ? 30 : 0);

            ctx.fillStyle = '#fca5a5'; ctx.save(); ctx.translate(0, -22); ctx.rotate(-walkAnim * Math.PI/180); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-3, 0, 7, 16, 3) : ctx.fillRect(-3, 0, 7, 16); ctx.fill(); ctx.restore();
            ctx.fillStyle = '#1e293b'; ctx.save(); ctx.translate(0, -12); ctx.rotate(walkAnim * Math.PI/180); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-4, 0, 9, 14, 2) : ctx.fillRect(-4, 0, 9, 14); ctx.fill(); ctx.restore();
            
            ctx.fillStyle = '#84cc16'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-10, -28, 20, 18, 5) : ctx.fillRect(-10, -28, 20, 18); ctx.fill();
            ctx.fillStyle = '#3b82f6'; ctx.fillRect(-8, -28, 5, 18); ctx.fillRect(3, -28, 5, 18);
            
            ctx.fillStyle = '#334155'; ctx.save(); ctx.translate(0, -12); ctx.rotate(-walkAnim * Math.PI/180); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-4, 0, 9, 14, 2) : ctx.fillRect(-4, 0, 9, 14); ctx.fill(); ctx.restore();
            
            ctx.save(); ctx.translate(0, -22); ctx.rotate(walkAnim * Math.PI/180);
            ctx.fillStyle = '#fca5a5'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-3, 0, 7, 16, 3) : ctx.fillRect(-3, 0, 7, 16); ctx.fill();
            ctx.fillStyle = '#9ca3af'; ctx.fillRect(-2, 14, 10, 10); ctx.fillStyle = '#ef4444'; ctx.fillRect(-3, 12, 5, 5);
            ctx.restore();

            ctx.fillStyle = '#fca5a5'; ctx.beginPath(); ctx.arc(0, -38, 9, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(4, -40, 2, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#166534'; ctx.beginPath(); ctx.arc(0, -40, 9, Math.PI, 0); ctx.fill(); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(0, -40, 14, 4, 2) : ctx.fillRect(0, -40, 14, 4); ctx.fill();
            ctx.restore();
        }

        // Particles
        for (let p of particles) {
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
            ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 10;
            ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI*2); ctx.fill(); ctx.restore();
        }

        ctx.restore(); // End Camera

        // Layer 5: Foreground Elements
        ctx.save();
        ctx.translate(-cameraX * 1.5, 0);
        ctx.fillStyle = time === 'night' ? '#022c22' : '#064e3b';
        for(let i=-200; i<levelData.width*2; i+=500) {
            ctx.beginPath(); ctx.arc(i, canvas.height + 60, 80, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(i+150, canvas.height + 70, 100, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();

        // --- 3. UI & POST PROCESSING ---
        let vig = ctx.createRadialGradient(canvas.width/2, canvas.height/2, canvas.height*0.4, canvas.width/2, canvas.height/2, canvas.height);
        vig.addColorStop(0, 'rgba(0,0,0,0)');
        vig.addColorStop(1, time === 'night' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.3)');
        ctx.fillStyle = vig; ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Scanlines
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        for(let i=0; i<canvas.height; i+=4) ctx.fillRect(0, i, canvas.width, 1);

        ctx.textAlign = "center";
        for (let ft of floatingTexts) {
            ctx.font = `bold ${ft.size} 'Playfair Display', serif`; ctx.fillStyle = ft.color; ctx.globalAlpha = ft.life;
            ctx.shadowColor = '#000'; ctx.shadowBlur = 6; ctx.fillText(ft.text, ft.x - cameraX, ft.y); ctx.shadowBlur = 0; ctx.globalAlpha = 1.0;
        }

        // Dialog Bubbles
        if (activeDialog) {
            let npc = activeDialog.npc;
            let cx = (npc.x + npc.w/2) - cameraX; let cy = npc.y - 45;
            ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 15;
            ctx.beginPath(); ctx.roundRect ? ctx.roundRect(cx - 120, cy - 50, 240, 60, 8) : ctx.fillRect(cx - 120, cy - 50, 240, 60); ctx.fill();
            ctx.beginPath(); ctx.moveTo(cx - 15, cy + 10); ctx.lineTo(cx + 15, cy + 10); ctx.lineTo(cx, cy + 25); ctx.fill();
            ctx.shadowBlur = 0;
            
            ctx.fillStyle = '#1c1917'; ctx.font = "bold 14px Arial"; ctx.fillText(npc.name, cx, cy - 30);
            ctx.fillStyle = '#44403c'; ctx.font = "14px Arial"; 
            
            if (activeDialog.showPrompt) {
                ctx.fillText("Appuyez sur 'E' pour parler", cx, cy - 10);
            } else {
                ctx.fillText(npc.dialogs[activeDialog.line], cx, cy - 10);
                if(frameCount % 40 < 20 && activeDialog.line < npc.dialogs.length - 1) { ctx.fillStyle = '#ef4444'; ctx.fillText("▼", cx + 100, cy + 5); }
            }
        } else if (nearNPC) {
            let cx = (nearNPC.x + nearNPC.w/2) - cameraX; let cy = nearNPC.y - 30;
            ctx.fillStyle = '#fde047'; ctx.font = "bold 13px Arial"; ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 4;
            ctx.fillText("'E' pour parler", cx, cy); ctx.shadowBlur = 0;
        }

        // Static UI (HP)
        ctx.fillStyle = '#ef4444'; ctx.textAlign = "left"; ctx.font = "28px Arial";
        ctx.shadowColor = '#000'; ctx.shadowBlur = 6;
        ctx.fillText("❤️".repeat(player.hp), 15, 35);
        ctx.shadowBlur = 0;
    }

    // Keyboard Setup (ZQSD / Arrows)
    document.addEventListener('keydown', (e) => {
        if (!gameActive) return;
        const k = e.key.toLowerCase();
        
        if(["arrowup","arrowdown","arrowleft","arrowright"," ","e"].includes(k) || ["z","q","s","d"].includes(k)) e.preventDefault();
        
        if (k === 'arrowleft' || k === 'q') keys.left = true;
        if (k === 'arrowright' || k === 'd') keys.right = true;
        if (k === 'arrowup' || k === 'z' || k === ' ') {
            if (!keys.jump) keys.jumpJustPressed = true;
            keys.jump = true;
        }
        if (k === 'e' || e.key === 'Enter') {
            if (!keys.interact) keys.interactJustPressed = true;
            keys.interact = true;
        }
    });

    document.addEventListener('keyup', (e) => {
        const k = e.key.toLowerCase();
        if (k === 'arrowleft' || k === 'q') keys.left = false;
        if (k === 'arrowright' || k === 'd') keys.right = false;
        if (k === 'arrowup' || k === 'z' || k === ' ') keys.jump = false;
        if (k === 'e' || e.key === 'Enter') keys.interact = false;
    });
});