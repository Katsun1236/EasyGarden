const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const directories = [
  'images/realisations',
  'images/blog',
  'images/globales'
];

const dataFiles = [
  'data/posts.json',
  'data/realisations.json',
  'data/images_globales.json'
];

async function convertImagesToWebP() {
  let fileChanges = 0;

  for (const dir of directories) {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) continue;

    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      if (!file.match(/\.(png|jpg|jpeg)$/i)) continue;

      const filePath = path.join(dirPath, file);
      const fileExt = path.extname(file);
      const newFileName = file.replace(new RegExp(fileExt + '$'), '.webp');
      const newFilePath = path.join(dirPath, newFileName);

      console.log(`Converting ${filePath} to WebP...`);
      try {
        await sharp(filePath)
          .webp({ quality: 80 })
          .toFile(newFilePath);
        
        fs.unlinkSync(filePath); // Delete original
        
        // Update JSON files references
        updateJsonFiles(file, newFileName);
        fileChanges++;
      } catch (err) {
        console.error(`Error converting ${filePath}:`, err);
      }
    }
  }

  if (fileChanges > 0) {
    console.log(`Successfully converted ${fileChanges} image(s) to WebP.`);
  } else {
    console.log('No new images to convert.');
  }
}

function updateJsonFiles(oldName, newName) {
  for (const dataFile of dataFiles) {
    const dataPath = path.join(__dirname, dataFile);
    if (!fs.existsSync(dataPath)) continue;

    let content = fs.readFileSync(dataPath, 'utf8');
    const oldNameEscaped = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(/images/[a-zA-Z0-9_-]+)?/${oldNameEscaped}`, 'g');
    
    if (content.match(regex)) {
      // Find the folder path prefix to preserve it, or just replace the filename
      content = content.replace(regex, (match) => {
          return match.replace(oldName, newName);
      });
      fs.writeFileSync(dataPath, content, 'utf8');
      console.log(`Updated references in ${dataFile}`);
    }
  }
}

convertImagesToWebP();