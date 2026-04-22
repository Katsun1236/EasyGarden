const fs = require('fs');

let content = fs.readFileSync('js/easter-egg.js', 'utf8');

// 1. Add keys
content = content.replace(
    `const keys = { left: false, right: false, up: false, space: false };`,
    `const keys = { left: false, right: false, up: false, space: false, jumpJustPressed: false };`
);

// 2. Add player properties
content = content.replace(
    `squash: 1, stretch: 1, hp: 3, maxHp: 3, invincibleTimer: 0`,
    `squash: 1, stretch: 1, hp: 3, maxHp: 3, invincibleTimer: 0, jumps: 0, spawnX: 50, spawnY: 200`
);

// 3. Add checkpoints to levels
content = content.replace(
    `water: [ { x: 800, y: groundY + 10, w: 150, h: 50 } ], // Flaque de boue`,
    `water: [ { x: 800, y: groundY + 10, w: 150, h: 50 } ],\n            checkpoints: [{x: 1000, y: groundY - 60, w: 20, h: 60, active: false}],`
);

content = content.replace(
    `water: [ { x: 500, y: groundY + 10, w: 150, h: 50 }, { x: 1250, y: groundY + 10, w: 100, h: 50 } ],`,
    `water: [ { x: 500, y: groundY + 10, w: 150, h: 50 }, { x: 1250, y: groundY + 10, w: 100, h: 50 } ],\n            checkpoints: [{x: 1300, y: groundY - 60, w: 20, h: 60, active: false}],`
);

content = content.replace(
    `water: [ { x: 300, y: groundY + 10, w: 600, h: 50 }, { x: 1300, y: groundY + 10, w: 600, h: 50 }, { x: 2300, y: groundY + 10, w: 300, h: 50 } ],`,
    `water: [ { x: 300, y: groundY + 10, w: 600, h: 50 }, { x: 1300, y: groundY + 10, w: 600, h: 50 }, { x: 2300, y: groundY + 10, w: 300, h: 50 } ],\n            checkpoints: [{x: 1000, y: groundY - 60, w: 20, h: 60, active: false}, {x: 2000, y: groundY - 60, w: 20, h: 60, active: false}],`
);

content = content.replace(
    `water: [ { x: 500, y: groundY + 10, w: 550, h: 50 }, { x: 1550, y: groundY + 10, w: 550, h: 50 } ],`,
    `water: [ { x: 500, y: groundY + 10, w: 550, h: 50 }, { x: 1550, y: groundY + 10, w: 550, h: 50 } ],\n            checkpoints: [{x: 1200, y: groundY - 60, w: 20, h: 60, active: false}, {x: 2200, y: groundY - 60, w: 20, h: 60, active: false}],`
);

// 4. loadLevel reset spawn
content = content.replace(
    `player.hp = player.maxHp; player.invincibleTimer = 0;`,
    `player.hp = player.maxHp; player.invincibleTimer = 0;\n        player.spawnX = 50; player.spawnY = 200;`
);

// 5. Update: Double jump logic
const oldJump = `if (keys.up && player.grounded) {
            player.vy = player.jumpPower;
            player.grounded = false;
            player.squash = 0.6; player.stretch = 1.4;
            spawnParticles(player.x + 12, player.y + 32, '#d4d4d8', 5);
        }`;

const newJump = `if (player.grounded) player.jumps = 0;
        
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
        keys.jumpJustPressed = false;`;
content = content.replace(oldJump, newJump);

// 6. Update: Fall Death with handleFallDeath
const oldFall = `// Water Hazards
        for (let w of (levelData.water || [])) {
            if (player.y + player.height > w.y + 20 && player.x + player.width > w.x && player.x < w.x + w.w) {
                spawnParticles(player.x+12, w.y+10, '#3b82f6', 20);
                return showGameOver("Plouf !", "Vous êtes tombé à l'eau.", "Recommencer");
            }
        }
        
        // Fall Death
        if (player.y > 600) return showGameOver("Tombé !", "Attention où vous mettez les pieds.", "Recommencer");`;

const newFall = `function handleFallDeath(title, desc) {
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
        }`;
content = content.replace(oldFall, newFall);

// 7. Update: Checkpoints logic
const oldTasks = `// Tasks
        for (let t of levelData.tasks) {`;

const newCheckpoints = `// Checkpoints
        for (let c of (levelData.checkpoints || [])) {
            if (!c.active && checkCollision(player, c)) {
                c.active = true;
                player.spawnX = c.x; player.spawnY = c.y - 20;
                spawnParticles(c.x + 10, c.y, '#fde047', 20);
                spawnText(c.x, c.y - 20, "CHECKPOINT", '#fde047');
            }
        }

        // Tasks
        for (let t of levelData.tasks) {`;
content = content.replace(oldTasks, newCheckpoints);

// 8. Draw Checkpoints
const oldDrawEnemies = `// Enemies
        for(let e of enemies) {`;

const newDrawCheckpoints = `// Checkpoints
        for (let c of (levelData.checkpoints || [])) {
            ctx.fillStyle = '#78350f'; // Poteau
            ctx.fillRect(c.x + 8, c.y, 4, c.h);
            ctx.fillStyle = c.active ? '#22c55e' : '#ef4444'; // Drapeau
            ctx.beginPath(); ctx.moveTo(c.x + 12, c.y + 2); ctx.lineTo(c.x + 30, c.y + 10); ctx.lineTo(c.x + 12, c.y + 18); ctx.fill();
        }

        // Enemies
        for(let e of enemies) {`;
content = content.replace(oldDrawEnemies, newDrawCheckpoints);

// 9. Keyboard Event Listeners for jumpJustPressed
const oldKeyboard = `// Keyboard
    window.addEventListener('keydown', e => {
        if (!gameActive) return;
        if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].indexOf(e.code) > -1) e.preventDefault();
        if (e.code === 'ArrowLeft') keys.left = true;
        if (e.code === 'ArrowRight') keys.right = true;
        if (e.code === 'ArrowUp') keys.up = true;
        if (e.code === 'Space') keys.space = true;
    });`;

const newKeyboard = `// Keyboard
    window.addEventListener('keydown', e => {
        if (!gameActive) return;
        if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].indexOf(e.code) > -1) e.preventDefault();
        if (e.code === 'ArrowLeft') keys.left = true;
        if (e.code === 'ArrowRight') keys.right = true;
        if (e.code === 'ArrowUp') {
            if (!keys.up) keys.jumpJustPressed = true;
            keys.up = true;
        }
        if (e.code === 'Space') keys.space = true;
    });`;
content = content.replace(oldKeyboard, newKeyboard);

fs.writeFileSync('js/easter-egg.js', content);
console.log("Easter egg updated successfully!");
