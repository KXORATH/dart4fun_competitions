import fs from 'fs';
import path from 'path';

const htmlPath = path.join(process.cwd(), 'dist', 'index.html');
if (fs.existsSync(htmlPath)) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  html = html.replace(/crossorigin="[^"]*"/g, '').replace(/crossorigin/g, '');
  fs.writeFileSync(htmlPath, html);
  console.log('Removed crossorigin attributes from dist/index.html');
} else {
  console.log('dist/index.html not found');
}
