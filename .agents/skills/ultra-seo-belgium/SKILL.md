---
name: ultra-seo-belgium
description: >-
  Méthodologie avancée de référencement naturel (SEO) ciblée pour la Belgique et la province du Hainaut.
  Couvre les balisages de données structurées Schema.org (JSON-LD), le maillage interne par silos,
  l'optimisation Google Images, le géociblage local (BE-WHT), et la conformité Search Console.
  Utilisez ce skill quand l'utilisateur demande d'optimiser le SEO, le référencement local,
  les métadonnées ou le ranking Google.
---

# Ultra SEO Belgique & Wallonie (Hainaut)

Guide expert pour propulser un site vitrine d'artisan en première position Google sur les requêtes ciblées en Wallonie.

## 1. Géociblage & Méta-balises Régionales

Toujours inclure les méta-balises régionales pour la Belgique francophone :
```html
<meta name="geo.region" content="BE-WHT">
<meta name="geo.placename" content="Montigny-le-Tilleul, Hainaut">
<meta name="geo.position" content="50.3803;4.3828">
<meta name="ICBM" content="50.3803, 4.3828">
<link rel="alternate" hreflang="fr-BE" href="https://easy-garden.eu/">
```

## 2. Données Structurées Schema.org Multi-Entités (JSON-LD)

Ne jamais se limiter à un simple `WebPage`. Générer un graphe complet :
1. **`HomeAndConstructionBusiness`** : Nom, géolocalisation, `areaServed` (tableau de toutes les communes cibles du Hainaut : Montigny-le-Tilleul, Charleroi, Thuin, Gerpinnes, etc.), horaires, devis gratuit.
2. **`AggregateRating` & `Review`** : Avis clients vérifiés avec note `ratingValue: 4.9` sur 5.
3. **`Service` & `OfferCatalog`** : Silos thématiques détaillant chaque prestation (Élagage, Aménagement, Tonte).
4. **`FAQPage`** : Questions/réponses fréquentes éligibles aux Featured Snippets Google.
5. **`BreadcrumbList`** : Fil d'Ariane dynamique sur chaque page intérieure.

## 3. Silos & Maillage Interne Local

- Chaque commune stratégique doit posséder sa page d'atterrissage dédiée :
  - `jardinier-charleroi.html` (Intervention rapide Charleroi Métropole)
  - `paysagiste-thuin.html` (Entretien et création paysagère Thudinie)
  - `taille-haie-gerpinnes.html` (Spécialiste haies et arbustes Gerpinnes)
  - `elagage-montigny-le-tilleul.html` (Siège local et travaux arboricoles)
- Lier systématiquement ces pages depuis le footer et le plan du site pour maximiser le jus de liens.

## 4. Google Images SEO & Vitesse

- Format d'image obligatoire : WebP avec attributs `width`, `height`, `loading="lazy"` et `decoding="async"`.
- Texte alternatif `alt` riche et contextualisé avec localisation (ex : *"Tonte et remise à neuf de pelouse par Easy Garden à Montigny-le-Tilleul"*).
- Sitemap XML incluant le tag `<image:image>` pour indexation directe dans Google Images.
