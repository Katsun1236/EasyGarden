const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Fonction utilitaire pour lire le JSON
function getJsonData(fileName) {
  const filePath = path.join(__dirname, 'data', fileName);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return null;
}

function processPage(htmlFile, jsonData, pageName) {
  const filePath = path.join(__dirname, htmlFile);
  if (!fs.existsSync(filePath) || !jsonData) return;

  console.log(`Injecting CMS data into ${htmlFile}...`);
  const html = fs.readFileSync(filePath, 'utf8');
  const $ = cheerio.load(html, { decodeEntities: false });

  // 1. Remplacement des attributs [data-cms] pour le texte/HTML
  $('[data-cms]').each(function() {
    const key = $(this).attr('data-cms');
    // key ex: accueil.hero_title -> on utilise juste hero_title car on a déjà les datas
    const propName = key.split('.')[1];
    
    if (jsonData[propName] !== undefined && jsonData[propName] !== null) {
      $(this).html(jsonData[propName]);
    }
  });

  // 2. Remplacement des attributs [data-cms-src] pour les images
  $('[data-cms-src]').each(function() {
    const key = $(this).attr('data-cms-src');
    
    // Support nested keys like accueil.services_accueil.img_creation
    const parts = key.split('.').slice(1); // Enleve le nom du fichier
    let currentData = jsonData;
    
    // Traverse l'objet JSON
    for (const part of parts) {
      if (currentData && currentData[part] !== undefined) {
        currentData = currentData[part];
      } else {
        currentData = undefined;
        break;
      }
    }
    
    if (currentData) {
      $(this).attr('src', currentData);
    }
  });

  // Logique spécifique pour la page Services (liste des prestations)
  if (pageName === 'services' && jsonData.services_list) {
    // Si la page est 'services', nous devons générer dynamiquement la liste d'articles
    const servicesContainer = $('#services-container');
    if (servicesContainer.length) {
      let servicesHtml = '';
      
      jsonData.services_list.forEach((service, index) => {
        const isReverse = index % 2 !== 0; // Alterne la disposition
        
        // Construction des li pour les points forts
        let featuresHtml = '';
        if (service.features) {
          service.features.forEach(f => {
            const pointText = typeof f === 'object' && f.point ? f.point : f;
            featuresHtml += `
            <li class="flex items-start gap-4 p-4 bg-stone-50 rounded">
                <i class="fa-solid fa-check text-botanic mt-1" aria-hidden="true"></i>
                <div>
                    <span class="text-stone-700 text-sm font-light">${pointText}</span>
                </div>
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
                <p class="text-stone-600 leading-relaxed mb-6 font-light text-lg">
                    ${service.description}
                </p>
                <ul class="space-y-4 mb-8">
                    ${featuresHtml}
                </ul>
                <a href="/contact.html" class="glow-btn inline-block bg-botanic-dark text-white px-8 py-4 uppercase tracking-widest text-sm font-bold hover:bg-botanic transition-colors duration-300">
                    Demander un devis
                </a>
            </div>
        </article>`;
      });

      servicesContainer.html(servicesHtml);
    }
  }

  // Logique spécifique pour les paramètres globaux (téléphone, email...) si besoin
  // ...

  fs.writeFileSync(filePath, $.html());
  console.log(`✅ ${htmlFile} updated!`);
}

// Données JSON
const accueilData = getJsonData('accueil.json');
const servicesData = getJsonData('services.json');
const contactData = getJsonData('contact.json');
const globalesData = getJsonData('images_globales.json');

// Fonction pour processer un objet data unique (pour fusionner si besoin)
function processPageWithGlobals(htmlFile, specificData, pageName) {
  const mergedData = { ...specificData };
  processPage(htmlFile, mergedData, pageName);
  
  // Appliquer les données globales (si on en a besoin pour hero_services / hero_contact)
  // On passe `globalesData` en simulant un namespace "images_globales"
  if (globalesData) {
     processPage(htmlFile, globalesData, 'global');
  }
}

// Mise à jour des pages
processPageWithGlobals('index.html', accueilData, 'accueil');
processPageWithGlobals('services.html', servicesData, 'services');
processPageWithGlobals('contact.html', contactData, 'contact');