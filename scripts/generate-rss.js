const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const postsPath = path.join(ROOT_DIR, 'src/data/posts.json');
const postsData = fs.existsSync(postsPath) ? JSON.parse(fs.readFileSync(postsPath, 'utf8')) : { posts: [] };

const BASE_URL = 'https://easy-garden.eu';
const now = new Date().toUTCString();

const items = (postsData.posts || [])
  .filter(p => p.published)
  .map(post => {
    const postUrl = `${BASE_URL}/blog/${post.slug}`;
    const pubDate = new Date(post.date).toUTCString();
    const imgUrl = post.image ? (post.image.startsWith('http') ? post.image : `${BASE_URL}${post.image}`) : `${BASE_URL}/images/easygarden_logo.webp`;
    
    return `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <category><![CDATA[${post.category || 'Jardinage'}]]></category>
      <description><![CDATA[${post.excerpt}]]></description>
      <author>easygarden.devis@gmail.com (Easy Garden)</author>
      <enclosure url="${imgUrl}" type="image/webp" length="50000" />
    </item>`;
  }).join('\n');

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Easy Garden — Blog Jardinage &amp; Paysagisme Hainaut</title>
    <link>${BASE_URL}/blog/</link>
    <description>Conseils d'experts paysagistes pour aménager, entretenir et sublimer vos espaces extérieurs en Wallonie et dans le Hainaut.</description>
    <language>fr-be</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${BASE_URL}/blog/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${BASE_URL}/images/easygarden_logo.webp</url>
      <title>Easy Garden</title>
      <link>${BASE_URL}/blog/</link>
    </image>
${items}
  </channel>
</rss>
`;

const distDir = path.join(ROOT_DIR, 'dist/blog');
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(path.join(distDir, 'feed.xml'), rss.trim(), 'utf8');

const publicDir = path.join(ROOT_DIR, 'public/blog');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, 'feed.xml'), rss.trim(), 'utf8');

console.log('✅ Flux RSS blog/feed.xml généré avec succès !');

