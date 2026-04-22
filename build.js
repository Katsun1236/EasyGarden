const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');
const { marked } = require('marked');

// Configuration
const DIST_DIR = path.join(__dirname, 'dist');
const PAGES = ['index.html', 'services.html', 'contact.html', 'realisations.html', 'stats.html'];
const ASSETS_DIRS = ['images', 'js', 'css', 'data', 'admin', 'static'];

// Utility
function getJsonData(fileName) {
  const filePath = path.join(__dirname, 'data', fileName);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return null;
}

// 1. Initialiser le dossier de build
console.log('🧹 Cleaning dist directory...');
fs.emptyDirSync(DIST_DIR);

// 2. Copier les assets (sauf html)
console.log('📁 Copying assets...');
for (const dir of ASSETS_DIRS) {
    if (fs.existsSync(path.join(__dirname, dir))) {
        fs.copySync(path.join(__dirname, dir), path.join(DIST_DIR, dir));
    }
}
// Copy favicon, robots, netlify admin things if needed that are in root
['robots.txt', '_redirects'].forEach(file => {
    if(fs.existsSync(path.join(__dirname, file))) {
        fs.copySync(path.join(__dirname, file), path.join(DIST_DIR, file));
    }
});

// 3. Charger les Components (DRY)
const headerHtml = fs.readFileSync(path.join(__dirname, 'components', 'header.html'), 'utf8');
const footerHtml = fs.readFileSync(path.join(__dirname, 'components', 'footer.html'), 'utf8');

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
    
    // SEO: JSON-LD Injection
    let schemaObj = null;

    if (pageName === 'accueil' && contactData) {
        schemaObj = {
            "@context": "https://schema.org",
            "@type": "HomeAndConstructionBusiness",
            "name": "Easy Garden",
            "image": "https://easy-garden.netlify.app/images/easygarden_logo.webp",
            "@id": "https://easy-garden.netlify.app/",
            "url": "https://easy-garden.netlify.app/",
            "telephone": contactData.phone || "+32493824581",
            "email": contactData.email || "easygarden.devis@gmail.com",
            "address": {
                "@type": "PostalAddress",
                "addressLocality": contactData.address || "Montigny-le-Tilleul",
                "addressRegion": "Hainaut",
                "addressCountry": "BE"
            },
            "areaServed": { "@type": "State", "name": "Hainaut" },
            "priceRange": "Sur devis (Gratuit)",
            "description": "Artisan paysagiste à votre service. De l'aménagement à l'entretien, demandez votre devis 100% gratuit."
        };
    } else if (pageName === 'article' && jsonData) {
        schemaObj = {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": jsonData.title,
            "image": jsonData.image ? `https://easy-garden.netlify.app${jsonData.image}` : "https://easy-garden.netlify.app/images/easygarden_logo.webp",
            "datePublished": jsonData.date,
            "dateModified": jsonData.date,
            "author": {
                "@type": "Person",
                "name": jsonData.author || "Easy Garden"
            },
            "publisher": {
                "@type": "Organization",
                "name": "Easy Garden",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://easy-garden.netlify.app/images/easygarden_logo.webp"
                }
            },
            "description": jsonData.excerpt
        };
    } else if (pageName === 'services') {
         schemaObj = {
            "@context": "https://schema.org",
            "@type": "Service",
            "serviceType": "Paysagisme",
            "provider": {
                "@type": "HomeAndConstructionBusiness",
                "name": "Easy Garden"
            },
            "description": "Création de jardins, entretien régulier, taille de haies et élagage dans le Hainaut."
        };
    }
    
    if (schemaObj) {
        // Remplace l'ancien JSON-LD par le nouveau injecté dynamiquement
        $('script[type="application/ld+json"]').remove();
        $('head').append(`\n    <script type="application/ld+json">\n    ${JSON.stringify(schemaObj, null, 2)}\n    </script>`);
    }

    return $.html();
}

