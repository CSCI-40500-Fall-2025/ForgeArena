const { getState } = require('../../shared/state');

module.exports = function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    const { itemId } = req.query;
    const state = getState();
    const item = state.equipment[itemId];
    
    if (!item || !state.user.avatar.inventory.includes(itemId)) {
      return res.status(400).json({ message: 'Item not found in inventory' });
    }

    // Unequip current item of same type
    const currentEquipped = state.user.avatar.equipment[item.type];
    if (currentEquipped) {
      state.user.avatar.inventory.push(currentEquipped);
    }

    // Equip new item
    state.user.avatar.equipment[item.type] = itemId;
    state.user.avatar.inventory = state.user.avatar.inventory.filter(id => id !== itemId);

    // Apply stat bonuses
    Object.keys(item.stats).forEach(stat => {
      state.user.avatar[stat] += item.stats[stat];
    });

    res.status(200).json({ message: `Equipped ${item.name}!`, equipment: state.user.avatar.equipment });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
