// js/easter-egg/engine.js
// Gère la physique (collisions robustes), les entités, le Boss, les coffres et le rendu Canvas.

import { groundY, clouds, stars, levels } from './config.js';
import { keys } from './input.js';
import { initAudio, playSound } from './audio.js';

let gameContainer, closeBtn, restartBtn, canvas, ctx, scoreElement, gameOverScreen;
let bossHpContainer, bossHpFill, bossNameTxt;
let gameLoop;

let gameActive = false;
export const isGameActive = () => gameActive;

let currentLevelIdx = 0;
let cameraX = 0;
let frameCount = 0;
let screenShake = 0;

let hitStopFrames = 0; 
let gameState = 'playing'; 
let cinematicTimer = 0;
let cinematicState = '';

const gravity = 0.55;
const friction = 0.8;

const player = {
    x: 50, y: 200, width: 24, height: 32,
    vx: 0, vy: 0, speed: 6, jumpPower: -12.5,
    grounded: false, facingRight: true,
    squash: 1, stretch: 1, hp: 5, maxHp: 5, invincibleTimer: 0,
    jumps: 0, spawnX: 50, spawnY: 200,
    hasWallJump: false, hasDash: false, 
    canDash: true, isDashing: false, dashTimer: 0, dashDir: 1
};

let particles = []; let floatingTexts = []; let ghosts = [];
let enemies = []; let items = []; let npcs = []; let chests = [];
let levelTasks = 0; let completedTasks = 0;
let levelData = {};
let activeDialog = null; let nearNPC = null;

export function initEngine() {
    gameContainer = document.getElementById('easter-egg-game-container');
    closeBtn = document.getElementById('close-game-btn');
    restartBtn = document.getElementById('restart-game-btn');
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    scoreElement = document.getElementById('game-score');
    gameOverScreen = document.getElementById('game-over-screen');
    bossHpContainer = document.getElementById('boss-hp-container');
    bossHpFill = document.getElementById('boss-hp-fill');
    bossNameTxt = document.getElementById('boss-name');

    closeBtn.addEventListener('click', closeGameUI);
    restartBtn.addEventListener('click', () => { initAudio(); loadLevel(levelData.isBoss ? currentLevelIdx : 0); });
}

export function startGameUI() {
    initAudio();
    player.hasWallJump = false; player.hasDash = false;
    gameContainer.classList.remove('hidden'); gameContainer.classList.add('flex'); 
    document.body.style.overflow = 'hidden';
    loadLevel(0);
}

function closeGameUI() {
    gameContainer.classList.add('hidden'); gameContainer.classList.remove('flex');
    document.body.style.overflow = ''; gameActive = false; cancelAnimationFrame(gameLoop);
}

function activateBossUI(boss) {
    bossHpContainer.classList.remove('hidden'); bossNameTxt.innerText = boss.name;
    setTimeout(() => bossHpContainer.classList.remove('opacity-0'), 50); updateBossUI(boss);
}

function updateBossUI(boss) {
    let pct = Math.max(0, (boss.hp / boss.maxHp) * 100); bossHpFill.style.width = pct + '%';
    if(pct <= 0) { bossHpContainer.classList.add('opacity-0'); setTimeout(() => bossHpContainer.classList.add('hidden'), 500); }
}

function loadLevel(idx) {
    currentLevelIdx = idx;
    levelData = JSON.parse(JSON.stringify(levels[idx])); 
    player.x = player.spawnX = 50; player.y = player.spawnY = 200;
    player.vx = 0; player.vy = 0; player.facingRight = true;
    player.hp = player.maxHp; player.invincibleTimer = 0; player.jumps = 0;
    player.isDashing = false; player.canDash = true;
    
    enemies = levelData.enemies || []; items = levelData.items || [];
    npcs = levelData.npcs || []; chests = [];
    completedTasks = 0; levelTasks = levelData.tasks ? levelData.tasks.length : 0;
    particles = []; floatingTexts = []; ghosts = [];
    activeDialog = null; nearNPC = null;
    levelData.projectiles = []; levelData.switches = [];
    
    gameState = 'playing'; hitStopFrames = 0;

    if (levelData.isBoss && levelData.boss) {
        levelData.boss.phase = 1; levelData.boss.state = 'classic'; levelData.boss.shield = false;
        levelData.boss.invincible = false; levelData.boss.hasDoneIntro = false;
    }
    
    document.getElementById('game-ui-level').innerText = "NIVEAU " + (idx + 1) + " - " + levelData.name;
    document.getElementById('game-ui-score').innerHTML = levelData.isBoss ? "BATTEZ LA RONCE !" : `TÂCHES: <span id="game-score" class="text-botanic-light text-xl">0/${levelTasks}</span>`;
    if(!levelData.isBoss) scoreElement = document.getElementById('game-score');
    
    gameOverScreen.classList.add('hidden');
    if(bossHpContainer) { bossHpContainer.classList.add('opacity-0'); setTimeout(() => bossHpContainer.classList.add('hidden'), 500); }
    
    gameActive = true; cancelAnimationFrame(gameLoop); update();
}

function spawnParticles(x, y, color, count, type = 'normal') {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x + Math.random() * 20 - 10, y: y + Math.random() * 20 - 10,
            vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 1) * 10,
            life: 1.0, size: Math.random() * 6 + 3, rot: Math.random() * Math.PI * 2, vrot: (Math.random() - 0.5) * 0.4,
            color: color, type: type
        });
    }
}

function spawnText(x, y, text, color = '#fff', size = '18px') {
    floatingTexts.push({ x: x, y: y, text: text, life: 1.0, color: color, size: size });
}

