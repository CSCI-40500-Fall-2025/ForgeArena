import React from 'react';
import Sidebar from './Sidebar';
import AppHeader from './AppHeader';
import './Layout.css';

interface AppLayoutProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  headerTitle: string;
  headerSubtitle?: string;
  showXP?: boolean;
  level?: number;
  xpProgress?: number;
  xpToNextLevel?: number;
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab,
  onNavigate,
  headerTitle,
  headerSubtitle,
  showXP = true,
  level = 1,
  xpProgress = 0,
  xpToNextLevel = 100,
  children,
}) => {
  return (
    <>
      <Sidebar activeTab={activeTab} onNavigate={onNavigate} />
      <main className="app-main">
        <AppHeader
          title={headerTitle}
          subtitle={headerSubtitle}
          showXP={showXP}
          level={level}
          xpProgress={xpProgress}
          xpToNextLevel={xpToNextLevel}
        />
        <div className="app-main-content">{children}</div>
      </main>
    </>
  );
};

export default AppLayout;
