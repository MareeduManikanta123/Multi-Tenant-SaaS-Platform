const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Simple PNG generator - creates placeholder images with text
const generatePNG = (filename, title) => {
  try {
    const canvas = createCanvas(1200, 800);
    const ctx = canvas.getContext('2d');
    
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1200, 800);
    
    // Border
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 1180, 780);
    
    // Title
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, 600, 100);
    
    // Description text
    ctx.fillStyle = '#4b5563';
    ctx.font = '20px Arial';
    ctx.fillText('See architecture.md for detailed ASCII diagrams', 600, 400);
    ctx.fillText('All system documentation in text format', 600, 450);
    
    // Footer
    ctx.fillStyle = '#9ca3af';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Multi-Tenant SaaS Platform • Generated from SVG source', 30, 780);
    
    // Save PNG
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(filename, buffer);
    console.log(`✓ Created ${path.basename(filename)}`);
  } catch (err) {
    console.error(`Error creating ${filename}:`, err.message);
  }
};

generatePNG('system-architecture.png', 'System Architecture');
generatePNG('database-erd.png', 'Database ERD');
