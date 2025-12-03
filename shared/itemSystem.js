// ============================================
// FORGEARENA ITEM SYSTEM
// Procedural item generation with Roblox-style customization
// ============================================

// ============================================
// CONSTANTS & ENUMS
// ============================================

const RARITY = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
  MYTHIC: 'mythic'
};

const RARITY_WEIGHTS = {
  [RARITY.COMMON]: 50,
  [RARITY.UNCOMMON]: 25,
  [RARITY.RARE]: 15,
  [RARITY.EPIC]: 7,
  [RARITY.LEGENDARY]: 2.5,
  [RARITY.MYTHIC]: 0.5
};

const RARITY_COLORS = {
  [RARITY.COMMON]: '#9CA3AF',
  [RARITY.UNCOMMON]: '#22C55E',
  [RARITY.RARE]: '#3B82F6',
  [RARITY.EPIC]: '#A855F7',
  [RARITY.LEGENDARY]: '#F59E0B',
  [RARITY.MYTHIC]: '#EF4444'
};

const RARITY_STAT_MULTIPLIERS = {
  [RARITY.COMMON]: 1,
  [RARITY.UNCOMMON]: 1.5,
  [RARITY.RARE]: 2.25,
  [RARITY.EPIC]: 3.5,
  [RARITY.LEGENDARY]: 5,
  [RARITY.MYTHIC]: 8
};

// Avatar equipment slots (Roblox-style)
const SLOT = {
  // Head
  HEAD: 'head',
  FACE: 'face',
  HAIR: 'hair',
  HAT: 'hat',
  
  // Upper Body
  TORSO: 'torso',
  SHIRT: 'shirt',
  JACKET: 'jacket',
  BACK: 'back',
  
  // Arms
  LEFT_ARM: 'leftArm',
  RIGHT_ARM: 'rightArm',
  GLOVES: 'gloves',
  
  // Lower Body
  PANTS: 'pants',
  LEGS: 'legs',
  
  // Feet
  SHOES: 'shoes',
  
  // Accessories
  NECK: 'neck',
  WAIST: 'waist',
  LEFT_WRIST: 'leftWrist',
  RIGHT_WRIST: 'rightWrist',
  
  // Gear (functional items)
  WEAPON: 'weapon',
  OFFHAND: 'offhand',
  AURA: 'aura',
  PET: 'pet'
};

const SLOT_DISPLAY_NAMES = {
  [SLOT.HEAD]: 'Head',
  [SLOT.FACE]: 'Face',
  [SLOT.HAIR]: 'Hair',
  [SLOT.HAT]: 'Hat',
  [SLOT.TORSO]: 'Torso',
  [SLOT.SHIRT]: 'Shirt',
  [SLOT.JACKET]: 'Jacket',
  [SLOT.BACK]: 'Back',
  [SLOT.LEFT_ARM]: 'Left Arm',
  [SLOT.RIGHT_ARM]: 'Right Arm',
  [SLOT.GLOVES]: 'Gloves',
  [SLOT.PANTS]: 'Pants',
  [SLOT.LEGS]: 'Legs',
  [SLOT.SHOES]: 'Shoes',
  [SLOT.NECK]: 'Neck',
  [SLOT.WAIST]: 'Waist',
  [SLOT.LEFT_WRIST]: 'Left Wrist',
  [SLOT.RIGHT_WRIST]: 'Right Wrist',
  [SLOT.WEAPON]: 'Weapon',
  [SLOT.OFFHAND]: 'Off-Hand',
  [SLOT.AURA]: 'Aura',
  [SLOT.PET]: 'Pet'
};

// Item categories for organization
const CATEGORY = {
  CLOTHING: 'clothing',
  ARMOR: 'armor',
  ACCESSORY: 'accessory',
  GEAR: 'gear',
  COSMETIC: 'cosmetic',
  SPECIAL: 'special'
};

// ============================================
// ITEM TEMPLATES - Base items that can be modified
// ============================================

