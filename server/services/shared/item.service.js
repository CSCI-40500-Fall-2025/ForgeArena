// ============================================
// ITEM SERVICE - Server-side item management
// ============================================

const {
  generateItem,
  generateItemId,
  generateLootDrop,
  generateQuestReward,
  generateRaidDrop,
  generateEventReward,
  createDefaultEquipment,
  calculateEquipmentStats,
  canEquipItem,
  createStarterInventory,
  RARITY,
  SLOT,
  SLOT_DISPLAY_NAMES
} = require('../../../shared/game/itemSystem');

// In-memory storage (replace with database in production)
const userInventories = new Map();
const userEquipment = new Map();

// ============================================
// INVENTORY MANAGEMENT
// ============================================

/**
 * Gets or creates a user's inventory
 */
const getUserInventory = (userId) => {
  if (!userInventories.has(userId)) {
    userInventories.set(userId, createStarterInventory());
  }
  return userInventories.get(userId);
};

/**
 * Gets or creates a user's equipment loadout
 */
const getUserEquipment = (userId) => {
  if (!userEquipment.has(userId)) {
    userEquipment.set(userId, createDefaultEquipment());
  }
  return userEquipment.get(userId);
};

/**
 * Adds an item to user's inventory
 */
const addItemToInventory = (userId, item) => {
  const inventory = getUserInventory(userId);
  inventory.push(item);
  return inventory;
};

/**
 * Adds multiple items to user's inventory
 */
const addItemsToInventory = (userId, items) => {
  const inventory = getUserInventory(userId);
  inventory.push(...items);
  return inventory;
};

/**
 * Removes an item from user's inventory
 */
const removeItemFromInventory = (userId, itemId) => {
  const inventory = getUserInventory(userId);
  const index = inventory.findIndex(item => item.id === itemId);
  
  if (index === -1) {
    throw new Error('Item not found in inventory');
  }
  
  const [removed] = inventory.splice(index, 1);
  return removed;
};

/**
 * Gets a specific item from inventory
 */
const getItemFromInventory = (userId, itemId) => {
  const inventory = getUserInventory(userId);
  return inventory.find(item => item.id === itemId);
};

// ============================================
// EQUIPMENT MANAGEMENT
// ============================================

/**
 * Equips an item to a slot
 */
const equipItem = (userId, itemId) => {
  const inventory = getUserInventory(userId);
  const equipment = getUserEquipment(userId);
  
  const item = inventory.find(i => i.id === itemId);
  if (!item) {
    throw new Error('Item not found in inventory');
  }
  
  const slot = item.slot;
  
  // Unequip current item in slot (if any)
  const currentItem = equipment[slot];
  if (currentItem) {
    currentItem.equipped = false;
  }
  
  // Equip new item
  equipment[slot] = item;
  item.equipped = true;
  
  return {
    equipped: item,
    unequipped: currentItem,
    equipment,
    stats: calculateEquipmentStats(equipment)
  };
};

/**
 * Unequips an item from a slot
 */
const unequipItem = (userId, slot) => {
  const equipment = getUserEquipment(userId);
  
  const item = equipment[slot];
  if (!item) {
    throw new Error('No item equipped in that slot');
  }
  
  item.equipped = false;
  equipment[slot] = null;
  
  return {
    unequipped: item,
    equipment,
    stats: calculateEquipmentStats(equipment)
  };
};

/**
 * Gets full avatar customization state
 */
const getAvatarState = (userId) => {
  const inventory = getUserInventory(userId);
  const equipment = getUserEquipment(userId);
  const { stats, xpBonus } = calculateEquipmentStats(equipment);
  
  return {
    inventory,
    equipment,
    equipmentStats: stats,
    xpBonus,
    totalItems: inventory.length,
    equippedCount: Object.values(equipment).filter(Boolean).length
  };
};

// ============================================
// REWARD DISTRIBUTION
// ============================================

/**
 * Awards items from quest completion
 */
const awardQuestItems = (userId, questDifficulty = 'normal') => {
  const items = generateQuestReward(questDifficulty);
  addItemsToInventory(userId, items);
  
  return {
    items,
    message: `You received ${items.length} item(s) from the quest!`
  };
};

/**
 * Awards items from raid participation
 */
