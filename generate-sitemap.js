const fs = require('fs');

// 1. Charger les données du blog
const postsData = JSON.parse(fs.readFileSync('./data/posts.json', 'utf8'));

const baseUrl = 'https://easy-garden.netlify.app';
const date = new Date().toISOString().split('T')[0];

// 2. Générer le contenu du sitemap
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url><loc>${baseUrl}/</loc><lastmod>${date}</lastmod><priority>1.0</priority></url>
    <url><loc>${baseUrl}/services.html</loc><lastmod>${date}</lastmod><priority>0.9</priority></url>
    <url><loc>${baseUrl}/realisations.html</loc><lastmod>${date}</lastmod><priority>0.8</priority></url>
    <url><loc>${baseUrl}/contact.html</loc><lastmod>${date}</lastmod><priority>0.8</priority></url>
    <url><loc>${baseUrl}/blog/</loc><lastmod>${date}</lastmod><priority>0.8</priority></url>
    ${postsData.posts.filter(p => p.published).map(post => `
    <url>
        <loc>${baseUrl}/blog/${post.slug}</loc>
        <lastmod>${post.date}</lastmod>
        <priority>0.7</priority>
    </url>`).join('')}
</urlset>`;

// 3. Écraser l'ancien fichier sitemap.xml
fs.writeFileSync('./sitemap.xml', sitemap);
console.log('Sitemap.xml mis à jour avec succès !');