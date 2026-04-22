// js/easter-egg/input.js
// Écoute des touches et export de l'objet "keys"

export const keys = { 
    left: false, right: false, jump: false, interact: false, dash: false,
    jumpJustPressed: false, interactJustPressed: false, dashJustPressed: false
};

export function initInputs(gameActiveGetter) {
    document.addEventListener('keydown', (e) => {
        if (!gameActiveGetter()) return;
        const k = e.key.toLowerCase();
        
        if(["arrowup","arrowdown","arrowleft","arrowright"," ","e","shift"].includes(k) || ["z","q","s","d"].includes(k)) e.preventDefault();
        
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
        if (k === 'shift') {
            if (!keys.dash) keys.dashJustPressed = true;
            keys.dash = true;
        }
    });

    document.addEventListener('keyup', (e) => {
        const k = e.key.toLowerCase();
        if (k === 'arrowleft' || k === 'q') keys.left = false;
        if (k === 'arrowright' || k === 'd') keys.right = false;
        if (k === 'arrowup' || k === 'z' || k === ' ') keys.jump = false;
        if (k === 'e' || e.key === 'enter') keys.interact = false;
        if (k === 'shift') keys.dash = false;
    });
}