function processPage(htmlFile, jsonData, pageName) {
    const srcPath = path.join(__dirname, htmlFile);
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
                        <img src="${service.image || '/images/EasyGarden_Tonte.webp'}" alt="${service.title.replace(/<[^>]*>?/gm, '')}" class="w-full h-[55vh] object-cover" loading="lazy">
                    </div>
                    <div class="w-full md:w-1/2">
                        <span class="text-7xl font-serif text-stone-100 block mb-2 -ml-4">${service.number || '0'+(index+1)}</span>
                        <h2 class="text-3xl md:text-4xl font-serif text-stone-900 mb-4 -mt-10 relative z-10">${service.title}</h2>
                        <div class="w-10 h-px bg-botanic mb-6"></div>
                        <p class="text-stone-600 leading-relaxed mb-6 font-light text-lg">${service.description}</p>
                        <ul class="space-y-4 mb-8">${featuresHtml}</ul>
                        <a href="/contact.html" class="glow-btn inline-block bg-botanic-dark text-white px-8 py-4 uppercase tracking-widest text-sm font-bold hover:bg-botanic transition-colors duration-300">Demander un devis</a>
                    </div>
                </article>`;
            });
            servicesContainer.html(servicesHtml);
        }
    }

    // Save to dist/
    fs.writeFileSync(path.join(DIST_DIR, htmlFile), $.html());
    console.log(`✅ ${htmlFile} builded successfully!`);
}

// Construction des pages principales
processPage('index.html', accueilData, 'accueil');
processPage('services.html', servicesData, 'services');
processPage('contact.html', contactData, 'contact');
processPage('realisations.html', null, 'realisations');
processPage('stats.html', null, 'stats');

// Construction du blog (blog/index.html & blog/article.html)
if (fs.existsSync(path.join(__dirname, 'blog'))) {
    fs.ensureDirSync(path.join(DIST_DIR, 'blog'));
    
    // Copier l'index du blog avec header/footer
    let blogIndexHtml = fs.readFileSync(path.join(__dirname, 'blog', 'index.html'), 'utf8');
    blogIndexHtml = injectComponentsAndSEO(blogIndexHtml, 'blog/', 'blog', null);
    fs.writeFileSync(path.join(DIST_DIR, 'blog', 'index.html'), blogIndexHtml);
    console.log(`✅ blog/index.html builded!`);

    // Pour chaque article de blog, générer la page article.html dynamiquement
    if (fs.existsSync(path.join(__dirname, 'blog', 'article.html')) && postsData && postsData.posts) {
        const articleTemplate = fs.readFileSync(path.join(__dirname, 'blog', 'article.html'), 'utf8');
        
        postsData.posts.filter(p => p.published).forEach(post => {
            // Créer le HTML avec header, footer et JSON-LD spécifique au post
            let articleHtml = injectComponentsAndSEO(articleTemplate, `blog/${post.slug}`, 'article', post);
            const $ = cheerio.load(articleHtml, { decodeEntities: false });
            
            // Injecter les données de l'article dans le HTML
            $('#article-title').html(post.title);
            $('#article-category').html(post.category);
            $('#article-date').html(new Date(post.date).toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' }));
            if(post.image) $('#article-image').attr('src', post.image);
            
            // Convertir le markdown en HTML
            const htmlContent = marked.parse(post.content || "");
            $('#article-content').html(htmlContent);
            
            // Modifier les meta tags SEO (Title, Description, OG)
            $('title').html(`${post.title} | Blog Easy Garden`);
            $('meta[name="description"]').attr('content', post.excerpt);
            $('meta[property="og:title"]').attr('content', post.title);
            $('meta[property="og:description"]').attr('content', post.excerpt);
            $('meta[property="og:url"]').attr('content', `https://easy-garden.netlify.app/blog/${post.slug}`);
            if (post.image) $('meta[property="og:image"]').attr('content', `https://easy-garden.netlify.app${post.image}`);
            
            // Sauvegarder dans dist/blog/article-slug.html 
            // Note: netlify redirige /blog/:slug vers /blog/article.html?slug=:slug actuellement.
            // On peut le garder ainsi ou faire des fichiers statiques. 
            // Puisqu'on est en SSG complet, générons le fichier !
            fs.writeFileSync(path.join(DIST_DIR, 'blog', `${post.slug}.html`), $.html());
            console.log(`✅ blog/${post.slug}.html builded!`);
        });
        
        // On copie quand même l'article.html par défaut pour la route fallback
        let fallbackHtml = injectComponentsAndSEO(articleTemplate, 'blog/article.html', 'blog', null);
        fs.writeFileSync(path.join(DIST_DIR, 'blog', 'article.html'), fallbackHtml);
    }
}

console.log('🚀 Build HTML & CMS Injection complete!');
