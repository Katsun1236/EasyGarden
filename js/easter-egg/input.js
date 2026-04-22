// js/easter-egg/input.js
// Gère toutes les entrées clavier (ZQSD, Flèches, Espace, E)

export const keys = { 
    left: false, right: false, jump: false, interact: false, 
    jumpJustPressed: false, interactJustPressed: false 
};

export function initInputs(gameActiveGetter) {
    document.addEventListener('keydown', (e) => {
        // gameActiveGetter() permet de vérifier si le jeu tourne sans créer de dépendance circulaire
        if (!gameActiveGetter()) return;
        const k = e.key.toLowerCase();
        
        if(["arrowup","arrowdown","arrowleft","arrowright"," ","e"].includes(k) || ["z","q","s","d"].includes(k)) e.preventDefault();
        
        if (k === 'arrowleft' || k === 'q') keys.left = true;
        if (k === 'arrowright' || k === 'd') keys.right = true;
        if (k === 'arrowup' || k === 'z' || k === ' ') {
            if (!keys.jump) keys.jumpJustPressed = true;
            keys.jump = true;
        }
        if (k === 'e' || e.key === 'enter') {
            if (!keys.interact) keys.interactJustPressed = true;
            keys.interact = true;
        }
    });

    document.addEventListener('keyup', (e) => {
        const k = e.key.toLowerCase();
        if (k === 'arrowleft' || k === 'q') keys.left = false;
        if (k === 'arrowright' || k === 'd') keys.right = false;
        if (k === 'arrowup' || k === 'z' || k === ' ') keys.jump = false;
        if (k === 'e' || e.key === 'enter') keys.interact = false;
    });
}