import React from 'react';
import './Layout.css';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showXP?: boolean;
  level?: number;
  xpProgress?: number;
  xpToNextLevel?: number;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showXP = true,
  level = 1,
  xpProgress = 0,
  xpToNextLevel = 100,
}) => {
  return (
    <header className="app-main-header">
      <div className="app-main-header-inner">
        <div className="app-main-header-left">
          <h2 className="app-main-header-title">{title}</h2>
          {showXP ? (
            <div className="app-xp-row">
              <span className="app-xp-label">Level {level}</span>
              <div className="app-xp-bar-wrap">
                <div
                  className="app-xp-bar-fill"
                  style={{ width: `${Math.min(100, Math.max(0, xpProgress))}%` }}
                  title={`${xpProgress}% XP Progress`}
                />
              </div>
              <span className="app-xp-text">{xpToNextLevel} XP to next level</span>
            </div>
          ) : (
            subtitle && <p className="app-main-header-subtitle">{subtitle}</p>
          )}
        </div>
        <div className="app-main-header-actions">
          <button
            type="button"
            className="app-main-header-icon-btn"
            title="Notifications"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button type="button" className="app-main-header-cta">
            <span className="material-symbols-outlined">bolt</span>
            Level Up
          </button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
