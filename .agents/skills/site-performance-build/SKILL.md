---
name: site-performance-build
description: >-
  Procédures d'automatisation de build, conversion WebP avec Sharp, minification Tailwind CSS,
  optimisation des Core Web Vitals (LCP, CLS, FID) et déploiement continu sur Netlify.
  Utilisez ce skill quand l'utilisateur demande de compiler, alléger le site, optimiser
  la vitesse ou vérifier le pipeline de déploiement.
---

# Site Performance & Build Automation

Guide des opérations pour maintenir un temps de chargement éclair et un pipeline de production irréprochable.

## 1. Pipeline de Compilation (`npm run build`)

Le pipeline complet s'exécute via la commande orchestrée :
`npm run build`

Étapes internes automatisées :
1. **`build:images`** : Exécute `scripts/convert-to-webp.js` via la librairie `sharp` pour compresser et convertir automatiquement toutes les images en WebP haute efficacité.
2. **`build:cms`** : Exécute `scripts/build.js` pour injecter les composants DRY (`header.html`, `footer.html`), générer les pages SSG, injecter les métadonnées SEO et le blog.
3. **`build:css`** : Compile et minifie Tailwind CSS avec daisyUI et plugins officiels (`-o ./dist/css/main.css --minify`).
4. **`build:sitemap`** : Génère `sitemap.xml` avec balises d'images et priorités d'indexation.
5. **`build:rss`** : Génère `feed.xml` pour les articles de blog.

## 2. Règles d'Optimisation des Core Web Vitals

- **LCP (Largest Contentful Paint < 2.0s) :**
  - L'image de hero doit impérativement avoir l'attribut `fetchpriority="high"`.
  - Pas de `loading="lazy"` sur l'image de hero principale.
  - Préconnexion aux polices Google (`rel="preconnect"`).
- **CLS (Cumulative Layout Shift < 0.05) :**
  - Toutes les balises `<img>` doivent comporter leurs dimensions natives `width` et `height`.
  - Conteneurs avec ratio d'aspect fixe (`aspect-video`, `h-80`, `h-[50vh]`).
- **FID / INP (Interactivité < 100ms) :**
  - Scripts JS légers et asynchrones ou en fin de balise `<body>`.
  - Parallaxe et animations pilotées par `requestAnimationFrame` sans bloquer le thread principal.

## 3. Déploiement Continu Netlify

- Branche principale de travail : `update`.
- Toujours vérifier que `dist/` n'est pas pollué dans git et que le commit est propre.
- Pousser avec `git push origin update` pour déclencher le webhook Netlify automatique.
