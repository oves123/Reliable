const fs = require('fs');
const path = require('path');
const https = require('https');
const vm = require('vm');

const JS_URL = 'https://reliableseal.com/js/productapp.js';
const BASE_URL = 'https://reliableseal.com/';
const DATA_DIR = path.join(__dirname, 'src', 'data');
const IMG_DIR = path.join(__dirname, 'public', 'images', 'sealproduct');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

function downloadImage(url, dest) {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(dest)) {
            return resolve(); // Skip if already downloaded
        }
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                const file = fs.createWriteStream(dest);
                response.pipe(file);
                file.on('finish', () => {
                    file.close(resolve);
                });
            } else {
                reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
            }
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
}

https.get(JS_URL, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', async () => {
        try {
            // Find the productsData array string
            const startStr = 'const productsData = ';
            const startIndex = data.indexOf(startStr);
            if (startIndex === -1) throw new Error("Could not find productsData");
            
            // Extract everything from the array start up to the semicolon
            const arrayDataStr = data.substring(startIndex + startStr.length);
            const endIndex = arrayDataStr.indexOf('];');
            if (endIndex === -1) throw new Error("Could not find end of productsData array");
            
            const rawArrayStr = arrayDataStr.substring(0, endIndex + 1);

            // Execute in a sandbox to get the JS object
            const sandbox = {};
            vm.createContext(sandbox);
            vm.runInContext(`var parsedData = ${rawArrayStr};`, sandbox);
            
            const products = sandbox.parsedData;
            
            // Save to JSON
            fs.writeFileSync(path.join(DATA_DIR, 'products.json'), JSON.stringify(products, null, 2));
            console.log(`Saved ${products.length} products to src/data/products.json`);

            // Download images
            const imageSet = new Set();
            for (const p of products) {
                if (p.img) imageSet.add(p.img);
                if (p.images && Array.isArray(p.images)) {
                    p.images.forEach(img => imageSet.add(img));
                }
            }

            console.log(`Found ${imageSet.size} unique images to download...`);
            
            let count = 0;
            for (const imgPath of imageSet) {
                if (imgPath.trim() === "") continue;
                // imgPath is like "images/sealproduct/something.png"
                const fullUrl = BASE_URL + imgPath;
                const fileName = path.basename(imgPath);
                const destPath = path.join(IMG_DIR, fileName);
                
                try {
                    await downloadImage(fullUrl, destPath);
                    count++;
                    if (count % 10 === 0) console.log(`Downloaded ${count}/${imageSet.size} images`);
                } catch (err) {
                    console.error(`Error downloading ${fullUrl}:`, err.message);
                }
            }
            console.log('All downloads finished successfully!');
            
        } catch (err) {
            console.error("Error parsing JS file:", err);
        }
    });
}).on('error', err => {
    console.error("Error fetching JS file:", err.message);
});
