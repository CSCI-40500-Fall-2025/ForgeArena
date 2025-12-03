import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Circle } from '@react-google-maps/api';
import { useAuth } from '../contexts/AuthContext';
import { apiGet, apiPost } from '../utils/api';
import './ClubsScreen.css';

// Types
interface Club {
  id: string;
  name: string;
  tag: string;
  description: string;
  color: string;
  emblem: string;
  founderName: string;
  memberCount: number;
  territoriesControlled: number;
  totalPower: number;
  wins: number;
  losses: number;
  isRecruiting: boolean;
  minLevelToJoin: number;
}

interface GymLocation {
  id: string;
  placeId: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  rating: number;
  controllingClubId: string | null;
  controllingClubName: string | null;
  controllingClubColor: string | null;
  controlStrength: number;
  defenders: Array<{ userId: string; username: string; level: number }>;
  distance?: number;
}

interface ClubMember {
  id: string;
  username: string;
  handle: string;
  level: number;
  role: 'founder' | 'officer' | 'member';
  weeklyXP: number;
}

type TabType = 'map' | 'clubs' | 'my-club' | 'leaderboard';

// Google Maps container style
const mapContainerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '16px',
};

// Miles to meters conversion
const milesToMeters = (miles: number) => miles * 1609.34;

const ClubsScreen: React.FC = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('map');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [nearbyGyms, setNearbyGyms] = useState<GymLocation[]>([]);
  const [myClub, setMyClub] = useState<Club | null>(null);
  const [clubMembers, setClubMembers] = useState<ClubMember[]>([]);
  const [leaderboard, setLeaderboard] = useState<Club[]>([]);
  const [selectedGym, setSelectedGym] = useState<GymLocation | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(10); // Default 10 miles
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  
  // Create club form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    tag: '',
    description: '',
    color: '#FF6B6B',
    minLevelToJoin: 1,
  });

  // Load Google Maps
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });

  // Map options
  const mapOptions = useMemo(() => ({
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }],
      },
    ],
  }), []);

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(loc);
          setMapCenter(loc);
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Default to NYC
          const defaultLoc = { lat: 40.7128, lng: -74.0060 };
          setUserLocation(defaultLoc);
          setMapCenter(defaultLoc);
        }
      );
    }
  }, []);

  // Fetch nearby gyms when location or radius changes
  const fetchNearbyGyms = useCallback(async () => {
    if (!userLocation) return;
    
    try {
      setLoading(true);
      const radiusMeters = milesToMeters(searchRadius);
      const gyms = await apiGet(
        `/api/clubs/gyms/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=${radiusMeters}`
      );
      setNearbyGyms(gyms);
    } catch (error) {
      console.error('Error fetching nearby gyms:', error);
    } finally {
      setLoading(false);
    }
  }, [userLocation, searchRadius]);

  useEffect(() => {
    if (userLocation) {
      fetchNearbyGyms();
    }
  }, [userLocation, searchRadius, fetchNearbyGyms]);

  // Fetch clubs list
  const fetchClubs = useCallback(async () => {
    try {
      const clubsList = await apiGet('/api/clubs?recruiting=true');
      setClubs(clubsList);
    } catch (error) {
      console.error('Error fetching clubs:', error);
    }
  }, []);

  // Fetch my club details
  const fetchMyClub = useCallback(async () => {
    if (!userProfile?.clubId) {
      setMyClub(null);
      return;
    }
    
    try {
      const [club, members] = await Promise.all([
        apiGet(`/api/clubs/${userProfile.clubId}`),
        apiGet(`/api/clubs/${userProfile.clubId}/members`),
      ]);
      setMyClub(club);
      setClubMembers(members);
    } catch (error) {
      console.error('Error fetching my club:', error);
    }
  }, [userProfile?.clubId]);

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async () => {
    try {
      const lb = await apiGet('/api/clubs/leaderboard');
      setLeaderboard(lb);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  }, []);

  useEffect(() => {
    fetchClubs();
    fetchMyClub();
    fetchLeaderboard();
  }, [fetchClubs, fetchMyClub, fetchLeaderboard]);

  // Show message helper
  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // Create club handler
  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await apiPost('/api/clubs', createForm);
      showMessage('Club created successfully!', 'success');
      setShowCreateForm(false);
      setCreateForm({ name: '', tag: '', description: '', color: '#FF6B6B', minLevelToJoin: 1 });
      fetchClubs();
      fetchMyClub();
    } catch (error: any) {
      showMessage(error.message || 'Failed to create club', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Join club handler
  const handleJoinClub = async (clubId: string) => {
    try {
      setLoading(true);
      await apiPost(`/api/clubs/${clubId}/join`);
      showMessage('Joined club successfully!', 'success');
      fetchClubs();
      fetchMyClub();
    } catch (error: any) {
      showMessage(error.message || 'Failed to join club', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Leave club handler
  const handleLeaveClub = async () => {
    if (!window.confirm('Are you sure you want to leave this club?')) return;
    
    try {
      setLoading(true);
      await apiPost('/api/clubs/leave');
      showMessage('Left club successfully', 'success');
      setMyClub(null);
      fetchClubs();
    } catch (error: any) {
      showMessage(error.message || 'Failed to leave club', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Claim gym handler
  const handleClaimGym = async (gymId: string) => {
    try {
      setLoading(true);
      const result = await apiPost(`/api/clubs/gyms/${gymId}/claim`);
      showMessage(result.message, 'success');
      fetchNearbyGyms();
      fetchMyClub();
      setSelectedGym(null);
    } catch (error: any) {
      showMessage(error.message || 'Failed to claim gym', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Challenge gym handler
  const handleChallengeGym = async (gymId: string) => {
    try {
      setLoading(true);
      const result = await apiPost(`/api/clubs/gyms/${gymId}/challenge`);
      showMessage(result.message, result.victory ? 'success' : 'error');
      fetchNearbyGyms();
      fetchMyClub();
      fetchLeaderboard();
      setSelectedGym(null);
    } catch (error: any) {
      showMessage(error.message || 'Failed to challenge gym', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Defend gym handler
  const handleDefendGym = async (gymId: string) => {
    try {
      setLoading(true);
      const result = await apiPost(`/api/clubs/gyms/${gymId}/defend`);
      showMessage(result.message, 'success');
      fetchNearbyGyms();
    } catch (error: any) {
      showMessage(error.message || 'Failed to add defender', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Get marker icon based on control status
  const getMarkerIcon = (gym: GymLocation) => {
    if (gym.controllingClubColor) {
      return {
        path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
        fillColor: gym.controllingClubColor,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 12,
      };
    }
    return {
      path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
      fillColor: '#9CA3AF',
      fillOpacity: 0.8,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 10,
    };
  };

  const renderMap = () => (
    <div className="clubs-map-section">
      <h2>Territory Map</h2>
      
      {/* Search Radius Slider */}
      <div className="search-controls">
        <div className="radius-slider">
          <label htmlFor="radius">Search Radius: <strong>{searchRadius} miles</strong></label>
          <input
            type="range"
            id="radius"
            min="1"
            max="100"
            value={searchRadius}
            onChange={(e) => setSearchRadius(parseInt(e.target.value))}
            className="slider"
          />
          <div className="slider-labels">
            <span>1 mi</span>
            <span>25 mi</span>
            <span>50 mi</span>
            <span>75 mi</span>
            <span>100 mi</span>
          </div>
        </div>
        <p className="map-subtitle">
          {nearbyGyms.length} gym{nearbyGyms.length !== 1 ? 's' : ''} found within {searchRadius} miles
          {loading && ' (Loading...)'}
        </p>
      </div>
      
      {!userLocation ? (
        <div className="location-prompt">
          <div className="location-icon">Location</div>
          <p>Enable location access to see nearby gyms</p>
        </div>
      ) : loadError ? (
        <div className="map-error">
          <p>Error loading Google Maps. Please check your API key.</p>
        </div>
      ) : !isLoaded ? (
        <div className="map-loading">
          <p>Loading map...</p>
        </div>
      ) : (
        <div className="map-container">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter || userLocation}
            zoom={searchRadius > 50 ? 8 : searchRadius > 20 ? 10 : 12}
            options={mapOptions}
            onClick={() => setSelectedGym(null)}
          >
            {/* User location marker */}
            <Marker
              position={userLocation}
              icon={{
                path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
                fillColor: '#3B82F6',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 3,
                scale: 8,
              }}
              title="Your Location"
            />

            {/* Search radius circle */}
            <Circle
              center={userLocation}
              radius={milesToMeters(searchRadius)}
              options={{
                fillColor: '#3B82F6',
                fillOpacity: 0.08,
                strokeColor: '#3B82F6',
                strokeOpacity: 0.3,
                strokeWeight: 2,
              }}
            />

            {/* Gym markers */}
            {nearbyGyms.map((gym) => (
              <Marker
                key={gym.id}
                position={gym.location}
                icon={getMarkerIcon(gym)}
                onClick={() => setSelectedGym(gym)}
                title={gym.name}
              />
            ))}

            {/* Info window for selected gym */}
            {selectedGym && (
              <InfoWindow
                position={selectedGym.location}
                onCloseClick={() => setSelectedGym(null)}
              >
                <div className="info-window">
                  <h3>{selectedGym.name}</h3>
                  <p className="info-address">{selectedGym.address}</p>
                  
                  {selectedGym.controllingClubId ? (
                    <div 
                      className="info-control"
                      style={{ backgroundColor: selectedGym.controllingClubColor || '#666' }}
                    >
                      Controlled by {selectedGym.controllingClubName}
                    </div>
                  ) : (
                    <div className="info-unclaimed">Unclaimed Territory</div>
                  )}
                  
                  <div className="info-stats">
                    <span>Rating: {selectedGym.rating?.toFixed(1) || 'N/A'}</span>
                    {selectedGym.controlStrength > 0 && (
                      <span>Defense: {selectedGym.controlStrength}</span>
                    )}
                    {selectedGym.distance && (
                      <span>Distance: {selectedGym.distance.toFixed(1)} mi</span>
                    )}
                  </div>

                  {selectedGym.defenders && selectedGym.defenders.length > 0 && (
                    <div className="info-defenders">
                      <strong>Defenders:</strong>
                      {selectedGym.defenders.slice(0, 3).map((d, i) => (
                        <span key={i}>{d.username} (Lv.{d.level})</span>
                      ))}
                      {selectedGym.defenders.length > 3 && (
                        <span>+{selectedGym.defenders.length - 3} more</span>
                      )}
                    </div>
                  )}

                  <div className="info-actions">
                    {!userProfile?.clubId ? (
                      <p className="info-warning">Join a club to interact</p>
                    ) : selectedGym.controllingClubId === userProfile.clubId ? (
                      <button
                        className="info-btn defend"
                        onClick={() => handleDefendGym(selectedGym.id)}
                        disabled={loading}
                      >
                        Add Defender
                      </button>
                    ) : selectedGym.controllingClubId ? (
                      <button
                        className="info-btn challenge"
                        onClick={() => handleChallengeGym(selectedGym.id)}
                        disabled={loading}
                      >
                        Challenge
                      </button>
                    ) : (
                      <button
                        className="info-btn claim"
                        onClick={() => handleClaimGym(selectedGym.id)}
                        disabled={loading}
                      >
                        Claim Territory
                      </button>
                    )}
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </div>
      )}

      {/* Gym list below map */}
      <div className="gym-list">
        <h3>Nearby Gyms</h3>
        <div className="gym-grid">
          {nearbyGyms.map((gym) => (
            <div
              key={gym.id}
              className={`gym-card ${selectedGym?.id === gym.id ? 'selected' : ''} ${
                gym.controllingClubId ? 'controlled' : 'unclaimed'
              }`}
              style={{
                borderColor: gym.controllingClubColor || 'var(--color-neutral-300)',
              }}
              onClick={() => {
                setSelectedGym(gym);
                setMapCenter(gym.location);
              }}
            >
              <div className="gym-header">
                <h4>{gym.name}</h4>
                {gym.controllingClubId && (
                  <span
                    className="control-badge"
                    style={{ backgroundColor: gym.controllingClubColor || '#666' }}
                  >
                    {gym.controllingClubName}
                  </span>
                )}
              </div>
              
              <p className="gym-address">{gym.address}</p>
              
              <div className="gym-stats">
                <span>Rating: {gym.rating?.toFixed(1) || 'N/A'}</span>
                <span>{gym.distance?.toFixed(1) || '?'} mi</span>
                {gym.controlStrength > 0 && (
                  <span>Def: {gym.controlStrength}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderClubsList = () => (
    <div className="clubs-list-section">
      <div className="section-header">
        <h2>Available Clubs</h2>
        {!userProfile?.clubId && (
          <button
            className="create-club-btn"
            onClick={() => setShowCreateForm(true)}
          >
            + Create Club
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="create-club-form">
          <h3>Create Your Club</h3>
          <form onSubmit={handleCreateClub}>
            <div className="form-group">
              <label>Club Name</label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="Enter club name"
                required
                minLength={3}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Tag (5 chars max)</label>
                <input
                  type="text"
                  value={createForm.tag}
                  onChange={(e) => setCreateForm({ ...createForm, tag: e.target.value.toUpperCase().slice(0, 5) })}
                  placeholder="TAG"
                  maxLength={5}
                />
              </div>
              
              <div className="form-group">
                <label>Club Color</label>
                <input
                  type="color"
                  value={createForm.color}
                  onChange={(e) => setCreateForm({ ...createForm, color: e.target.value })}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Describe your club..."
                rows={3}
              />
            </div>
            
            <div className="form-group">
              <label>Minimum Level to Join</label>
              <input
                type="number"
                value={createForm.minLevelToJoin}
                onChange={(e) => setCreateForm({ ...createForm, minLevelToJoin: parseInt(e.target.value) || 1 })}
                min={1}
                max={100}
              />
            </div>
            
            <div className="form-actions">
              <button type="button" onClick={() => setShowCreateForm(false)}>
                Cancel
              </button>
              <button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Club'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="clubs-grid">
        {clubs.map((club) => (
          <div
            key={club.id}
            className="club-card"
            style={{ borderColor: club.color }}
          >
            <div className="club-banner" style={{ backgroundColor: club.color }}>
              <span className="club-tag">[{club.tag}]</span>
              <h3>{club.name}</h3>
            </div>
            
            <div className="club-details">
              <p className="club-description">{club.description || 'No description'}</p>
              
              <div className="club-stats">
                <div className="stat">
                  <span className="stat-value">{club.memberCount}</span>
                  <span className="stat-label">Members</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{club.territoriesControlled}</span>
                  <span className="stat-label">Territories</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{club.wins}/{club.losses}</span>
                  <span className="stat-label">W/L</span>
                </div>
              </div>
              
              <p className="club-founder">Founded by {club.founderName}</p>
              {club.minLevelToJoin > 1 && (
                <p className="level-req">Requires Level {club.minLevelToJoin}+</p>
              )}
            </div>
            
            {!userProfile?.clubId && (
              <button
                className="join-btn"
                onClick={() => handleJoinClub(club.id)}
                disabled={loading || (userProfile?.level || 1) < club.minLevelToJoin}
              >
                Join Club
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderMyClub = () => (
    <div className="my-club-section">
      {!myClub ? (
        <div className="no-club">
          <div className="no-club-icon">Club</div>
          <h2>You're not in a club yet</h2>
          <p>Join an existing club or create your own to start competing for territory!</p>
          <button onClick={() => setActiveTab('clubs')}>Browse Clubs</button>
        </div>
      ) : (
        <>
          <div className="my-club-header" style={{ backgroundColor: myClub.color }}>
            <div className="club-emblem">Shield</div>
            <div className="club-info">
              <span className="club-tag">[{myClub.tag}]</span>
              <h2>{myClub.name}</h2>
              <p>{myClub.description}</p>
            </div>
          </div>

          <div className="club-stats-grid">
            <div className="stat-card">
              <span className="stat-icon">Members</span>
              <span className="stat-value">{myClub.memberCount}</span>
              <span className="stat-label">Members</span>
            </div>
            <div className="stat-card">
              <span className="stat-icon">Territory</span>
              <span className="stat-value">{myClub.territoriesControlled}</span>
              <span className="stat-label">Territories</span>
            </div>
            <div className="stat-card">
              <span className="stat-icon">Wins</span>
              <span className="stat-value">{myClub.wins}</span>
              <span className="stat-label">Victories</span>
            </div>
            <div className="stat-card">
              <span className="stat-icon">Power</span>
              <span className="stat-value">{myClub.totalPower}</span>
              <span className="stat-label">Total Power</span>
            </div>
          </div>

          <div className="members-section">
            <h3>Members</h3>
            <div className="members-list">
              {clubMembers.map((member) => (
                <div key={member.id} className={`member-card ${member.role}`}>
                  <div className="member-info">
                    <span className="member-name">{member.username}</span>
                    <span className="member-handle">@{member.handle}</span>
                  </div>
                  <div className="member-stats">
                    <span className="member-level">Lv.{member.level}</span>
                    <span className={`member-role ${member.role}`}>
                      {member.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button className="leave-btn" onClick={handleLeaveClub} disabled={loading}>
            Leave Club
          </button>
        </>
      )}
    </div>
  );

  const renderLeaderboard = () => (
    <div className="leaderboard-section">
      <h2>Club Leaderboard</h2>
      <p className="leaderboard-subtitle">Top clubs by territories controlled</p>
      
      <div className="leaderboard-list">
        {leaderboard.map((club, index) => (
          <div
            key={club.id}
            className={`leaderboard-entry ${index < 3 ? `top-${index + 1}` : ''}`}
            style={{ borderLeftColor: club.color }}
          >
            <span className="rank">
              #{index + 1}
            </span>
            <div className="club-info">
              <span className="club-name" style={{ color: club.color }}>
                [{club.tag}] {club.name}
              </span>
              <span className="club-stats">
                {club.memberCount} members | {club.totalPower} power
              </span>
            </div>
            <div className="territories">
              <span className="territory-count">{club.territoriesControlled}</span>
              <span className="territory-label">territories</span>
            </div>
            <div className="win-loss">
              <span className="wins">{club.wins}W</span>
              <span className="losses">{club.losses}L</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="clubs-screen">
      {message && (
        <div className={`message-toast ${message.type}`}>
          {message.text}
        </div>
      )}

      <nav className="clubs-nav">
        <button
          className={activeTab === 'map' ? 'active' : ''}
          onClick={() => setActiveTab('map')}
        >
          Map
        </button>
        <button
          className={activeTab === 'clubs' ? 'active' : ''}
          onClick={() => setActiveTab('clubs')}
        >
          Clubs
        </button>
        <button
          className={activeTab === 'my-club' ? 'active' : ''}
          onClick={() => setActiveTab('my-club')}
        >
          My Club
        </button>
        <button
          className={activeTab === 'leaderboard' ? 'active' : ''}
          onClick={() => setActiveTab('leaderboard')}
        >
          Rankings
        </button>
      </nav>

      <div className="clubs-content">
        {activeTab === 'map' && renderMap()}
        {activeTab === 'clubs' && renderClubsList()}
        {activeTab === 'my-club' && renderMyClub()}
        {activeTab === 'leaderboard' && renderLeaderboard()}
      </div>
    </div>
  );
};

export default ClubsScreen;
