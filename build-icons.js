#!/usr/bin/env node
/**
 * Icon generation script for Gene Editor
 * 
 * This script generates the required icons for Tauri from a source image.
 * Requirements: ImageMagick (convert command)
 * 
 * Usage: node build-icons.js [source-image.png]
 * If no source image is provided, a default icon will be created.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, 'src-tauri', 'icons');
const SIZES = [32, 128, 256, 512];

function createDefaultIcon(size) {
    // Create a simple DNA helix icon using ImageMagick
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#3B82F6"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
        font-family="Arial" font-size="${size * 0.5}" fill="white" font-weight="bold">G</text>
</svg>`;
    
    const svgPath = path.join(ICONS_DIR, `icon-${size}.svg`);
    fs.writeFileSync(svgPath, svg);
    
    try {
        execSync(`convert "${svgPath}" "${path.join(ICONS_DIR, `${size}x${size}.png`)}"`, { stdio: 'inherit' });
        fs.unlinkSync(svgPath);
    } catch (e) {
        console.error(`Failed to convert icon for size ${size}:`, e.message);
    }
}

function generateIcons() {
    console.log('Generating icons for Gene Editor...\n');
    
    // Ensure icons directory exists
    if (!fs.existsSync(ICONS_DIR)) {
        fs.mkdirSync(ICONS_DIR, { recursive: true });
    }
    
    const sourceImage = process.argv[2];
    
    if (sourceImage && fs.existsSync(sourceImage)) {
        console.log(`Using source image: ${sourceImage}`);
        
        // Generate icons from source
        for (const size of SIZES) {
            const outputPath = path.join(ICONS_DIR, `${size}x${size}.png`);
            try {
                execSync(`convert "${sourceImage}" -resize ${size}x${size} "${outputPath}"`, { stdio: 'inherit' });
                console.log(`✓ Generated ${size}x${size}.png`);
            } catch (e) {
                console.error(`✗ Failed to generate ${size}x${size}.png`);
            }
        }
        
        // Generate Windows ICO
        try {
            execSync(`convert "${sourceImage}" -resize 256x256 "${path.join(ICONS_DIR, 'icon.ico')}"`, { stdio: 'inherit' });
            console.log('✓ Generated icon.ico');
        } catch (e) {
            console.error('✗ Failed to generate icon.ico');
        }
        
        // Generate macOS ICNS
        try {
            execSync(`convert "${sourceImage}" -resize 512x512 "${path.join(ICONS_DIR, 'icon.icns')}"`, { stdio: 'inherit' });
            console.log('✓ Generated icon.icns');
        } catch (e) {
            console.error('✗ Failed to generate icon.icns');
        }
    } else {
        console.log('No source image provided. Creating default icons...');
        console.log('Usage: node build-icons.js [source-image.png]\n');
        
        // Create default simple icons
        for (const size of SIZES) {
            createDefaultIcon(size);
            console.log(`✓ Generated default ${size}x${size}.png`);
        }
    }
    
    console.log('\nIcon generation complete!');
}

generateIcons();
