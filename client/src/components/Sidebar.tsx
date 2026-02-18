import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

export const SIDEBAR_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'ai-coach', label: 'AI Coach', icon: 'smart_toy' },
  { id: 'duels', label: 'Duels Hub', icon: 'swords' },
  { id: 'raid', label: 'Raids', icon: 'skull' },
  { id: 'clubs', label: 'Territories', icon: 'map' },
  { id: 'party', label: 'Party', icon: 'groups' },
  { id: 'avatar', label: 'Avatar', icon: 'person' },
  { id: 'profile', label: 'Profile', icon: 'badge' },
  { id: 'achievements', label: 'Achievements', icon: 'emoji_events' },
  { id: 'social', label: 'Social', icon: 'group' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
] as const;

export type SidebarTabId = typeof SIDEBAR_TABS[number]['id'];

interface SidebarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onNavigate }) => {
  const { userProfile, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar-logo">
        <div className="app-sidebar-logo-icon">
          <span className="material-symbols-outlined">swords</span>
        </div>
        <h1 className="app-sidebar-logo-text">ForgeArena</h1>
      </div>
      <nav className="app-sidebar-nav">
        {SIDEBAR_TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            className={`app-sidebar-nav-link ${activeTab === id ? 'active' : ''}`}
            onClick={() => onNavigate(id)}
          >
            <span className="material-symbols-outlined">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="app-sidebar-user">
        <div className="app-sidebar-user-inner">
          <div className="app-sidebar-user-avatar">
            {userProfile?.avatarUrl ? (
              <img src={userProfile.avatarUrl} alt="" />
            ) : (
              <span>
                {userProfile?.username?.charAt(0).toUpperCase() ?? '?'}
              </span>
            )}
          </div>
          <div className="app-sidebar-user-details">
            <p className="app-sidebar-user-name">
              {userProfile?.username ?? 'Athlete'}
            </p>
            <p className="app-sidebar-user-meta">
              Level {userProfile?.level ?? 1}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="app-sidebar-logout"
          onClick={handleLogout}
          title="Log out"
        >
          Exit
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
