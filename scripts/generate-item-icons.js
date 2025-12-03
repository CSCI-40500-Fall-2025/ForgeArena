/**
 * AI Item Icon Generator
 * 
 * This script generates item icons using AI image generation.
 * Run once to generate all icons, then store them in /client/public/assets/icons/
 * 
 * COST ESTIMATE: ~$2-4 total for all icons (one-time cost)
 * 
 * Supported APIs:
 * 1. OpenAI DALL-E 3 ($0.04-0.08 per image)
 * 2. Stability AI (similar pricing)
 * 3. Free alternatives: Bing Image Creator (manual), Stable Diffusion (self-hosted)
 * 
 * Usage:
 *   Set OPENAI_API_KEY environment variable
 *   node scripts/generate-item-icons.js
 */

const fs = require('fs').promises;
const path = require('path');

// Configuration
const OUTPUT_DIR = path.join(__dirname, '../client/public/assets/icons');
const IMAGE_SIZE = '256x256'; // Small icons, cheaper
const IMAGE_STYLE = 'game-icon'; // Consistent style

// All item icons to generate
const ITEM_ICONS = [
  // Equipment
  { id: 'headband', prompt: 'A sleek athletic headband, game icon style, clean design, transparent background, fitness equipment' },
  { id: 'helmet', prompt: 'A warrior training helmet, game icon style, metallic, clean design, fitness RPG' },
  { id: 'cap', prompt: 'A sporty baseball cap, game icon style, athletic wear, clean design' },
  { id: 'mask', prompt: 'A training face mask, game icon style, athletic, ninja style, clean design' },
  { id: 'glasses', prompt: 'Sport sunglasses, game icon style, tactical eyewear, clean design' },
  { id: 'hair-spiky', prompt: 'Spiky anime-style hair, game icon style, character customization, clean design' },
  { id: 'hair-long', prompt: 'Long flowing hair, game icon style, character customization, clean design' },
  { id: 'tank-top', prompt: 'Athletic tank top shirt, game icon style, fitness apparel, clean design' },
  { id: 'armor-chest', prompt: 'Warrior chest armor plate, game icon style, RPG equipment, metallic, clean design' },
  { id: 'hoodie', prompt: 'Athletic hoodie jacket, game icon style, gym wear, clean design' },
  { id: 'cape', prompt: 'Hero cape flowing, game icon style, RPG accessory, clean design' },
  { id: 'backpack', prompt: 'Tactical gym backpack, game icon style, athletic gear, clean design' },
  { id: 'wings', prompt: 'Angelic wings spread, game icon style, fantasy accessory, glowing, clean design' },
  { id: 'gloves', prompt: 'Training workout gloves, game icon style, fitness equipment, clean design' },
  { id: 'boxing-gloves', prompt: 'Red boxing gloves, game icon style, combat sports, clean design' },
  { id: 'gauntlets', prompt: 'Armored warrior gauntlets, game icon style, RPG equipment, metallic, clean design' },
  { id: 'shorts', prompt: 'Athletic shorts, game icon style, gym wear, clean design' },
  { id: 'leggings', prompt: 'Compression leggings, game icon style, athletic wear, clean design' },
  { id: 'armor-legs', prompt: 'Leg armor greaves, game icon style, RPG equipment, metallic, clean design' },
  { id: 'sneakers', prompt: 'Running sneakers shoes, game icon style, athletic footwear, clean design' },
  { id: 'boots', prompt: 'Combat boots, game icon style, tactical footwear, clean design' },
  { id: 'necklace', prompt: 'Power amulet necklace, game icon style, RPG accessory, glowing gem, clean design' },
  { id: 'belt', prompt: 'Weightlifting belt, game icon style, fitness equipment, clean design' },
  { id: 'wristband', prompt: 'Athletic wristband sweatband, game icon style, fitness accessory, clean design' },
  { id: 'watch', prompt: 'Sport smartwatch, game icon style, fitness tracker, clean design' },
  { id: 'dumbbell', prompt: 'Heavy dumbbell weight, game icon style, gym equipment, metallic, clean design' },
  { id: 'sword', prompt: 'Warrior sword blade, game icon style, RPG weapon, metallic, clean design' },
  { id: 'staff', prompt: 'Magical staff with crystal, game icon style, RPG weapon, glowing, clean design' },
  { id: 'shield', prompt: 'Warrior shield with emblem, game icon style, RPG equipment, metallic, clean design' },
  { id: 'towel', prompt: 'Gym towel rolled, game icon style, fitness accessory, clean design' },
  { id: 'aura-flame', prompt: 'Fire flame aura effect, game icon style, magical energy, glowing orange, clean design' },
  { id: 'aura-lightning', prompt: 'Lightning electric aura, game icon style, magical energy, glowing blue, clean design' },
  { id: 'aura-cosmic', prompt: 'Cosmic star aura, game icon style, magical energy, purple galaxy, clean design' },
  { id: 'pet-dragon', prompt: 'Cute baby dragon pet, game icon style, fantasy companion, friendly, clean design' },
  { id: 'pet-phoenix', prompt: 'Phoenix fire bird pet, game icon style, fantasy companion, glowing, clean design' },
  { id: 'pet-wolf', prompt: 'Wolf companion pet, game icon style, fantasy companion, majestic, clean design' },
  
  // Achievement icons
  { id: 'trophy', prompt: 'Golden trophy cup, game icon style, achievement reward, shiny, clean design' },
  { id: 'level-up', prompt: 'Level up arrow pointing up, game icon style, achievement, glowing green, clean design' },
  { id: 'streak', prompt: 'Fire streak flame, game icon style, achievement, burning hot, clean design' },
  { id: 'crown', prompt: 'Golden king crown, game icon style, achievement, royal, shiny, clean design' },
  
  // Stat icons
  { id: 'strength', prompt: 'Flexed muscular arm, game icon style, strength stat, powerful, clean design' },
  { id: 'endurance', prompt: 'Heart with pulse line, game icon style, endurance stat, healthy, clean design' },
  { id: 'agility', prompt: 'Lightning bolt speed, game icon style, agility stat, fast, clean design' },
];

