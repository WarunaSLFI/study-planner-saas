const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('src', function (filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        // Remove dark: classes completely
        let newContent = content.replace(/dark:[a-zA-Z0-9\-\/\[\]\.:]+/g, '');

        // Clean up multiple spaces inside strings or template literals that might be classNames
        newContent = newContent.replace(/className="([^"]*)"/g, (match, p1) => {
            const cleaned = p1.replace(/\s+/g, ' ').trim();
            return `className="${cleaned}"`;
        });

        newContent = newContent.replace(/className=\{`([^`]+)`\}/g, (match, p1) => {
            const cleaned = p1.replace(/\s+/g, ' ').trim();
            return `className={\`${cleaned}\`}`;
        });

        // general replace for multiple spaces inside class names
        newContent = newContent.replace(/ className=([^>]+)>/g, (match, p1) => {
            // Let prettier handle the final format, just basic clean first
            return match.replace(/  +/g, ' ');
        });

        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Updated ${filePath}`);
        }
    }
});
