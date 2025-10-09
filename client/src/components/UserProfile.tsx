import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface UserProfileProps {
  className?: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ className = '' }) => {
  const { currentUser, userProfile, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!currentUser || !userProfile) {
    return null;
  }

  return (
    <div className={`user-profile ${className}`}>
      <div className="user-info">
        <div className="user-avatar">
          <span className="avatar-letter">
            {userProfile.username.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="user-details">
          <h3 className="username">{userProfile.username}</h3>
          <p className="user-level">Level {userProfile.level}</p>
        </div>
      </div>
      
      <button 
        className="logout-btn"
        onClick={handleLogout}
        title="Logout"
      >
        🚪
      </button>
    </div>
  );
};

export default UserProfile;