const ITEM_TEMPLATES = {
  // ===== HEAD ITEMS =====
  headband: {
    baseId: 'headband',
    baseName: 'Headband',
    slot: SLOT.HEAD,
    category: CATEGORY.ACCESSORY,
    baseStats: { endurance: 2 },
    variants: ['Sweat', 'Warrior', 'Champion', 'Elite', 'Ninja'],
    materials: ['Cotton', 'Silk', 'Leather', 'Steel-Woven', 'Dragon Scale'],
    icon: 'headband'
  },
  helmet: {
    baseId: 'helmet',
    baseName: 'Helmet',
    slot: SLOT.HEAD,
    category: CATEGORY.ARMOR,
    baseStats: { strength: 3, endurance: 1 },
    variants: ['Training', 'Battle', 'Gladiator', 'Knight', 'Ancient'],
    materials: ['Plastic', 'Iron', 'Steel', 'Titanium', 'Mythril'],
    icon: 'helmet'
  },
  cap: {
    baseId: 'cap',
    baseName: 'Cap',
    slot: SLOT.HAT,
    category: CATEGORY.CLOTHING,
    baseStats: { agility: 1 },
    variants: ['Gym', 'Sports', 'Pro', 'Limited', 'Vintage'],
    materials: ['Cotton', 'Polyester', 'Performance', 'Premium', 'Legendary'],
    icon: 'cap'
  },

  // ===== FACE ITEMS =====
  mask: {
    baseId: 'mask',
    baseName: 'Mask',
    slot: SLOT.FACE,
    category: CATEGORY.ACCESSORY,
    baseStats: { endurance: 1, agility: 1 },
    variants: ['Training', 'Altitude', 'Ninja', 'Phantom', 'Void'],
    materials: ['Fabric', 'Neoprene', 'Carbon', 'Shadow', 'Ethereal'],
    icon: 'mask'
  },
  glasses: {
    baseId: 'glasses',
    baseName: 'Glasses',
    slot: SLOT.FACE,
    category: CATEGORY.ACCESSORY,
    baseStats: { agility: 2 },
    variants: ['Sport', 'Tactical', 'Cyber', 'Holo', 'Quantum'],
    materials: ['Plastic', 'Titanium', 'Carbon Fiber', 'Nano-Tech', 'Void Crystal'],
    icon: 'glasses'
  },

  // ===== HAIR ITEMS =====
  hairstyle_spiky: {
    baseId: 'hairstyle_spiky',
    baseName: 'Spiky Hair',
    slot: SLOT.HAIR,
    category: CATEGORY.COSMETIC,
    baseStats: {},
    variants: ['Casual', 'Wild', 'Super', 'Ultra', 'Legendary'],
    colors: ['Black', 'Brown', 'Blonde', 'Red', 'Blue', 'Silver', 'Rainbow'],
    icon: 'hair-spiky'
  },
  hairstyle_long: {
    baseId: 'hairstyle_long',
    baseName: 'Long Hair',
    slot: SLOT.HAIR,
    category: CATEGORY.COSMETIC,
    baseStats: {},
    variants: ['Flowing', 'Warrior', 'Mystic', 'Ethereal', 'Divine'],
    colors: ['Black', 'Brown', 'Blonde', 'Red', 'Purple', 'White', 'Cosmic'],
    icon: 'hair-long'
  },

  // ===== TORSO ITEMS =====
  tank_top: {
    baseId: 'tank_top',
    baseName: 'Tank Top',
    slot: SLOT.SHIRT,
    category: CATEGORY.CLOTHING,
    baseStats: { agility: 1 },
    variants: ['Basic', 'Performance', 'Pro', 'Elite', 'Champion'],
    materials: ['Cotton', 'Polyester', 'Dry-Fit', 'Compression', 'Nano-Fiber'],
    icon: 'tank-top'
  },
  armor_chest: {
    baseId: 'armor_chest',
    baseName: 'Chest Armor',
    slot: SLOT.TORSO,
    category: CATEGORY.ARMOR,
    baseStats: { strength: 2, endurance: 3 },
    variants: ['Training', 'Battle', 'War', 'Legendary', 'Divine'],
    materials: ['Leather', 'Iron', 'Steel', 'Adamantine', 'Celestial'],
    icon: 'armor-chest'
  },
  hoodie: {
    baseId: 'hoodie',
    baseName: 'Hoodie',
    slot: SLOT.JACKET,
    category: CATEGORY.CLOTHING,
    baseStats: { endurance: 2 },
    variants: ['Gym', 'Street', 'Tech', 'Phantom', 'Mythic'],
    materials: ['Cotton', 'Fleece', 'Performance', 'Shadow-Weave', 'Void-Touched'],
    icon: 'hoodie'
  },

  // ===== BACK ITEMS =====
  cape: {
    baseId: 'cape',
    baseName: 'Cape',
    slot: SLOT.BACK,
    category: CATEGORY.COSMETIC,
    baseStats: { agility: 2 },
    variants: ['Training', 'Warrior', 'Hero', 'Champion', 'Godly'],
    materials: ['Cloth', 'Silk', 'Enchanted', 'Phoenix Feather', 'Starlight'],
    icon: 'cape'
  },
  backpack: {
    baseId: 'backpack',
    baseName: 'Backpack',
    slot: SLOT.BACK,
    category: CATEGORY.ACCESSORY,
    baseStats: { endurance: 1 },
    variants: ['Gym', 'Tactical', 'Adventure', 'Explorer', 'Dimensional'],
    materials: ['Nylon', 'Canvas', 'Kevlar', 'Dragon Hide', 'Void Pocket'],
    icon: 'backpack'
  },
  wings: {
    baseId: 'wings',
    baseName: 'Wings',
    slot: SLOT.BACK,
    category: CATEGORY.SPECIAL,
    baseStats: { agility: 5 },
    variants: ['Feathered', 'Mechanical', 'Angelic', 'Demonic', 'Cosmic'],
    materials: ['Feathers', 'Steel', 'Light', 'Shadow', 'Stardust'],
    icon: 'wings'
  },

  // ===== GLOVES =====
  gloves_training: {
    baseId: 'gloves_training',
    baseName: 'Training Gloves',
    slot: SLOT.GLOVES,
    category: CATEGORY.GEAR,
    baseStats: { strength: 2 },
    variants: ['Basic', 'Pro', 'Champion', 'Master', 'Legendary'],
    materials: ['Leather', 'Synthetic', 'Reinforced', 'Titanium-Weave', 'Dragon Scale'],
    icon: 'gloves'
  },
  gloves_boxing: {
    baseId: 'gloves_boxing',
    baseName: 'Boxing Gloves',
    slot: SLOT.GLOVES,
    category: CATEGORY.GEAR,
    baseStats: { strength: 3, agility: 1 },
    variants: ['Training', 'Sparring', 'Competition', 'Champion', 'Mythic'],
    materials: ['Vinyl', 'Leather', 'Premium Leather', 'Enchanted', 'Infernal'],
    icon: 'boxing-gloves'
  },
  gauntlets: {
    baseId: 'gauntlets',
    baseName: 'Gauntlets',
    slot: SLOT.GLOVES,
    category: CATEGORY.ARMOR,
    baseStats: { strength: 4, endurance: 2 },
    variants: ['Iron', 'Steel', 'War', 'Titan', 'Godslayer'],
    materials: ['Iron', 'Steel', 'Mithril', 'Adamantine', 'Cosmic Metal'],
    icon: 'gauntlets'
  },

  // ===== PANTS =====
  shorts: {
    baseId: 'shorts',
    baseName: 'Shorts',
    slot: SLOT.PANTS,
    category: CATEGORY.CLOTHING,
    baseStats: { agility: 2 },
    variants: ['Gym', 'Performance', 'Pro', 'Elite', 'Champion'],
    materials: ['Cotton', 'Polyester', 'Compression', 'Nano-Fiber', 'Wind-Weave'],
    icon: 'shorts'
  },
  leggings: {
    baseId: 'leggings',
    baseName: 'Leggings',
    slot: SLOT.PANTS,
    category: CATEGORY.CLOTHING,
    baseStats: { agility: 1, endurance: 1 },
    variants: ['Basic', 'Performance', 'Compression', 'Elite', 'Legendary'],
    materials: ['Spandex', 'Polyester', 'Compression', 'Tech-Fiber', 'Shadow-Silk'],
    icon: 'leggings'
  },
  armor_legs: {
    baseId: 'armor_legs',
    baseName: 'Leg Armor',
    slot: SLOT.LEGS,
    category: CATEGORY.ARMOR,
    baseStats: { endurance: 3, strength: 1 },
    variants: ['Training', 'Battle', 'War', 'Champion', 'Divine'],
    materials: ['Leather', 'Iron', 'Steel', 'Titanium', 'Celestial'],
    icon: 'armor-legs'
  },

  // ===== SHOES =====
  sneakers: {
    baseId: 'sneakers',
    baseName: 'Sneakers',
    slot: SLOT.SHOES,
    category: CATEGORY.CLOTHING,
    baseStats: { agility: 2 },
    variants: ['Basic', 'Running', 'Training', 'Pro', 'Limited Edition'],
    materials: ['Canvas', 'Mesh', 'Synthetic', 'Boost-Tech', 'Air-Weave'],
    icon: 'sneakers'
  },
  boots: {
    baseId: 'boots',
    baseName: 'Boots',
    slot: SLOT.SHOES,
    category: CATEGORY.ARMOR,
    baseStats: { strength: 1, endurance: 2 },
    variants: ['Work', 'Combat', 'Tactical', 'War', 'Titan'],
    materials: ['Leather', 'Steel-Toe', 'Reinforced', 'Mithril', 'Void-Walker'],
    icon: 'boots'
  },

  // ===== ACCESSORIES =====
  necklace: {
    baseId: 'necklace',
    baseName: 'Necklace',
    slot: SLOT.NECK,
    category: CATEGORY.ACCESSORY,
    baseStats: { strength: 1, endurance: 1, agility: 1 },
    variants: ['Simple', 'Elegant', 'Power', 'Ancient', 'Divine'],
    materials: ['Silver', 'Gold', 'Platinum', 'Enchanted', 'Cosmic'],
    icon: 'necklace'
  },
  belt: {
    baseId: 'belt',
    baseName: 'Belt',
    slot: SLOT.WAIST,
    category: CATEGORY.ACCESSORY,
    baseStats: { strength: 2 },
    variants: ['Basic', 'Weight', 'Power', 'Champion', 'Legendary'],
    materials: ['Leather', 'Nylon', 'Reinforced', 'Titan-Weave', 'Dragon Hide'],
    icon: 'belt'
  },
  wristband: {
    baseId: 'wristband',
    baseName: 'Wristband',
    slot: SLOT.LEFT_WRIST,
    category: CATEGORY.ACCESSORY,
    baseStats: { endurance: 1 },
    variants: ['Sweat', 'Power', 'Tech', 'Champion', 'Mythic'],
    materials: ['Cotton', 'Elastic', 'Smart-Fiber', 'Energy-Weave', 'Void-Touched'],
    icon: 'wristband'
  },
  watch: {
    baseId: 'watch',
    baseName: 'Watch',
    slot: SLOT.RIGHT_WRIST,
    category: CATEGORY.ACCESSORY,
    baseStats: { agility: 1 },
    variants: ['Sport', 'Smart', 'Tactical', 'Quantum', 'Chrono'],
    materials: ['Plastic', 'Steel', 'Titanium', 'Nano-Tech', 'Time Crystal'],
    icon: 'watch'
  },

  // ===== WEAPONS =====
  dumbbell: {
    baseId: 'dumbbell',
    baseName: 'Dumbbell',
    slot: SLOT.WEAPON,
    category: CATEGORY.GEAR,
    baseStats: { strength: 4 },
    variants: ['Training', 'Heavy', 'Champion', 'Titan', 'World-Breaker'],
    materials: ['Iron', 'Steel', 'Chrome', 'Enchanted', 'Cosmic Metal'],
    icon: 'dumbbell'
  },
  sword: {
    baseId: 'sword',
    baseName: 'Sword',
    slot: SLOT.WEAPON,
    category: CATEGORY.GEAR,
    baseStats: { strength: 5, agility: 2 },
    variants: ['Training', 'Battle', 'War', 'Legendary', 'Divine'],
    materials: ['Iron', 'Steel', 'Mithril', 'Adamantine', 'Starforged'],
    icon: 'sword'
  },
  staff: {
    baseId: 'staff',
    baseName: 'Staff',
    slot: SLOT.WEAPON,
    category: CATEGORY.GEAR,
    baseStats: { endurance: 3, agility: 3 },
    variants: ['Wooden', 'Reinforced', 'Battle', 'Arcane', 'Celestial'],
    materials: ['Oak', 'Ironwood', 'Crystal', 'Enchanted', 'World Tree'],
    icon: 'staff'
  },

  // ===== OFFHAND =====
  shield: {
    baseId: 'shield',
    baseName: 'Shield',
    slot: SLOT.OFFHAND,
    category: CATEGORY.GEAR,
    baseStats: { endurance: 5, strength: 1 },
    variants: ['Training', 'Battle', 'Tower', 'Champion', 'Aegis'],
    materials: ['Wood', 'Iron', 'Steel', 'Mithril', 'Divine Light'],
    icon: 'shield'
  },
  towel: {
    baseId: 'towel',
    baseName: 'Gym Towel',
    slot: SLOT.OFFHAND,
    category: CATEGORY.ACCESSORY,
    baseStats: { endurance: 2 },
    variants: ['Basic', 'Quick-Dry', 'Pro', 'Champion', 'Legendary'],
    materials: ['Cotton', 'Microfiber', 'Bamboo', 'Cooling-Tech', 'Phoenix Down'],
    icon: 'towel'
  },

  // ===== AURAS =====
  aura_flame: {
    baseId: 'aura_flame',
    baseName: 'Flame Aura',
    slot: SLOT.AURA,
    category: CATEGORY.SPECIAL,
    baseStats: { strength: 3 },
    variants: ['Ember', 'Fire', 'Inferno', 'Phoenix', 'Solar'],
    colors: ['Orange', 'Red', 'Blue', 'White', 'Black'],
    icon: 'aura-flame'
  },
  aura_lightning: {
    baseId: 'aura_lightning',
    baseName: 'Lightning Aura',
    slot: SLOT.AURA,
    category: CATEGORY.SPECIAL,
    baseStats: { agility: 3 },
    variants: ['Spark', 'Thunder', 'Storm', 'Tempest', 'Divine'],
    colors: ['Yellow', 'Blue', 'Purple', 'White', 'Gold'],
    icon: 'aura-lightning'
  },
  aura_cosmic: {
    baseId: 'aura_cosmic',
    baseName: 'Cosmic Aura',
    slot: SLOT.AURA,
    category: CATEGORY.SPECIAL,
    baseStats: { strength: 1, endurance: 1, agility: 1 },
    variants: ['Starlight', 'Nebula', 'Galaxy', 'Void', 'Universe'],
    colors: ['Purple', 'Blue', 'Pink', 'Black', 'Rainbow'],
    icon: 'aura-cosmic'
  },

  // ===== PETS =====
  pet_dragon: {
    baseId: 'pet_dragon',
    baseName: 'Dragon',
    slot: SLOT.PET,
    category: CATEGORY.SPECIAL,
    baseStats: { strength: 2, agility: 2 },
    variants: ['Baby', 'Young', 'Adult', 'Elder', 'Ancient'],
    colors: ['Red', 'Blue', 'Green', 'Black', 'Gold'],
    icon: 'pet-dragon'
  },
  pet_phoenix: {
    baseId: 'pet_phoenix',
    baseName: 'Phoenix',
    slot: SLOT.PET,
    category: CATEGORY.SPECIAL,
    baseStats: { endurance: 3, agility: 1 },
    variants: ['Hatchling', 'Fledgling', 'Mature', 'Elder', 'Eternal'],
    colors: ['Orange', 'Red', 'Gold', 'Blue', 'White'],
    icon: 'pet-phoenix'
  },
  pet_wolf: {
    baseId: 'pet_wolf',
    baseName: 'Wolf',
    slot: SLOT.PET,
    category: CATEGORY.SPECIAL,
    baseStats: { agility: 3, strength: 1 },
    variants: ['Pup', 'Young', 'Alpha', 'Spirit', 'Celestial'],
    colors: ['Gray', 'White', 'Black', 'Silver', 'Spectral'],
    icon: 'pet-wolf'
  }
};

