const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'src', 'data', 'products.json');
let products = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

function slugify(text) {
    if (!text) return 'unknown';
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

products = products.map(p => {
    // 1. Slugs
    p.categorySlug = slugify(p.category);
    p.slug = slugify(p.name) + '-' + p.id;

    // 2. Image path fixing for the Astro site (from public folder)
    let imgPath = p.img || (p.images && p.images[0]);
    if (imgPath) {
        p.image = '/images/sealproduct/' + path.basename(imgPath);
    } else {
        p.image = '/images/products/seal1.png'; // fallback
    }

    // 3. Specs extraction
    // Identify keys that are likely technical specifications
    const skipKeys = ['id', 'name', 'category', 'images', 'img', 'description', 'seal_types', 'common_specs', 'applications', 'direction', 'info', 'categorySlug', 'slug', 'image'];
    const specs = {};
    
    // Add common specs if they exist
    if (p.common_specs) {
        Object.assign(specs, p.common_specs);
    }

    for (const [key, value] of Object.entries(p)) {
        if (!skipKeys.includes(key) && value && typeof value === 'string') {
            // Prettify keys (e.g. MOCofouterShell -> MOC of Outer Shell)
            const prettyKey = key.replace(/([A-Z])/g, ' $1').trim().replace(/_/g, ' ');
            specs[prettyKey.charAt(0).toUpperCase() + prettyKey.slice(1)] = value;
        }
    }
    p.specs = specs;

    // 4. Features extraction
    let features = [];
    if (p.seal_types && p.seal_types.length > 0) {
        p.seal_types.forEach(st => {
            features.push(st.type + ": " + (st.description_paragraph || ''));
        });
    } else if (p.applications && p.applications.length > 0) {
        features = p.applications.map(a => "Application: " + a);
    } else if (p.direction) {
        features.push("Direction: " + p.direction);
    }
    
    if (p.info) features.push(p.info);

    if (features.length === 0) {
        features = [
            "High performance reliability",
            "Designed for severe conditions",
            "Long operating life",
            "Easy installation and maintenance"
        ];
    }
    p.features = features;

    // Fix description if empty
    if (!p.description || p.description.trim() === "") {
        p.description = "A reliable sealing solution engineered for maximum efficiency and durability in industrial applications.";
    }

    return p;
});

fs.writeFileSync(dataPath, JSON.stringify(products, null, 2));
console.log('Formatted products.json for Astro template!');
