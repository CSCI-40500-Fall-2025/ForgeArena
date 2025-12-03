// ============================================
// AVATAR & ITEM API ROUTES
// ============================================

const express = require('express');
const router = express.Router();

const itemService = require('../services/item.service');
const { RARITY, SLOT, SLOT_DISPLAY_NAMES } = require('../../shared/itemSystem');

// ============================================
// INVENTORY ENDPOINTS
// ============================================

/**
 * GET /api/avatar/inventory
 * Get user's full inventory
 */
router.get('/inventory', (req, res) => {
  try {
    const userId = req.user?.id || 'default_user';
    const filters = {
      slot: req.query.slot,
      rarity: req.query.rarity,
      category: req.query.category,
      equipped: req.query.equipped === 'true' ? true : req.query.equipped === 'false' ? false : undefined,
      sortBy: req.query.sortBy
    };
    
    const inventory = itemService.getFilteredInventory(userId, filters);
    res.json({
      success: true,
      inventory,
      count: inventory.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/avatar/inventory/stats
 * Get inventory statistics
 */
router.get('/inventory/stats', (req, res) => {
  try {
    const userId = req.user?.id || 'default_user';
    const stats = itemService.getInventoryStats(userId);
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/avatar/inventory/slot/:slot
 * Get available items for a specific slot
 */
router.get('/inventory/slot/:slot', (req, res) => {
  try {
    const userId = req.user?.id || 'default_user';
    const { slot } = req.params;
    
    if (!Object.values(SLOT).includes(slot)) {
      return res.status(400).json({ success: false, error: 'Invalid slot' });
    }
    
    const items = itemService.getItemsForSlot(userId, slot);
    res.json({
      success: true,
      slot,
      slotName: SLOT_DISPLAY_NAMES[slot],
      items,
      count: items.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// EQUIPMENT ENDPOINTS
// ============================================

/**
 * GET /api/avatar/equipment
 * Get user's current equipment loadout
 */
router.get('/equipment', (req, res) => {
  try {
    const userId = req.user?.id || 'default_user';
    const equipment = itemService.getUserEquipment(userId);
    const { stats, xpBonus } = require('../../shared/itemSystem').calculateEquipmentStats(equipment);
    
    res.json({
      success: true,
      equipment,
      stats,
      xpBonus
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/avatar/equip
 * Equip an item
 */
router.post('/equip', (req, res) => {
  try {
    const userId = req.user?.id || 'default_user';
    const { itemId } = req.body;
    
    if (!itemId) {
      return res.status(400).json({ success: false, error: 'Item ID required' });
    }
    
    const result = itemService.equipItem(userId, itemId);
    res.json({
      success: true,
      message: `Equipped ${result.equipped.name}`,
      ...result
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/avatar/unequip
 * Unequip an item from a slot
 */
router.post('/unequip', (req, res) => {
  try {
    const userId = req.user?.id || 'default_user';
    const { slot } = req.body;
    
    if (!slot || !Object.values(SLOT).includes(slot)) {
      return res.status(400).json({ success: false, error: 'Valid slot required' });
    }
    
    const result = itemService.unequipItem(userId, slot);
    res.json({
      success: true,
      message: `Unequipped ${result.unequipped.name}`,
      ...result
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/avatar/state
 * Get full avatar customization state
 */
router.get('/state', (req, res) => {
  try {
    const userId = req.user?.id || 'default_user';
    const state = itemService.getAvatarState(userId);
    res.json({ success: true, ...state });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ITEM OPERATIONS
// ============================================

/**
 * POST /api/avatar/salvage
 * Salvage an item for resources
 */
router.post('/salvage', (req, res) => {
  try {
    const userId = req.user?.id || 'default_user';
    const { itemId } = req.body;
    
    if (!itemId) {
      return res.status(400).json({ success: false, error: 'Item ID required' });
    }
    
    const result = itemService.salvageItem(userId, itemId);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/avatar/item/:itemId
 * Get details of a specific item
 */
router.get('/item/:itemId', (req, res) => {
  try {
    const userId = req.user?.id || 'default_user';
    const { itemId } = req.params;
    
    const item = itemService.getItemFromInventory(userId, itemId);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    
    res.json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// REWARD ENDPOINTS (for testing/admin)
// ============================================

/**
 * POST /api/avatar/rewards/quest
 * Award quest completion items
 */
router.post('/rewards/quest', (req, res) => {
  try {
    const userId = req.user?.id || 'default_user';
    const { difficulty = 'normal' } = req.body;
    
    const result = itemService.awardQuestItems(userId, difficulty);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/avatar/rewards/raid
 * Award raid participation items
 */
router.post('/rewards/raid', (req, res) => {
  try {
    const userId = req.user?.id || 'default_user';
    const { participationLevel = 'normal', bossDefeated = true } = req.body;
    
    const result = itemService.awardRaidItems(userId, participationLevel, bossDefeated);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/avatar/rewards/event
 * Award event items
 */
router.post('/rewards/event', (req, res) => {
  try {
    const userId = req.user?.id || 'default_user';
    const { eventType = 'normal' } = req.body;
    
    const result = itemService.awardEventItems(userId, eventType);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/avatar/rewards/generate
 * Generate a custom item (admin/testing)
 */
router.post('/rewards/generate', (req, res) => {
  try {
    const userId = req.user?.id || 'default_user';
    const options = req.body;
    
    const result = itemService.awardGeneratedItem(userId, options);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// METADATA ENDPOINTS
// ============================================

/**
 * GET /api/avatar/slots
 * Get all available equipment slots
 */
router.get('/slots', (req, res) => {
  const slots = Object.entries(SLOT).map(([key, value]) => ({
    id: value,
    name: SLOT_DISPLAY_NAMES[value],
    key
  }));
  
  res.json({ success: true, slots });
});

/**
 * GET /api/avatar/rarities
 * Get all rarity tiers
 */
router.get('/rarities', (req, res) => {
  const { RARITY_COLORS, RARITY_STAT_MULTIPLIERS } = require('../../shared/itemSystem');
  
  const rarities = Object.entries(RARITY).map(([key, value]) => ({
    id: value,
    name: key.charAt(0) + key.slice(1).toLowerCase(),
    color: RARITY_COLORS[value],
    statMultiplier: RARITY_STAT_MULTIPLIERS[value]
  }));
  
  res.json({ success: true, rarities });
});

module.exports = router;

