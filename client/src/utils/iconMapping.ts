/**
 * Icon Mapping Utility for ForgeArena
 * 
 * This file maps icon identifiers to display values.
 * In the future, these can be replaced with AI-generated images
 * by updating the paths to point to image assets.
 * 
 * Usage:
 * - Import getIconUrl or getIconLabel
 * - Use getIconUrl(iconId) to get an image URL (for future image support)
 * - Use getIconLabel(iconId) to get a text label
 */

// Icon identifier to display label mapping
export const ICON_LABELS: { [key: string]: string } = {
  // Equipment icons
  'headband': 'HB',
  'helmet': 'HLM',
  'cap': 'CAP',
  'mask': 'MSK',
  'glasses': 'GLS',
  'hair-spiky': 'HAIR',
  'hair-long': 'HAIR',
  'tank-top': 'TOP',
  'armor-chest': 'ARM',
  'hoodie': 'HDY',
  'cape': 'CPE',
  'backpack': 'BAG',
  'wings': 'WNG',
  'gloves': 'GLV',
  'boxing-gloves': 'BOX',
  'gauntlets': 'GTL',
  'shorts': 'SHT',
  'leggings': 'LEG',
  'armor-legs': 'ARM',
  'sneakers': 'SNK',
  'boots': 'BTS',
  'necklace': 'NKL',
  'belt': 'BLT',
  'wristband': 'WRB',
  'watch': 'WCH',
  'dumbbell': 'DUM',
  'sword': 'SWD',
  'staff': 'STF',
  'shield': 'SHD',
  'towel': 'TWL',
  'aura-flame': 'FLM',
  'aura-lightning': 'LTN',
  'aura-cosmic': 'CSM',
  'pet-dragon': 'DRG',
  'pet-phoenix': 'PHX',
  'pet-wolf': 'WLF',
  
  // Achievement icons
  'trophy': 'TRP',
  'level-up': 'LVL',
  'streak': 'STK',
  'crown': 'CRN',
  
  // Stat icons
  'strength': 'STR',
  'endurance': 'END',
  'agility': 'AGI',
  
  // UI icons
  'check': 'OK',
  'flame': 'HOT',
  'castle': 'HQ',
  'sword': 'ATK',
};

/**
 * Get display label for an icon identifier
 * @param iconId - The icon identifier string
 * @returns Display label (short text)
 */
export function getIconLabel(iconId: string): string {
  return ICON_LABELS[iconId] || iconId.toUpperCase().substring(0, 3);
}

/**
 * Get image URL for an icon identifier
 * Returns the path to AI-generated images if they exist
 * @param iconId - The icon identifier string
 * @returns Image URL or null if not available
 */
export function getIconUrl(iconId: string): string | null {
  // Icon mode configuration
  // Options: 'none' | 'svg' | 'png'
  // - 'none': Use text labels only
  // - 'svg': Use generated SVG placeholders (free, included)
  // - 'png': Use AI-generated PNG images (requires running generate script with API key)
  const ICON_MODE: 'none' | 'svg' | 'png' = 'svg';
  
  if (ICON_MODE === 'png') {
    return `/assets/icons/${iconId}.png`;
  }
  
  if (ICON_MODE === 'svg') {
    return `/assets/icons/${iconId}.svg`;
  }
  
  return null;
}

/**
 * Check if an icon has an image available
 * @param iconId - The icon identifier string
 * @returns true if image is available
 */
export function hasIconImage(iconId: string): boolean {
  return getIconUrl(iconId) !== null;
}

/**
 * Get CSS class for styling icon based on type
 * @param iconId - The icon identifier string
 * @returns CSS class name
 */
export function getIconClass(iconId: string): string {
  if (iconId.startsWith('aura-')) return 'icon-aura';
  if (iconId.startsWith('pet-')) return 'icon-pet';
  if (iconId.startsWith('armor-')) return 'icon-armor';
  if (iconId.startsWith('hair-')) return 'icon-cosmetic';
  return 'icon-default';
}

export default {
  ICON_LABELS,
  getIconLabel,
  getIconUrl,
  hasIconImage,
  getIconClass,
};