// ============================================
// SPECIAL TRAITS (Bonus modifiers)
// ============================================

const TRAITS = {
  // Stat-boosting traits
  mighty: { name: 'Mighty', description: '+20% Strength', statBonus: { strength: 0.2 } },
  resilient: { name: 'Resilient', description: '+20% Endurance', statBonus: { endurance: 0.2 } },
  swift: { name: 'Swift', description: '+20% Agility', statBonus: { agility: 0.2 } },
  balanced: { name: 'Balanced', description: '+10% All Stats', statBonus: { strength: 0.1, endurance: 0.1, agility: 0.1 } },
  
  // Special effects
  glowing: { name: 'Glowing', description: 'Emits a soft glow', visual: 'glow' },
  animated: { name: 'Animated', description: 'Has animated particles', visual: 'particles' },
  shimmering: { name: 'Shimmering', description: 'Shimmers with light', visual: 'shimmer' },
  
  // Bonus XP/rewards
  fortunate: { name: 'Fortunate', description: '+5% XP Gain', xpBonus: 0.05 },
  blessed: { name: 'Blessed', description: '+10% XP Gain', xpBonus: 0.10 },
  
  // Set bonuses (when wearing matching items)
  setpiece: { name: 'Set Piece', description: 'Part of a set', isSetPiece: true }
};