function checkCollision(r1, r2) {
    let w1 = r1.w || r1.width; let h1 = r1.h || r1.height;
    let w2 = r2.w || r2.width; let h2 = r2.h || r2.height;
    return r1.x < r2.x + w2 && r1.x + w1 > r2.x && r1.y < r2.y + h2 && r1.y + h1 > r2.y;
}

function showGameOver(title, desc, btnText, isWin = false) {
    gameActive = false;
    document.getElementById('game-end-title').innerText = title; document.getElementById('game-end-text').innerText = desc;
    restartBtn.innerText = btnText;
    
    if (isWin) {
        restartBtn.onclick = () => { closeGameUI(); };
    } else {
        restartBtn.onclick = () => loadLevel(currentLevelIdx);
    }
    gameOverScreen.classList.remove('hidden');
}

function handleFallDeath(title, desc) {
    player.hp--;
    if (player.hp <= 0) { showGameOver("Game Over", desc, "Réessayer"); return true; }
    player.x = player.spawnX; player.y = player.spawnY; player.vx = 0; player.vy = 0; player.invincibleTimer = 60;
    cameraX = player.x - canvas.width / 2; spawnText(player.x, player.y - 20, "-1 PV", '#ef4444', '24px');
    return false;
}

function update() {
    if (!gameActive) return;
    
    if (hitStopFrames > 0) {
        hitStopFrames--; draw(); gameLoop = requestAnimationFrame(update); return;
    }
    frameCount++;

    if (gameState === 'boss_intro') {
        cinematicTimer++;
        if (cinematicState === 'pan') {
            let targetCamX = levelData.boss.x - canvas.width/2 + levelData.boss.w/2;
            cameraX += (targetCamX - cameraX) * 0.05;
            if (cinematicTimer > 60) { cinematicState = 'roar'; cinematicTimer = 0; }
        } else if (cinematicState === 'roar') {
            if (cinematicTimer === 1) { playSound('boss_hit'); screenShake = 20; }
            if (cinematicTimer > 60) { cinematicState = 'pan_back'; cinematicTimer = 0; }
        } else if (cinematicState === 'pan_back') {
            let targetCamX = player.x - canvas.width/2 + player.width/2;
            cameraX += (targetCamX - cameraX) * 0.1;
            if (Math.abs(cameraX - targetCamX) < 10 || cinematicTimer > 60) {
                gameState = 'playing'; activateBossUI(levelData.boss);
            }
        }
        draw(); gameLoop = requestAnimationFrame(update); return; 
    }

    if (levelData.isBoss && !levelData.boss.hasDoneIntro && player.x > levelData.boss.arenaMin - 300) {
        gameState = 'boss_intro'; cinematicState = 'pan'; cinematicTimer = 0;
        levelData.boss.hasDoneIntro = true; player.vx = 0; player.vy = 0; 
    }

    nearNPC = null;
    for (let npc of npcs) {
        let dist = Math.abs((player.x + player.width/2) - (npc.x + npc.w/2));
        if (dist < 100 && Math.abs(player.y - npc.y) < 60) nearNPC = npc;
    }
    
    if (nearNPC) {
        if (!activeDialog || activeDialog.npc !== nearNPC) activeDialog = { npc: nearNPC, line: 0, showPrompt: true };
        if (keys.interactJustPressed) {
            if(activeDialog.showPrompt) { activeDialog.showPrompt = false; } 
            else {
                activeDialog.line++;
                if (activeDialog.line >= nearNPC.dialogs.length) activeDialog = null;
            }
        }
    } else if (activeDialog && activeDialog.npc.name !== "Coffre") {
        activeDialog = null;
    }

    // Coffres
    for (let c of chests) {
        if (!c.opened && checkCollision(player, c)) {
            if (keys.interactJustPressed) {
                c.opened = true; playSound('chest');
                spawnParticles(c.x + 20, c.y + 20, '#fde047', 50);
                
                let itemName = c.item === 'walljump' ? "Crampons d'Élagage" : "Sécateur-Dash";
                let itemDesc = c.item === 'walljump' ? "Maintiens la flèche vers un mur en l'air pour glisser, puis SAUTE !" : "Appuie sur MAJ en plein saut pour foncer et être invincible !";
                if (c.item === 'walljump') player.hasWallJump = true;
                if (c.item === 'dash') player.hasDash = true;
                
                activeDialog = { 
                    npc: { x: c.x, y: c.y - 40, w: 0, h: 0, name: "Coffre", dialogs: [`Vous avez obtenu : ${itemName} !`, itemDesc] }, 
                    line: 0, showPrompt: false 
                };
            }
        }
    }
    
    if(activeDialog && activeDialog.npc.name === "Coffre" && keys.interactJustPressed) {
        activeDialog.line++;
        if (activeDialog.line >= activeDialog.npc.dialogs.length) activeDialog = null;
    }
    keys.interactJustPressed = false; 

    clouds.forEach(c => { c.x -= c.s; if(c.x < -200) c.x = levelData.width + 200; });

    if (player.invincibleTimer > 0) player.invincibleTimer--;
    player.squash += (1 - player.squash) * 0.2; player.stretch += (1 - player.stretch) * 0.2;

    // DASH
    if (keys.dashJustPressed && player.hasDash && player.canDash && !player.isDashing) {
        player.isDashing = true; player.dashTimer = 12; player.canDash = false;
        player.dashDir = player.facingRight ? 1 : -1; player.vy = 0;
        playSound('dash'); spawnParticles(player.x, player.y+10, '#3b82f6', 15);
    }
    keys.dashJustPressed = false;

    if (!player.isDashing) {
        if (keys.left) { player.vx -= 1.0; player.facingRight = false; }
        if (keys.right) { player.vx += 1.0; player.facingRight = true; }
        player.vx *= friction; player.vy += gravity;
    } else {
        player.vx = player.dashDir * 14; player.dashTimer--; player.vy = 0; 
        if (frameCount % 3 === 0) ghosts.push({ x: player.x, y: player.y, squash: player.squash, stretch: player.stretch, facingRight: player.facingRight, life: 1.0 });
        if (player.dashTimer <= 0) player.isDashing = false;
    }

    if (player.grounded) { player.jumps = 0; player.canDash = true; }
    
    // SAUT / DOUBLE SAUT / WALL JUMP
    let touchingWallDir = 0;
    for (let p of levelData.platforms) {
        if (player.vy >= 0 && player.y + player.height > p.y && player.y < p.y + p.h) {
            if (player.x + player.width >= p.x - 2 && player.x + player.width <= p.x + 5 && keys.right) touchingWallDir = 1;
            if (player.x <= p.x + p.w + 2 && player.x >= p.x + p.w - 5 && keys.left) touchingWallDir = -1;
        }
    }

    let isWallSliding = false;
    if (player.hasWallJump && !player.grounded && player.vy > 0 && touchingWallDir !== 0 && !player.isDashing) {
        isWallSliding = true; player.vy = 2; player.canDash = true; player.jumps = 1;
        if (frameCount % 5 === 0) spawnParticles(player.x + (touchingWallDir===1?player.width:0), player.y + 10, '#d4d4d8', 2);
    }

    if (keys.jumpJustPressed && !player.isDashing) {
        if (isWallSliding) {
            playSound('jump'); player.vy = player.jumpPower * 0.9; player.vx = touchingWallDir * -10; 
            player.facingRight = (touchingWallDir === -1); player.jumps = 1;
            player.squash = 0.7; player.stretch = 1.3; spawnParticles(player.x + (touchingWallDir===1?player.width:0), player.y + 16, '#d4d4d8', 12);
        } else if (player.grounded) {
            playSound('jump'); player.vy = player.jumpPower; player.grounded = false; player.jumps = 1;
            player.squash = 0.6; player.stretch = 1.4; spawnParticles(player.x + 12, player.y + 32, '#d4d4d8', 8);
        } else if (player.jumps === 1) {
            playSound('jump'); player.vy = player.jumpPower * 0.9; player.jumps = 2;
            player.squash = 0.7; player.stretch = 1.3; spawnParticles(player.x + 12, player.y + 32, '#818cf8', 15);
        }
    }
    keys.jumpJustPressed = false; 

    if (!player.isDashing) {
        if (player.vx > player.speed) player.vx = player.speed;
        if (player.vx < -player.speed) player.vx = -player.speed;
    }

    player.x += player.vx;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > levelData.width) player.x = levelData.width - player.width;

    player.y += player.vy;
    const wasGrounded = player.grounded; player.grounded = false;

    // EAU
    for (let w of (levelData.water || [])) {
        if (player.y + player.height > w.y + 20 && player.x + player.width > w.x && player.x < w.x + w.w) {
            playSound('water'); spawnParticles(player.x+12, w.y+10, '#3b82f6', 30);
            if(handleFallDeath("Plouf !", "Vous êtes tombé à l'eau.")) return;
        }
    }
    if (player.y > groundY + 200) if(handleFallDeath("Tombé !", "Attention où vous mettez les pieds.")) return;

    // COLLISIONS PLATEFORMES Y
    for (let p of levelData.platforms) {
        if (p.type === 'moving') { p.x += p.vx; if (p.x < p.minX || p.x + p.w > p.maxX) p.vx *= -1; }
        if (p.type === 'fragile' && p.state === 'falling') { p.y += 6; continue; }

        if (player.vy > 0 && player.x + player.width > p.x + 5 && player.x < p.x + p.w - 5 &&
            player.y + player.height >= p.y && player.y + player.height <= p.y + player.vy + 3) {
            
            player.y = p.y - player.height; player.vy = 0; player.grounded = true;
            if (p.type === 'moving') player.x += p.vx;
            
            if (p.type === 'bouncy') {
                playSound('bounce'); player.vy = -17; player.grounded = false;
                player.squash = 0.5; player.stretch = 1.5; spawnParticles(player.x + 12, player.y + 32, '#ef4444', 15);
            }
            if (p.type === 'fragile') {
                if(p.state === 'idle') p.state = 'shaking';
                p.timer++; if(p.timer > 25) p.state = 'falling';
            }
        }
    }

    if (!wasGrounded && player.grounded) { player.squash = 1.4; player.stretch = 0.6; spawnParticles(player.x + 12, player.y + 32, '#a8a29e', 6); }

    // CAMERA
    let targetCamX = player.x - canvas.width / 2 + player.width / 2;
    if (levelData.isBoss && levelData.boss && levelData.boss.hp > 0 && gameState !== 'boss_intro') {
        targetCamX = levelData.boss.arenaMin + (levelData.boss.arenaMax - levelData.boss.arenaMin)/2 - canvas.width/2;
    }
    if (targetCamX < 0) targetCamX = 0; if (targetCamX > levelData.width - canvas.width) targetCamX = levelData.width - canvas.width;
    cameraX += (targetCamX - cameraX) * 0.08;

    if (screenShake > 0) { ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake); screenShake *= 0.9; }

    for (let i = ghosts.length - 1; i >= 0; i--) { ghosts[i].life -= 0.05; if (ghosts[i].life <= 0) ghosts.splice(i, 1); }
    for (let i = particles.length - 1; i >= 0; i--) { let p = particles[i]; p.x += p.vx; p.y += p.vy; p.vy += gravity * 0.5; p.rot += p.vrot; p.life -= 0.02; if (p.life <= 0) particles.splice(i, 1); }
    for (let i = floatingTexts.length - 1; i >= 0; i--) { let ft = floatingTexts[i]; ft.y -= 1.0; ft.life -= 0.015; if (ft.life <= 0) floatingTexts.splice(i, 1); }

    // TÂCHES
    for (let t of levelData.tasks) {
        if (!t.done && checkCollision(player, t)) {
            t.done = true; completedTasks++; playSound('hit'); hitStopFrames = 3; 
            if (scoreElement) scoreElement.innerText = `${completedTasks}/${levelTasks}`;
            spawnParticles(t.x + t.w/2, t.y + t.h/2, '#22c55e', 40, 'leaf'); 
            spawnText(t.x + t.w/2, t.y - 20, t.name, '#4ade80', '22px');
        }
    }

    // TÉLÉPORTEUR
    let isTeleporterOpen = completedTasks >= levelTasks && (!levelData.boss || levelData.boss.dead) && chests.every(c => c.opened);
    if (!levelData.isBoss && checkCollision(player, levelData.goal)) {
        if (isTeleporterOpen) {
            if (keys.interact) {
                playSound('portal');
                if (currentLevelIdx < levels.length - 1) return loadLevel(currentLevelIdx + 1);
            }
        } else if (frameCount % 60 === 0) spawnText(player.x, player.y - 40, "Tâches ou Coffre manquant !", '#ef4444');
    }

    // ITEMS
    for (let i = items.length - 1; i >= 0; i--) {
        let item = items[i]; item.y = item.baseY + Math.sin(frameCount * 0.1) * 5; // Fix dérive !
        if (!item.collected && checkCollision(player, item)) {
            item.collected = true; if (player.hp < player.maxHp) player.hp++;
            spawnParticles(item.x + 10, item.y + 10, '#ef4444', 25); spawnText(item.x, item.y, "+1 PV", '#ef4444');
            items.splice(i, 1);
        }
    }

    // ENNEMIS
    for (let e of enemies) {
        if (e.dead) continue;
        
        if (e.type === 'snail') { e.x += e.vx; if (e.x < e.minX || e.x + e.w > e.maxX) e.vx *= -1; } 
        else if (e.type === 'bee') { e.x += e.vx; e.y = e.baseY + Math.sin(frameCount * 0.05 + e.x * 0.01) * 40; if (e.x < e.minX || e.x + e.w > e.maxX) e.vx *= -1; } 
        else if (e.type === 'frog') {
            e.x += e.vx; e.vy += gravity; e.y += e.vy;
            if (e.y >= e.baseY) { e.y = e.baseY; e.vy = 0; if (Math.random() < 0.02) e.vy = -12; }
            if (e.x < e.minX || e.x + e.w > e.maxX) e.vx *= -1;
        }

        if (player.invincibleTimer === 0 && checkCollision(player, e)) {
            if (!player.isDashing && player.vy > 0 && player.y + player.height * 0.5 < e.y) {
                e.dead = true; player.vy = -10; hitStopFrames = 5; playSound('hit'); screenShake = 8;
                spawnParticles(e.x + e.w/2, e.y + e.h/2, '#fde047', 25); spawnText(e.x, e.y - 10, "CRASH!", '#fde047', '20px');
            } else if (!player.isDashing) {
                player.hp--; player.invincibleTimer = 60; player.vx = (player.x < e.x) ? -12 : 12; player.vy = -7;
                spawnParticles(player.x, player.y, '#ef4444', 15);
                if (player.hp <= 0) return showGameOver("Game Over", "Les nuisibles ont gagné.", "Réessayer");
            }
        }
    }

    // BOSS
    if (levelData.boss && !levelData.boss.dead && gameState !== 'boss_intro') {
        let b = levelData.boss;
        b.timer++;
        
        if (b.type === 'scarecrow') {
            b.x += b.vx || 0;
            if (b.state === 'idle') {
                if(b.timer > 60) { b.attackType = Math.random() > 0.5 ? 'throw' : 'dash'; b.state = b.attackType; b.timer = 0; }
            } else if (b.state === 'throw') {
                if (b.timer === 20 || b.timer === 40) { 
                    levelData.projectiles.push({ x: b.x+b.w/2, y: b.y + 40, vx: (player.x > b.x ? 6 : -6), vy: 0, size: 20, color: '#9ca3af', type: 'scythe', rot: 0 }); playSound('hit');
                }
                if (b.timer > 100) { b.state = 'idle'; b.timer = 0; b.vx = 0; }
            } else if (b.state === 'dash') {
                if (b.timer === 20) b.vx = (player.x > b.x ? 12 : -12);
                if (b.timer > 60 || b.x < b.arenaMin || b.x + b.w > b.arenaMax) { b.state = 'idle'; b.timer = 0; b.vx = 0; }
            }
        }
        else if (b.type === 'toad') {
            if (b.state === 'idle') {
                if(b.timer > 90) { b.attackType = Math.random() > 0.6 ? 'summon' : 'jump'; b.state = b.attackType; b.timer = 0; } 
            } else if (b.state === 'jump') {
                if(b.timer === 1) { b.vy = -18; b.vx = (player.x - b.x) * 0.03; }
                b.vy += gravity; b.x += b.vx; b.y += b.vy;
                if (b.x < b.arenaMin) b.x = b.arenaMin; if (b.x + b.w > b.arenaMax) b.x = b.arenaMax - b.w;
                if (b.y >= 150 - b.h) { 
                    b.y = 150 - b.h; b.vy = 0; b.vx = 0; b.state = 'idle'; b.timer = 0; screenShake = 20; playSound('boss_hit');
                    levelData.projectiles.push({ x: b.x+b.w/2, y: b.y+b.h-10, vx: 7, vy: 0, size: 15, color: '#4ade80', type: 'shockwave', life: 100 });
                    levelData.projectiles.push({ x: b.x+b.w/2, y: b.y+b.h-10, vx: -7, vy: 0, size: 15, color: '#4ade80', type: 'shockwave', life: 100 });
                }
            } else if (b.state === 'summon') {
                if (b.timer === 30) {
                    playSound('water');
                    enemies.push({ x: b.x, y: b.y+b.h-24, w: 24, h: 24, type: 'frog', vx: -3, vy: -10, baseY: 150-24, minX: b.arenaMin, maxX: b.arenaMax, dead: false });
                }
                if (b.timer > 80) { b.state = 'idle'; b.timer = 0; }
            }
        }

        if (player.invincibleTimer === 0 && checkCollision(player, b)) {
            if (!b.invincible && !player.isDashing && player.vy > 0 && player.y + player.height < b.y + 40) {
                b.hp--; player.vy = -16; hitStopFrames = 10; screenShake = 25; playSound('boss_hit');
                spawnParticles(b.x + b.w/2, b.y, '#dc2626', 80); spawnText(b.x + b.w/2, b.y - 30, "AÏE !", '#fde047', '36px');
                updateBossUI(b);
                if (b.hp <= 0) {
                    b.dead = true; 
                    // LE COFFRE APPARAÎT !
                    chests.push({ x: b.x + b.w/2 - 20, y: b.y + b.h - 40, w: 40, h: 40, item: b.reward, opened: false });
                    b.w = 0; // Cache le boss
                }
            } else if (!player.isDashing) {
                player.hp--; player.invincibleTimer = 60; screenShake = 20;
                player.vx = (player.x < b.x) ? -18 : 18; player.vy = -10;
                spawnText(player.x, player.y - 30, "OUCH!", '#ef4444', '24px');
                if (player.hp <= 0) return showGameOver("Game Over", "Le boss vous a écrasé.", "Réessayer");
            }
        }
        
        for (let i = levelData.projectiles.length - 1; i >= 0; i--) {
            let p = levelData.projectiles[i]; p.x += p.vx; p.y += p.vy;
            if(p.type === 'scythe') p.rot += 0.2;
            if(p.type === 'shockwave') { p.life--; if(p.life <= 0) { levelData.projectiles.splice(i, 1); continue; } }
            if (checkCollision(player, {x: p.x-p.size, y: p.y-p.size, w: p.size*2, h: p.size*2}) && player.invincibleTimer === 0 && !player.isDashing) {
                player.hp--; player.invincibleTimer = 60; screenShake = 20; levelData.projectiles.splice(i, 1);
                if (player.hp <= 0) return showGameOver("Game Over", "Touché par un projectile.", "Réessayer");
            }
        }
    }

    draw(); gameLoop = requestAnimationFrame(update);
}

