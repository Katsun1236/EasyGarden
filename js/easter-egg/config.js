// js/easter-egg/config.js
// Les niveaux ont été ajustés avec "startX" pour les Boss (utile pour les Checkpoints)

export const groundY = 450;

export const clouds = Array.from({length: 15}, () => ({
    x: Math.random() * 4000, y: Math.random() * 200, 
    s: Math.random() * 0.3 + 0.1, size: Math.random() * 15 + 20
}));

export const stars = Array.from({length: 100}, () => ({
    x: Math.random() * 4000, y: Math.random() * 400, 
    size: Math.random() * 2 + 0.5, twinkleSpeed: Math.random() * 0.05 + 0.01
}));

export const levels = [
    {   // NIVEAU 1 : Matin (Tutoriel)
        name: "Le Verger Paisible", time: "morning", width: 2600,
        goal: { x: 2450, y: groundY - 80, w: 120, h: 80 }, 
        checkpoints: [{ x: 1650, y: groundY - 60, w: 20, h: 60, active: false }],
        platforms: [
            { x: 0, y: groundY, w: 2600, h: 60, type: 'normal' },
            { x: 600, y: 340, w: 150, h: 20, type: 'normal' },
            { x: 1000, y: 250, w: 150, h: 20, type: 'normal' },
            { x: 1300, y: 340, w: 150, h: 20, type: 'normal' },
        ],
        water: [], windZones: [],
        tasks: [
            { x: 400, y: groundY - 20, w: 60, h: 20, type: 'grass', done: false, name: 'Tonte' },
            { x: 800, y: groundY - 45, w: 50, h: 45, type: 'hedge', done: false, name: 'Taille' },
            { x: 1050, y: 250 - 45, w: 50, h: 45, type: 'hedge', done: false, name: 'Taille' },
            { x: 1500, y: groundY - 20, w: 80, h: 20, type: 'grass', done: false, name: 'Tonte' },
        ],
        npcs: [
            { x: 200, y: groundY - 36, w: 20, h: 36, color: '#f87171', name: "Mme. Rose", dialogs: ["Bienvenue dans mon jardin !", "J'ai amélioré tes bottes : appuie DEUX FOIS sur SAUT.", "C'est le Double Saut ! Pratique pour l'Épouvantail plus loin."] }
        ],
        enemies: [
            { x: 700, y: groundY - 24, w: 24, h: 24, type: 'snail', vx: 1, minX: 650, maxX: 950, dead: false },
            { x: 1400, y: groundY - 24, w: 24, h: 24, type: 'snail', vx: -1, minX: 1350, maxX: 1550, dead: false }
        ], items: [],
        boss: {
            x: 2000, startX: 2000, y: groundY - 140, w: 80, h: 140, hp: 4, maxHp: 4, type: 'scarecrow', state: 'idle', timer: 0, dead: false,
            name: "ÉPOUVANTAIL DÉTRAQUÉ", reward: "walljump", arenaMin: 1800, arenaMax: 2300, hasDoneIntro: false, isActive: false
        }
    },
    {   // NIVEAU 2 : Midi (La Boue & Puits du Wall-Jump)
        name: "Les Terres Boueuses", time: "midday", width: 3000,
        goal: { x: 2800, y: 150 - 80, w: 120, h: 80 }, 
        checkpoints: [ { x: 1000, y: 150 - 60, w: 20, h: 60, active: false } ],
        platforms: [
            { x: 0, y: groundY, w: 300, h: 60, type: 'normal' }, 
            { x: 300, y: 150, w: 50, h: 360, type: 'normal' }, // Mur gauche Wall-Jump
            { x: 550, y: 150, w: 50, h: 360, type: 'normal' }, // Mur droit Wall-Jump
            { x: 550, y: 150, w: 1000, h: 60, type: 'mud' }, // Sol GLISSANT !
            { x: 1550, y: 150, w: 1500, h: 60, type: 'normal' },
            { x: 1300, y: 50, w: 100, h: 20, type: 'normal' },
            { x: 1600, y: 50, w: 100, h: 20, type: 'bouncy' }
        ],
        water: [], windZones: [],
        tasks: [
            { x: 700, y: 150 - 20, w: 80, h: 20, type: 'grass', done: false, name: 'Tonte' },
            { x: 1300, y: 50 - 45, w: 50, h: 45, type: 'hedge', done: false, name: 'Taille' },
            { x: 1750, y: 150 - 120, w: 40, h: 20, type: 'branch', done: false, trunkX: 1780, trunkY: 150, name: 'Élagage' },
        ],
        npcs: [
            { x: 150, y: groundY - 36, w: 20, h: 36, color: '#60a5fa', name: "M. Tulipe", dialogs: ["Un grand mur ? Saute dessus et maintiens la flèche vers lui.", "Tu vas glisser. Ensuite, appuie sur SAUT pour t'éjecter comme un ninja !"] }
        ],
        enemies: [
            { x: 850, y: 150, w: 24, h: 24, type: 'mole', vx: 0, vy: 0, baseY: 150, timer: 0, dead: false },
            { x: 1100, y: 150 - 24, w: 24, h: 24, type: 'frog', vx: -1.5, vy: 0, baseY: 150 - 24, minX: 1000, maxX: 1250, dead: false }
        ],
        items: [ { x: 1340, y: -20, baseY: -20, w: 20, h: 20, type: 'hp', collected: false } ],
        boss: {
            x: 2300, startX: 2300, y: 150 - 100, w: 100, h: 100, hp: 6, maxHp: 6, type: 'toad', state: 'idle', timer: 0, dead: false,
            name: "CRAPAUD-BUFFLE", reward: "dash", arenaMin: 2000, arenaMax: 2600, hasDoneIntro: false, isActive: false
        }
    },
    {   // NIVEAU 3 : Crépuscule (Courants d'air)
        name: "Les Hauts Vents", time: "sunset", width: 3600,
        goal: { x: 3400, y: groundY - 80, w: 120, h: 80 },
        checkpoints: [ { x: 1600, y: groundY - 60, w: 20, h: 60, active: false }, { x: 2600, y: 350 - 60, w: 20, h: 60, active: false } ],
        platforms: [
            { x: 0, y: groundY, w: 300, h: 60, type: 'normal' },
            { x: 900, y: groundY, w: 2700, h: 60, type: 'normal' },
            { x: 1300, y: 300, w: 100, h: 20, type: 'fragile', timer: 0, state: 'idle' },
            { x: 1700, y: 250, w: 100, h: 20, type: 'moving', minX: 1700, maxX: 2100, vx: 3 },
            { x: 2300, y: 250, w: 100, h: 20, type: 'bouncy' },
            { x: 2800, y: 350, w: 100, h: 20, type: 'normal' },
        ],
        water: [ { x: 300, y: groundY + 20, w: 600, h: 60 } ],
        windZones: [ { x: 400, y: 100, w: 400, h: groundY } ],
        tasks: [
            { x: 1000, y: groundY - 45, w: 50, h: 45, type: 'hedge', done: false, name: 'Taille' },
            { x: 1320, y: 300 - 20, w: 60, h: 20, type: 'grass', done: false, name: 'Tonte' },
            { x: 2820, y: 350 - 120, w: 40, h: 20, type: 'branch', done: false, trunkX: 2850, trunkY: 350, name: 'Élagage' },
            { x: 3100, y: groundY - 20, w: 80, h: 20, type: 'grass', done: false, name: 'Tonte' }
        ],
        npcs: [
            { x: 150, y: groundY - 36, w: 20, h: 36, color: '#fcd34d', name: "L'Apprenti", dialogs: ["Chef, j'ai laissé le Souffleur à feuilles allumé dans la crevasse !", "Sautez dans le vent, ça va vous porter. Puis utilisez le Sécateur-Dash (MAJ) !"] }
        ],
        enemies: [
            { x: 1100, y: groundY - 24, w: 24, h: 24, type: 'snail', vx: 1.5, minX: 950, maxX: 1250, dead: false },
            { x: 1800, y: 150, w: 24, h: 24, type: 'bee', vx: 2, baseY: 150, minX: 1700, maxX: 2200, dead: false },
            { x: 2500, y: groundY, w: 24, h: 24, type: 'mole', vx: 0, vy: 0, baseY: groundY, timer: 0, dead: false }, 
            { x: 2600, y: 200, w: 24, h: 24, type: 'bee', vx: -2.5, baseY: 200, minX: 2400, maxX: 2900, dead: false }
        ],
        items: [ { x: 2340, y: 100, baseY: 100, w: 20, h: 20, type: 'hp', collected: false } ]
    },
    {   // NIVEAU 4 : Nuit (Boss Final)
        name: "La Racine du Mal", time: "night", width: 3000,
        goal: { x: -1000, y: 0, w: 1, h: 1 }, 
        isBoss: true,
        platforms: [
            { x: 0, y: groundY, w: 500, h: 60, type: 'normal' },
            { x: 500, y: groundY, w: 2500, h: 60, type: 'normal' },
            { x: 800, y: 300, w: 100, h: 20, type: 'normal' },
            { x: 1200, y: 250, w: 100, h: 20, type: 'fragile', timer: 0, state: 'idle' },
            { x: 1600, y: 250, w: 100, h: 20, type: 'moving', minX: 1600, maxX: 1900, vx: 3 },
            { x: 2200, y: 300, w: 100, h: 20, type: 'normal' },
            { x: 2600, y: 250, w: 100, h: 20, type: 'bouncy' }
        ],
        water: [], windZones: [], tasks: [], enemies: [], items: [
            { x: 1240, y: 200, baseY: 200, w: 20, h: 20, type: 'hp', collected: false }
        ],
        npcs: [
            { x: 200, y: groundY - 36, w: 20, h: 36, color: '#a78bfa', name: "Vieux Chêne", dialogs: ["La Ronce Mutante s'est terrée ici...", "Ton Sécateur-Dash te rend invincible pendant une fraction de seconde.", "Utilise-le pour traverser ses attaques !"] }
        ],
        boss: {
            x: 1000, startX: 1000, y: groundY - 140, w: 100, h: 140, hp: 15, maxHp: 15, type: 'bramble', state: 'intro', timer: 0, dead: false,
            name: "RONCE MUTANTE", phase: 1, shield: false, invincible: false, arenaMin: 700, arenaMax: 2800, hasDoneIntro: false, isActive: false
        }
    }
];