/**
 * Generate a single icon using OpenAI DALL-E API
 */
async function generateIconWithDALLE(item, apiKey) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: item.prompt,
      n: 1,
      size: '1024x1024', // DALL-E 3 minimum
      quality: 'standard',
      response_format: 'b64_json'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`DALL-E API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return Buffer.from(data.data[0].b64_json, 'base64');
}

/**
 * Save image to file
 */
async function saveIcon(id, imageBuffer) {
  const filePath = path.join(OUTPUT_DIR, `${id}.png`);
  await fs.writeFile(filePath, imageBuffer);
  console.log(`  Saved: ${filePath}`);
}

/**
 * Main generation function
 */
async function generateAllIcons() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.log('='.repeat(60));
    console.log('AI ITEM ICON GENERATOR');
    console.log('='.repeat(60));
    console.log('');
    console.log('No OPENAI_API_KEY found. You have several options:');
    console.log('');
    console.log('OPTION 1: Use OpenAI DALL-E (Recommended, ~$2-4 total)');
    console.log('  1. Get API key from https://platform.openai.com/api-keys');
    console.log('  2. Run: set OPENAI_API_KEY=your-key-here');
    console.log('  3. Run: node scripts/generate-item-icons.js');
    console.log('');
    console.log('OPTION 2: Use Free Bing Image Creator (Manual)');
    console.log('  1. Go to https://www.bing.com/images/create');
    console.log('  2. Use prompts from this script to generate each icon');
    console.log('  3. Save to client/public/assets/icons/');
    console.log('');
    console.log('OPTION 3: Use Stable Diffusion (Free, requires setup)');
    console.log('  1. Install Stable Diffusion locally or use a free API');
    console.log('  2. Modify this script to use that API');
    console.log('');
    console.log('OPTION 4: Generate placeholder icons (Free, immediate)');
    console.log('  Run: node scripts/generate-item-icons.js --placeholders');
    console.log('');
    
    // Check for placeholder flag
    if (process.argv.includes('--placeholders')) {
      await generatePlaceholders();
    }
    
    return;
  }

  // Create output directory
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  
  console.log('='.repeat(60));
  console.log('GENERATING AI ITEM ICONS');
  console.log('='.repeat(60));
  console.log(`Total icons to generate: ${ITEM_ICONS.length}`);
  console.log(`Estimated cost: $${(ITEM_ICONS.length * 0.04).toFixed(2)} - $${(ITEM_ICONS.length * 0.08).toFixed(2)}`);
  console.log('');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < ITEM_ICONS.length; i++) {
    const item = ITEM_ICONS[i];
    console.log(`[${i + 1}/${ITEM_ICONS.length}] Generating: ${item.id}`);
    
    try {
      const imageBuffer = await generateIconWithDALLE(item, apiKey);
      await saveIcon(item.id, imageBuffer);
      successCount++;
      
      // Rate limiting - wait 1 second between requests
      if (i < ITEM_ICONS.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`  ERROR: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log('');
  console.log('='.repeat(60));
  console.log('GENERATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log('');
  console.log('Next steps:');
  console.log('1. Update client/src/utils/iconMapping.ts to return image URLs');
  console.log('2. The ItemIcon component will automatically use the images');
}

/**
 * Generate simple placeholder icons (free, no API needed)
 */
async function generatePlaceholders() {
  console.log('');
  console.log('Generating placeholder icons...');
  
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  
  // Create a simple SVG placeholder for each icon
  for (const item of ITEM_ICONS) {
    const label = item.id.toUpperCase().substring(0, 3);
    const hue = Math.abs(item.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 360;
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:hsl(${hue}, 70%, 60%)"/>
      <stop offset="100%" style="stop-color:hsl(${hue}, 70%, 40%)"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="16" fill="url(#bg)"/>
  <text x="64" y="72" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="white" text-anchor="middle">${label}</text>
</svg>`;
    
    const filePath = path.join(OUTPUT_DIR, `${item.id}.svg`);
    await fs.writeFile(filePath, svg);
  }
  
  console.log(`Generated ${ITEM_ICONS.length} placeholder icons in ${OUTPUT_DIR}`);
  console.log('');
  console.log('These are simple SVG placeholders. Replace with AI-generated images later.');
}

// Run the generator
generateAllIcons().catch(console.error);