function draw() {
    const time = levelData.time;
    let skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (time === 'morning') { skyGrad.addColorStop(0, '#0ea5e9'); skyGrad.addColorStop(1, '#e0f2fe'); }
    else if (time === 'midday') { skyGrad.addColorStop(0, '#0284c7'); skyGrad.addColorStop(1, '#bae6fd'); } 
    else if (time === 'afternoon') { skyGrad.addColorStop(0, '#ea580c'); skyGrad.addColorStop(1, '#fef08a'); } 
    else if (time === 'sunset') { skyGrad.addColorStop(0, '#9f1239'); skyGrad.addColorStop(1, '#fca5a5'); } 
    else { skyGrad.addColorStop(0, '#1e1b4b'); skyGrad.addColorStop(1, '#4c1d95'); } 
    ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (time === 'night') {
        ctx.fillStyle = '#fff';
        stars.forEach(s => {
            let twinkle = Math.sin(frameCount * s.twinkleSpeed) * 0.5 + 0.5;
            ctx.globalAlpha = twinkle;
            ctx.beginPath(); ctx.arc(s.x - cameraX * 0.05, s.y, s.size, 0, Math.PI*2); ctx.fill();
        }); ctx.globalAlpha = 1.0;
    }

    let sunX = 700 - (cameraX * 0.03); 
    ctx.shadowColor = (time === 'night') ? 'rgba(255,255,255,0.9)' : 'rgba(253, 224, 71, 0.9)';
    ctx.shadowBlur = 50 + Math.sin(frameCount*0.05)*20;
    ctx.fillStyle = (time === 'night') ? '#f8fafc' : (time === 'sunset' ? '#f87171' : '#fef08a');
    ctx.beginPath(); ctx.arc(sunX, 100, 60, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;

    ctx.save();
    ctx.translate(-cameraX * 0.15, 0);
    ctx.fillStyle = (time === 'sunset' || time === 'night') ? '#881337' : '#7dd3fc';
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(400, 100); ctx.lineTo(800, groundY); ctx.fill();
    ctx.beginPath(); ctx.moveTo(600, groundY); ctx.lineTo(1000, 150); ctx.lineTo(1400, groundY); ctx.fill();
    ctx.beginPath(); ctx.moveTo(1200, groundY); ctx.lineTo(1700, 100); ctx.lineTo(2200, groundY); ctx.fill();
    
    ctx.translate(cameraX * 0.15 - cameraX * 0.3, 0);
    ctx.fillStyle = (time === 'sunset' || time === 'night') ? '#4c0519' : '#38bdf8';
    ctx.beginPath(); ctx.moveTo(-200, groundY); ctx.lineTo(150, 180); ctx.lineTo(600, groundY); ctx.fill();
    ctx.beginPath(); ctx.moveTo(500, groundY); ctx.lineTo(900, 220); ctx.lineTo(1300, groundY); ctx.fill();
    
    ctx.translate(cameraX * 0.3 - cameraX * 0.5, 0);
    let treeColor = (time === 'sunset' || time === 'night') ? '#1e3a8a' : '#0369a1';
    for(let i=0; i<levelData.width*2; i+=350) {
        ctx.fillStyle = '#1e3a8a'; ctx.fillRect(i+140, groundY-100, 20, 100);
        ctx.fillStyle = treeColor; 
        ctx.beginPath(); ctx.arc(i+150, groundY-120, 60, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(i+110, groundY-80, 50, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(i+190, groundY-80, 50, 0, Math.PI*2); ctx.fill();
    }
    ctx.translate(cameraX * 0.5 - cameraX, 0); 

    ctx.fillStyle = (time === 'sunset' || time === 'night') ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.9)';
    clouds.forEach(c => {
        let float = Math.sin(frameCount*0.02 + c.x)*5;
        ctx.beginPath(); ctx.arc(c.x, c.y + float, c.size, 0, Math.PI*2);
        ctx.arc(c.x + c.size*1.3, c.y - c.size*0.7 + float, c.size*1.4, 0, Math.PI*2);
        ctx.arc(c.x + c.size*2.6, c.y + float, c.size, 0, Math.PI*2); ctx.fill();
    });

    for (let w of (levelData.water || [])) {
        let waveGrad = ctx.createLinearGradient(0, w.y, 0, w.y+w.h);
        waveGrad.addColorStop(0, time === 'afternoon' ? '#b45309' : '#0284c7'); waveGrad.addColorStop(1, time === 'afternoon' ? '#78350f' : '#1e3a8a');
        ctx.fillStyle = waveGrad; ctx.beginPath(); ctx.moveTo(w.x, w.y + w.h);
        for(let i=0; i<=w.w; i+=15) { ctx.lineTo(w.x + i, w.y + 8 + Math.sin(frameCount*0.1 + i*0.1)*6); }
        ctx.lineTo(w.x + w.w, w.y + w.h); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2; ctx.beginPath();
        for(let i=0; i<=w.w; i+=15) { ctx.lineTo(w.x + i, w.y + 8 + Math.sin(frameCount*0.1 + i*0.1)*6); } ctx.stroke();
    }

    for (let p of levelData.platforms) {
        if(p.type === 'fragile' && p.state === 'falling') ctx.globalAlpha = 0.5;
        if (p.type === 'bouncy') {
            ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(p.x + p.w/2, p.y + p.h, p.w/2, Math.PI, 0); ctx.fill(); 
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x + p.w*0.3, p.y + p.h*0.5, 6, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(p.x + p.w*0.7, p.y + p.h*0.7, 7, 0, Math.PI*2); ctx.fill();
        } else if (p.type === 'moving') {
            ctx.fillStyle = '#b45309'; ctx.fillRect(p.x, p.y, p.w, p.h); ctx.fillStyle = '#78350f'; ctx.fillRect(p.x, p.y+p.h-4, p.w, 4);
            ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(p.x+15, p.y); ctx.lineTo(p.x+15, p.y-150); ctx.stroke(); 
            ctx.beginPath(); ctx.moveTo(p.x+p.w-15, p.y); ctx.lineTo(p.x+p.w-15, p.y-150); ctx.stroke();
        } else if (p.type === 'fragile') {
            ctx.fillStyle = '#d97706'; ctx.fillRect(p.x, p.y, p.w, p.h); ctx.fillStyle = '#fde047'; ctx.fillRect(p.x, p.y, p.w, 4);
            if(p.state === 'shaking') { ctx.fillStyle = 'rgba(239, 68, 68, 0.4)'; ctx.fillRect(p.x, p.y, p.w, p.h); }
        } else {
            ctx.fillStyle = levelData.isBoss ? '#290f02' : '#451a03'; ctx.fillRect(p.x, p.y + 12, p.w, p.h - 12);
            ctx.fillStyle = levelData.isBoss ? '#7c2d12' : (time === 'night' ? '#064e3b' : '#22c55e'); ctx.fillRect(p.x, p.y, p.w, 12);
            ctx.fillStyle = levelData.isBoss ? '#9a3412' : (time === 'night' ? '#022c22' : '#16a34a'); ctx.fillRect(p.x, p.y+12, p.w, 4);
        }
        ctx.globalAlpha = 1.0;
    }

    // Coffres
    for (let c of chests) {
        ctx.fillStyle = '#b45309'; ctx.fillRect(c.x, c.y, c.w, c.h);
        ctx.fillStyle = '#fde047'; ctx.fillRect(c.x - 2, c.y + 15, c.w + 4, 8);
        ctx.fillStyle = '#78350f'; ctx.fillRect(c.x + c.w/2 - 4, c.y + 12, 8, 14);
        if (!c.opened) {
            ctx.shadowColor = '#fde047'; ctx.shadowBlur = 15;
            ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2; ctx.strokeRect(c.x, c.y, c.w, c.h);
            ctx.shadowBlur = 0;
            if (Math.abs((player.x+player.width/2) - (c.x+c.w/2)) < 50) {
                ctx.fillStyle = '#fde047'; ctx.font = "bold 14px Arial"; ctx.textAlign = "center";
                ctx.fillText("'E' OUVRIR", c.x + c.w/2, c.y - 15);
            }
        } else {
            ctx.fillStyle = '#000'; ctx.fillRect(c.x + 4, c.y + 4, c.w - 8, c.h - 8);
        }
    }

    // Le Téléporteur Magique
    if (!levelData.isBoss) {
        let g = levelData.goal;
        let isTeleporterOpen = completedTasks >= levelTasks && (!levelData.boss || levelData.boss.dead) && chests.every(c => c.opened);
        
        ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.ellipse(g.x + g.w/2, g.y + g.h/2 + 20, g.w/2 + 5, g.h/2 + 15, 0, 0, Math.PI*2); ctx.fill();
        if(isTeleporterOpen) { ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 30 + Math.sin(frameCount*0.1)*10; }
        ctx.fillStyle = isTeleporterOpen ? '#22c55e' : '#475569'; ctx.beginPath(); ctx.ellipse(g.x + g.w/2, g.y + g.h/2 + 20, g.w/2, g.h/2 + 10, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = isTeleporterOpen ? '#bbf7d0' : '#0f172a'; ctx.beginPath(); ctx.ellipse(g.x + g.w/2, g.y + g.h/2 + 20, g.w/2 - 10, g.h/2, 0, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;

        if (isTeleporterOpen) {
            ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(g.x + g.w/2, g.y + g.h/2 + 20, 20 + Math.sin(frameCount*0.1)*5, 0, Math.PI*2); ctx.stroke();
            if (Math.abs((player.x+player.width/2) - (g.x+g.w/2)) < 50) {
                ctx.shadowColor = '#22c55e'; ctx.shadowBlur = 15;
                ctx.fillStyle = '#22c55e'; ctx.font = "bold 16px Arial"; ctx.textAlign = "center"; 
                ctx.fillText("APPUYEZ SUR 'E'", g.x + g.w/2, g.y - 20); ctx.shadowBlur = 0;
            }
        }
    }

    // TÂCHES
    for (let t of levelData.tasks) {
        if (!t.done) { ctx.shadowColor = 'rgba(74, 222, 128, 0.9)'; ctx.shadowBlur = 20 + Math.sin(frameCount * 0.1)*10; }
        if (t.type === 'grass') {
            ctx.fillStyle = t.done ? '#4ade80' : '#166534';
            let sway = Math.sin(frameCount * 0.05 + t.x) * (t.done ? 1 : 5);
            let yOff = t.done ? t.h - 8 : 0;
            for(let i=0; i<t.w; i+=12) {
                ctx.beginPath(); ctx.moveTo(t.x + i, t.y + t.h); ctx.lineTo(t.x + i + 6 + sway, t.y + yOff); ctx.lineTo(t.x + i + 12, t.y + t.h); ctx.fill();
            }
        } else if (t.type === 'hedge') {
            if (!t.done) {
                let sX = Math.sin(frameCount * 0.03 + t.x) * 3; let sY = Math.cos(frameCount * 0.04 + t.x) * 3;
                ctx.fillStyle = '#14532d';
                ctx.beginPath(); ctx.arc(t.x+15+sX, t.y+25+sY, 28, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(t.x+35-sX, t.y+20-sY, 33, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(t.x+45+sX, t.y+35+sY, 23, 0, Math.PI*2); ctx.fill();
            } else { ctx.fillStyle = '#15803d'; ctx.fillRect(t.x, t.y + 20, t.w, t.h - 20); }
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

    for(let npc of npcs) {
        ctx.fillStyle = npc.color; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(npc.x, npc.y, npc.w, npc.h, 6) : ctx.fillRect(npc.x, npc.y, npc.w, npc.h); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(npc.x + 6, npc.y + 10, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(npc.x + 14, npc.y + 10, 3, 0, Math.PI*2); ctx.fill();
    }

    // FANTOMES DASH
    for (let g of ghosts) {
        ctx.save(); ctx.translate(g.x + player.width/2, g.y + player.height);
        if (!g.facingRight) ctx.scale(-1, 1);
        ctx.scale(g.squash, g.stretch);
        ctx.globalAlpha = g.life * 0.4; ctx.fillStyle = '#3b82f6';
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-10, -28, 20, 18, 5) : ctx.fillRect(-10, -28, 20, 18); ctx.fill();
        ctx.beginPath(); ctx.arc(0, -38, 9, 0, Math.PI*2); ctx.fill(); ctx.restore();
    }
    ctx.globalAlpha = 1.0;

    // JOUEUR
    if (player.invincibleTimer % 4 < 2) { 
        ctx.save(); ctx.translate(player.x + player.width/2, player.y + player.height);
        if (!player.facingRight) ctx.scale(-1, 1);
        
        if (player.isDashing) { ctx.rotate(Math.PI/2); ctx.scale(1.5, 0.5); } 
        else ctx.scale(player.squash, player.stretch);
        
        let walkAnim = (Math.abs(player.vx) > 0.1 && player.grounded) ? Math.sin(frameCount * 0.5) * 25 : (!player.grounded ? 30 : 0);

        ctx.fillStyle = '#fca5a5'; ctx.save(); ctx.translate(0, -22); ctx.rotate(-walkAnim * Math.PI/180); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-3, 0, 7, 16, 3) : ctx.fillRect(-3, 0, 7, 16); ctx.fill(); ctx.restore();
        ctx.fillStyle = '#1e293b'; ctx.save(); ctx.translate(0, -12); ctx.rotate(walkAnim * Math.PI/180); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-4, 0, 9, 14, 2) : ctx.fillRect(-4, 0, 9, 14); ctx.fill(); ctx.restore();
        
        ctx.fillStyle = player.hasDash ? '#f59e0b' : '#84cc16'; 
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-10, -28, 20, 18, 5) : ctx.fillRect(-10, -28, 20, 18); ctx.fill();
        ctx.fillStyle = '#3b82f6'; ctx.fillRect(-8, -28, 5, 18); ctx.fillRect(3, -28, 5, 18);
        
        ctx.fillStyle = '#334155'; ctx.save(); ctx.translate(0, -12); ctx.rotate(-walkAnim * Math.PI/180); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-4, 0, 9, 14, 2) : ctx.fillRect(-4, 0, 9, 14); ctx.fill(); ctx.restore();
        
        ctx.save(); ctx.translate(0, -22); ctx.rotate(walkAnim * Math.PI/180);
        ctx.fillStyle = '#fca5a5'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-3, 0, 7, 16, 3) : ctx.fillRect(-3, 0, 7, 16); ctx.fill();
        ctx.fillStyle = '#9ca3af'; ctx.fillRect(-2, 14, 10, 10); ctx.fillStyle = '#ef4444'; ctx.fillRect(-3, 12, 5, 5); ctx.restore();

        ctx.fillStyle = '#fca5a5'; ctx.beginPath(); ctx.arc(0, -38, 9, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(4, -40, 2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#166534'; ctx.beginPath(); ctx.arc(0, -40, 9, Math.PI, 0); ctx.fill(); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(0, -40, 14, 4, 2) : ctx.fillRect(0, -40, 14, 4); ctx.fill();
        ctx.restore();
    }

    // ENNEMIS / BOSS / PROJECTILES
    for(let e of enemies) {
        if(e.dead) continue;
        let dir = e.vx > 0 ? 1 : -1;
        if (e.type === 'snail' || e.type === 'frog') {
            ctx.fillStyle = e.type === 'snail' ? '#ca8a04' : '#4ade80'; ctx.fillRect(e.x, e.y, e.w, e.h);
            ctx.fillStyle = '#000'; ctx.fillRect(e.x+4, e.y+4, 4,4);
        } else if (e.type === 'bee') {
            ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(e.x + 12, e.y + 12, 10, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#000'; ctx.fillRect(e.x + 8, e.y + 2, 4, 20); ctx.fillRect(e.x + 16, e.y + 2, 4, 20);
            ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(e.x + 12 - 5*dir, e.y + 6 - Math.sin(frameCount*0.5)*4, 6, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(e.x + 12 + 10*dir, e.y + 12, 2, 0, Math.PI*2); ctx.fill();
        }
    }

    if (levelData.isBoss && !levelData.boss.dead && levelData.boss.w > 0) {
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
        }
    }

    for (let p of levelData.projectiles) {
        ctx.save(); ctx.translate(p.x, p.y);
        if(p.type === 'scythe') {
            ctx.rotate(p.rot); ctx.fillStyle = p.color; ctx.fillRect(-2, -p.size, 4, p.size*2);
            ctx.fillStyle = '#cbd5e1'; ctx.beginPath(); ctx.moveTo(2, -p.size); ctx.lineTo(20, -p.size-10); ctx.lineTo(2, -p.size+10); ctx.fill();
        } else { ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI*2); ctx.fill(); }
        ctx.restore();
    }

    for (let p of particles) {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.type === 'leaf') { ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size/2, 0, 0, Math.PI*2); ctx.fill(); } 
        else { ctx.shadowColor = p.color; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI*2); ctx.fill(); }
        ctx.restore();
    }

    ctx.restore(); 

    if (gameState === 'boss_intro') {
        ctx.fillStyle = '#000'; let barHeight = Math.min(cinematicTimer * 2, 80); 
        ctx.fillRect(0, 0, canvas.width, barHeight); ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);
    }

    // UI & DIALOGUES
    ctx.textAlign = "center";
    for (let ft of floatingTexts) {
        ctx.font = `bold ${ft.size} 'Playfair Display', serif`; ctx.fillStyle = ft.color; ctx.globalAlpha = ft.life;
        ctx.shadowColor = '#000'; ctx.shadowBlur = 6; ctx.fillText(ft.text, ft.x - cameraX, ft.y); ctx.shadowBlur = 0; ctx.globalAlpha = 1.0;
    }

    if (activeDialog && gameState !== 'boss_intro') {
        let npc = activeDialog.npc;
        let cx = (npc.x + npc.w/2) - cameraX; let cy = npc.y - 45;
        
        ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 15;
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(cx - 150, cy - 60, 300, 70, 8) : ctx.fillRect(cx - 150, cy - 60, 300, 70); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx - 15, cy + 10); ctx.lineTo(cx + 15, cy + 10); ctx.lineTo(cx, cy + 25); ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#1c1917'; ctx.font = "bold 14px Arial"; ctx.fillText(npc.name, cx, cy - 40);
        ctx.fillStyle = '#44403c'; ctx.font = "14px Arial"; 
        
        if (activeDialog.showPrompt) {
            ctx.fillText("Appuyez sur 'E' pour interagir", cx, cy - 15);
        } else {
            ctx.fillText(npc.dialogs[activeDialog.line], cx, cy - 15);
            if(frameCount % 40 < 20 && activeDialog.line < npc.dialogs.length - 1) { ctx.fillStyle = '#ef4444'; ctx.fillText("▼", cx + 130, cy + 5); }
        }
    }

    if (gameState !== 'boss_intro') {
        ctx.fillStyle = '#ef4444'; ctx.textAlign = "left"; ctx.font = "28px Arial";
        ctx.shadowColor = '#000'; ctx.shadowBlur = 6; ctx.fillText("❤️".repeat(player.hp), 15, 35); ctx.shadowBlur = 0;
    }
}