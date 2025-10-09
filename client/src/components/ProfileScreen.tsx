import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { compressImage, validateImageFile } from '../utils/imageUtils';
import './Profile.css';

const ProfileScreen: React.FC = () => {
  const { userProfile, updateHandle, uploadAvatar, checkHandleAvailability } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [newHandle, setNewHandle] = useState(userProfile?.handle || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!userProfile) {
    return (
      <div className="profile-container">
        <div className="profile-loading">Loading profile...</div>
      </div>
    );
  }

  const handleEditToggle = () => {
    if (isEditing) {
      setNewHandle(userProfile.handle);
      setError('');
    }
    setIsEditing(!isEditing);
  };

  const handleSaveHandle = async () => {
    if (newHandle === userProfile.handle) {
      setIsEditing(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      await updateHandle(newHandle);
      setMessage('Handle updated successfully!');
      setIsEditing(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleHandleChange = async (value: string) => {
    setNewHandle(value);
    setError('');

    // Validate format
    if (value.length < 3) {
      setError('Handle must be at least 3 characters');
      return;
    }

    if (!/^[a-z0-9]*$/.test(value)) {
      setError('Handle can only contain lowercase letters and numbers');
      return;
    }

    if (value.length > 20) {
      setError('Handle must be 20 characters or less');
      return;
    }

    // Check availability (debounced)
    if (value !== userProfile.handle && value.length >= 3) {
      try {
        const available = await checkHandleAvailability(value);
        if (!available) {
          setError('Handle is already taken');
        }
      } catch (error) {
        console.error('Error checking handle availability:', error);
      }
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Compress image
      const compressedBlob = await compressImage(file, {
        maxWidth: 200,
        maxHeight: 200,
        quality: 0.8,
        format: 'jpeg'
      });

      // Create preview
      const previewUrl = URL.createObjectURL(compressedBlob);
      setAvatarPreview(previewUrl);

      // Convert blob to file for upload
      const compressedFile = new File([compressedBlob], file.name, {
        type: 'image/jpeg'
      });

      // Upload to Firebase
      await uploadAvatar(compressedFile);
      setMessage('Avatar updated successfully!');
      setTimeout(() => {
        setMessage('');
        setAvatarPreview(null);
      }, 3000);

    } catch (error: any) {
      setError(error.message);
      setAvatarPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarUrl = () => {
    if (avatarPreview) return avatarPreview;
    if (userProfile.avatarUrl) return userProfile.avatarUrl;
    return null;
  };

  const getInitials = () => {
    return userProfile.username.charAt(0).toUpperCase();
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>Your Profile</h2>
        <p>Manage your display handle and avatar</p>
      </div>

      {message && <div className="profile-success">{message}</div>}
      {error && <div className="profile-error">{error}</div>}

      <div className="profile-content">
        {/* Avatar Section */}
        <div className="avatar-section">
          <h3>Avatar</h3>
          <div className="avatar-container">
            <div 
              className="avatar-display"
              onClick={handleAvatarClick}
              title="Click to change avatar"
            >
              {getAvatarUrl() ? (
                <img 
                  src={getAvatarUrl()!} 
                  alt="Avatar" 
                  className="avatar-image"
                />
              ) : (
                <div className="avatar-placeholder">
                  {getInitials()}
                </div>
              )}
              <div className="avatar-overlay">
                <span>📷</span>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>
          <p className="avatar-help">
            Click to upload a new avatar. Max 5MB. Recommended: 200x200px
          </p>
        </div>

        {/* Handle Section */}
        <div className="handle-section">
          <h3>Display Handle</h3>
          <div className="handle-container">
            {isEditing ? (
              <div className="handle-edit">
                <div className="handle-input-group">
                  <span className="handle-prefix">@</span>
                  <input
                    type="text"
                    value={newHandle}
                    onChange={(e) => handleHandleChange(e.target.value.toLowerCase())}
                    className="handle-input"
                    placeholder="Enter handle"
                    maxLength={20}
                    disabled={loading}
                  />
                </div>
                <div className="handle-actions">
                  <button 
                    onClick={handleSaveHandle}
                    disabled={loading || !!error || newHandle === userProfile.handle}
                    className="btn-save"
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button 
                    onClick={handleEditToggle}
                    disabled={loading}
                    className="btn-cancel"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="handle-display">
                <span className="current-handle">@{userProfile.handle}</span>
                <button 
                  onClick={handleEditToggle}
                  className="btn-edit"
                  disabled={loading}
                >
                  Edit
                </button>
              </div>
            )}
          </div>
          <p className="handle-help">
            Your handle is how other players will find you. 
            Use 3-20 characters, letters and numbers only.
          </p>
        </div>

        {/* Profile Stats */}
        <div className="stats-section">
          <h3>Profile Stats</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Username</span>
              <span className="stat-value">{userProfile.username}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Level</span>
              <span className="stat-value">{userProfile.level}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">XP</span>
              <span className="stat-value">{userProfile.xp}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Workout Streak</span>
              <span className="stat-value">{userProfile.workoutStreak} days</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Gym</span>
              <span className="stat-value">{userProfile.gym || 'Not set'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Member Since</span>
              <span className="stat-value">
                {new Date(userProfile.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
