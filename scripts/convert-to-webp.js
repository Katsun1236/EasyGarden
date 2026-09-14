const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT_DIR = path.join(__dirname, '..');

const directories = [
  'src/assets/images',
  'src/assets/images/realisations',
  'src/assets/images/blog',
  'src/assets/images/globales'
];

const dataFiles = [
  'src/data/accueil.json',
  'src/data/services.json',
  'src/data/posts.json',
  'src/data/realisations.json',
  'src/data/images_globales.json'
];

const htmlDirectories = [
  'src/pages',
  'src/pages/blog',
  'src/components'
];

async function convertImagesToWebP() {
  let fileChanges = 0;

  for (const relDir of directories) {
    const dirPath = path.join(ROOT_DIR, relDir);
    if (!fs.existsSync(dirPath)) continue;

    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      if (!file.match(/\.(png|jpg|jpeg)$/i)) continue;

      const filePath = path.join(dirPath, file);
      if (fs.statSync(filePath).isDirectory()) continue;

      const fileExt = path.extname(file);
      const newFileName = file.replace(new RegExp(fileExt + '$'), '.webp');
      const newFilePath = path.join(dirPath, newFileName);

      console.log(`🖼️  Optimizing & Converting ${file} to WebP...`);
      try {
        await sharp(filePath)
          .resize({ width: 1920, withoutEnlargement: true })
          .webp({ quality: 82, effort: 4 })
          .toFile(newFilePath);

        fs.unlinkSync(filePath); // Delete original
        console.log(`✅ Converted ${file} -> ${newFileName}`);

        updateDataAndHtmlFiles(file, newFileName);
        fileChanges++;
      } catch (err) {
        console.error(`❌ Error converting ${filePath}:`, err);
      }
    }
  }

  if (fileChanges > 0) {
    console.log(`✨ Successfully optimized and converted ${fileChanges} image(s) to WebP.`);
  } else {
    console.log('⚡ All images are already in WebP format.');
  }

  // Also optimize any oversized existing webps
  for (const relDir of directories) {
    const dirPath = path.join(ROOT_DIR, relDir);
    if (!fs.existsSync(dirPath)) continue;

    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      if (!file.endsWith('.webp')) continue;
      const filePath = path.join(dirPath, file);
      if (fs.statSync(filePath).isDirectory()) continue;

      const stat = fs.statSync(filePath);
      if (stat.size > 800 * 1024) {
        try {
          const inputBuffer = fs.readFileSync(filePath);
          const buf = await sharp(inputBuffer)
            .resize({ width: 1920, withoutEnlargement: true })
            .webp({ quality: 78, effort: 5 })
            .toBuffer();
          if (buf.length < stat.size) {
            fs.writeFileSync(filePath, buf);
            console.log(`   📉 Compressed large webp ${file}: ${(stat.size/1024/1024).toFixed(2)}MB -> ${(buf.length/1024/1024).toFixed(2)}MB`);
          }
        } catch (e) {
          // ignore
        }
      }
    }
  }
}

function updateDataAndHtmlFiles(oldName, newName) {
  const oldNameEscaped = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(oldNameEscaped, 'g');

  for (const dataFile of dataFiles) {
    const dataPath = path.join(ROOT_DIR, dataFile);
    if (!fs.existsSync(dataPath)) continue;

    let content = fs.readFileSync(dataPath, 'utf8');
    if (content.match(regex)) {
      content = content.replace(regex, newName);
      fs.writeFileSync(dataPath, content, 'utf8');
      console.log(`   📝 Updated reference in ${dataFile}`);
    }
  }

  for (const htmlDir of htmlDirectories) {
    const dirPath = path.join(ROOT_DIR, htmlDir);
    if (!fs.existsSync(dirPath)) continue;

    const htmlFiles = fs.readdirSync(dirPath);
    for (const hf of htmlFiles) {
      if (!hf.endsWith('.html')) continue;
      const htmlFilePath = path.join(dirPath, hf);
      let content = fs.readFileSync(htmlFilePath, 'utf8');
      if (content.match(regex)) {
        content = content.replace(regex, newName);
        fs.writeFileSync(htmlFilePath, content, 'utf8');
        console.log(`   📝 Updated reference in ${path.relative(ROOT_DIR, htmlFilePath)}`);
      }
    }
  }
}

convertImagesToWebP();