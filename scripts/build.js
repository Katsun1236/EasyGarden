const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');
const { marked } = require('marked');

// Configuration
const ROOT_DIR = path.join(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const PAGES = ['index.html', 'services.html', 'contact.html', 'realisations.html', 'stats.html'];
const ASSETS_DIRS = ['css', 'js', 'images'];
const BASE_URL = 'https://easy-garden.eu';

// Utility
function getJsonData(fileName) {
  const filePath = path.join(ROOT_DIR, 'src/data', fileName);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return null;
}

// 1. Initialiser le dossier de build
console.log('🧹 Cleaning dist directory...');
fs.emptyDirSync(DIST_DIR);

// 2. Copier les assets (sauf html) et dossiers
console.log('📁 Copying assets...');
for (const dir of ASSETS_DIRS) {
    if (fs.existsSync(path.join(ROOT_DIR, 'src/assets', dir))) {
        fs.copySync(path.join(ROOT_DIR, 'src/assets', dir), path.join(DIST_DIR, dir));
    }
}
if (fs.existsSync(path.join(ROOT_DIR, 'src/data'))) {
    fs.copySync(path.join(ROOT_DIR, 'src/data'), path.join(DIST_DIR, 'data'));
}
if (fs.existsSync(path.join(ROOT_DIR, 'src/admin'))) {
    fs.copySync(path.join(ROOT_DIR, 'src/admin'), path.join(DIST_DIR, 'admin'));
}

// Copy public files
if (fs.existsSync(path.join(ROOT_DIR, 'public'))) {
    fs.copySync(path.join(ROOT_DIR, 'public'), DIST_DIR);
}

// 3. Charger les Components (DRY)
const headerHtml = fs.readFileSync(path.join(ROOT_DIR, 'src/components', 'header.html'), 'utf8');
const footerHtml = fs.readFileSync(path.join(ROOT_DIR, 'src/components', 'footer.html'), 'utf8');

// Données CMS
const accueilData = getJsonData('accueil.json');
const servicesData = getJsonData('services.json');
const contactData = getJsonData('contact.json');
const globalesData = getJsonData('images_globales.json');
const postsData = getJsonData('posts.json');

function injectComponentsAndSEO(html, fileName, pageName, jsonData) {
    // DRY Header / Footer
    let resultHtml = html.replace('<!-- HEADER -->', headerHtml).replace('<!-- FOOTER -->', footerHtml);
    
    // Active class logic for Header
    const $ = cheerio.load(resultHtml, { decodeEntities: false });
    $('.nav-link, .mobile-link').removeClass('page-active');
    
    let linkMatch = fileName === 'index.html' ? '/' : `/${fileName}`;
    $(`.nav-link[href="${linkMatch}"]`).addClass('page-active');

    // 1. Meta Tags Enhancement (Twitter cards, robots, og)
    const title = $('title').text() || 'Easy Garden | Artisan Paysagiste dans le Hainaut';
    const desc = $('meta[name="description"]').attr('content') || "Artisan paysagiste dans le Hainaut. Création de jardins, entretien et élagage. Devis gratuit.";
    const ogImg = $('meta[property="og:image"]').attr('content') || `${BASE_URL}/images/easygarden_logo.webp`;
    const pageUrl = `${BASE_URL}/${fileName === 'index.html' ? '' : fileName}`;

    // Twitter Card
    if (!$('meta[name="twitter:card"]').length) {
        $('head').append(`    <meta name="twitter:card" content="summary_large_image">\n`);
    }
    if (!$('meta[name="twitter:title"]').length) {
        $('head').append(`    <meta name="twitter:title" content="${title}">\n`);
    }
    if (!$('meta[name="twitter:description"]').length) {
        $('head').append(`    <meta name="twitter:description" content="${desc}">\n`);
    }
    if (!$('meta[name="twitter:image"]').length) {
        $('head').append(`    <meta name="twitter:image" content="${ogImg}">\n`);
    }

    // Canonical & Hreflang
    if (!$('link[rel="canonical"]').length) {
        $('head').append(`    <link rel="canonical" href="${pageUrl}">\n`);
    }
    if (!$('link[rel="alternate"][hreflang="fr-BE"]').length) {
        $('head').append(`    <link rel="alternate" hreflang="fr-BE" href="${pageUrl}">\n`);
    }

    // SEO: JSON-LD Schemas Non-destructive merging
    let existingSchemas = [];
    $('script[type="application/ld+json"]').each(function() {
        try {
            const raw = $(this).html();
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) existingSchemas.push(...parsed);
            else existingSchemas.push(parsed);
        } catch(e) {}
    });

    let newSchemas = [];

    if (pageName === 'accueil') {
        // Retain FAQPage if present
        const hasFaq = existingSchemas.some(s => s['@type'] === 'FAQPage');
        const hasBusiness = existingSchemas.some(s => s['@type'] === 'HomeAndConstructionBusiness' || s['@type'] === 'LocalBusiness');
        
        if (!hasBusiness) {
            newSchemas.push({
                "@context": "https://schema.org",
                "@type": "HomeAndConstructionBusiness",
                "name": "Easy Garden",
                "image": `${BASE_URL}/images/easygarden_logo.webp`,
                "@id": `${BASE_URL}/#business`,
                "url": `${BASE_URL}/`,
                "telephone": (contactData && contactData.phone) || "+32493824581",
                "email": (contactData && contactData.email) || "easygarden.devis@gmail.com",
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "Rue des Paysagistes",
                    "addressLocality": (contactData && contactData.address) || "Montigny-le-Tilleul",
                    "postalCode": "6110",
                    "addressRegion": "Hainaut",
                    "addressCountry": "BE"
                },
                "geo": {
                    "@type": "GeoCoordinates",
                    "latitude": 50.3803,
                    "longitude": 4.3828
                },
                "openingHoursSpecification": [
                    {
                        "@type": "OpeningHoursSpecification",
                        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                        "opens": "07:30",
                        "closes": "19:00"
                    }
                ],
                "areaServed": [
                    { "@type": "City", "name": "Montigny-le-Tilleul" },
                    { "@type": "City", "name": "Charleroi" },
                    { "@type": "City", "name": "Thuin" },
                    { "@type": "City", "name": "Gerpinnes" },
                    { "@type": "City", "name": "Ham-sur-Heure-Nalinnes" },
                    { "@type": "City", "name": "Courcelles" },
                    { "@type": "City", "name": "Binche" },
                    { "@type": "State", "name": "Province de Hainaut" }
                ],
                "priceRange": "Sur devis (Gratuit)",
                "sameAs": [
                    "https://www.facebook.com/share/18K4bjzwpv/",
                    "https://www.instagram.com/easyxgarden"
                ],
                "description": "Artisan paysagiste de référence dans le Hainaut. De l'aménagement paysager à l'entretien régulier, demandez votre devis 100% gratuit."
            });
        }
    } else if (pageName === 'services') {
        const hasService = existingSchemas.some(s => s['@type'] === 'Service');
        if (!hasService) {
            newSchemas.push({
                "@context": "https://schema.org",
                "@type": "Service",
                "serviceType": "Aménagement et Entretien Paysager",
                "provider": {
                    "@type": "HomeAndConstructionBusiness",
                    "name": "Easy Garden",
                    "url": `${BASE_URL}/`
                },
                "areaServed": { "@type": "State", "name": "Hainaut" },
                "hasOfferCatalog": {
                    "@type": "OfferCatalog",
                    "name": "Services Paysagers Easy Garden",
                    "itemListElement": [
                        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Création de jardins sur mesure" } },
                        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Tonte et entretien de pelouse" } },
                        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Taille de haies et arbustes" } },
                        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Élagage et abattage d'arbres" } }
                    ]
                }
            });
        }
    } else if (pageName === 'article' && jsonData) {
        newSchemas.push({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": `${BASE_URL}/blog/${jsonData.slug}`
            },
            "headline": jsonData.title,
            "image": jsonData.image ? (jsonData.image.startsWith('http') ? jsonData.image : `${BASE_URL}${jsonData.image}`) : `${BASE_URL}/images/easygarden_logo.webp`,
            "datePublished": `${jsonData.date}T08:00:00+02:00`,
            "dateModified": `${jsonData.date}T08:00:00+02:00`,
            "author": {
                "@type": "Organization",
                "name": jsonData.author || "Easy Garden",
                "url": BASE_URL
            },
            "publisher": {
                "@type": "Organization",
                "name": "Easy Garden",
                "logo": {
                    "@type": "ImageObject",
                    "url": `${BASE_URL}/images/easygarden_logo.webp`
                }
            },
            "description": jsonData.excerpt
        });
        newSchemas.push({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Accueil", "item": `${BASE_URL}/` },
                { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${BASE_URL}/blog/` },
                { "@type": "ListItem", "position": 3, "name": jsonData.title, "item": `${BASE_URL}/blog/${jsonData.slug}` }
            ]
        });
    }

    if (newSchemas.length > 0) {
        const combined = [...existingSchemas, ...newSchemas];
        $('script[type="application/ld+json"]').remove();
        $('head').append(`\n    <script type="application/ld+json">\n    ${JSON.stringify(combined.length === 1 ? combined[0] : combined, null, 2)}\n    </script>\n`);
    }

    // 3. Image optimization tags: ensure alt, lazy, and decoding
    $('img').each(function() {
        const img = $(this);
        if (!img.attr('alt')) {
            img.attr('alt', 'Easy Garden - Artisan paysagiste Hainaut');
        }
        if (!img.attr('decoding')) {
            img.attr('decoding', 'async');
        }
        if (!img.attr('loading') && !img.attr('fetchpriority')) {
            img.attr('loading', 'lazy');
        }
    });

    return $.html();
}

function processPage(htmlFile, jsonData, pageName) {
    const srcPath = path.join(ROOT_DIR, 'src/pages', htmlFile);
    if (!fs.existsSync(srcPath)) return;

    let html = fs.readFileSync(srcPath, 'utf8');

    // Inject Components and SEO
    html = injectComponentsAndSEO(html, htmlFile, pageName, jsonData);
    
    const $ = cheerio.load(html, { decodeEntities: false });

    // 1. CMS Text Injection
    $('[data-cms]').each(function() {
        const key = $(this).attr('data-cms');
        if(!key) return;
        const parts = key.split('.').slice(1);
        let currentData = jsonData;
        for (const part of parts) {
            if (currentData && currentData[part] !== undefined) currentData = currentData[part];
            else { currentData = undefined; break; }
        }
        if (currentData !== undefined) $(this).html(currentData);
    });

    // 2. CMS Image Injection
    $('[data-cms-src]').each(function() {
        const key = $(this).attr('data-cms-src');
        if(!key) return;
        let isGlobal = key.startsWith('images_globales');
        const parts = key.split('.').slice(1);
        let currentData = isGlobal ? globalesData : jsonData;
        
        for (const part of parts) {
            if (currentData && currentData[part] !== undefined) currentData = currentData[part];
            else { currentData = undefined; break; }
        }
        if (currentData) $(this).attr('src', currentData);
    });

    // 3. Services list generation
    if (pageName === 'services' && jsonData && jsonData.services_list) {
        const servicesContainer = $('#services-container');
        if (servicesContainer.length) {
            let servicesHtml = '';
            jsonData.services_list.forEach((service, index) => {
                const isReverse = index % 2 !== 0;
                let featuresHtml = '';
                if (service.features) {
                    service.features.forEach(f => {
                        const pointText = typeof f === 'object' && f.point ? f.point : f;
                        featuresHtml += `
                        <li class="flex items-start gap-4 p-4 bg-stone-50 rounded">
                            <i class="fa-solid fa-check text-botanic mt-1" aria-hidden="true"></i>
                            <div><span class="text-stone-700 text-sm font-light">${pointText}</span></div>
                        </li>`;
                    });
                }

                servicesHtml += `
                <article class="flex flex-col md:flex-row${isReverse ? '-reverse' : ''} items-center gap-12 lg:gap-20 mb-32 reveal">
                    <div class="w-full md:w-1/2 img-zoom rounded-sm shadow-2xl">
                        <img src="${service.image || '/images/EasyGarden_Tonte.webp'}" alt="${service.title.replace(/<[^>]*>?/gm, '')}" class="w-full h-[55vh] object-cover" loading="lazy" decoding="async">
                    </div>
                    <div class="w-full md:w-1/2">
                        <span class="text-7xl font-serif text-stone-100 block mb-2 -ml-4">${service.number || '0'+(index+1)}</span>
                        <h2 class="text-3xl md:text-4xl font-serif text-stone-900 mb-4 -mt-10 relative z-10">${service.title}</h2>
                        <div class="w-10 h-px bg-botanic mb-6"></div>
                        <p class="text-stone-600 leading-relaxed mb-6 font-light text-lg">${service.description}</p>
                        <ul class="space-y-4 mb-8">${featuresHtml}</ul>
                        <a href="/contact.html" class="glow-btn inline-block bg-botanic-dark text-white px-8 py-4 uppercase tracking-widest text-sm font-bold hover:bg-botanic transition-colors duration-300">Demander un devis gratuit</a>
                    </div>
                </article>`;
            });
            servicesContainer.html(servicesHtml);
        }
    }

    // Save to dist/
    fs.writeFileSync(path.join(DIST_DIR, htmlFile), $.html());
    console.log(`✅ ${htmlFile} built successfully!`);
}

// Construction des pages principales
processPage('index.html', accueilData, 'accueil');
processPage('services.html', servicesData, 'services');
processPage('contact.html', contactData, 'contact');
processPage('realisations.html', null, 'realisations');
processPage('stats.html', null, 'stats');

// Construction du blog (blog/index.html & blog/article.html)
if (fs.existsSync(path.join(ROOT_DIR, 'src/pages/blog'))) {
    fs.ensureDirSync(path.join(DIST_DIR, 'blog'));
    
    const publishedPosts = (postsData && postsData.posts) ? postsData.posts.filter(p => p.published) : [];

    // 1. Génération SSG de l'index du blog avec pré-rendu complet des articles pour les robots de recherche
    let blogIndexHtml = fs.readFileSync(path.join(ROOT_DIR, 'src/pages/blog', 'index.html'), 'utf8');
    blogIndexHtml = injectComponentsAndSEO(blogIndexHtml, 'blog/', 'blog', null);
    
    const $blog = cheerio.load(blogIndexHtml, { decodeEntities: false });
    
    // Génération du HTML des cartes de blog
    if (publishedPosts.length > 0) {
        let cardsHtml = publishedPosts.map((p, i) => {
            const dateStr = new Date(p.date).toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' });
            const delay = i % 3 === 1 ? ' reveal-delay-1' : i % 3 === 2 ? ' reveal-delay-2' : '';
            return `
            <article class="blog-card reveal${delay}">
                <a href="/blog/${p.slug}" class="block group">
                    <div class="img-zoom h-56">
                        <img src="${p.image}" alt="${p.title}" class="w-full h-full object-cover" loading="lazy" decoding="async">
                    </div>
                    <div class="p-7">
                        <div class="flex items-center justify-between mb-4">
                            <span class="category-badge">${p.category}</span>
                            <time class="text-xs text-stone-400 uppercase tracking-widest" datetime="${p.date}">${dateStr}</time>
                        </div>
                        <h2 class="font-serif text-xl text-stone-900 mb-3 group-hover:text-botanic-dark transition-colors leading-snug">${p.title}</h2>
                        <p class="text-stone-500 text-sm font-light leading-relaxed mb-5">${p.excerpt.substring(0, 130)}...</p>
                        <span class="inline-flex items-center gap-2 text-botanic-dark font-bold text-xs uppercase tracking-widest border-b border-botanic-dark pb-px">
                            Lire l'article <i class="fa-solid fa-arrow-right text-xs" aria-hidden="true"></i>
                        </span>
                    </div>
                </a>
            </article>`;
        }).join('\n');

        $blog('#posts-grid').html(cardsHtml).removeClass('hidden');
        $blog('#posts-loading').remove();
    }

    fs.writeFileSync(path.join(DIST_DIR, 'blog', 'index.html'), $blog.html());
    console.log(`✅ blog/index.html pre-rendered SSG with ${publishedPosts.length} posts!`);

    // 2. Pour chaque article de blog, générer la page statique
    if (fs.existsSync(path.join(ROOT_DIR, 'src/pages/blog', 'article.html')) && publishedPosts.length > 0) {
        const articleTemplate = fs.readFileSync(path.join(ROOT_DIR, 'src/pages/blog', 'article.html'), 'utf8');
        
        publishedPosts.forEach(post => {
            let articleHtml = injectComponentsAndSEO(articleTemplate, `blog/${post.slug}`, 'article', post);
            const $art = cheerio.load(articleHtml, { decodeEntities: false });
            
            $art('#article-title').html(post.title);
            $art('#article-category').html(post.category);
            $art('#article-date').html(new Date(post.date).toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' }));
            if (post.image) {
                $art('#hero-img').attr('src', post.image).attr('alt', post.title);
            }
            
            // Convertir le markdown en HTML
            const htmlContent = marked.parse(post.content || "");
            $art('#article-body').html(htmlContent);
            
            // Retirer le loading state
            $art('#loading-state').remove();
            $art('#article-content').removeClass('hidden');
            
            // Meta tags SEO
            $art('title').text(`${post.title} | Blog Easy Garden`);
            $art('meta[name="description"]').attr('content', post.excerpt);
            $art('meta[property="og:title"]').attr('content', post.title);
            $art('meta[property="og:description"]').attr('content', post.excerpt);
            $art('meta[property="og:url"]').attr('content', `${BASE_URL}/blog/${post.slug}`);
            if (post.image) {
                const fullImg = post.image.startsWith('http') ? post.image : `${BASE_URL}${post.image}`;
                $art('meta[property="og:image"]').attr('content', fullImg);
                $art('meta[name="twitter:image"]').attr('content', fullImg);
            }
            $art('meta[name="twitter:title"]').attr('content', post.title);
            $art('meta[name="twitter:description"]').attr('content', post.excerpt);
            
            // Fichiers statiques : à la fois slug.html et slug/index.html pour compatibilité maximale
            fs.writeFileSync(path.join(DIST_DIR, 'blog', `${post.slug}.html`), $art.html());
            
            const postDir = path.join(DIST_DIR, 'blog', post.slug);
            fs.ensureDirSync(postDir);
            fs.writeFileSync(path.join(postDir, 'index.html'), $art.html());

            console.log(`✅ blog/${post.slug}.html & blog/${post.slug}/index.html built!`);
        });
        
        // Copie du fallback
        let fallbackHtml = injectComponentsAndSEO(articleTemplate, 'blog/article.html', 'blog', null);
        fs.writeFileSync(path.join(DIST_DIR, 'blog', 'article.html'), fallbackHtml);
    }
}

console.log('🚀 Build HTML, SSG & SEO injection complete!');

