// js/easter-egg/config.js
// Contient toutes les données mortes : constantes, niveaux, dialogues.

export const groundY = 450;

export const clouds = Array.from({length: 15}, () => ({
    x: Math.random() * 4000, y: Math.random() * 200, 
    s: Math.random() * 0.3 + 0.1, size: Math.random() * 15 + 20
}));

// Générateur d'étoiles pour la nuit
export const stars = Array.from({length: 100}, () => ({
    x: Math.random() * 4000, y: Math.random() * 400, 
    size: Math.random() * 2 + 0.5, twinkleSpeed: Math.random() * 0.05 + 0.01
}));

export const levels = [
    {   // NIVEAU 1 : Matin (Aube dorée)
        name: "Le Jardin Paisible", time: "morning", width: 2500,
        goal: { x: 2350, y: groundY - 100, w: 80, h: 100 },
        checkpoints: [],
        platforms: [
            { x: 0, y: groundY, w: 2500, h: 60 },
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
    {   // NIVEAU 2 : Midi (Zénith bleu éclatant)
        name: "L'invasion des Batraciens", time: "midday", width: 3500,
        goal: { x: 3350, y: groundY - 100, w: 80, h: 100 },
        checkpoints: [ { x: 1500, y: groundY - 60, w: 20, h: 60, active: false } ],
        platforms: [
            { x: 0, y: groundY, w: 1000, h: 60 },
            { x: 1100, y: groundY, w: 2400, h: 60 },
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
    {   // NIVEAU 3 : Après-Midi (Orangé / Golden Hour)
        name: "Le Ruché Agité", time: "afternoon", width: 4000,
        goal: { x: 3800, y: groundY - 100, w: 80, h: 100 },
        checkpoints: [ { x: 1800, y: groundY - 60, w: 20, h: 60, active: false } ],
        platforms: [
            { x: 0, y: groundY, w: 1200, h: 60 },
            { x: 1200, y: 350, w: 200, h: 20, type: 'fragile', timer: 0, state: 'idle' },
            { x: 1400, y: groundY, w: 2600, h: 60 },
            { x: 800, y: 250, w: 100, h: 20 },
            { x: 2200, y: 280, w: 100, h: 20, type: 'moving', minX: 2200, maxX: 2600, vx: 3 },
            { x: 2900, y: 220, w: 100, h: 20, type: 'bouncy' }
        ],
        water: [ { x: 1200, y: groundY + 10, w: 200, h: 50 } ],
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
    {   // NIVEAU 4 : Crépuscule (Rouge sang)
        name: "La Lisière Sombre", time: "sunset", width: 4000,
        goal: { x: 3800, y: groundY - 100, w: 80, h: 100 },
        checkpoints: [ { x: 1800, y: groundY - 60, w: 20, h: 60, active: false } ],
        platforms: [
            { x: 0, y: groundY, w: 1500, h: 60 },
            { x: 1650, y: groundY, w: 2350, h: 60 },
            { x: 600, y: 340, w: 80, h: 20, type: 'moving', minX: 600, maxX: 900, vx: 3.5 },
            { x: 1200, y: 250, w: 80, h: 20, type: 'fragile', timer: 0, state: 'idle' },
            { x: 2400, y: groundY - 20, w: 80, h: 20, type: 'bouncy' },
            { x: 2600, y: 150, w: 100, h: 20 },
        ],
        water: [],
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
    {   // NIVEAU 5 : Nuit (BOSS - Sombre, lune brillante)
        name: "L'Antre de la Ronce", time: "night", width: 4000,
        goal: { x: -1000, y: 0, w: 1, h: 1 }, 
        isBoss: true,
        platforms: [
            { x: 0, y: groundY, w: 1200, h: 60 },
            { x: 200, y: 300, w: 120, h: 20 },
            { x: 880, y: 300, w: 120, h: 20 },
            { x: 540, y: 200, w: 120, h: 20 }, 
            { x: 1200, y: groundY, w: 400, h: 60 },
            { x: 1700, y: groundY - 50, w: 150, h: 20, type: 'fragile', timer: 0, state: 'idle' },
            { x: 1950, y: groundY - 100, w: 150, h: 20, type: 'moving', minX: 1950, maxX: 2200, vx: 3 },
            { x: 2350, y: groundY, w: 650, h: 60 },
            { x: 3000, y: groundY, w: 1000, h: 60 },
            { x: 3200, y: 300, w: 100, h: 20 },
            { x: 3700, y: 300, w: 100, h: 20 },
            { x: 3450, y: 200, w: 100, h: 20 }
        ],
        water: [
            { x: 1600, y: groundY + 10, w: 100, h: 50 },
            { x: 2200, y: groundY + 10, w: 150, h: 50 }
        ], 
        tasks: [], enemies: [], items: [
            { x: 1400, y: groundY - 50, w: 20, h: 20, type: 'hp', collected: false },
            { x: 2600, y: groundY - 50, w: 20, h: 20, type: 'hp', collected: false }
        ], npcs: [],
        boss: {
            x: 900, y: groundY - 140, w: 100, h: 140, hp: 25, maxHp: 25, vx: -4, vy: 0, state: 'classic', timer: 0,
            name: "RONCE MUTANTE", phase: 1, shield: false, invincible: false, arenaMin: 0, arenaMax: 1200
        }
    }
];