import React, { useState, useEffect, useCallback } from 'react';
import './AvatarEditor.css';

// ============================================
// TYPES
// ============================================

interface ItemStats {
  strength?: number;
  endurance?: number;
  agility?: number;
}

interface ItemTrait {
  key: string;
  name: string;
  description: string;
  visual?: string;
}

interface Item {
  id: string;
  templateId: string;
  name: string;
  slot: string;
  category: string;
  rarity: string;
  stats: ItemStats;
  traits: ItemTrait[];
  icon: string;
  variant: string;
  material?: string;
  color?: string;
  visualEffects: string[];
  xpBonus: number;
  equipped: boolean;
  acquiredAt: string;
}

interface Equipment {
  [slot: string]: Item | null;
}

interface SlotInfo {
  id: string;
  name: string;
  key: string;
}

interface RarityInfo {
  id: string;
  name: string;
  color: string;
  statMultiplier: number;
}

// ============================================
// CONSTANTS
// ============================================

const RARITY_COLORS: { [key: string]: string } = {
  common: '#9CA3AF',
  uncommon: '#22C55E',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B',
  mythic: '#EF4444'
};

const SLOT_GROUPS = {
  head: ['head', 'face', 'hair', 'hat'],
  body: ['torso', 'shirt', 'jacket', 'back'],
  arms: ['leftArm', 'rightArm', 'gloves'],
  legs: ['pants', 'legs', 'shoes'],
  accessories: ['neck', 'waist', 'leftWrist', 'rightWrist'],
  gear: ['weapon', 'offhand', 'aura', 'pet']
};

const SLOT_ICONS: { [key: string]: string } = {
  head: 'HEAD',
  face: 'FACE',
  hair: 'HAIR',
  hat: 'HAT',
  torso: 'TORSO',
  shirt: 'SHIRT',
  jacket: 'JACKET',
  back: 'BACK',
  leftArm: 'L-ARM',
  rightArm: 'R-ARM',
  gloves: 'GLOVES',
  pants: 'PANTS',
  legs: 'LEGS',
  shoes: 'SHOES',
  neck: 'NECK',
  waist: 'WAIST',
  leftWrist: 'L-WRIST',
  rightWrist: 'R-WRIST',
  weapon: 'WEAPON',
  offhand: 'OFFHAND',
  aura: 'AURA',
  pet: 'PET'
};

// ============================================
// API HELPERS
// ============================================

