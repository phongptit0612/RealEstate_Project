const fs = require('fs');
const path = require('path');

const themeColors = {
  'rose-900': 'ocean-900',
  'rose-600': 'ocean-800',
  'rose-500': 'ocean-500',
  'rose-400': 'ocean-400',
  'rose-300': 'ocean-200',
  'orange-500': 'ocean-800',
  'orange-400': 'ocean-500',
  'orange-300': 'ocean-400',
};

function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (let f of files) {
        const pf = path.join(dir, f);
        if (fs.statSync(pf).isDirectory()) {
            walk(pf);
        } else if (pf.endsWith('.jsx')) {
            let content = fs.readFileSync(pf, 'utf-8');
            let modified = content;
            for (const [oldC, newC] of Object.entries(themeColors)) {
                modified = modified.split(oldC).join(newC);
            }
            if (modified !== content) {
                fs.writeFileSync(pf, modified);
                console.log(`Updated colors in ${pf}`);
            }
        }
    }
}

walk('C:/Users/Admin/Desktop/Project/frontend/src');
