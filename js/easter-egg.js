// Injection de l'interface du jeu dans le body
const gameHTML = `
<div id="easter-egg-game-container" class="fixed inset-0 bg-stone-900 z-[100] hidden flex-col items-center justify-center p-4">
    <button id="close-game-btn" class="absolute top-6 right-6 text-white text-3xl focus:outline-none hover:text-botanic transition-colors z-[101]" aria-label="Fermer le jeu"><i class="fa-solid fa-times"></i></button>
    <div class="text-center mb-6">
        <h2 class="font-serif text-3xl md:text-5xl text-white mb-2"><span class="text-botanic-light">Super</span> Jardinier !</h2>
        <p class="text-stone-400">Flèches GAUCHE/DROITE, HAUT pour sauter. Évitez les escargots !</p>
    </div>
    <div class="relative bg-stone-800 p-2 rounded-lg shadow-2xl border border-stone-700">
        <div class="absolute top-4 left-6 text-white font-bold tracking-widest z-10" id="game-ui-score">TÂCHES: <span id="game-score" class="text-botanic-light text-xl">0/0</span></div>
        <div id="game-over-screen" class="absolute inset-0 bg-stone-900/90 flex flex-col items-center justify-center hidden rounded-lg z-20">
            <h3 id="game-end-title" class="font-serif text-4xl text-white mb-4">Chantier terminé !</h3>
            <p id="game-end-text" class="text-stone-300 mb-6 text-lg">Le jardin est parfait.</p>
            <button id="restart-game-btn" class="glow-btn px-6 py-3 bg-botanic text-white uppercase tracking-widest text-sm font-bold hover:bg-botanic-dark transition-all">Rejouer</button>
        </div>
        <canvas id="gameCanvas" width="800" height="400" class="bg-[#87CEEB] rounded border border-botanic/30" style="image-rendering: pixelated;"></canvas>
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
    const keys = { left: false, right: false, up: false };
    let gameLoop;
    let gameActive = false;
    let currentLevelIdx = 0;
    let cameraX = 0;
    let frameCount = 0;
    
    // Physics Improvements
    const gravity = 0.55;
    const friction = 0.8;
    const groundY = 350;

    const player = {
        x: 50, y: 200, width: 24, height: 32,
        vx: 0, vy: 0, speed: 6, jumpPower: -12.5, // Stronger jump
        grounded: false, facingRight: true,
        squash: 1, stretch: 1, hp: 3, maxHp: 3, invincibleTimer: 0
    };

    let particles = [];
    let floatingTexts = [];
    let enemies = [];
    let items = [];
    let levelTasks = 0;
    let completedTasks = 0;
    let levelData = {};

    // Generate random background clouds
    const clouds = Array.from({length: 10}, () => ({
        x: Math.random() * 2000, y: Math.random() * 150, s: Math.random() * 0.3 + 0.1, size: Math.random() * 10 + 15
    }));

    const levels = [
        {   // NIVEAU 1 - Tutorial
            width: 1800,
            goal: { x: 1650, y: groundY - 100, w: 80, h: 100 },
            platforms: [
                { x: 0, y: groundY, w: 600, h: 60 },
                { x: 750, y: groundY, w: 1200, h: 60 }, // Gap of 150
                { x: 400, y: 250, w: 100, h: 20 },
            ],
            tasks: [
                { x: 200, y: groundY - 20, w: 50, h: 20, type: 'grass', done: false, name: 'Tonte' },
                { x: 420, y: 250 - 45, w: 50, h: 45, type: 'hedge', done: false, name: 'Taille' },
                { x: 800, y: groundY - 20, w: 60, h: 20, type: 'grass', done: false, name: 'Tonte' },
                { x: 1200, y: groundY - 120, w: 40, h: 20, type: 'branch', done: false, trunkX: 1230, trunkY: groundY, name: 'Élagage' },
            ],
            enemies: [
                { x: 900, y: groundY - 24, w: 24, h: 24, type: 'snail', vx: -1, minX: 750, maxX: 1100, dead: false }
            ],
            items: []
        },
        {   // NIVEAU 2 - Verticality
            width: 2500,
            goal: { x: 2300, y: groundY - 100, w: 80, h: 100 },
            platforms: [
                { x: 0, y: groundY, w: 400, h: 60 },
                { x: 500, y: 270, w: 100, h: 20, type: 'moving', minX: 450, maxX: 650, vx: 2 },
                { x: 800, y: groundY, w: 300, h: 60 },
                { x: 900, y: 200, w: 100, h: 20 },
                { x: 1200, y: groundY, w: 400, h: 60 },
                { x: 1400, y: groundY - 20, w: 80, h: 20, type: 'bouncy' }, // Champignon
                { x: 1380, y: 150, w: 120, h: 20 }, // Accessible par le champignon
                { x: 1750, y: groundY, w: 800, h: 60 },
            ],
            tasks: [
                { x: 200, y: groundY - 20, w: 50, h: 20, type: 'grass', done: false, name: 'Tonte' },
                { x: 920, y: 200 - 45, w: 50, h: 45, type: 'hedge', done: false, name: 'Taille' },
                { x: 1400, y: 150 - 120, w: 40, h: 20, type: 'branch', done: false, trunkX: 1430, trunkY: 150, name: 'Élagage' },
                { x: 1900, y: groundY - 45, w: 60, h: 45, type: 'hedge', done: false, name: 'Taille' }
            ],
            enemies: [
                { x: 850, y: groundY - 24, w: 24, h: 24, type: 'snail', vx: 1, minX: 800, maxX: 1050, dead: false },
                { x: 1800, y: groundY - 24, w: 24, h: 24, type: 'snail', vx: -1.5, minX: 1750, maxX: 2100, dead: false }
            ],
            items: [
                { x: 940, y: 140, w: 20, h: 20, type: 'hp', collected: false }
            ]
        },
        {   // BOSS LEVEL
            width: 1000,
            goal: { x: -1000, y: 0, w: 1, h: 1 }, 
            isBoss: true,
            platforms: [
                { x: 0, y: groundY, w: 1000, h: 60 },
                { x: 150, y: 240, w: 100, h: 20 },
                { x: 750, y: 240, w: 100, h: 20 },
                { x: 450, y: 160, w: 100, h: 20 }, // Plateforme du milieu
            ],
            tasks: [], enemies: [], items: [],
            boss: {
                x: 800, y: groundY - 100, w: 80, h: 100, hp: 5, maxHp: 5, vx: -3, state: 'move', timer: 0,
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
    restartBtn.addEventListener('click', () => loadLevel(0));

    function loadLevel(idx) {
        currentLevelIdx = idx;
        levelData = JSON.parse(JSON.stringify(levels[idx])); 
        player.x = 50; player.y = 200;
        player.vx = 0; player.vy = 0;
        player.facingRight = true;
        player.hp = player.maxHp; player.invincibleTimer = 0;
        
        enemies = levelData.enemies || [];
        items = levelData.items || [];
        completedTasks = 0;
        levelTasks = levelData.tasks.length;
        particles = [];
        floatingTexts = [];
        
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
                vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 1) * 6,
                life: 1.0, size: Math.random() * 5 + 2, rot: Math.random() * Math.PI * 2, vrot: (Math.random() - 0.5) * 0.2,
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

    function update() {
        if (!gameActive) return;
        frameCount++;

        // Clouds animation
        clouds.forEach(c => { c.x -= c.s; if(c.x < -100) c.x = levelData.width + 100; });

        // Player timers
        if (player.invincibleTimer > 0) player.invincibleTimer--;
        player.squash += (1 - player.squash) * 0.2;
        player.stretch += (1 - player.stretch) * 0.2;

        // Player Movement
        if (keys.left) { player.vx -= 0.8; player.facingRight = false; }
        if (keys.right) { player.vx += 0.8; player.facingRight = true; }
        player.vx *= friction;
        player.vy += gravity;

        if (keys.up && player.grounded) {
            player.vy = player.jumpPower;
            player.grounded = false;
            player.squash = 0.6; player.stretch = 1.4;
            spawnParticles(player.x + 12, player.y + 32, '#d4d4d8', 5);
        }

        if (player.vx > player.speed) player.vx = player.speed;
        if (player.vx < -player.speed) player.vx = -player.speed;

        player.x += player.vx;
        if (player.x < 0) player.x = 0;
        if (player.x + player.width > levelData.width) player.x = levelData.width - player.width;

        player.y += player.vy;
        const wasGrounded = player.grounded;
        player.grounded = false;

        // Fall Death
        if (player.y > 600) return showGameOver("Tombé !", "Attention où vous mettez les pieds.", "Recommencer");

        // Platforms & Moving/Bouncy logic
        for (let p of levelData.platforms) {
            // Moving platform logic
            if (p.type === 'moving') {
                p.x += p.vx;
                if (p.x < p.minX || p.x + p.w > p.maxX) p.vx *= -1;
            }

            // Top Collision
            if (player.vy > 0 && player.x + player.width > p.x + 5 && player.x < p.x + p.w - 5 &&
                player.y + player.height >= p.y && player.y + player.height <= p.y + player.vy + 2) {
                
                player.y = p.y - player.height;
                player.vy = 0;
                player.grounded = true;

                if (p.type === 'moving') player.x += p.vx;
                
                if (p.type === 'bouncy') { // Champignon
                    player.vy = -16;
                    player.grounded = false;
                    player.squash = 0.5; player.stretch = 1.5;
                    spawnParticles(player.x + 12, player.y + 32, '#ef4444', 10);
                }
            }
        }

        if (!wasGrounded && player.grounded) {
            player.squash = 1.4; player.stretch = 0.6;
            spawnParticles(player.x + 12, player.y + 32, '#a8a29e', 3);
        }

        // Camera
        cameraX = player.x - canvas.width / 2 + player.width / 2;
        if (cameraX < 0) cameraX = 0;
        if (cameraX > levelData.width - canvas.width) cameraX = levelData.width - canvas.width;

        // Particles & Texts
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += gravity * 0.4; p.rot += p.vrot; p.life -= 0.02;
            if (p.life <= 0) particles.splice(i, 1);
        }
        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            let ft = floatingTexts[i];
            ft.y -= 1.5; ft.life -= 0.015;
            if (ft.life <= 0) floatingTexts.splice(i, 1);
        }

        // Items (Health)
        for (let i = items.length - 1; i >= 0; i--) {
            let item = items[i];
            item.y += Math.sin(frameCount * 0.1) * 0.5; // Flotte
            if (!item.collected && checkCollision(player, item)) {
                item.collected = true;
                if (player.hp < player.maxHp) player.hp++;
                spawnParticles(item.x + 10, item.y + 10, '#ef4444', 15);
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
                if (player.vy > 0 && player.y + player.height < e.y + e.h/2) {
                    e.dead = true;
                    player.vy = -8;
                    spawnParticles(e.x + e.w/2, e.y + e.h/2, '#fde047', 15);
                    spawnText(e.x, e.y, "Pouic!", '#fde047');
                } else {
                    // Take damage
                    player.hp--;
                    player.invincibleTimer = 60;
                    player.vx = (player.x < e.x) ? -10 : 10;
                    player.vy = -5;
                    spawnParticles(player.x, player.y, '#ef4444', 10);
                    if (player.hp <= 0) return showGameOver("Game Over", "Les nuisibles ont gagné.", "Réessayer");
                }
            }
        }

        // Tasks
        for (let t of levelData.tasks) {
            if (!t.done && checkCollision(player, t)) {
                t.done = true;
                completedTasks++;
                if (scoreElement) scoreElement.innerText = `${completedTasks}/${levelTasks}`;
                spawnParticles(t.x + t.w/2, t.y + t.h/2, '#22c55e', 25);
                spawnText(t.x + t.w/2, t.y - 10, t.name, '#4ade80', '20px');
            }
        }

        // Goal
        if (!levelData.isBoss && checkCollision(player, levelData.goal)) {
            if (completedTasks >= levelTasks) {
                if (currentLevelIdx < levels.length - 1) return loadLevel(currentLevelIdx + 1);
            } else {
                if (frameCount % 60 === 0) spawnText(player.x, player.y - 30, "Il reste des tâches !", '#ef4444');
            }
        }

        // Boss
        if (levelData.isBoss) {
            let boss = levelData.boss;
            if (boss.hp > 0) {
                boss.timer++;
                boss.x += boss.vx;
                if (boss.x < 100 || boss.x + boss.w > levelData.width - 100) boss.vx *= -1;
                
                // Jump
                if (boss.timer % 120 === 0 && boss.y >= groundY - boss.h - 10) boss.vy = -14;
                if (boss.y < groundY - boss.h) {
                    boss.vy += gravity; boss.y += boss.vy;
                } else {
                    boss.y = groundY - boss.h; boss.vy = 0;
                }

                // Attack Player
                if (player.invincibleTimer === 0 && checkCollision(player, boss)) {
                    if (player.vy > 0 && player.y + player.height < boss.y + 30) {
                        boss.hp--;
                        player.vy = -12;
                        spawnParticles(boss.x + boss.w/2, boss.y, '#65a30d', 40);
                        spawnText(boss.x + boss.w/2, boss.y - 20, "BAM!", '#fde047', '24px');
                        boss.vx *= 1.2; 
                        
                        // Enrage effect
                        if(boss.hp === 1) boss.vx *= 1.5;
                    } else {
                        player.hp--;
                        player.invincibleTimer = 60;
                        player.vx = (player.x < boss.x) ? -12 : 12;
                        player.vy = -8;
                        spawnText(player.x, player.y - 20, "Aïe!", '#ef4444');
                        if (player.hp <= 0) return showGameOver("Game Over", "La Ronce Mutante vous a piqué.", "Réessayer");
                    }
                }
            } else {
                if (boss.w > 0) {
                    spawnParticles(boss.x + boss.w/2, boss.y + boss.h/2, '#166534', 15);
                    boss.w -= 2; boss.x += 1; boss.h -= 2; boss.y += 2;
                } else {
                    return showGameOver("VICTOIRE !", "Le Hainaut est sauvé. Profitez de votre nouveau curseur !", "Récupérer la récompense", true);
                }
            }
        }

        draw();
        gameLoop = requestAnimationFrame(update);
    }

    function draw() {
        // Sky
        let skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        if (levelData.isBoss) {
            skyGrad.addColorStop(0, '#7f1d1d'); skyGrad.addColorStop(1, '#fca5a5');
        } else {
            skyGrad.addColorStop(0, '#38bdf8'); skyGrad.addColorStop(1, '#e0f2fe');
        }
        ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Sun / Moon
        let sunGrad = ctx.createRadialGradient(600, 80, 10, 600, 80, 80 + Math.sin(frameCount*0.05)*5);
        sunGrad.addColorStop(0, levelData.isBoss ? 'rgba(248, 113, 113, 1)' : 'rgba(253, 224, 71, 1)');
        sunGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
        ctx.fillStyle = sunGrad; ctx.beginPath(); ctx.arc(600, 80, 85, 0, Math.PI*2); ctx.fill();

        ctx.save();
        ctx.translate(-cameraX, 0);

        // Parallax Mountains
        ctx.fillStyle = levelData.isBoss ? '#991b1b' : '#bae6fd';
        ctx.beginPath(); ctx.moveTo(cameraX*0.8, groundY); ctx.lineTo(cameraX*0.8 + 250, 100); ctx.lineTo(cameraX*0.8 + 550, groundY); ctx.fill();
        ctx.fillStyle = levelData.isBoss ? '#7f1d1d' : '#7dd3fc';
        ctx.beginPath(); ctx.moveTo(cameraX*0.7 + 300, groundY); ctx.lineTo(cameraX*0.7 + 600, 50); ctx.lineTo(cameraX*0.7 + 900, groundY); ctx.fill();

        // Clouds
        ctx.fillStyle = levelData.isBoss ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.9)';
        clouds.forEach(c => {
            let float = Math.sin(frameCount*0.02 + c.x)*3;
            ctx.beginPath();
            ctx.arc(c.x, c.y + float, c.size, 0, Math.PI*2);
            ctx.arc(c.x + c.size*1.2, c.y - c.size*0.6 + float, c.size*1.3, 0, Math.PI*2);
            ctx.arc(c.x + c.size*2.4, c.y + float, c.size, 0, Math.PI*2);
            ctx.fill();
        });

        // Platforms
        for (let p of levelData.platforms) {
            if (p.type === 'bouncy') {
                // Mushroom
                ctx.fillStyle = '#ef4444';
                ctx.beginPath(); ctx.arc(p.x + p.w/2, p.y + p.h, p.w/2, Math.PI, 0); ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.beginPath(); ctx.arc(p.x + p.w*0.3, p.y + p.h*0.5, 4, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(p.x + p.w*0.7, p.y + p.h*0.7, 5, 0, Math.PI*2); ctx.fill();
            } else if (p.type === 'moving') {
                // Wood plank
                ctx.fillStyle = '#b45309'; ctx.fillRect(p.x, p.y, p.w, p.h);
                ctx.fillStyle = '#78350f'; ctx.fillRect(p.x, p.y+p.h-4, p.w, 4);
                // Chains
                ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(p.x+10, p.y); ctx.lineTo(p.x+10, p.y-50); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(p.x+p.w-10, p.y); ctx.lineTo(p.x+p.w-10, p.y-50); ctx.stroke();
            } else {
                // Dirt & Grass
                ctx.fillStyle = levelData.isBoss ? '#451a03' : '#78350f';
                ctx.fillRect(p.x, p.y + 10, p.w, p.h - 10);
                
                // Pattern dirt
                ctx.fillStyle = levelData.isBoss ? '#290f02' : '#451a03';
                for(let i=0; i<p.w; i+=40) { ctx.fillRect(p.x + i + (p.y%20), p.y + 20 + (i%20), 8, 4); }

                // Grass
                ctx.fillStyle = levelData.isBoss ? '#7c2d12' : '#22c55e';
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(p.x - 5, p.y, p.w + 10, 15, 8);
                else ctx.fillRect(p.x - 5, p.y, p.w + 10, 15);
                ctx.fill();
                
                ctx.fillStyle = levelData.isBoss ? '#9a3412' : '#4ade80';
                ctx.fillRect(p.x - 2, p.y + 2, p.w + 4, 4);
            }
        }

        // Items (Heart)
        for(let item of items) {
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(item.x + 5, item.y + 5, 6, Math.PI, 0);
            ctx.arc(item.x + 15, item.y + 5, 6, Math.PI, 0);
            ctx.lineTo(item.x + 10, item.y + 18);
            ctx.fill();
        }

        // Enemies (Snail)
        for(let e of enemies) {
            if(e.dead) continue;
            // Shell
            ctx.fillStyle = '#ca8a04';
            ctx.beginPath(); ctx.arc(e.x + 12, e.y + 12, 10, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#854d0e'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(e.x + 12, e.y + 12, 6, 0, Math.PI); ctx.stroke();
            // Body
            ctx.fillStyle = '#a3e635';
            let dir = e.vx > 0 ? 1 : -1;
            ctx.fillRect(e.x + 12, e.y + 16, 16 * dir, 6);
            // Antennas
            ctx.beginPath(); ctx.moveTo(e.x + 12 + 12*dir, e.y + 16); ctx.lineTo(e.x + 12 + 16*dir, e.y + 8); ctx.stroke();
        }

        // Goal (House)
        if (!levelData.isBoss) {
            let g = levelData.goal;
            ctx.fillStyle = '#fef08a'; ctx.fillRect(g.x, g.y + 40, g.w, 60);
            ctx.fillStyle = '#ef4444';
            ctx.beginPath(); ctx.moveTo(g.x - 10, g.y + 40); ctx.lineTo(g.x + g.w/2, g.y); ctx.lineTo(g.x + g.w + 10, g.y + 40); ctx.fill();
            ctx.fillStyle = '#3b82f6'; ctx.fillRect(g.x + 30, g.y + 60, 20, 40);
            if (completedTasks >= levelTasks) {
                ctx.fillStyle = '#22c55e'; ctx.font = "bold 24px Arial"; ctx.fillText("✓ Ouvert", g.x + 40, g.y - 10);
            }
        }

        // Boss
        if (levelData.isBoss && levelData.boss.hp > 0) {
            let b = levelData.boss;
            // Pulsing huge bush
            ctx.fillStyle = '#14532d';
            let pulse = Math.sin(frameCount*0.1)*10;
            ctx.beginPath(); ctx.arc(b.x+b.w/2, b.y+b.h/2, b.w/2 + pulse, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#064e3b';
            ctx.beginPath(); ctx.arc(b.x+b.w/2 - 10, b.y+b.h/2 - 10, b.w/3 + pulse, 0, Math.PI*2); ctx.fill();
            
            // Angry Eyes
            ctx.fillStyle = '#ef4444';
            ctx.beginPath(); ctx.ellipse(b.x + 20, b.y + 30, 8, 12, 0.5, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(b.x + b.w - 20, b.y + 30, 8, 12, -0.5, 0, Math.PI*2); ctx.fill();
            
            // Thorns
            ctx.fillStyle = '#78350f';
            for(let i=0; i<3; i++) {
                ctx.beginPath(); ctx.moveTo(b.x-15, b.y+30+i*20); ctx.lineTo(b.x, b.y+20+i*20); ctx.lineTo(b.x, b.y+40+i*20); ctx.fill();
                ctx.beginPath(); ctx.moveTo(b.x+b.w+15, b.y+30+i*20); ctx.lineTo(b.x+b.w, b.y+20+i*20); ctx.lineTo(b.x+b.w, b.y+40+i*20); ctx.fill();
            }
            
            // HP Bar
            ctx.fillStyle = '#451a03'; ctx.fillRect(b.x, b.y - 30, b.w, 10);
            ctx.fillStyle = '#ef4444'; ctx.fillRect(b.x+1, b.y - 29, (b.w-2) * (b.hp/b.maxHp), 8);
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
                    let sX = Math.sin(frameCount * 0.03 + t.x) * 2;
                    let sY = Math.cos(frameCount * 0.04 + t.x) * 2;
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

        // Player (Advanced Drawing)
        if (player.invincibleTimer % 4 < 2) { 
            ctx.save();
            ctx.translate(player.x + player.width/2, player.y + player.height);
            if (!player.facingRight) ctx.scale(-1, 1);
            ctx.scale(player.squash, player.stretch);
            
            let walkAnim = (Math.abs(player.vx) > 0.1 && player.grounded) ? Math.sin(frameCount * 0.4) * 20 : (!player.grounded ? 25 : 0);

            // Back Arm
            ctx.fillStyle = '#fca5a5'; ctx.save(); ctx.translate(0, -22); ctx.rotate(-walkAnim * Math.PI/180); 
            ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-3, 0, 6, 14, 3) : ctx.fillRect(-3, 0, 6, 14); ctx.fill(); ctx.restore();
            
            // Back Leg
            ctx.fillStyle = '#1e293b'; ctx.save(); ctx.translate(0, -12); ctx.rotate(walkAnim * Math.PI/180); 
            ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-4, 0, 8, 12, 2) : ctx.fillRect(-4, 0, 8, 12); ctx.fill(); ctx.restore();
            
            // Body (Overalls)
            ctx.fillStyle = '#84cc16'; 
            ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-9, -26, 18, 16, 5) : ctx.fillRect(-9, -26, 18, 16); ctx.fill();
            ctx.fillStyle = '#3b82f6'; // Bretelles bleues
            ctx.fillRect(-7, -26, 4, 16); ctx.fillRect(3, -26, 4, 16);
            
            // Front Leg
            ctx.fillStyle = '#334155'; ctx.save(); ctx.translate(0, -12); ctx.rotate(-walkAnim * Math.PI/180); 
            ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-4, 0, 8, 12, 2) : ctx.fillRect(-4, 0, 8, 12); ctx.fill(); ctx.restore();
            
            // Front Arm (Holding Shears)
            ctx.save(); ctx.translate(0, -22); ctx.rotate(walkAnim * Math.PI/180);
            ctx.fillStyle = '#fca5a5'; 
            ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-3, 0, 6, 14, 3) : ctx.fillRect(-3, 0, 6, 14); ctx.fill();
            // Sécateur
            ctx.fillStyle = '#9ca3af'; ctx.fillRect(-2, 12, 8, 8);
            ctx.fillStyle = '#ef4444'; ctx.fillRect(-3, 10, 4, 4);
            ctx.restore();

            // Head
            ctx.fillStyle = '#fca5a5'; ctx.beginPath(); ctx.arc(0, -34, 8, 0, Math.PI*2); ctx.fill();
            // Eye
            ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(3, -36, 1.5, 0, Math.PI*2); ctx.fill();
            // Cap
            ctx.fillStyle = '#166534'; 
            ctx.beginPath(); ctx.arc(0, -36, 8, Math.PI, 0); ctx.fill(); 
            ctx.beginPath(); ctx.roundRect ? ctx.roundRect(0, -36, 12, 3, 2) : ctx.fillRect(0, -36, 12, 3); ctx.fill();
            
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
            ctx.font = `bold ${ft.size} 'Playfair Display', serif`;
            ctx.fillStyle = ft.color;
            ctx.globalAlpha = ft.life;
            ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1.0;
        }

        ctx.restore(); // End Camera

        // Static UI
        ctx.fillStyle = '#ef4444'; ctx.textAlign = "left"; ctx.font = "24px Arial";
        ctx.fillText("❤️".repeat(player.hp), 10, 30);
    }

    // Keyboard
    window.addEventListener('keydown', e => {
        if (!gameActive) return;
        if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].indexOf(e.code) > -1) e.preventDefault();
        if (e.code === 'ArrowLeft') keys.left = true;
        if (e.code === 'ArrowRight') keys.right = true;
        if (e.code === 'ArrowUp' || e.code === 'Space') keys.up = true;
    });

    window.addEventListener('keyup', e => {
        if (e.code === 'ArrowLeft') keys.left = false;
        if (e.code === 'ArrowRight') keys.right = false;
        if (e.code === 'ArrowUp' || e.code === 'Space') keys.up = false;
    });
});
