// js/easter-egg/engine.js
// Le cœur du jeu : Physique, mise à jour, rendu (Canvas), sons et gestion des niveaux.

import { groundY, clouds, stars, levels } from './config.js';
import { keys } from './input.js';

let gameContainer, closeBtn, restartBtn, canvas, ctx, scoreElement, gameOverScreen;
let gameLoop;
let gameActive = false;
export const isGameActive = () => gameActive;

let currentLevelIdx = 0;
let cameraX = 0;
let frameCount = 0;
let screenShake = 0;

const gravity = 0.55;
const friction = 0.8;

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
    } else if (type === 'hit') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
        gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);
    } else if (type === 'water') {
        osc.type = 'square'; osc.frequency.setValueAtTime(100, now); osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
        gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'portal') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.5);
        gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now); osc.stop(now + 0.5);
    }
}

export function initEngine() {
    gameContainer = document.getElementById('easter-egg-game-container');
    closeBtn = document.getElementById('close-game-btn');
    restartBtn = document.getElementById('restart-game-btn');
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    scoreElement = document.getElementById('game-score');
    gameOverScreen = document.getElementById('game-over-screen');

    closeBtn.addEventListener('click', closeGameUI);
    restartBtn.addEventListener('click', () => {
        initAudio();
        loadLevel(levelData.isBoss ? currentLevelIdx : 0);
    });
}