const API_BASE = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/api`
  : (process.env.NODE_ENV === 'production' 
      ? '/api'
      : 'http://localhost:5000/api');

// ============================================
// COMPONENT
// ============================================

const AvatarEditor: React.FC = () => {
  // State
  const [inventory, setInventory] = useState<Item[]>([]);
  const [equipment, setEquipment] = useState<Equipment>({});
  const [equipmentStats, setEquipmentStats] = useState<ItemStats>({ strength: 0, endurance: 0, agility: 0 });
  const [xpBonus, setXpBonus] = useState<number>(0);
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [rarities, setRarities] = useState<RarityInfo[]>([]);
  
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [activeTab, setActiveTab] = useState<string>('avatar');
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('rarity');
  
  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [rewardLoading, setRewardLoading] = useState<boolean>(false);

  // ============================================
  // DATA FETCHING
  // ============================================

  const fetchAvatarState = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/avatar/state`);
      const data = await response.json();
      
      if (data.success) {
        setInventory(data.inventory);
        setEquipment(data.equipment);
        setEquipmentStats(data.equipmentStats);
        setXpBonus(data.xpBonus);
      }
    } catch (error) {
      console.error('Failed to fetch avatar state:', error);
      showMessage('Failed to load avatar data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMetadata = useCallback(async () => {
    try {
      const [slotsRes, raritiesRes] = await Promise.all([
        fetch(`${API_BASE}/avatar/slots`),
        fetch(`${API_BASE}/avatar/rarities`)
      ]);
      
      const slotsData = await slotsRes.json();
      const raritiesData = await raritiesRes.json();
      
      if (slotsData.success) setSlots(slotsData.slots);
      if (raritiesData.success) setRarities(raritiesData.rarities);
    } catch (error) {
      console.error('Failed to fetch metadata:', error);
    }
  }, []);

  useEffect(() => {
    fetchAvatarState();
    fetchMetadata();
  }, [fetchAvatarState, fetchMetadata]);

  // ============================================
  // ACTIONS
  // ============================================

  const showMessage = (text: string, type: 'success' | 'error' | 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const equipItem = async (itemId: string) => {
    try {
      const response = await fetch(`${API_BASE}/avatar/equip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showMessage(data.message, 'success');
        fetchAvatarState();
        setSelectedItem(null);
      } else {
        showMessage(data.error, 'error');
      }
    } catch (error) {
      showMessage('Failed to equip item', 'error');
    }
  };

  const unequipItem = async (slot: string) => {
    try {
      const response = await fetch(`${API_BASE}/avatar/unequip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showMessage(data.message, 'success');
        fetchAvatarState();
      } else {
        showMessage(data.error, 'error');
      }
    } catch (error) {
      showMessage('Failed to unequip item', 'error');
    }
  };

  const salvageItem = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to salvage this item? This cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/avatar/salvage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showMessage(data.message, 'success');
        fetchAvatarState();
        setSelectedItem(null);
      } else {
        showMessage(data.error, 'error');
      }
    } catch (error) {
      showMessage('Failed to salvage item', 'error');
    }
  };

  const claimReward = async (type: string, options: object = {}) => {
    setRewardLoading(true);
    try {
      const response = await fetch(`${API_BASE}/avatar/rewards/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });
      
      const data = await response.json();
      
      if (data.success) {
        showMessage(data.message, 'success');
        fetchAvatarState();
      } else {
        showMessage(data.error, 'error');
      }
    } catch (error) {
      showMessage('Failed to claim reward', 'error');
    } finally {
      setRewardLoading(false);
    }
  };

  // ============================================
  // FILTERING & SORTING
  // ============================================

  const getFilteredInventory = () => {
    let filtered = [...inventory];
    
    // Filter by slot if selected
    if (selectedSlot) {
      filtered = filtered.filter(item => item.slot === selectedSlot);
    }
    
    // Filter by rarity
    if (filterRarity !== 'all') {
      filtered = filtered.filter(item => item.rarity === filterRarity);
    }
    
    // Sort
    const rarityOrder = ['mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
    switch (sortBy) {
      case 'rarity':
        filtered.sort((a, b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity));
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'recent':
        filtered.sort((a, b) => new Date(b.acquiredAt).getTime() - new Date(a.acquiredAt).getTime());
        break;
    }
    
    return filtered;
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  const renderStatBar = (label: string, value: number, max: number = 100, color: string = '#3B82F6') => (
    <div className="stat-bar-container">
      <div className="stat-bar-label">
        <span>{label}</span>
        <span className="stat-value">+{value}</span>
      </div>
      <div className="stat-bar">
        <div 
          className="stat-bar-fill" 
          style={{ width: `${Math.min((value / max) * 100, 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );

  const renderItemCard = (item: Item, onClick?: () => void, showEquipButton: boolean = true) => (
    <div 
      key={item.id}
      className={`item-card ${item.rarity} ${item.equipped ? 'equipped' : ''} ${selectedItem?.id === item.id ? 'selected' : ''}`}
      onClick={onClick}
      style={{ borderColor: RARITY_COLORS[item.rarity] }}
    >
      <div className="item-icon" style={{ backgroundColor: `${RARITY_COLORS[item.rarity]}20` }}>
        {item.icon}
      </div>
      <div className="item-info">
        <h4 className="item-name" style={{ color: RARITY_COLORS[item.rarity] }}>{item.name}</h4>
        <p className="item-rarity">{item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}</p>
        <div className="item-stats-mini">
          {item.stats.strength && <span className="stat str">+{item.stats.strength} STR</span>}
          {item.stats.endurance && <span className="stat end">+{item.stats.endurance} END</span>}
          {item.stats.agility && <span className="stat agi">+{item.stats.agility} AGI</span>}
        </div>
        {item.traits.length > 0 && (
          <div className="item-traits-mini">
            {item.traits.slice(0, 2).map(trait => (
              <span key={trait.key} className="trait-badge">{trait.name}</span>
            ))}
            {item.traits.length > 2 && <span className="trait-badge more">+{item.traits.length - 2}</span>}
          </div>
        )}
      </div>
      {item.equipped && <div className="equipped-badge">Equipped</div>}
      {item.visualEffects.length > 0 && (
        <div className={`visual-effect ${item.visualEffects[0]}`} />
      )}
    </div>
  );

  const renderSlotButton = (slot: string, groupName: string) => {
    const equippedItem = equipment[slot];
    const slotInfo = slots.find(s => s.id === slot);
    
    return (
      <button
        key={slot}
        className={`slot-button ${selectedSlot === slot ? 'selected' : ''} ${equippedItem ? 'has-item' : ''}`}
        onClick={() => {
          setSelectedSlot(selectedSlot === slot ? null : slot);
          setSelectedItem(null);
        }}
        style={equippedItem ? { borderColor: RARITY_COLORS[equippedItem.rarity] } : {}}
      >
        <span className="slot-icon">{equippedItem?.icon || SLOT_ICONS[slot] || '◯'}</span>
        <span className="slot-name">{slotInfo?.name || slot}</span>
        {equippedItem && (
          <span className="slot-item-name" style={{ color: RARITY_COLORS[equippedItem.rarity] }}>
            {equippedItem.name}
          </span>
        )}
      </button>
    );
  };

  // ============================================
  // MAIN RENDER
  // ============================================

  if (loading) {
    return (
      <div className="avatar-editor loading">
        <div className="loading-spinner" />
        <p>Loading Avatar Editor...</p>
      </div>
    );
  }

  return (
    <div className="avatar-editor">
      {/* Message Toast */}
      {message && (
        <div className={`toast-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Header - design system */}
      <div className="ds-page-header" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 className="ds-page-title">Avatar & Inventory</h1>
          <p className="ds-page-subtitle">Customize your warrior's appearance and gear</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="editor-tabs">
        <button 
          className={`tab ${activeTab === 'avatar' ? 'active' : ''}`}
          onClick={() => setActiveTab('avatar')}
        >
          Avatar
        </button>
        <button 
          className={`tab ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          Inventory ({inventory.length})
        </button>
        <button 
          className={`tab ${activeTab === 'rewards' ? 'active' : ''}`}
          onClick={() => setActiveTab('rewards')}
        >
          Rewards
        </button>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <span className="stat-icon stat-str">STR</span>
          <span className="stat-label">Strength</span>
          <span className="stat-number">+{equipmentStats.strength || 0}</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon stat-end">END</span>
          <span className="stat-label">Endurance</span>
          <span className="stat-number">+{equipmentStats.endurance || 0}</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon stat-agi">AGI</span>
          <span className="stat-label">Agility</span>
          <span className="stat-number">+{equipmentStats.agility || 0}</span>
        </div>
        {xpBonus > 0 && (
          <div className="stat-card bonus">
            <span className="stat-icon stat-xp">XP</span>
            <span className="stat-label">XP Bonus</span>
            <span className="stat-number">+{(xpBonus * 100).toFixed(0)}%</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="editor-content">
        {activeTab === 'avatar' && (
          <div className="avatar-view">
            {/* Avatar Preview */}
            <div className="avatar-preview">
              <div className="avatar-model">
                <div className="avatar-silhouette">
                  {/* Head area */}
                  <div className="avatar-part head">
                    {equipment.head?.icon || equipment.hat?.icon || equipment.hair?.icon || 'HEAD'}
                  </div>
                  {equipment.face && <div className="avatar-part face">{equipment.face.icon}</div>}
                  
                  {/* Body area */}
                  <div className="avatar-part body">
                    {equipment.torso?.icon || equipment.shirt?.icon || equipment.jacket?.icon || 'BODY'}
                  </div>
                  {equipment.back && <div className="avatar-part back">{equipment.back.icon}</div>}
                  
                  {/* Arms */}
                  <div className="avatar-part left-arm">
                    {equipment.gloves?.icon || equipment.leftArm?.icon || ''}
                  </div>
                  <div className="avatar-part right-arm">
                    {equipment.gloves?.icon || equipment.rightArm?.icon || ''}
                  </div>
                  
                  {/* Legs */}
                  <div className="avatar-part legs">
                    {equipment.pants?.icon || equipment.legs?.icon || 'LEGS'}
                  </div>
                  <div className="avatar-part feet">
                    {equipment.shoes?.icon || 'FEET'}
                  </div>
                  
                  {/* Gear */}
                  {equipment.weapon && <div className="avatar-part weapon">{equipment.weapon.icon}</div>}
                  {equipment.offhand && <div className="avatar-part offhand">{equipment.offhand.icon}</div>}
                  {equipment.pet && <div className="avatar-part pet">{equipment.pet.icon}</div>}
                  
                  {/* Aura effect */}
                  {equipment.aura && (
                    <div className={`avatar-aura ${equipment.aura.variant?.toLowerCase()}`}>
                      {equipment.aura.icon}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Equipment Slots */}
            <div className="equipment-slots">
              {Object.entries(SLOT_GROUPS).map(([groupName, groupSlots]) => (
                <div key={groupName} className="slot-group">
                  <h3 className="group-title">{groupName.charAt(0).toUpperCase() + groupName.slice(1)}</h3>
                  <div className="slots-grid">
                    {groupSlots.map(slot => renderSlotButton(slot, groupName))}
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Slot Items */}
            {selectedSlot && (
              <div className="slot-items-panel">
                <h3>
                  {SLOT_ICONS[selectedSlot]} {slots.find(s => s.id === selectedSlot)?.name || selectedSlot} Items
                </h3>
                
                {equipment[selectedSlot] && (
                  <div className="current-equipped">
                    <h4>Currently Equipped</h4>
                    {renderItemCard(equipment[selectedSlot]!, () => setSelectedItem(equipment[selectedSlot]))}
                    <button className="unequip-btn" onClick={() => unequipItem(selectedSlot)}>
                      Unequip
                    </button>
                  </div>
                )}
                
                <div className="available-items">
                  <h4>Available Items</h4>
                  <div className="items-grid">
                    {inventory
                      .filter(item => item.slot === selectedSlot && !item.equipped)
                      .map(item => (
                        <div key={item.id} className="item-with-action">
                          {renderItemCard(item, () => setSelectedItem(item))}
                          <button className="equip-btn" onClick={() => equipItem(item.id)}>
                            Equip
                          </button>
                        </div>
                      ))}
                    {inventory.filter(item => item.slot === selectedSlot && !item.equipped).length === 0 && (
                      <p className="no-items">No items available for this slot</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="inventory-view">
            {/* Filters */}
            <div className="inventory-filters">
              <div className="filter-group">
                <label>Rarity</label>
                <select value={filterRarity} onChange={(e) => setFilterRarity(e.target.value)}>
                  <option value="all">All Rarities</option>
                  {rarities.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Sort By</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="rarity">Rarity</option>
                  <option value="name">Name</option>
                  <option value="recent">Recently Acquired</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Slot</label>
                <select value={selectedSlot || ''} onChange={(e) => setSelectedSlot(e.target.value || null)}>
                  <option value="">All Slots</option>
                  {slots.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Inventory Grid */}
            <div className="inventory-grid">
              {getFilteredInventory().map(item => (
                <div key={item.id} className="inventory-item-wrapper">
                  {renderItemCard(item, () => setSelectedItem(item))}
                </div>
              ))}
              {getFilteredInventory().length === 0 && (
                <p className="no-items">No items match your filters</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'rewards' && (
          <div className="rewards-view">
            <h2>Claim Rewards</h2>
            <p className="rewards-description">
              Test the item generation system by claiming different types of rewards!
            </p>
            
            <div className="reward-categories">
              <div className="reward-category">
                <h3>Quest Rewards</h3>
                <div className="reward-buttons">
                  <button onClick={() => claimReward('quest', { difficulty: 'easy' })} disabled={rewardLoading}>
                    Easy Quest
                  </button>
                  <button onClick={() => claimReward('quest', { difficulty: 'normal' })} disabled={rewardLoading}>
                    Normal Quest
                  </button>
                  <button onClick={() => claimReward('quest', { difficulty: 'hard' })} disabled={rewardLoading}>
                    Hard Quest
                  </button>
                  <button onClick={() => claimReward('quest', { difficulty: 'legendary' })} disabled={rewardLoading} className="legendary">
                    Legendary Quest
                  </button>
                </div>
              </div>

              <div className="reward-category">
                <h3>Raid Rewards</h3>
                <div className="reward-buttons">
                  <button onClick={() => claimReward('raid', { participationLevel: 'low', bossDefeated: true })} disabled={rewardLoading}>
                    Low Participation
                  </button>
                  <button onClick={() => claimReward('raid', { participationLevel: 'normal', bossDefeated: true })} disabled={rewardLoading}>
                    Normal Participation
                  </button>
                  <button onClick={() => claimReward('raid', { participationLevel: 'high', bossDefeated: true })} disabled={rewardLoading}>
                    High Participation
                  </button>
                  <button onClick={() => claimReward('raid', { participationLevel: 'mvp', bossDefeated: true })} disabled={rewardLoading} className="mythic">
                    MVP Reward
                  </button>
                </div>
              </div>

              <div className="reward-category">
                <h3>Event Rewards</h3>
                <div className="reward-buttons">
                  <button onClick={() => claimReward('event', { eventType: 'daily' })} disabled={rewardLoading}>
                    Daily Event
                  </button>
                  <button onClick={() => claimReward('event', { eventType: 'weekly' })} disabled={rewardLoading}>
                    Weekly Event
                  </button>
                  <button onClick={() => claimReward('event', { eventType: 'special' })} disabled={rewardLoading}>
                    Special Event
                  </button>
                  <button onClick={() => claimReward('event', { eventType: 'seasonal' })} disabled={rewardLoading} className="mythic">
                    Seasonal Event
                  </button>
                </div>
              </div>
            </div>

            {rewardLoading && (
              <div className="reward-loading">
                <div className="loading-spinner" />
                <p>Generating loot...</p>
              </div>
            )}
          </div>
        )}

        {/* Item Detail Panel */}
        {selectedItem && (
          <div className="item-detail-panel">
            <button className="close-btn" onClick={() => setSelectedItem(null)}>×</button>
            
            <div className="item-detail-header" style={{ borderColor: RARITY_COLORS[selectedItem.rarity] }}>
              <div className="item-detail-icon" style={{ backgroundColor: `${RARITY_COLORS[selectedItem.rarity]}30` }}>
                {selectedItem.icon}
                {selectedItem.visualEffects.length > 0 && (
                  <div className={`visual-effect large ${selectedItem.visualEffects[0]}`} />
                )}
              </div>
              <div className="item-detail-title">
                <h2 style={{ color: RARITY_COLORS[selectedItem.rarity] }}>{selectedItem.name}</h2>
                <p className="item-detail-rarity" style={{ color: RARITY_COLORS[selectedItem.rarity] }}>
                  {selectedItem.rarity.charAt(0).toUpperCase() + selectedItem.rarity.slice(1)} {selectedItem.category}
                </p>
                <p className="item-detail-slot">{SLOT_ICONS[selectedItem.slot]} {slots.find(s => s.id === selectedItem.slot)?.name}</p>
              </div>
            </div>

            <div className="item-detail-stats">
              <h3>Stats</h3>
              {selectedItem.stats.strength && renderStatBar('Strength', selectedItem.stats.strength, 50, '#EF4444')}
              {selectedItem.stats.endurance && renderStatBar('Endurance', selectedItem.stats.endurance, 50, '#22C55E')}
              {selectedItem.stats.agility && renderStatBar('Agility', selectedItem.stats.agility, 50, '#3B82F6')}
              {selectedItem.xpBonus > 0 && (
                <div className="xp-bonus">
                  <span>XP Bonus: +{(selectedItem.xpBonus * 100).toFixed(0)}%</span>
                </div>
              )}
            </div>

            {selectedItem.traits.length > 0 && (
              <div className="item-detail-traits">
                <h3>Traits</h3>
                <div className="traits-list">
                  {selectedItem.traits.map(trait => (
                    <div key={trait.key} className={`trait-item ${trait.visual || ''}`}>
                      <span className="trait-name">{trait.name}</span>
                      <span className="trait-desc">{trait.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="item-detail-info">
              {selectedItem.material && <p><strong>Material:</strong> {selectedItem.material}</p>}
              {selectedItem.color && <p><strong>Color:</strong> {selectedItem.color}</p>}
              {selectedItem.variant && <p><strong>Variant:</strong> {selectedItem.variant}</p>}
              <p><strong>Acquired:</strong> {new Date(selectedItem.acquiredAt).toLocaleDateString()}</p>
            </div>

            <div className="item-detail-actions">
              {!selectedItem.equipped ? (
                <>
                  <button className="action-btn equip" onClick={() => equipItem(selectedItem.id)}>
                    Equip Item
                  </button>
                  <button className="action-btn salvage" onClick={() => salvageItem(selectedItem.id)}>
                    Salvage
                  </button>
                </>
              ) : (
                <button className="action-btn unequip" onClick={() => unequipItem(selectedItem.slot)}>
                  Unequip Item
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AvatarEditor;

