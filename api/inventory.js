let mockEquipment = {
  basic_gloves: { name: 'Basic Gloves', type: 'accessory', stats: { strength: 1 }, rarity: 'common' },
  water_bottle: { name: 'Water Bottle', type: 'accessory', stats: { endurance: 1 }, rarity: 'common' }
};

let mockInventory = ['basic_gloves', 'water_bottle'];

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    const inventory = mockInventory.map(itemId => ({
      id: itemId,
      ...mockEquipment[itemId]
    }));
    res.status(200).json(inventory);
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