export function startGameUI() {
    initAudio();
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
    levelData.projectiles = [];
    levelData.switches = [];
    
    if (levelData.isBoss) {
        levelData.boss.phase = 1;
        levelData.boss.state = 'classic';
        levelData.boss.shield = false;
        levelData.boss.invincible = false;
        levelData.boss.arenaMin = 0;
        levelData.boss.arenaMax = 1200;
    }
    
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
                if (activeDialog.line >= nearNPC.dialogs.length) activeDialog = null;
            }
        }
    } else {
        activeDialog = null;
    }
    keys.interactJustPressed = false; 

    clouds.forEach(c => { c.x -= c.s; if(c.x < -200) c.x = levelData.width + 200; });

    if (player.invincibleTimer > 0) player.invincibleTimer--;
    player.squash += (1 - player.squash) * 0.2;
    player.stretch += (1 - player.stretch) * 0.2;

    if (keys.left) { player.vx -= 1.0; player.facingRight = false; }
    if (keys.right) { player.vx += 1.0; player.facingRight = true; }
    player.vx *= friction;
    player.vy += gravity;

    if (player.grounded) player.jumps = 0;
    
    // Double Saut
    if (keys.jumpJustPressed) {
        if (player.grounded) {
            playSound('jump');
            player.vy = player.jumpPower;
            player.grounded = false;
            player.jumps = 1;
            player.squash = 0.6; player.stretch = 1.4;
            spawnParticles(player.x + 12, player.y + 32, '#d4d4d8', 8);
        } else if (player.jumps === 1) {
            playSound('jump');
            player.vy = player.jumpPower * 0.9;
            player.jumps = 2;
            player.squash = 0.7; player.stretch = 1.3;
            spawnParticles(player.x + 12, player.y + 32, '#818cf8', 15);
        }
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

    // Eau
    for (let w of (levelData.water || [])) {
        if (player.y + player.height > w.y + 20 && player.x + player.width > w.x && player.x < w.x + w.w) {
            playSound('water');
            spawnParticles(player.x+12, w.y+10, '#3b82f6', 30);
            if(handleFallDeath("Plouf !", "Vous êtes tombé à l'eau.")) return;
        }
    }
    
    if (player.y > groundY + 200) {
        if(handleFallDeath("Tombé !", "Attention où vous mettez les pieds.")) return;
    }

    // Plateformes
    for (let p of levelData.platforms) {
        if (p.type === 'moving') {
            p.x += p.vx;
            if (p.x < p.minX || p.x + p.w > p.maxX) p.vx *= -1;
        }
        if (p.type === 'fragile' && p.state === 'falling') {
            p.y += 6; 
            continue;
        }

        if (player.vy > 0 && player.x + player.width > p.x + 5 && player.x < p.x + p.w - 5 &&
            player.y + player.height >= p.y && player.y + player.height <= p.y + player.vy + 3) {
            
            player.y = p.y - player.height;
            player.vy = 0;
            player.grounded = true;

            if (p.type === 'moving') player.x += p.vx;
            
            if (p.type === 'bouncy') {
                playSound('bounce');
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

    // Caméra
    let targetCamX = player.x - canvas.width / 2 + player.width / 2;
    if (levelData.isBoss && levelData.boss && levelData.boss.hp > 0) {
        let b = levelData.boss;
        if (b.state === 'retreat_1' || b.state === 'retreat_2') {
            targetCamX = b.x - canvas.width / 2;
            targetCamX += (Math.random() - 0.5) * 20; 
        } else if (b.state === 'shielded' || b.phase >= 4) {
            targetCamX = 3500 - canvas.width / 2; 
        }
    }
    
    if (targetCamX < 0) targetCamX = 0;
    if (targetCamX > levelData.width - canvas.width) targetCamX = levelData.width - canvas.width;
    cameraX += (targetCamX - cameraX) * 0.08;

    if (screenShake > 0) {
        ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
        screenShake *= 0.9;
    }

    // Particules
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

    // Tâches
    for (let t of levelData.tasks) {
        if (!t.done && checkCollision(player, t)) {
            t.done = true; completedTasks++;
            playSound('hit'); 
            if (scoreElement) scoreElement.innerText = `${completedTasks}/${levelTasks}`;
            spawnParticles(t.x + t.w/2, t.y + t.h/2, '#22c55e', 40);
            spawnText(t.x + t.w/2, t.y - 20, t.name, '#4ade80', '22px');
        }
    }

    // Objectif (Téléporteur)
    if (!levelData.isBoss && checkCollision(player, levelData.goal)) {
        if (completedTasks >= levelTasks) {
            if (keys.interact) {
                playSound('portal');
                if (currentLevelIdx < levels.length - 1) return loadLevel(currentLevelIdx + 1);
            }
        } else {
            if (frameCount % 60 === 0) spawnText(player.x, player.y - 40, "Il reste des tâches !", '#ef4444');
        }
    }

    // Items
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

    // Ennemis
    for (let e of enemies) {
        if (e.dead) continue;
        
        if (e.type === 'snail') {
            e.x += e.vx;
            if (e.x < e.minX || e.x + e.w > e.maxX) e.vx *= -1;
        } else if (e.type === 'bee') {
            e.x += e.vx;
            e.y = e.baseY + Math.sin(frameCount * 0.05 + e.x * 0.01) * 40; 
            if (e.x < e.minX || e.x + e.w > e.maxX) e.vx *= -1;
        } else if (e.type === 'frog') {
            e.x += e.vx;
            e.vy += gravity;
            e.y += e.vy;
            if (e.y >= e.baseY) {
                e.y = e.baseY;
                e.vy = 0;
                if (Math.random() < 0.02) e.vy = -12; 
            }
            if (e.x < e.minX || e.x + e.w > e.maxX) e.vx *= -1;
        }

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

    // Boss
    if (levelData.isBoss) {
        let b = levelData.boss;
        if (b.hp > 0) {
            b.timer++;
            
            // PHASE 1
            if (b.phase === 1) {
                b.x += b.vx;
                if (b.x < b.arenaMin || b.x + b.w > b.arenaMax) b.vx *= -1;
                if (b.timer % 120 === 0 && b.y >= groundY - b.h - 10) b.vy = -15;
                
                if (b.hp <= 20) {
                    b.phase = 2; b.state = 'retreat_1';
                    spawnText(b.x, b.y - 50, "C'EST TOUT ?", '#ef4444', '30px');
                }
            }
            // PHASE 2
            else if (b.phase === 2) {
                if (b.state === 'retreat_1') {
                    b.x += 10; 
                    if (b.x > 2500) { 
                        b.state = 'waiting'; b.phase = 3; 
                        b.x = 3500; b.arenaMin = 3000; b.arenaMax = 4000;
                        enemies.push({ x: 1300, y: groundY - 24, w: 24, h: 24, type: 'snail', vx: 2, minX: 1200, maxX: 1600, dead: false });
                        enemies.push({ x: 2400, y: groundY - 24, w: 24, h: 24, type: 'frog', vx: 3, vy: 0, baseY: groundY-24, minX: 2300, maxX: 2900, dead: false });
                    }
                }
            }
            // PHASE 3
            else if (b.phase === 3) {
                if (player.x > 3000) {
                    b.phase = 4; b.state = 'shielded';
                    b.hp = 15; 
                    levelData.switches = [
                        { x: 3100, y: 270, w: 30, h: 30, active: false },
                        { x: 3850, y: 270, w: 30, h: 30, active: false }
                    ];
                    spawnText(3500, 150, "ACTIVEZ LES LEVIERS !", '#fde047', '28px');
                }
                if (b.timer % 80 === 0) {
                    levelData.projectiles.push({ x: cameraX + canvas.width + 50, y: 100 + Math.random()*300, vx: -7, vy: 0, size: 10, color: '#4d7c0f' });
                }
            }
            // PHASE 4
            else if (b.phase === 4) {
                b.invincible = true;
                b.x = 3500;
                if (b.timer % 60 === 0) { 
                    levelData.projectiles.push({ x: 3200 + Math.random()*600, y: -20, vx: 0, vy: 5, size: 8, color: '#ef4444' });
                }
                
                let allActive = true;
                for(let s of levelData.switches) {
                    if (player.x < s.x + s.w && player.x + player.width > s.x && player.y < s.y + s.h && player.y + player.height > s.y && keys.interactJustPressed) {
                        s.active = true;
                        spawnParticles(s.x, s.y, '#fde047', 20);
                    }
                    if (!s.active) allActive = false;
                }
                
                if (allActive) {
                    b.phase = 5; b.invincible = false; b.state = 'classic';
                    spawnText(b.x, b.y - 50, "NON ! MON BOUCLIER !", '#ef4444', '30px');
                }
            }
            // PHASE 5
            else if (b.phase === 5) {
                b.x += b.vx * 1.6;
                if (b.x < b.arenaMin || b.x + b.w > b.arenaMax) b.vx *= -1;
                if (b.timer % 80 === 0 && b.y >= groundY - b.h - 10) {
                    b.vy = -18;
                    if (Math.random() < 0.4) {
                        levelData.projectiles.push({ x: b.x + b.w/2, y: groundY - 5, vx: 6, vy: 0, size: 15, color: '#991b1b', type: 'shockwave' });
                        levelData.projectiles.push({ x: b.x + b.w/2, y: groundY - 5, vx: -6, vy: 0, size: 15, color: '#991b1b', type: 'shockwave' });
                        screenShake = 15;
                    }
                }
                
                if (b.timer % 100 === 0) { 
                    let dx = (player.x + player.width/2) - (b.x + b.w/2);
                    let dy = (player.y + player.height/2) - (b.y + b.h/2);
                    let dist = Math.sqrt(dx*dx + dy*dy);
                    levelData.projectiles.push({ x: b.x + b.w/2, y: b.y + b.h/2, vx: (dx/dist)*9, vy: (dy/dist)*9, size: 12, color: '#b91c1c' });
                }
            }

            if (b.y < groundY - b.h) {
                b.vy += gravity; b.y += b.vy;
            } else {
                if (b.vy > 5) screenShake = 8; 
                b.y = groundY - b.h; b.vy = 0;
            }

            for (let i = levelData.projectiles.length - 1; i >= 0; i--) {
                let p = levelData.projectiles[i];
                p.x += p.vx; p.y += p.vy;
                if (p.type === 'shockwave') p.size += 0.5;

                if (player.invincibleTimer === 0 && player.x < p.x + p.size && player.x + player.width > p.x && player.y < p.y + p.size && player.y + player.height > p.y) {
                    player.hp--; player.invincibleTimer = 60;
                    screenShake = 20;
                    levelData.projectiles.splice(i, 1);
                    if (player.hp <= 0) return showGameOver("Game Over", "La Ronce vous a eu de loin.", "Réessayer");
                }
                else if (p.x < cameraX - 100 || p.x > cameraX + canvas.width + 100 || p.y > groundY + 100 || p.y < -500) {
                    levelData.projectiles.splice(i, 1);
                }
            }

            if (player.invincibleTimer === 0 && checkCollision(player, b)) {
                if (!b.invincible && player.vy > 0 && player.y + player.height < b.y + 40) {
                    b.hp--; player.vy = -16;
                    screenShake = 25;
                    spawnParticles(b.x + b.w/2, b.y, '#dc2626', 80);
                    spawnText(b.x + b.w/2, b.y - 30, "AÏE !", '#fde047', '36px');
                    if (b.hp === 10) { b.phase = 5; spawnText(b.x, b.y-100, "FINISSONS-EN !", '#ef4444', '40px'); }
                } else {
                    player.hp--; player.invincibleTimer = 60;
                    screenShake = 20;
                    player.vx = (player.x < b.x) ? -18 : 18; player.vy = -10;
                    spawnText(player.x, player.y - 30, "OUCH!", '#ef4444', '24px');
                    if (player.hp <= 0) return showGameOver("Game Over", "La Ronce vous a écrasé.", "Réessayer");
                }
            }
        } else {
            screenShake = 5; 
            if (b.w > 0) {
                spawnParticles(b.x + b.w/2, b.y + b.h/2, '#166534', 30);
                b.w -= 3; b.x += 1.5; b.h -= 3; b.y += 3;
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
    
    // --- 1. SKY & SUN/MOON ---
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
        });
        ctx.globalAlpha = 1.0;
    }

    let sunX = 700 - (cameraX * 0.03); 
    // Halo dynamique du soleil/lune
    ctx.shadowColor = (time === 'night') ? 'rgba(255,255,255,0.9)' : 'rgba(253, 224, 71, 0.9)';
    ctx.shadowBlur = 50 + Math.sin(frameCount*0.05)*20;
    ctx.fillStyle = (time === 'night') ? '#f8fafc' : (time === 'sunset' ? '#f87171' : '#fef08a');
    ctx.beginPath(); ctx.arc(sunX, 100, 60, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;

    // --- 2. PARALLAX ---
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

    // Nuages
    ctx.fillStyle = (time === 'sunset' || time === 'night') ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.9)';
    clouds.forEach(c => {
        let float = Math.sin(frameCount*0.02 + c.x)*5;
        ctx.beginPath();
        ctx.arc(c.x, c.y + float, c.size, 0, Math.PI*2);
        ctx.arc(c.x + c.size*1.3, c.y - c.size*0.7 + float, c.size*1.4, 0, Math.PI*2);
        ctx.arc(c.x + c.size*2.6, c.y + float, c.size, 0, Math.PI*2);
        ctx.fill();
    });

    // Eau
    for (let w of (levelData.water || [])) {
        let waveGrad = ctx.createLinearGradient(0, w.y, 0, w.y+w.h);
        waveGrad.addColorStop(0, time === 'afternoon' ? '#b45309' : '#0284c7'); 
        waveGrad.addColorStop(1, time === 'afternoon' ? '#78350f' : '#1e3a8a');
        ctx.fillStyle = waveGrad;
        ctx.beginPath(); ctx.moveTo(w.x, w.y + w.h);
        for(let i=0; i<=w.w; i+=15) { ctx.lineTo(w.x + i, w.y + 8 + Math.sin(frameCount*0.1 + i*0.1)*6); }
        ctx.lineTo(w.x + w.w, w.y + w.h); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2;
        ctx.beginPath();
        for(let i=0; i<=w.w; i+=15) { ctx.lineTo(w.x + i, w.y + 8 + Math.sin(frameCount*0.1 + i*0.1)*6); }
        ctx.stroke();
    }

    // Checkpoints
    for (let c of (levelData.checkpoints || [])) {
        ctx.fillStyle = '#78350f'; ctx.fillRect(c.x + 8, c.y, 4, c.h);
        ctx.fillStyle = c.active ? '#22c55e' : '#ef4444';
        ctx.shadowColor = c.active ? 'rgba(34,197,94,0.8)' : 'rgba(239,68,68,0.8)'; ctx.shadowBlur = 15;
        ctx.beginPath(); ctx.moveTo(c.x + 12, c.y + 2); ctx.lineTo(c.x + 35, c.y + 12); ctx.lineTo(c.x + 12, c.y + 22); ctx.fill();
        ctx.shadowBlur = 0;
    }

    // Plateformes (Herbe et Terre)
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
            if(p.state === 'shaking') { ctx.fillStyle = 'rgba(239, 68, 68, 0.4)'; ctx.fillRect(p.x, p.y, p.w, p.h); }
        } else {
            ctx.fillStyle = levelData.isBoss ? '#290f02' : '#451a03'; ctx.fillRect(p.x, p.y + 12, p.w, p.h - 12);
            ctx.fillStyle = levelData.isBoss ? '#7c2d12' : (time === 'night' ? '#064e3b' : '#22c55e');
            ctx.fillRect(p.x, p.y, p.w, 12);
            ctx.fillStyle = levelData.isBoss ? '#9a3412' : (time === 'night' ? '#022c22' : '#16a34a');
            ctx.fillRect(p.x, p.y+12, p.w, 4);
        }
        ctx.globalAlpha = 1.0;
    }

    // Le Téléporteur Magique
    if (!levelData.isBoss) {
        let g = levelData.goal;
        let isOpen = (completedTasks >= levelTasks);
        
        ctx.fillStyle = '#1e293b';
        ctx.beginPath(); ctx.ellipse(g.x + g.w/2, g.y + g.h/2 + 20, g.w/2 + 5, g.h/2 + 15, 0, 0, Math.PI*2); ctx.fill();
        
        if(isOpen) { ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 30 + Math.sin(frameCount*0.1)*10; }
        
        ctx.fillStyle = isOpen ? '#22c55e' : '#475569';
        ctx.beginPath(); ctx.ellipse(g.x + g.w/2, g.y + g.h/2 + 20, g.w/2, g.h/2 + 10, 0, 0, Math.PI*2); ctx.fill();
        
        ctx.fillStyle = isOpen ? '#bbf7d0' : '#0f172a';
        ctx.beginPath(); ctx.ellipse(g.x + g.w/2, g.y + g.h/2 + 20, g.w/2 - 10, g.h/2, 0, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;

        if (isOpen) {
            ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(g.x + g.w/2, g.y + g.h/2 + 20, 20 + Math.sin(frameCount*0.1)*5, 0, Math.PI*2); ctx.stroke();
            
            if (Math.abs((player.x+player.width/2) - (g.x+g.w/2)) < 50) {
                ctx.shadowColor = '#22c55e'; ctx.shadowBlur = 15;
                ctx.fillStyle = '#22c55e'; ctx.font = "bold 16px Arial"; ctx.textAlign = "center"; 
                ctx.fillText("APPUYEZ SUR 'E'", g.x + g.w/2, g.y - 20);
                ctx.shadowBlur = 0;
            }
        }
    }

    // TÂCHES (Le Halo)
    for (let t of levelData.tasks) {
        if (!t.done) { 
            ctx.shadowColor = 'rgba(74, 222, 128, 0.9)'; 
            ctx.shadowBlur = 20 + Math.sin(frameCount * 0.1)*10; 
        }
        
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
            } else {
                ctx.fillStyle = '#15803d'; ctx.fillRect(t.x, t.y + 20, t.w, t.h - 20);
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

    // NPCs
    for(let npc of npcs) {
        ctx.fillStyle = npc.color; 
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(npc.x, npc.y, npc.w, npc.h, 6) : ctx.fillRect(npc.x, npc.y, npc.w, npc.h); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(npc.x + 6, npc.y + 10, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(npc.x + 14, npc.y + 10, 3, 0, Math.PI*2); ctx.fill();
    }

    // Boss Phase 4 Bouclier
    if (levelData.isBoss && levelData.boss.hp > 0 && levelData.boss.invincible) {
        let b = levelData.boss;
        ctx.strokeStyle = 'rgba(147, 197, 253, 0.6)'; ctx.lineWidth = 8;
        ctx.setLineDash([15, 10]);
        ctx.beginPath(); ctx.arc(b.x + b.w/2, b.y + b.h/2, b.w + Math.sin(frameCount*0.1)*20, 0, Math.PI*2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(191, 219, 254, 0.3)'; ctx.lineWidth = 2;
        for(let i=0; i<8; i++) {
            let ang = frameCount*0.02 + i*(Math.PI/4);
            ctx.beginPath(); ctx.moveTo(b.x+b.w/2, b.y+b.h/2); ctx.lineTo(b.x+b.w/2 + Math.cos(ang)*200, b.y+b.h/2 + Math.sin(ang)*200); ctx.stroke();
        }
    }

    // Joueur
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

    // Particules
    for (let p of particles) {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI*2); ctx.fill(); ctx.restore();
    }

    ctx.restore(); 

    // UI par dessus
    ctx.textAlign = "center";
    for (let ft of floatingTexts) {
        ctx.font = `bold ${ft.size} 'Playfair Display', serif`; ctx.fillStyle = ft.color; ctx.globalAlpha = ft.life;
        ctx.shadowColor = '#000'; ctx.shadowBlur = 6; ctx.fillText(ft.text, ft.x - cameraX, ft.y); ctx.shadowBlur = 0; ctx.globalAlpha = 1.0;
    }

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
    }

    ctx.fillStyle = '#ef4444'; ctx.textAlign = "left"; ctx.font = "28px Arial";
    ctx.shadowColor = '#000'; ctx.shadowBlur = 6;
    ctx.fillText("❤️".repeat(player.hp), 15, 35);
    ctx.shadowBlur = 0;
}