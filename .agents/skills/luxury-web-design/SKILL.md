---
name: luxury-web-design
description: >-
  Directives et normes pour concevoir des interfaces web de prestige (niveau studio de design Awwwards),
  utilisant Tailwind CSS, daisyUI, typographie Playfair/Lato, Lenis smooth scroll, palettes naturelles
  et micro-interactions raffinées. Utilisez ce skill quand l'utilisateur demande des améliorations
  esthétiques, un design digne des sites de luxe ou un audit visuel.
---

# Luxury Web Design & Esthétique Studio

Ce skill définit les règles strictes pour élever un site web du statut d'artisanat amateur au rang de référence visuelle digne d'un studio de design international.

## 1. Principes Fondamentaux de Luxe Végétal & Paysager

- **Règle d'or du Contraste :** Ne jamais poser de texte blanc sur une photo sans triple protection :
  1. `bg-stone-950/75` (couche d'opacité sombre homogène)
  2. `bg-gradient-to-r from-stone-950/95 via-stone-950/80 to-stone-950/50` (gradient latéral guidant l'œil)
  3. `bg-gradient-to-t from-stone-950 via-transparent to-black/30` (vignettage vertical)
- **Typographie Éditoriale :**
  - Titres en serif prestige : `font-serif` (Playfair Display) avec accents manuscrits ou légers en italique (`italic font-light text-botanic-light`).
  - Corps de texte aéré : `font-sans font-light text-stone-600 leading-relaxed max-w-2xl`.
  - Pas de titrage agressif en rouge ou vert fluo : uniquement vert botanique profond (`#1e2b17`), émeraude naturelle et or fin.

## 2. Composants daisyUI & Finitions Haut de Gamme

- **Boutons :**
  - Bouton Primaire : `btn btn-primary text-white tracking-widest uppercase text-xs font-bold shadow-xl hover:scale-[1.02] transition-transform`
  - Bouton Secondaire / Outline : `btn btn-outline border-white/40 text-white hover:bg-white hover:text-stone-900`
- **Badges de Confiance (Pills) :**
  - `badge badge-lg bg-stone-900/80 border-emerald-500/30 text-white backdrop-blur-md px-4 py-3 gap-2 font-medium`
  - Utiliser un voyant animé : `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>`
- **Accordéons FAQ :**
  - Préférer `collapse collapse-plus bg-stone-50 border border-stone-200/80 rounded-2xl` de daisyUI pour des transitions soyeuses.
- **Notes et Avis Clients :**
  - `rating rating-sm` ou étoiles dorées fines, chiffres de notation clairs (`4.9/5 sur Google`), étiquette « Avis vérifié ».

## 3. Défilement & Micro-Interactions

- **Lenis Smooth Scroll :**
  - Assurer une inertie fluide sans à-coups sur la molette de souris.
- **Cartes de Réalisation & Services :**
  - Toujours encapsulées dans `overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500`.
  - Zoom doux au survol : `group-hover:scale-105 transition-transform duration-700`.

## 4. Ce qu'il faut ABSOLUMENT BANNIR

1. **Les boîtes encombrantes collées sous la bannière d'en-tête** : le hero doit respirer.
2. **La répétition d'une même photo** : chaque bloc doit afficher une image haute définition distincte.
3. **Les bordures brutes ou les ombres noires trop dures** : toujours adoucir avec `border-stone-100` et `shadow-stone-900/5`.