const TRAIT_WEIGHTS = {
  mighty: 15,
  resilient: 15,
  swift: 15,
  balanced: 10,
  glowing: 12,
  animated: 8,
  shimmering: 10,
  fortunate: 10,
  blessed: 3,
  setpiece: 2
};

// ============================================
// ITEM GENERATION FUNCTIONS
// ============================================

/**
 * Generates a unique item ID
 */
const generateItemId = () => {
  return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Weighted random selection
 */
const weightedRandom = (weights) => {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let random = Math.random() * total;
  
  for (const [key, weight] of entries) {
    random -= weight;
    if (random <= 0) return key;
  }
  
  return entries[0][0];
};

/**
 * Determines rarity based on source (better sources = better odds)
 */
const determineRarity = (source = 'normal', bonusLuck = 0) => {
  const sourceModifiers = {
    normal: 0,
    quest: 5,
    raid: 15,
    event: 10,
    boss: 20,
    legendary_quest: 30,
    mythic_event: 50
  };
  
  const modifier = sourceModifiers[source] || 0;
  const adjustedWeights = { ...RARITY_WEIGHTS };
  
  // Shift weights towards rarer items
  adjustedWeights[RARITY.COMMON] = Math.max(10, adjustedWeights[RARITY.COMMON] - modifier - bonusLuck);
  adjustedWeights[RARITY.UNCOMMON] = adjustedWeights[RARITY.UNCOMMON] + (modifier * 0.2);
  adjustedWeights[RARITY.RARE] = adjustedWeights[RARITY.RARE] + (modifier * 0.3);
  adjustedWeights[RARITY.EPIC] = adjustedWeights[RARITY.EPIC] + (modifier * 0.25);
  adjustedWeights[RARITY.LEGENDARY] = adjustedWeights[RARITY.LEGENDARY] + (modifier * 0.15);
  adjustedWeights[RARITY.MYTHIC] = adjustedWeights[RARITY.MYTHIC] + (modifier * 0.1);
  
  return weightedRandom(adjustedWeights);
};

/**
 * Determines how many traits an item gets based on rarity
 */
const determineTraitCount = (rarity) => {
  const traitChances = {
    [RARITY.COMMON]: [0.9, 0.1, 0, 0],
    [RARITY.UNCOMMON]: [0.6, 0.35, 0.05, 0],
    [RARITY.RARE]: [0.3, 0.5, 0.18, 0.02],
    [RARITY.EPIC]: [0.1, 0.4, 0.4, 0.1],
    [RARITY.LEGENDARY]: [0, 0.2, 0.5, 0.3],
    [RARITY.MYTHIC]: [0, 0, 0.3, 0.7]
  };
  
  const chances = traitChances[rarity] || [1, 0, 0, 0];
  const roll = Math.random();
  let cumulative = 0;
  
  for (let i = 0; i < chances.length; i++) {
    cumulative += chances[i];
    if (roll <= cumulative) return i;
  }
  
  return 0;
};

/**
 * Selects random traits for an item
 */
const selectTraits = (count) => {
  const selectedTraits = [];
  const availableTraits = { ...TRAIT_WEIGHTS };
  
  for (let i = 0; i < count; i++) {
    const trait = weightedRandom(availableTraits);
    selectedTraits.push(trait);
    delete availableTraits[trait]; // No duplicate traits
  }
  
  return selectedTraits;
};

/**
 * Calculates final stats for an item
 */
const calculateStats = (baseStats, rarity, traits) => {
  const multiplier = RARITY_STAT_MULTIPLIERS[rarity];
  const stats = {};
  
  // Apply base stats with rarity multiplier
  for (const [stat, value] of Object.entries(baseStats)) {
    stats[stat] = Math.round(value * multiplier);
  }
  
  // Apply trait bonuses
  for (const traitKey of traits) {
    const trait = TRAITS[traitKey];
    if (trait.statBonus) {
      for (const [stat, bonus] of Object.entries(trait.statBonus)) {
        if (stats[stat]) {
          stats[stat] = Math.round(stats[stat] * (1 + bonus));
        } else {
          stats[stat] = Math.round((baseStats[stat] || 1) * multiplier * bonus);
        }
      }
    }
  }
  
  return stats;
};

/**
 * Generates a procedural item name
 */
const generateItemName = (template, rarity, variantIndex, materialIndex, traits) => {
  const variant = template.variants[variantIndex];
  const material = template.materials ? template.materials[materialIndex] : null;
  const color = template.colors ? template.colors[materialIndex] : null;
  
  let prefix = '';
  let suffix = '';
  
  // Add trait-based prefixes
  if (traits.includes('glowing')) prefix = 'Radiant ';
  else if (traits.includes('animated')) prefix = 'Living ';
  else if (traits.includes('shimmering')) prefix = 'Ethereal ';
  else if (traits.includes('mighty')) prefix = 'Powerful ';
  else if (traits.includes('swift')) prefix = 'Quick ';
  else if (traits.includes('resilient')) prefix = 'Sturdy ';
  
  // Add rarity-based suffixes for high rarity
  if (rarity === RARITY.LEGENDARY) suffix = ' of Legends';
  else if (rarity === RARITY.MYTHIC) suffix = ' of the Gods';
  else if (traits.includes('blessed')) suffix = ' of Fortune';
  
  const materialPart = material ? `${material} ` : '';
  const colorPart = color ? `${color} ` : '';
  
  return `${prefix}${materialPart || colorPart}${variant} ${template.baseName}${suffix}`;
};

/**
 * Main item generation function
 */
const generateItem = (options = {}) => {
  const {
    templateId = null,
    slot = null,
    rarity = null,
    source = 'normal',
    bonusLuck = 0,
    forcedTraits = []
  } = options;
  
  // Select template
  let template;
  if (templateId && ITEM_TEMPLATES[templateId]) {
    template = ITEM_TEMPLATES[templateId];
  } else if (slot) {
    const slotTemplates = Object.values(ITEM_TEMPLATES).filter(t => t.slot === slot);
    template = slotTemplates[Math.floor(Math.random() * slotTemplates.length)];
  } else {
    const templates = Object.values(ITEM_TEMPLATES);
    template = templates[Math.floor(Math.random() * templates.length)];
  }
  
  if (!template) {
    throw new Error('No valid template found');
  }
  
  // Determine rarity
  const finalRarity = rarity || determineRarity(source, bonusLuck);
  
  // Determine variant/material based on rarity
  const rarityIndex = Object.values(RARITY).indexOf(finalRarity);
  const maxVariantIndex = Math.min(rarityIndex, template.variants.length - 1);
  const variantIndex = Math.floor(Math.random() * (maxVariantIndex + 1));
  
  const materialArray = template.materials || template.colors || [];
  const maxMaterialIndex = Math.min(rarityIndex, materialArray.length - 1);
  const materialIndex = maxMaterialIndex >= 0 ? Math.floor(Math.random() * (maxMaterialIndex + 1)) : 0;
  
  // Determine traits
  const traitCount = determineTraitCount(finalRarity);
  const traits = [...forcedTraits, ...selectTraits(Math.max(0, traitCount - forcedTraits.length))];
  
  // Calculate stats
  const stats = calculateStats(template.baseStats, finalRarity, traits);
  
  // Generate name
  const name = generateItemName(template, finalRarity, variantIndex, materialIndex, traits);
  
  // Build the item
  const item = {
    id: generateItemId(),
    templateId: template.baseId,
    name,
    slot: template.slot,
    category: template.category,
    rarity: finalRarity,
    stats,
    traits: traits.map(t => ({ key: t, ...TRAITS[t] })),
    icon: template.icon,
    variant: template.variants[variantIndex],
    material: template.materials ? template.materials[materialIndex] : null,
    color: template.colors ? template.colors[materialIndex] : null,
    source,
    acquiredAt: new Date().toISOString(),
    equipped: false
  };
  
  // Add visual effects based on traits
  item.visualEffects = [];
  for (const trait of traits) {
    if (TRAITS[trait].visual) {
      item.visualEffects.push(TRAITS[trait].visual);
    }
  }
  
  // Calculate XP bonus
  item.xpBonus = traits.reduce((sum, t) => sum + (TRAITS[t].xpBonus || 0), 0);
  
  return item;
};

/**
 * Generates a loot drop (multiple items)
 */
const generateLootDrop = (options = {}) => {
  const {
    source = 'normal',
    guaranteedSlots = [],
    minItems = 1,
    maxItems = 3,
    bonusLuck = 0
  } = options;
  
  const items = [];
  
  // Generate guaranteed slot items
  for (const slot of guaranteedSlots) {
    items.push(generateItem({ slot, source, bonusLuck }));
  }
  
  // Generate random additional items
  const additionalCount = Math.floor(Math.random() * (maxItems - minItems + 1)) + minItems - guaranteedSlots.length;
  for (let i = 0; i < Math.max(0, additionalCount); i++) {
    items.push(generateItem({ source, bonusLuck }));
  }
  
  return items;
};

/**
 * Generates quest rewards
 */
const generateQuestReward = (questDifficulty = 'normal') => {
  const difficultyMap = {
    easy: { source: 'quest', minItems: 1, maxItems: 1, bonusLuck: 0 },
    normal: { source: 'quest', minItems: 1, maxItems: 2, bonusLuck: 5 },
    hard: { source: 'quest', minItems: 2, maxItems: 3, bonusLuck: 15 },
    legendary: { source: 'legendary_quest', minItems: 2, maxItems: 4, bonusLuck: 30 }
  };
  
  const config = difficultyMap[questDifficulty] || difficultyMap.normal;
  return generateLootDrop(config);
};

/**
 * Generates raid boss drops
 */
const generateRaidDrop = (participationLevel = 'normal', bossDefeated = true) => {
  if (!bossDefeated) {
    return generateLootDrop({ source: 'normal', minItems: 0, maxItems: 1 });
  }
  
  const participationMap = {
    low: { source: 'raid', minItems: 1, maxItems: 2, bonusLuck: 5 },
    normal: { source: 'raid', minItems: 2, maxItems: 3, bonusLuck: 15 },
    high: { source: 'raid', minItems: 3, maxItems: 4, bonusLuck: 25 },
    mvp: { source: 'boss', minItems: 4, maxItems: 6, bonusLuck: 40 }
  };
  
  const config = participationMap[participationLevel] || participationMap.normal;
  return generateLootDrop(config);
};

/**
 * Generates event rewards
 */
const generateEventReward = (eventType = 'normal') => {
  const eventMap = {
    daily: { source: 'normal', minItems: 1, maxItems: 1, bonusLuck: 0 },
    weekly: { source: 'event', minItems: 1, maxItems: 2, bonusLuck: 10 },
    special: { source: 'event', minItems: 2, maxItems: 3, bonusLuck: 20 },
    seasonal: { source: 'mythic_event', minItems: 3, maxItems: 5, bonusLuck: 40 }
  };
  
  const config = eventMap[eventType] || eventMap.normal;
  return generateLootDrop(config);
};

// ============================================
// AVATAR EQUIPMENT MANAGEMENT
// ============================================

/**
 * Creates a default avatar equipment loadout
 */
const createDefaultEquipment = () => {
  const equipment = {};
  for (const slot of Object.values(SLOT)) {
    equipment[slot] = null;
  }
  return equipment;
};

/**
 * Calculates total stats from equipped items
 */
const calculateEquipmentStats = (equipment) => {
  const totalStats = { strength: 0, endurance: 0, agility: 0 };
  let totalXpBonus = 0;
  
  for (const item of Object.values(equipment)) {
    if (item) {
      for (const [stat, value] of Object.entries(item.stats || {})) {
        totalStats[stat] = (totalStats[stat] || 0) + value;
      }
      totalXpBonus += item.xpBonus || 0;
    }
  }
  
  return { stats: totalStats, xpBonus: totalXpBonus };
};

/**
 * Validates if an item can be equipped to a slot
 */
const canEquipItem = (item, slot) => {
  return item.slot === slot;
};

// ============================================
// STARTER ITEMS
// ============================================

const STARTER_ITEMS = [
  generateItem({ templateId: 'tank_top', rarity: RARITY.COMMON, source: 'normal' }),
  generateItem({ templateId: 'shorts', rarity: RARITY.COMMON, source: 'normal' }),
  generateItem({ templateId: 'sneakers', rarity: RARITY.COMMON, source: 'normal' }),
  generateItem({ templateId: 'gloves_training', rarity: RARITY.COMMON, source: 'normal' }),
  generateItem({ templateId: 'wristband', rarity: RARITY.COMMON, source: 'normal' })
];

/**
 * Creates starter inventory for new users
 */
const createStarterInventory = () => {
  return STARTER_ITEMS.map(item => ({
    ...item,
    id: generateItemId(),
    acquiredAt: new Date().toISOString()
  }));
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Constants
  RARITY,
  RARITY_COLORS,
  RARITY_STAT_MULTIPLIERS,
  SLOT,
  SLOT_DISPLAY_NAMES,
  CATEGORY,
  ITEM_TEMPLATES,
  TRAITS,
  
  // Item Generation
  generateItem,
  generateItemId,
  generateLootDrop,
  generateQuestReward,
  generateRaidDrop,
  generateEventReward,
  
  // Avatar Management
  createDefaultEquipment,
  calculateEquipmentStats,
  canEquipItem,
  createStarterInventory,
  
  // Utilities
  determineRarity,
  weightedRandom
};

