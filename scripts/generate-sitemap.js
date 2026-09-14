const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');

// 1. Charger les données
const postsPath = path.join(ROOT_DIR, 'src/data/posts.json');
const postsData = fs.existsSync(postsPath) ? JSON.parse(fs.readFileSync(postsPath, 'utf8')) : { posts: [] };

const baseUrl = 'https://easy-garden.eu';
const today = new Date().toISOString().split('T')[0];

const staticPages = [
  {
    loc: `${baseUrl}/`,
    changefreq: 'weekly',
    priority: '1.0',
    lastmod: today,
    images: [
      { loc: `${baseUrl}/images/easygarden_logo.webp`, title: 'Easy Garden - Artisan Paysagiste Hainaut' },
      { loc: `${baseUrl}/images/easygarden_fond.webp`, title: 'Aménagement et entretien de jardin Hainaut' },
      { loc: `${baseUrl}/images/EasyGarden_Tonte.webp`, title: 'Tonte de pelouse et entretien régulier' }
    ]
  },
  {
    loc: `${baseUrl}/services.html`,
    changefreq: 'weekly',
    priority: '0.9',
    lastmod: today,
    images: [
      { loc: `${baseUrl}/images/EasyGarden_Tonte.webp`, title: 'Services paysagers Easy Garden Hainaut' },
      { loc: `${baseUrl}/images/1000007687.webp`, title: 'Création de jardin et aménagement sur mesure' },
      { loc: `${baseUrl}/images/1000008561.webp`, title: 'Entretien des espaces verts et tonte' },
      { loc: `${baseUrl}/images/1000016685.webp`, title: 'Élagage et taille de haies professionnelles' }
    ]
  },
  {
    loc: `${baseUrl}/services/amenagement-creation-jardin`,
    changefreq: 'weekly',
    priority: '0.9',
    lastmod: today,
    images: [
      { loc: `${baseUrl}/images/1000007687.webp`, title: 'Création et aménagement de jardin Hainaut' },
      { loc: `${baseUrl}/images/EasyGarden_Tonte.webp`, title: 'Pose de pelouse en rouleaux et parterres' }
    ]
  },
  {
    loc: `${baseUrl}/services/entretien-pelouse-jardin`,
    changefreq: 'weekly',
    priority: '0.9',
    lastmod: today,
    images: [
      { loc: `${baseUrl}/images/1000008561.webp`, title: 'Entretien de jardin et tonte de pelouse Hainaut' },
      { loc: `${baseUrl}/images/EasyGarden_Tonte.webp`, title: 'Scarification et soins de pelouse' }
    ]
  },
  {
    loc: `${baseUrl}/services/elagage-abattage-arbres`,
    changefreq: 'weekly',
    priority: '0.9',
    lastmod: today,
    images: [
      { loc: `${baseUrl}/images/1000016685.webp`, title: 'Élagage et abattage d\'arbres délicat Hainaut' },
      { loc: `${baseUrl}/images/1000008561.webp`, title: 'Démontage sécurisé et rétention de branches' }
    ]
  },
  {
    loc: `${baseUrl}/realisations.html`,
    changefreq: 'weekly',
    priority: '0.8',
    lastmod: today,
    images: [
      { loc: `${baseUrl}/images/easygarden_logo.webp`, title: 'Réalisations paysagères Easy Garden' }
    ]
  },
  {
    loc: `${baseUrl}/contact.html`,
    changefreq: 'monthly',
    priority: '0.8',
    lastmod: today,
    images: [
      { loc: `${baseUrl}/images/easygarden_logo.webp`, title: 'Contactez Easy Garden pour un devis gratuit' }
    ]
  },
  {
    loc: `${baseUrl}/blog/`,
    changefreq: 'daily',
    priority: '0.9',
    lastmod: today,
    images: [
      { loc: `${baseUrl}/images/easygarden_logo.webp`, title: 'Blog Jardinage et Paysagisme Easy Garden' }
    ]
  }
];

function formatUrlEntry(page) {
  let imagesXml = '';
  if (page.images && page.images.length > 0) {
    imagesXml = page.images.map(img => `
        <image:image>
            <image:loc>${img.loc}</image:loc>
            <image:title><![CDATA[${img.title}]]></image:title>
        </image:image>`).join('');
  }

  return `    <url>
        <loc>${page.loc}</loc>
        <lastmod>${page.lastmod || today}</lastmod>
        <changefreq>${page.changefreq || 'monthly'}</changefreq>
        <priority>${page.priority}</priority>${imagesXml}
    </url>`;
}

const blogEntries = (postsData.posts || [])
  .filter(p => p.published)
  .map(post => {
    let postImages = [];
    if (post.image) {
      const imgUrl = post.image.startsWith('http') ? post.image : `${baseUrl}${post.image}`;
      postImages.push({
        loc: imgUrl,
        title: post.title
      });
    }
    return formatUrlEntry({
      loc: `${baseUrl}/blog/${post.slug}`,
      changefreq: 'monthly',
      priority: '0.8',
      lastmod: post.date || today,
      images: postImages
    });
  });

const allEntries = [
  ...staticPages.map(formatUrlEntry),
  ...blogEntries
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${allEntries.join('\n')}
</urlset>
`;

// Écriture du sitemap dans dist/ et public/
const distPath = path.join(ROOT_DIR, 'dist/sitemap.xml');
const publicPath = path.join(ROOT_DIR, 'public/sitemap.xml');

if (fs.existsSync(path.dirname(distPath))) {
  fs.writeFileSync(distPath, sitemap.trim(), 'utf8');
}
fs.writeFileSync(publicPath, sitemap.trim(), 'utf8');

console.log(`✅ Sitemap.xml généré avec succès avec ${allEntries.length} URLs (dont Google Images) !`);