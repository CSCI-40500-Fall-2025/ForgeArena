import React from 'react';
import { getIconLabel, getIconUrl, getIconClass } from '../utils/iconMapping';

interface ItemIconProps {
  icon: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  rarity?: string;
}

/**
 * ItemIcon Component
 * 
 * Renders an icon for items, achievements, and UI elements.
 * Currently displays text labels, but designed to support
 * AI-generated images when available.
 * 
 * To add image support:
 * 1. Generate images for each icon identifier
 * 2. Place them in /public/assets/icons/ or a CDN
 * 3. Update getIconUrl() in iconMapping.ts
 */
const ItemIcon: React.FC<ItemIconProps> = ({ 
  icon, 
  size = 'md', 
  className = '',
  rarity = 'common'
}) => {
  const imageUrl = getIconUrl(icon);
  const label = getIconLabel(icon);
  const iconClass = getIconClass(icon);
  
  const sizeClasses = {
    sm: 'item-icon-sm',
    md: 'item-icon-md',
    lg: 'item-icon-lg',
    xl: 'item-icon-xl',
  };

  if (imageUrl) {
    return (
      <div className={`item-icon ${sizeClasses[size]} ${iconClass} ${className} rarity-${rarity}`}>
        <img 
          src={imageUrl} 
          alt={label} 
          className="item-icon-image"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className={`item-icon item-icon-text ${sizeClasses[size]} ${iconClass} ${className} rarity-${rarity}`}>
      <span className="item-icon-label">{label}</span>
    </div>
  );
};

export default ItemIcon;


