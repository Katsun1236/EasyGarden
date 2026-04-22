// Injection de l'interface du jeu dans le body
const gameHTML = `
<div id="easter-egg-game-container" class="fixed inset-0 bg-stone-900 z-[100] hidden flex-col items-center justify-center p-4">
    <button id="close-game-btn" class="absolute top-6 right-6 text-white text-3xl focus:outline-none hover:text-botanic transition-colors z-[101]" aria-label="Fermer le jeu"><i class="fa-solid fa-times"></i></button>
    <div class="text-center mb-4">
        <h2 class="font-serif text-3xl md:text-5xl text-white mb-2"><span class="text-botanic-light">Super</span> Jardinier !</h2>
        <p class="text-stone-400 text-sm">Flèches: Bouger/Sauter | Espace: Parler aux clients</p>
    </div>
    <div class="relative bg-stone-800 p-2 rounded-lg shadow-2xl border border-stone-700">
        <div class="absolute top-4 left-6 text-white font-bold tracking-widest z-10" id="game-ui-score">TÂCHES: <span id="game-score" class="text-botanic-light text-xl">0/0</span></div>
        <div class="absolute top-4 right-6 text-white font-bold tracking-widest z-10 text-right" id="game-ui-level">NIVEAU 1</div>
        <div id="game-over-screen" class="absolute inset-0 bg-stone-900/90 flex flex-col items-center justify-center hidden rounded-lg z-20">
            <h3 id="game-end-title" class="font-serif text-4xl text-white mb-4">Chantier terminé !</h3>
            <p id="game-end-text" class="text-stone-300 mb-6 text-lg text-center max-w-md">Le jardin est parfait.</p>
            <button id="restart-game-btn" class="glow-btn px-6 py-3 bg-botanic text-white uppercase tracking-widest text-sm font-bold hover:bg-botanic-dark transition-all">Rejouer</button>
        </div>
        <canvas id="gameCanvas" width="800" height="450" class="bg-[#87CEEB] rounded border border-botanic/30 shadow-inner" style="image-rendering: pixelated;"></canvas>
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
    const keys = { left: false, right: false, up: false, space: false, jumpJustPressed: false };
    let gameLoop;
    let gameActive = false;
    let currentLevelIdx = 0;
    let cameraX = 0;
    let frameCount = 0;
    
    // Physics
    const gravity = 0.55;
    const friction = 0.8;
    const groundY = 400;

    const player = {
        x: 50, y: 200, width: 24, height: 32,
        vx: 0, vy: 0, speed: 6, jumpPower: -12.5,
        grounded: false, facingRight: true,
        squash: 1, stretch: 1, hp: 3, maxHp: 3, invincibleTimer: 0, jumps: 0, spawnX: 50, spawnY: 200
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

    const clouds = Array.from({length: 12}, () => ({
        x: Math.random() * 3000, y: Math.random() * 180, s: Math.random() * 0.3 + 0.1, size: Math.random() * 10 + 15
    }));

    // --- LEVELS DESIGN ---
    const levels = [
        {   // NIVEAU 1 : Matin (Tutoriel & Histoire)
            name: "Le Jardin Oublié", time: "morning", width: 1800,
            goal: { x: 1650, y: groundY - 100, w: 80, h: 100 },
            platforms: [
                { x: 0, y: groundY, w: 800, h: 60 },
                { x: 950, y: groundY, w: 900, h: 60 }, // Trou
                { x: 450, y: 300, w: 120, h: 20 },
            ],
            water: [ { x: 800, y: groundY + 10, w: 150, h: 50 } ],
            checkpoints: [{x: 1000, y: groundY - 60, w: 20, h: 60, active: false}],
            tasks: [
                { x: 500, y: 300 - 45, w: 50, h: 45, type: 'hedge', done: false, name: 'Taille' },
                { x: 1100, y: groundY - 20, w: 60, h: 20, type: 'grass', done: false, name: 'Tonte' },
                { x: 1400, y: groundY - 120, w: 40, h: 20, type: 'branch', done: false, trunkX: 1430, trunkY: groundY, name: 'Élagage' },
            ],
            npcs: [
                { x: 200, y: groundY - 36, w: 20, h: 36, color: '#f87171', name: "Mme. Rose", dialogs: ["Bonjour ! Mon jardin est en friche...", "Utilisez les flèches pour bouger et sauter.", "Coupez les herbes, taillez les haies et élaguez !", "Et attention à l'eau !"] }
            ],
            enemies: [], items: []
        },
        {   // NIVEAU 2 : Midi (Verticalité)
            name: "Le Parcours du Combattant", time: "midday", width: 2500,
            goal: { x: 2300, y: groundY - 100, w: 80, h: 100 },
            platforms: [
                { x: 0, y: groundY, w: 500, h: 60 },
                { x: 650, y: 320, w: 100, h: 20, type: 'moving', minX: 600, maxX: 800, vx: 2 },
                { x: 950, y: groundY, w: 300, h: 60 },
                { x: 1050, y: 250, w: 100, h: 20 },
                { x: 1350, y: groundY, w: 300, h: 60 },
                { x: 1450, y: groundY - 20, w: 80, h: 20, type: 'bouncy' }, // Champignon
                { x: 1430, y: 150, w: 120, h: 20 }, // Plateforme haute
                { x: 1800, y: groundY, w: 800, h: 60 },
            ],
            water: [ { x: 500, y: groundY + 10, w: 150, h: 50 }, { x: 1250, y: groundY + 10, w: 100, h: 50 } ],
            checkpoints: [{x: 1300, y: groundY - 60, w: 20, h: 60, active: false}],
            tasks: [
                { x: 300, y: groundY - 20, w: 50, h: 20, type: 'grass', done: false, name: 'Tonte' },
                { x: 1070, y: 250 - 45, w: 50, h: 45, type: 'hedge', done: false, name: 'Taille' },
                { x: 1450, y: 150 - 120, w: 40, h: 20, type: 'branch', done: false, trunkX: 1480, trunkY: 150, name: 'Élagage' },
                { x: 2000, y: groundY - 45, w: 60, h: 45, type: 'hedge', done: false, name: 'Taille' }
            ],
            npcs: [
                { x: 100, y: groundY - 36, w: 20, h: 36, color: '#60a5fa', name: "M. Tulipe", dialogs: ["Attention aux escargots !", "Sautez-leur sur la tête pour protéger le potager."] }
            ],
            enemies: [
                { x: 1000, y: groundY - 24, w: 24, h: 24, type: 'snail', vx: 1, minX: 950, maxX: 1200, dead: false },
                { x: 1900, y: groundY - 24, w: 24, h: 24, type: 'snail', vx: -1.5, minX: 1850, maxX: 2200, dead: false }
            ],
            items: [ { x: 1090, y: 190, w: 20, h: 20, type: 'hp', collected: false } ]
        },
        {   // NIVEAU 3 : Après-Midi (Inondation)
            name: "Le Domaine Inondé", time: "afternoon", width: 3000,
            goal: { x: 2800, y: groundY - 100, w: 80, h: 100 },
            platforms: [
                { x: 0, y: groundY, w: 300, h: 60 },
                { x: 450, y: 300, w: 80, h: 20, type: 'fragile', timer: 0, state: 'idle' },
                { x: 650, y: 250, w: 80, h: 20, type: 'fragile', timer: 0, state: 'idle' },
                { x: 900, y: groundY, w: 400, h: 60 },
                { x: 1400, y: 280, w: 100, h: 20, type: 'moving', minX: 1400, maxX: 1700, vx: 2.5 },
                { x: 1900, y: groundY, w: 400, h: 60 },
                { x: 2400, y: 250, w: 100, h: 20 },
                { x: 2600, y: groundY, w: 400, h: 60 },
            ],
            water: [ { x: 300, y: groundY + 10, w: 600, h: 50 }, { x: 1300, y: groundY + 10, w: 600, h: 50 }, { x: 2300, y: groundY + 10, w: 300, h: 50 } ],
            checkpoints: [{x: 1000, y: groundY - 60, w: 20, h: 60, active: false}, {x: 2000, y: groundY - 60, w: 20, h: 60, active: false}],
            tasks: [
                { x: 1000, y: groundY - 20, w: 60, h: 20, type: 'grass', done: false, name: 'Tonte' },
                { x: 1150, y: groundY - 45, w: 50, h: 45, type: 'hedge', done: false, name: 'Taille' },
                { x: 2000, y: groundY - 120, w: 40, h: 20, type: 'branch', done: false, trunkX: 2030, trunkY: groundY, name: 'Élagage' },
                { x: 2420, y: 250 - 45, w: 50, h: 45, type: 'hedge', done: false, name: 'Taille' }
            ],
            npcs: [
                { x: 200, y: groundY - 36, w: 20, h: 36, color: '#fcd34d', name: "L'Apprenti", dialogs: ["Chef ! Le terrain est inondé !", "Attention, certaines planches en bois sont très fragiles !"] }
            ],
            enemies: [
                { x: 1050, y: groundY - 24, w: 24, h: 24, type: 'snail', vx: 1.5, minX: 950, maxX: 1250, dead: false },
                { x: 2100, y: groundY - 24, w: 24, h: 24, type: 'snail', vx: -2, minX: 1950, maxX: 2250, dead: false }
            ],
            items: [ { x: 1550, y: 200, w: 20, h: 20, type: 'hp', collected: false } ]
        },
        {   // NIVEAU 4 : Crépuscule (Danger)
            name: "La Lisière Sombre", time: "sunset", width: 2800,
            goal: { x: 2600, y: groundY - 100, w: 80, h: 100 },
            platforms: [
                { x: 0, y: groundY, w: 500, h: 60 },
                { x: 600, y: groundY - 20, w: 80, h: 20, type: 'bouncy' },
                { x: 650, y: 150, w: 100, h: 20 },
                { x: 850, y: 250, w: 80, h: 20, type: 'fragile', timer: 0, state: 'idle' },
                { x: 1050, y: groundY, w: 500, h: 60 },
                { x: 1650, y: 250, w: 100, h: 20, type: 'moving', minX: 1600, maxX: 1900, vx: 3 },
                { x: 2100, y: groundY, w: 700, h: 60 },
            ],
            water: [ { x: 500, y: groundY + 10, w: 550, h: 50 }, { x: 1550, y: groundY + 10, w: 550, h: 50 } ],
            checkpoints: [{x: 1200, y: groundY - 60, w: 20, h: 60, active: false}, {x: 2200, y: groundY - 60, w: 20, h: 60, active: false}],
            tasks: [
                { x: 300, y: groundY - 20, w: 50, h: 20, type: 'grass', done: false, name: 'Tonte' },
                { x: 670, y: 150 - 45, w: 50, h: 45, type: 'hedge', done: false, name: 'Taille' },
                { x: 1200, y: groundY - 45, w: 50, h: 45, type: 'hedge', done: false, name: 'Taille' },
                { x: 1400, y: groundY - 120, w: 40, h: 20, type: 'branch', done: false, trunkX: 1430, trunkY: groundY, name: 'Élagage' },
                { x: 2300, y: groundY - 120, w: 40, h: 20, type: 'branch', done: false, trunkX: 2330, trunkY: groundY, name: 'Élagage' }
            ],
            npcs: [
                { x: 100, y: groundY - 36, w: 20, h: 36, color: '#a78bfa', name: "Vieux Chêne", dialogs: ["La nuit tombe... Une plante mutante rôde plus loin.", "Préparez votre meilleur sécateur, artisan !"] }
            ],
            enemies: [
                { x: 350, y: groundY - 24, w: 24, h: 24, type: 'snail', vx: -2, minX: 250, maxX: 450, dead: false },
                { x: 1100, y: groundY - 24, w: 24, h: 24, type: 'snail', vx: 2.5, minX: 1050, maxX: 1500, dead: false },
                { x: 2200, y: groundY - 24, w: 24, h: 24, type: 'snail', vx: -2, minX: 2150, maxX: 2500, dead: false }
            ],
            items: [ { x: 1750, y: 180, w: 20, h: 20, type: 'hp', collected: false } ]
        },
        {   // NIVEAU 5 : Nuit (BOSS)
            name: "L'Antre de la Ronce", time: "night", width: 1000,
            goal: { x: -1000, y: 0, w: 1, h: 1 }, 
            isBoss: true,
            platforms: [
                { x: 0, y: groundY, w: 1000, h: 60 },
                { x: 150, y: 260, w: 100, h: 20 },
                { x: 750, y: 260, w: 100, h: 20 },
                { x: 450, y: 180, w: 100, h: 20 }, 
            ],
            water: [], tasks: [], enemies: [], items: [], npcs: [],
            boss: {
                x: 800, y: groundY - 120, w: 80, h: 120, hp: 5, maxHp: 5, vx: -3, state: 'move', timer: 0,
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
        player.x = 50; player.y = 200;
        player.vx = 0; player.vy = 0;
        player.facingRight = true;
        player.hp = player.maxHp; player.invincibleTimer = 0;
        player.spawnX = 50; player.spawnY = 200;
        
        enemies = levelData.enemies || [];
        items = levelData.items || [];
        npcs = levelData.npcs || [];
        completedTasks = 0;
        levelTasks = levelData.tasks.length;
        particles = [];
        floatingTexts = [];
        activeDialog = null;
        
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
                vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 1) * 8,
                life: 1.0, size: Math.random() * 5 + 2, rot: Math.random() * Math.PI * 2, vrot: (Math.random() - 0.5) * 0.3,
                color: color
            });
        }
    }

    function spawnText(x, y, text, color = '#fff', size = '16px') {
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

    let spacePressed = false;

    function update() {
        if (!gameActive) return;
        frameCount++;

        // Interactions NPC (Proximité & Espace)
        let nearNPC = null;
        for (let npc of npcs) {
            let dist = Math.abs((player.x + player.width/2) - (npc.x + npc.w/2));
            if (dist < 80 && Math.abs(player.y - npc.y) < 50) nearNPC = npc;
        }
        
        if (nearNPC) {
            if (!activeDialog || activeDialog.npc !== nearNPC) {
                activeDialog = { npc: nearNPC, line: 0, showPrompt: true };
            }
            if (keys.space && !spacePressed) {
                activeDialog.showPrompt = false;
                activeDialog.line++;
                if (activeDialog.line >= nearNPC.dialogs.length) activeDialog.line = 0;
            }
        } else {
            activeDialog = null;
        }
        spacePressed = keys.space;

        // Clouds animation
        clouds.forEach(c => { c.x -= c.s; if(c.x < -100) c.x = levelData.width + 100; });

        // Player timers & physics
        if (player.invincibleTimer > 0) player.invincibleTimer--;
        player.squash += (1 - player.squash) * 0.2;
        player.stretch += (1 - player.stretch) * 0.2;

        if (keys.left) { player.vx -= 0.8; player.facingRight = false; }
        if (keys.right) { player.vx += 0.8; player.facingRight = true; }
        player.vx *= friction;
        player.vy += gravity;

        if (player.grounded) player.jumps = 0;
        
        if (keys.up && player.grounded) {
            player.vy = player.jumpPower;
            player.grounded = false;
            player.jumps = 1;
            player.squash = 0.6; player.stretch = 1.4;
            spawnParticles(player.x + 12, player.y + 32, '#d4d4d8', 5);
        } else if (keys.jumpJustPressed && player.jumps < 2 && !player.grounded) {
            player.vy = player.jumpPower * 0.9;
            player.jumps = 2;
            player.squash = 0.7; player.stretch = 1.3;
            spawnParticles(player.x + 12, player.y + 32, '#d4d4d8', 8);
        }
        keys.jumpJustPressed = false;

        if (player.vx > player.speed) player.vx = player.speed;
        if (player.vx < -player.speed) player.vx = -player.speed;

        player.x += player.vx;
        if (player.x < 0) player.x = 0;
        if (player.x + player.width > levelData.width) player.x = levelData.width - player.width;

        player.y += player.vy;
        const wasGrounded = player.grounded;
        player.grounded = false;

        function handleFallDeath(title, desc) {
            player.hp--;
            if (player.hp <= 0) {
                showGameOver("Game Over", desc, "Réessayer");
                return true;
            }
            player.x = player.spawnX; player.y = player.spawnY;
            player.vx = 0; player.vy = 0; player.invincibleTimer = 60;
            cameraX = player.x - canvas.width / 2;
            spawnText(player.x, player.y - 20, "-1 PV", '#ef4444');
            return false;
        }

        // Water Hazards
        for (let w of (levelData.water || [])) {
            if (player.y + player.height > w.y + 20 && player.x + player.width > w.x && player.x < w.x + w.w) {
                spawnParticles(player.x+12, w.y+10, '#3b82f6', 20);
                if(handleFallDeath("Plouf !", "Vous êtes tombé à l'eau.")) return;
            }
        }
        
        // Fall Death
        if (player.y > 600) {
            if(handleFallDeath("Tombé !", "Attention où vous mettez les pieds.")) return;
        }

        // Platforms Logic
        for (let p of levelData.platforms) {
            if (p.type === 'moving') {
                p.x += p.vx;
                if (p.x < p.minX || p.x + p.w > p.maxX) p.vx *= -1;
            }
            if (p.type === 'fragile' && p.state === 'falling') {
                p.y += 5; // Tombe
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
                    player.vy = -16.5; player.grounded = false;
                    player.squash = 0.5; player.stretch = 1.5;
                    spawnParticles(player.x + 12, player.y + 32, '#ef4444', 10);
                }

                if (p.type === 'fragile') {
                    if(p.state === 'idle') p.state = 'shaking';
                    p.timer++;
                    if(p.timer > 30) p.state = 'falling';
                }
            }
        }

        if (!wasGrounded && player.grounded) {
            player.squash = 1.4; player.stretch = 0.6;
            spawnParticles(player.x + 12, player.y + 32, '#a8a29e', 4);
        }

        // Camera (Smooth follow)
        let targetCamX = player.x - canvas.width / 2 + player.width / 2;
        if (targetCamX < 0) targetCamX = 0;
        if (targetCamX > levelData.width - canvas.width) targetCamX = levelData.width - canvas.width;
        cameraX += (targetCamX - cameraX) * 0.1;

        // Particles & Texts Update
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += gravity * 0.4; p.rot += p.vrot; p.life -= 0.02;
            if (p.life <= 0) particles.splice(i, 1);
        }
        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            let ft = floatingTexts[i];
            ft.y -= 1.0; ft.life -= 0.015;
            if (ft.life <= 0) floatingTexts.splice(i, 1);
        }

        // Items (Health)
        for (let i = items.length - 1; i >= 0; i--) {
            let item = items[i];
            item.y += Math.sin(frameCount * 0.1) * 0.5;
            if (!item.collected && checkCollision(player, item)) {
                item.collected = true;
                if (player.hp < player.maxHp) player.hp++;
                spawnParticles(item.x + 10, item.y + 10, '#ef4444', 20);
                spawnText(item.x, item.y, "+1 PV", '#ef4444');
                items.splice(i, 1);
            }
        }

        // Enemies (Snail)
        for (let e of enemies) {
            if (e.dead) continue;
            e.x += e.vx;
            if (e.x < e.minX || e.x + e.w > e.maxX) e.vx *= -1;

            if (player.invincibleTimer === 0 && checkCollision(player, e)) {
                // Jump on head
                if (player.vy > 0 && player.y + player.height < e.y + e.h/2 + 5) {
                    e.dead = true; player.vy = -9;
                    spawnParticles(e.x + e.w/2, e.y + e.h/2, '#fde047', 20);
                    spawnText(e.x, e.y, "CRASH!", '#fde047');
                } else {
                    // Damage
                    player.hp--; player.invincibleTimer = 60;
                    player.vx = (player.x < e.x) ? -10 : 10; player.vy = -6;
                    spawnParticles(player.x, player.y, '#ef4444', 10);
                    if (player.hp <= 0) return showGameOver("Game Over", "Les nuisibles ont gagné.", "Réessayer");
                }
            }
        }

        // Checkpoints
        for (let c of (levelData.checkpoints || [])) {
            if (!c.active && checkCollision(player, c)) {
                c.active = true;
                player.spawnX = c.x; player.spawnY = c.y - 20;
                spawnParticles(c.x + 10, c.y, '#fde047', 20);
                spawnText(c.x, c.y - 20, "CHECKPOINT", '#fde047');
            }
        }

        // Tasks
        for (let t of levelData.tasks) {
            if (!t.done && checkCollision(player, t)) {
                t.done = true; completedTasks++;
                if (scoreElement) scoreElement.innerText = `${completedTasks}/${levelTasks}`;
                spawnParticles(t.x + t.w/2, t.y + t.h/2, '#22c55e', 30);
                spawnText(t.x + t.w/2, t.y - 15, t.name, '#4ade80', '20px');
            }
        }

        // Goal
        if (!levelData.isBoss && checkCollision(player, levelData.goal)) {
            if (completedTasks >= levelTasks) {
                if (currentLevelIdx < levels.length - 1) return loadLevel(currentLevelIdx + 1);
            } else {
                if (frameCount % 60 === 0) spawnText(player.x, player.y - 30, "Finissez les tâches !", '#ef4444');
            }
        }

        // Boss
        if (levelData.isBoss) {
            let boss = levelData.boss;
            if (boss.hp > 0) {
                boss.timer++;
                boss.x += boss.vx;
                if (boss.x < 50 || boss.x + boss.w > levelData.width - 50) boss.vx *= -1;
                
                if (boss.timer % 100 === 0 && boss.y >= groundY - boss.h - 10) boss.vy = -15;
                if (boss.y < groundY - boss.h) {
                    boss.vy += gravity; boss.y += boss.vy;
                } else {
                    boss.y = groundY - boss.h; boss.vy = 0;
                }

                if (player.invincibleTimer === 0 && checkCollision(player, boss)) {
                    if (player.vy > 0 && player.y + player.height < boss.y + 35) {
                        boss.hp--; player.vy = -14;
                        spawnParticles(boss.x + boss.w/2, boss.y, '#65a30d', 50);
                        spawnText(boss.x + boss.w/2, boss.y - 20, "BAM!", '#fde047', '28px');
                        boss.vx *= 1.2; 
                        if(boss.hp === 1) boss.vx *= 1.5; // Enrage
                    } else {
                        player.hp--; player.invincibleTimer = 60;
                        player.vx = (player.x < boss.x) ? -14 : 14; player.vy = -8;
                        spawnText(player.x, player.y - 20, "Aïe!", '#ef4444');
                        if (player.hp <= 0) return showGameOver("Game Over", "La Ronce vous a écrasé.", "Réessayer");
                    }
                }
            } else {
                if (boss.w > 0) {
                    spawnParticles(boss.x + boss.w/2, boss.y + boss.h/2, '#166534', 20);
                    boss.w -= 2; boss.x += 1; boss.h -= 2; boss.y += 2;
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
        // Sky Gradient based on Time
        let skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        if (time === 'morning') { skyGrad.addColorStop(0, '#38bdf8'); skyGrad.addColorStop(1, '#e0f2fe'); }
        else if (time === 'midday') { skyGrad.addColorStop(0, '#0ea5e9'); skyGrad.addColorStop(1, '#bae6fd'); }
        else if (time === 'afternoon') { skyGrad.addColorStop(0, '#f59e0b'); skyGrad.addColorStop(1, '#fde68a'); }
        else if (time === 'sunset') { skyGrad.addColorStop(0, '#9f1239'); skyGrad.addColorStop(1, '#fca5a5'); }
        else { skyGrad.addColorStop(0, '#1e1b4b'); skyGrad.addColorStop(1, '#4c1d95'); } // night
        
        ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Sun / Moon
        let sunX = 600 - (cameraX * 0.05); // Light parallax on sun
        let sunGrad = ctx.createRadialGradient(sunX, 100, 10, sunX, 100, 80 + Math.sin(frameCount*0.05)*5);
        if (time === 'night') {
            sunGrad.addColorStop(0, 'rgba(255, 255, 255, 1)'); sunGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        } else if (time === 'sunset') {
            sunGrad.addColorStop(0, 'rgba(239, 68, 68, 1)'); sunGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        } else {
            sunGrad.addColorStop(0, 'rgba(253, 224, 71, 1)'); sunGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
        }
        ctx.fillStyle = sunGrad; ctx.beginPath(); ctx.arc(sunX, 100, 85, 0, Math.PI*2); ctx.fill();

        ctx.save();
        
        // --- PARALLAX 4 LAYERS ---

        // Layer 1: Far Mountains (0.2)
        ctx.translate(-cameraX * 0.2, 0);
        ctx.fillStyle = (time === 'sunset' || time === 'night') ? '#881337' : '#bae6fd';
        ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(300, 100); ctx.lineTo(600, groundY); ctx.fill();
        ctx.beginPath(); ctx.moveTo(500, groundY); ctx.lineTo(800, 150); ctx.lineTo(1200, groundY); ctx.fill();
        ctx.beginPath(); ctx.moveTo(1000, groundY); ctx.lineTo(1400, 100); ctx.lineTo(1800, groundY); ctx.fill();
        
        // Layer 2: Near Hills (0.4)
        ctx.translate(cameraX * 0.2 - cameraX * 0.4, 0);
        ctx.fillStyle = (time === 'sunset' || time === 'night') ? '#4c0519' : '#7dd3fc';
        ctx.beginPath(); ctx.moveTo(-200, groundY); ctx.lineTo(100, 150); ctx.lineTo(500, groundY); ctx.fill();
        ctx.beginPath(); ctx.moveTo(400, groundY); ctx.lineTo(750, 180); ctx.lineTo(1100, groundY); ctx.fill();
        ctx.beginPath(); ctx.moveTo(900, groundY); ctx.lineTo(1300, 120); ctx.lineTo(1800, groundY); ctx.fill();
        ctx.beginPath(); ctx.moveTo(1600, groundY); ctx.lineTo(2000, 160); ctx.lineTo(2500, groundY); ctx.fill();

        // Layer 3: Background Trees (0.6)
        ctx.translate(cameraX * 0.4 - cameraX * 0.6, 0);
        let treeColor = (time === 'sunset' || time === 'night') ? '#1e3a8a' : '#0ea5e9';
        for(let i=0; i<3000; i+=300) {
            ctx.fillStyle = '#1e3a8a'; ctx.fillRect(i+140, groundY-80, 20, 80);
            ctx.fillStyle = treeColor; 
            ctx.beginPath(); ctx.arc(i+150, groundY-100, 50, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(i+120, groundY-70, 40, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(i+180, groundY-70, 40, 0, Math.PI*2); ctx.fill();
        }

        // Layer 4: Main Gameplay (1.0)
        ctx.translate(cameraX * 0.6 - cameraX, 0);

        // Clouds (World Space)
        ctx.fillStyle = (time === 'sunset' || time === 'night') ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.9)';
        clouds.forEach(c => {
            let float = Math.sin(frameCount*0.02 + c.x)*4;
            ctx.beginPath();
            ctx.arc(c.x, c.y + float, c.size, 0, Math.PI*2);
            ctx.arc(c.x + c.size*1.2, c.y - c.size*0.6 + float, c.size*1.3, 0, Math.PI*2);
            ctx.arc(c.x + c.size*2.4, c.y + float, c.size, 0, Math.PI*2);
            ctx.fill();
        });

        // Water Hazards (Behind platforms)
        for (let w of (levelData.water || [])) {
            let waveGrad = ctx.createLinearGradient(0, w.y, 0, w.y+w.h);
            waveGrad.addColorStop(0, time === 'afternoon' ? '#b45309' : '#0ea5e9'); // Mud or Water
            waveGrad.addColorStop(1, time === 'afternoon' ? '#78350f' : '#1e3a8a');
            ctx.fillStyle = waveGrad;
            ctx.beginPath();
            ctx.moveTo(w.x, w.y + w.h);
            for(let i=0; i<=w.w; i+=10) {
                ctx.lineTo(w.x + i, w.y + 5 + Math.sin(frameCount*0.1 + i*0.1)*5);
            }
            ctx.lineTo(w.x + w.w, w.y + w.h);
            ctx.fill();
        }

        // Platforms
        for (let p of levelData.platforms) {
            if(p.type === 'fragile' && p.state === 'falling') ctx.globalAlpha = 0.5;

            if (p.type === 'bouncy') {
                ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(p.x + p.w/2, p.y + p.h, p.w/2, Math.PI, 0); ctx.fill();
                ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x + p.w*0.3, p.y + p.h*0.5, 4, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(p.x + p.w*0.7, p.y + p.h*0.7, 5, 0, Math.PI*2); ctx.fill();
            } else if (p.type === 'moving') {
                ctx.fillStyle = '#b45309'; ctx.fillRect(p.x, p.y, p.w, p.h);
                ctx.fillStyle = '#78350f'; ctx.fillRect(p.x, p.y+p.h-4, p.w, 4);
                ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(p.x+10, p.y); ctx.lineTo(p.x+10, p.y-100); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(p.x+p.w-10, p.y); ctx.lineTo(p.x+p.w-10, p.y-100); ctx.stroke();
            } else if (p.type === 'fragile') {
                ctx.fillStyle = '#d97706'; ctx.fillRect(p.x, p.y, p.w, p.h);
                ctx.fillStyle = '#fde047'; ctx.fillRect(p.x, p.y, p.w, 3);
                ctx.strokeStyle = '#78350f'; ctx.lineWidth = 1;
                for(let i=10; i<p.w; i+=20) { ctx.beginPath(); ctx.moveTo(p.x+i, p.y); ctx.lineTo(p.x+i, p.y+p.h); ctx.stroke(); }
                if(p.state === 'shaking') { ctx.fillStyle = 'rgba(239, 68, 68, 0.3)'; ctx.fillRect(p.x, p.y, p.w, p.h); }
            } else {
                ctx.fillStyle = levelData.isBoss ? '#451a03' : '#78350f';
                ctx.fillRect(p.x, p.y + 10, p.w, p.h - 10);
                ctx.fillStyle = levelData.isBoss ? '#290f02' : '#451a03';
                for(let i=0; i<p.w; i+=40) { ctx.fillRect(p.x + i + (p.y%20), p.y + 20 + (i%20), 8, 4); }

                ctx.fillStyle = levelData.isBoss ? '#7c2d12' : '#22c55e';
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(p.x - 5, p.y, p.w + 10, 15, 8); else ctx.fillRect(p.x - 5, p.y, p.w + 10, 15);
                ctx.fill();
                ctx.fillStyle = levelData.isBoss ? '#9a3412' : '#4ade80';
                ctx.fillRect(p.x - 2, p.y + 2, p.w + 4, 4);
            }
            ctx.globalAlpha = 1.0;
        }

        // Goal (House)
        if (!levelData.isBoss) {
            let g = levelData.goal;
            ctx.fillStyle = '#fef08a'; ctx.fillRect(g.x, g.y + 40, g.w, 60);
            ctx.fillStyle = '#ef4444';
            ctx.beginPath(); ctx.moveTo(g.x - 10, g.y + 40); ctx.lineTo(g.x + g.w/2, g.y); ctx.lineTo(g.x + g.w + 10, g.y + 40); ctx.fill();
            ctx.fillStyle = '#3b82f6'; ctx.fillRect(g.x + 30, g.y + 60, 20, 40);
            if (completedTasks >= levelTasks) {
                ctx.fillStyle = '#22c55e'; ctx.font = "bold 20px Arial"; ctx.fillText("Ouvert !", g.x + 40, g.y - 10);
            }
        }

        // NPCs
        for(let npc of npcs) {
            ctx.fillStyle = npc.color; 
            ctx.beginPath(); ctx.roundRect ? ctx.roundRect(npc.x, npc.y, npc.w, npc.h, 4) : ctx.fillRect(npc.x, npc.y, npc.w, npc.h); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(npc.x + 6, npc.y + 8, 2, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(npc.x + 14, npc.y + 8, 2, 0, Math.PI*2); ctx.fill();
            
            // Highlight
            if(activeDialog && activeDialog.npc === npc) {
                ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(npc.x + npc.w/2, npc.y - 15 + Math.sin(frameCount*0.1)*3, 4, 0, Math.PI*2); ctx.fill();
            }
        }

        // Tasks
        for (let t of levelData.tasks) {
            if (t.type === 'grass') {
                ctx.fillStyle = t.done ? '#4ade80' : '#166534';
                let sway = Math.sin(frameCount * 0.05 + t.x) * (t.done ? 1 : 4);
                let yOff = t.done ? t.h - 6 : 0;
                for(let i=0; i<t.w; i+=10) {
                    ctx.beginPath(); ctx.moveTo(t.x + i, t.y + t.h); ctx.lineTo(t.x + i + 5 + sway, t.y + yOff - Math.sin(i)*3); ctx.lineTo(t.x + i + 10, t.y + t.h); ctx.fill();
                }
            } else if (t.type === 'hedge') {
                if (!t.done) {
                    let sX = Math.sin(frameCount * 0.03 + t.x) * 2; let sY = Math.cos(frameCount * 0.04 + t.x) * 2;
                    ctx.fillStyle = '#14532d';
                    ctx.beginPath(); ctx.arc(t.x+15+sX, t.y+25+sY, 25, 0, Math.PI*2); ctx.fill();
                    ctx.beginPath(); ctx.arc(t.x+35-sX, t.y+20-sY, 30, 0, Math.PI*2); ctx.fill();
                    ctx.beginPath(); ctx.arc(t.x+45+sX, t.y+35+sY, 20, 0, Math.PI*2); ctx.fill();
                } else {
                    ctx.fillStyle = '#15803d'; ctx.fillRect(t.x, t.y + 20, t.w, t.h - 20);
                    ctx.strokeStyle = '#166534'; ctx.lineWidth = 3; ctx.strokeRect(t.x, t.y + 20, t.w, t.h - 20);
                }
            } else if (t.type === 'branch') {
                ctx.fillStyle = '#451a03'; ctx.fillRect(t.trunkX, t.y, 15, t.trunkY - t.y);
                if (!t.done) {
                    ctx.fillRect(t.x, t.y + 5, t.trunkX - t.x, 8);
                    let sway = Math.sin(frameCount * 0.05 + t.x) * 3;
                    ctx.fillStyle = '#166534';
                    ctx.beginPath(); ctx.arc(t.x + 10 + sway, t.y + 10, 25, 0, Math.PI*2); ctx.fill();
                    ctx.beginPath(); ctx.arc(t.x + 25 + sway, t.y, 20, 0, Math.PI*2); ctx.fill();
                }
                ctx.fillStyle = '#14532d'; ctx.beginPath(); ctx.arc(t.trunkX + 7, t.y - 10, 35, 0, Math.PI*2); ctx.fill();
            }
        }

        // Checkpoints
        for (let c of (levelData.checkpoints || [])) {
            ctx.fillStyle = '#78350f'; // Poteau
            ctx.fillRect(c.x + 8, c.y, 4, c.h);
            ctx.fillStyle = c.active ? '#22c55e' : '#ef4444'; // Drapeau
            ctx.beginPath(); ctx.moveTo(c.x + 12, c.y + 2); ctx.lineTo(c.x + 30, c.y + 10); ctx.lineTo(c.x + 12, c.y + 18); ctx.fill();
        }

        // Enemies
        for(let e of enemies) {
            if(e.dead) continue;
            ctx.fillStyle = '#ca8a04'; ctx.beginPath(); ctx.arc(e.x + 12, e.y + 12, 10, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#854d0e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.x + 12, e.y + 12, 6, 0, Math.PI); ctx.stroke();
            ctx.fillStyle = '#a3e635'; let dir = e.vx > 0 ? 1 : -1; ctx.fillRect(e.x + 12, e.y + 16, 16 * dir, 6);
            ctx.beginPath(); ctx.moveTo(e.x + 12 + 12*dir, e.y + 16); ctx.lineTo(e.x + 12 + 16*dir, e.y + 8); ctx.stroke();
        }

        // Items
        for(let item of items) {
            ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(item.x + 5, item.y + 5, 6, Math.PI, 0); ctx.arc(item.x + 15, item.y + 5, 6, Math.PI, 0); ctx.lineTo(item.x + 10, item.y + 18); ctx.fill();
        }

        // Boss
        if (levelData.isBoss && levelData.boss.hp > 0) {
            let b = levelData.boss;
            ctx.fillStyle = '#14532d'; let pulse = Math.sin(frameCount*0.1)*10;
            ctx.beginPath(); ctx.arc(b.x+b.w/2, b.y+b.h/2, b.w/2 + pulse, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#064e3b'; ctx.beginPath(); ctx.arc(b.x+b.w/2 - 10, b.y+b.h/2 - 10, b.w/3 + pulse, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.ellipse(b.x + 20, b.y + 30, 8, 12, 0.5, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(b.x + b.w - 20, b.y + 30, 8, 12, -0.5, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#78350f';
            for(let i=0; i<3; i++) {
                ctx.beginPath(); ctx.moveTo(b.x-15, b.y+30+i*20); ctx.lineTo(b.x, b.y+20+i*20); ctx.lineTo(b.x, b.y+40+i*20); ctx.fill();
                ctx.beginPath(); ctx.moveTo(b.x+b.w+15, b.y+30+i*20); ctx.lineTo(b.x+b.w, b.y+20+i*20); ctx.lineTo(b.x+b.w, b.y+40+i*20); ctx.fill();
            }
            ctx.fillStyle = '#451a03'; ctx.fillRect(b.x, b.y - 30, b.w, 10);
            ctx.fillStyle = '#ef4444'; ctx.fillRect(b.x+1, b.y - 29, (b.w-2) * (b.hp/b.maxHp), 8);
        }

        // Player Drawing
        if (player.invincibleTimer % 4 < 2) { 
            ctx.save();
            ctx.translate(player.x + player.width/2, player.y + player.height);
            if (!player.facingRight) ctx.scale(-1, 1);
            ctx.scale(player.squash, player.stretch);
            
            let walkAnim = (Math.abs(player.vx) > 0.1 && player.grounded) ? Math.sin(frameCount * 0.4) * 20 : (!player.grounded ? 25 : 0);

            ctx.fillStyle = '#fca5a5'; ctx.save(); ctx.translate(0, -22); ctx.rotate(-walkAnim * Math.PI/180); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-3, 0, 6, 14, 3) : ctx.fillRect(-3, 0, 6, 14); ctx.fill(); ctx.restore();
            ctx.fillStyle = '#1e293b'; ctx.save(); ctx.translate(0, -12); ctx.rotate(walkAnim * Math.PI/180); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-4, 0, 8, 12, 2) : ctx.fillRect(-4, 0, 8, 12); ctx.fill(); ctx.restore();
            
            ctx.fillStyle = '#84cc16'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-9, -26, 18, 16, 5) : ctx.fillRect(-9, -26, 18, 16); ctx.fill();
            ctx.fillStyle = '#3b82f6'; ctx.fillRect(-7, -26, 4, 16); ctx.fillRect(3, -26, 4, 16);
            
            ctx.fillStyle = '#334155'; ctx.save(); ctx.translate(0, -12); ctx.rotate(-walkAnim * Math.PI/180); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-4, 0, 8, 12, 2) : ctx.fillRect(-4, 0, 8, 12); ctx.fill(); ctx.restore();
            
            ctx.save(); ctx.translate(0, -22); ctx.rotate(walkAnim * Math.PI/180);
            ctx.fillStyle = '#fca5a5'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-3, 0, 6, 14, 3) : ctx.fillRect(-3, 0, 6, 14); ctx.fill();
            ctx.fillStyle = '#9ca3af'; ctx.fillRect(-2, 12, 8, 8); ctx.fillStyle = '#ef4444'; ctx.fillRect(-3, 10, 4, 4);
            ctx.restore();

            ctx.fillStyle = '#fca5a5'; ctx.beginPath(); ctx.arc(0, -34, 8, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(3, -36, 1.5, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#166534'; ctx.beginPath(); ctx.arc(0, -36, 8, Math.PI, 0); ctx.fill(); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(0, -36, 12, 3, 2) : ctx.fillRect(0, -36, 12, 3); ctx.fill();
            ctx.restore();
        }

        // Particles
        for (let p of particles) {
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
            ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI*2); ctx.fill(); ctx.restore();
        }

        // Floating Texts
        ctx.textAlign = "center";
        for (let ft of floatingTexts) {
            ctx.font = `bold ${ft.size} 'Playfair Display', serif`; ctx.fillStyle = ft.color; ctx.globalAlpha = ft.life;
            ctx.shadowColor = '#000'; ctx.shadowBlur = 4; ctx.fillText(ft.text, ft.x, ft.y); ctx.shadowBlur = 0; ctx.globalAlpha = 1.0;
        }

        // Dialog Bubbles
        if (activeDialog) {
            let npc = activeDialog.npc;
            let cx = npc.x + npc.w/2; let cy = npc.y - 40;
            ctx.fillStyle = 'rgba(255,255,255,0.95)';
            ctx.beginPath(); ctx.roundRect ? ctx.roundRect(cx - 100, cy - 40, 200, 50, 8) : ctx.fillRect(cx - 100, cy - 40, 200, 50); ctx.fill();
            ctx.beginPath(); ctx.moveTo(cx - 10, cy + 10); ctx.lineTo(cx + 10, cy + 10); ctx.lineTo(cx, cy + 20); ctx.fill();
            
            ctx.fillStyle = '#1c1917'; ctx.font = "bold 12px Arial"; ctx.fillText(npc.name, cx, cy - 25);
            ctx.fillStyle = '#44403c'; ctx.font = "12px Arial"; 
            
            if (activeDialog.showPrompt) {
                ctx.fillText("Appuyez sur ESPACE", cx, cy - 10);
            } else {
                ctx.fillText(npc.dialogs[activeDialog.line], cx, cy - 10);
                if(frameCount % 40 < 20) { ctx.fillStyle = '#ef4444'; ctx.fillText("▼", cx + 80, cy + 5); }
            }
        }

        ctx.restore(); // End Camera

        // Layer 5: Foreground Elements (Parallax fast 1.5)
        ctx.save();
        ctx.translate(-cameraX * 1.5, 0);
        ctx.fillStyle = '#064e3b'; // Buissons sombres au premier plan
        for(let i=-200; i<4000; i+=600) {
            ctx.beginPath(); ctx.arc(i, canvas.height + 20, 80, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(i+100, canvas.height + 40, 100, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();

        // Static UI
        ctx.fillStyle = '#ef4444'; ctx.textAlign = "left"; ctx.font = "24px Arial";
        ctx.fillText("❤️".repeat(player.hp), 10, 30);
    }

    // Keyboard
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') keys.left = true;
        if (e.key === 'ArrowRight') keys.right = true;
        if (e.key === 'ArrowUp') keys.up = true;
        if (e.key === ' ') keys.space = true;
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft') keys.left = false;
        if (e.key === 'ArrowRight') keys.right = false;
        if (e.key === 'ArrowUp') keys.up = false;
        if (e.key === ' ') keys.space = false;
    });
});