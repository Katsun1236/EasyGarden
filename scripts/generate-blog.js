const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Vérification des variables d'environnement
if (!process.env.GEMINI_API_KEY || !process.env.UNSPLASH_ACCESS_KEY) {
    console.error("❌ ERREUR: Les clés d'API (GEMINI_API_KEY ou UNSPLASH_ACCESS_KEY) sont manquantes dans les Secrets GitHub.");
    process.exit(1);
}

// Initialisation de Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

const categories = ["Entretien", "Création", "Élagage", "Conseils"];
const randomCategory = categories[Math.floor(Math.random() * categories.length)];

async function generateBlogPost() {
    console.log(`🤖 Demande de génération à Gemini (Thème: ${randomCategory})...`);

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
        Tu es un expert paysagiste basé dans la province du Hainaut en Belgique.
        Ton entreprise s'appelle "Easy Garden". Tu t'adresses à des particuliers qui ont un jardin ou veulent en créer un.
        Écris un article de blog SEO très instructif sur le thème: "${randomCategory}".
        
        Règles de formatage STRICTES :
        - Renvoie UNIQUEMENT un objet JSON valide.
        - Ne mets AUCUNE balise Markdown au début ou à la fin (comme \`\`\`json ou \`\`\`).
        - Le JSON doit respecter exactement cette structure:
        {
            "title": "Titre accrocheur et SEO de l'article",
            "slug": "titre-accrocheur-et-seo",
            "excerpt": "Un résumé de 2 ou 3 phrases pour donner envie de lire.",
            "content": "Le contenu de l'article en Markdown. Minimum 500 mots. Utilise des balises h2, h3, et des listes à puces pour aérer le texte. Ne mets pas de titre h1.",
            "category": "${randomCategory}",
            "image_keyword": "un ou deux mots-clés simples EN ANGLAIS pour trouver une belle photo sur unsplash (ex: garden, lawn mower, tree pruning, beautiful landscape, patio)"
        }
    `;

    try {
        const result = await model.generateContent(prompt);
        let text = result.response.text();
        
        // Nettoyage au cas où Gemini rajoute des balises Markdown malgré tout
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        const postData = JSON.parse(text);
        console.log(`✅ Contenu généré: "${postData.title}"`);

        console.log(`📸 Recherche d'image sur Unsplash pour le mot-clé: "${postData.image_keyword}"...`);
        let imageUrl = '/images/EasyGarden_Tonte.webp'; // Fallback par défaut

        const unsplashRes = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(postData.image_keyword)}&orientation=landscape&per_page=1`, {
            headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` }
        });
        const unsplashData = await unsplashRes.json();
        
        if (unsplashData.results && unsplashData.results.length > 0) {
            const imgUrl = unsplashData.results[0].urls.regular;
            console.log(`📥 Téléchargement de l'image...`);
            
            const imgRes = await fetch(imgUrl);
            const buffer = await imgRes.arrayBuffer();
            
            // On sauvegarde l'image. Le script de conversion WebP de build.js la convertira automatiquement !
            const fileName = `${postData.slug}.jpg`;
            const imgPath = path.join(__dirname, '..', 'src', 'assets', 'images', 'blog', fileName);
            fs.writeFileSync(imgPath, Buffer.from(buffer));
            
            // On sauvegarde le chemin en JPG. Le script build:images s'occupera de changer le JSON et l'image en WebP
            imageUrl = `/images/blog/${postData.slug}.jpg`;
            console.log(`✅ Image téléchargée et associée.`);
        } else {
            console.log(`⚠️ Aucune image trouvée sur Unsplash, utilisation de l'image par défaut.`);
        }

        // Mise à jour de posts.json
        const postsPath = path.join(__dirname, '..', 'src', 'data', 'posts.json');
        const postsFile = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
        
        let maxId = 0;
        if(postsFile.posts && postsFile.posts.length > 0) {
            postsFile.posts.forEach(p => {
                const id = parseInt(p.id) || 0;
                if (id > maxId) maxId = id;
            });
        }

        const date = new Date().toISOString().split('T')[0];

        const newPost = {
            id: (maxId + 1).toString(),
            title: postData.title,
            slug: postData.slug,
            date: date,
            category: postData.category,
            image: imageUrl,
            excerpt: postData.excerpt,
            content: postData.content,
            published: true,
            author: "Easy Garden"
        };

        if(!postsFile.posts) postsFile.posts = [];
        postsFile.posts.unshift(newPost);
        
        fs.writeFileSync(postsPath, JSON.stringify(postsFile, null, 2));
        console.log(`🎉 L'article a été ajouté avec succès à src/data/posts.json !`);

    } catch (err) {
        console.error("❌ Erreur lors de la génération de l'article :", err);
        process.exit(1);
    }
}

generateBlogPost();
