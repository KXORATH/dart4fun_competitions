import fs from 'fs';
import path from 'path';

const distPath = path.join(process.cwd(), 'dist');
const htmlPath = path.join(distPath, 'index.html');

if (fs.existsSync(htmlPath)) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  html = html.replace(/crossorigin="[^"]*"/g, '').replace(/crossorigin/g, '');
  fs.writeFileSync(htmlPath, html);
  console.log('Removed crossorigin attributes from dist/index.html');
}

const assetsPath = path.join(distPath, 'assets');
if (fs.existsSync(assetsPath)) {
  const files = fs.readdirSync(assetsPath);
  for (const file of files) {
    if (file.endsWith('.js')) {
      const filePath = path.join(assetsPath, file);
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('crossOrigin="anonymous"')) {
        content = content.replace(/r\.crossOrigin="anonymous"/g, 'r.removeAttribute("crossorigin")');
        fs.writeFileSync(filePath, content);
        console.log(`Removed crossOrigin from ${file}`);
      }
    }
  }
}