const awardRaidItems = (userId, participationLevel = 'normal', bossDefeated = true) => {
  const items = generateRaidDrop(participationLevel, bossDefeated);
  addItemsToInventory(userId, items);
  
  return {
    items,
    message: bossDefeated 
      ? `Boss defeated! You received ${items.length} item(s)!`
      : `Raid incomplete. You received ${items.length} consolation item(s).`
  };
};

/**
 * Awards items from events
 */
const awardEventItems = (userId, eventType = 'normal') => {
  const items = generateEventReward(eventType);
  addItemsToInventory(userId, items);
  
  return {
    items,
    message: `Event reward: ${items.length} item(s) received!`
  };
};

/**
 * Awards a specific generated item (for custom rewards)
 */
const awardGeneratedItem = (userId, options = {}) => {
  const item = generateItem(options);
  addItemToInventory(userId, item);
  
  return {
    item,
    message: `You received: ${item.name}!`
  };
};

// ============================================
// ITEM OPERATIONS
// ============================================

/**
 * Salvages an item for resources (future feature)
 */
const salvageItem = (userId, itemId) => {
  const item = removeItemFromInventory(userId, itemId);
  
  // Calculate salvage value based on rarity
  const salvageValues = {
    [RARITY.COMMON]: 10,
    [RARITY.UNCOMMON]: 25,
    [RARITY.RARE]: 50,
    [RARITY.EPIC]: 100,
    [RARITY.LEGENDARY]: 250,
    [RARITY.MYTHIC]: 500
  };
  
  const value = salvageValues[item.rarity] || 10;
  
  return {
    salvaged: item,
    resources: value,
    message: `Salvaged ${item.name} for ${value} resources`
  };
};

/**
 * Gets inventory filtered by various criteria
 */
const getFilteredInventory = (userId, filters = {}) => {
  let inventory = getUserInventory(userId);
  
  if (filters.slot) {
    inventory = inventory.filter(item => item.slot === filters.slot);
  }
  
  if (filters.rarity) {
    inventory = inventory.filter(item => item.rarity === filters.rarity);
  }
  
  if (filters.category) {
    inventory = inventory.filter(item => item.category === filters.category);
  }
  
  if (filters.equipped !== undefined) {
    inventory = inventory.filter(item => item.equipped === filters.equipped);
  }
  
  // Sort options
  if (filters.sortBy) {
    switch (filters.sortBy) {
      case 'rarity':
        const rarityOrder = Object.values(RARITY);
        inventory.sort((a, b) => rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity));
        break;
      case 'name':
        inventory.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'slot':
        inventory.sort((a, b) => a.slot.localeCompare(b.slot));
        break;
      case 'recent':
        inventory.sort((a, b) => new Date(b.acquiredAt) - new Date(a.acquiredAt));
        break;
    }
  }
  
  return inventory;
};

/**
 * Gets available items for a specific slot
 */
const getItemsForSlot = (userId, slot) => {
  return getFilteredInventory(userId, { slot, equipped: false });
};

/**
 * Gets inventory statistics
 */
const getInventoryStats = (userId) => {
  const inventory = getUserInventory(userId);
  
  const stats = {
    total: inventory.length,
    byRarity: {},
    bySlot: {},
    byCategory: {},
    equipped: 0
  };
  
  for (const item of inventory) {
    stats.byRarity[item.rarity] = (stats.byRarity[item.rarity] || 0) + 1;
    stats.bySlot[item.slot] = (stats.bySlot[item.slot] || 0) + 1;
    stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1;
    if (item.equipped) stats.equipped++;
  }
  
  return stats;
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Inventory
  getUserInventory,
  addItemToInventory,
  addItemsToInventory,
  removeItemFromInventory,
  getItemFromInventory,
  getFilteredInventory,
  getItemsForSlot,
  getInventoryStats,
  
  // Equipment
  getUserEquipment,
  equipItem,
  unequipItem,
  getAvatarState,
  
  // Rewards
  awardQuestItems,
  awardRaidItems,
  awardEventItems,
  awardGeneratedItem,
  
  // Operations
  salvageItem,
  
  // Re-exports from shared
  generateItem,
  generateLootDrop,
  RARITY,
  SLOT,
  SLOT_DISPLAY_NAMES
};


