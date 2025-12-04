import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiGet, apiPost } from '../utils/api';
import './PartyScreen.css';

// Types
interface PartyMember {
  userId: string;
  username: string;
  handle: string;
  avatarUrl: string | null;
  level: number;
  role: 'owner' | 'member';
  joinedAt: string;
  xp?: number;
  workoutStreak?: number;
  isOnline?: boolean;
}

interface Party {
  id: string;
  name: string;
  inviteCode: string;
  ownerId: string;
  ownerUsername: string;
  members: PartyMember[];
  memberCount: number;
  maxMembers: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ActiveRaid {
  id: string;
  bossName: string;
  bossColor: string;
  hpRemaining: number;
  hpTotal: number;
}

interface PartyPreview {
  id: string;
  name: string;
  memberCount: number;
  maxMembers: number;
  ownerUsername: string;
  isFull: boolean;
}

const PartyScreen: React.FC = () => {
  const { userProfile } = useAuth();
  const [party, setParty] = useState<Party | null>(null);
  const [activeRaid, setActiveRaid] = useState<ActiveRaid | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  // Create party form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [partyName, setPartyName] = useState('');
  
  // Join party form
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [partyPreview, setPartyPreview] = useState<PartyPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // Tracking for animations
  const [animatingMembers, setAnimatingMembers] = useState<Set<string>>(new Set());
  const prevMembersRef = useRef<PartyMember[]>([]);
  
  // Polling interval for real-time updates
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const POLL_INTERVAL = 3000; // 3 seconds

  // Show message helper
  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // Fetch party data
  const fetchParty = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await apiGet('/api/parties/my-party');
      
      if (response.party) {
        // Check for new members to animate
        const prevMemberIds = new Set(prevMembersRef.current.map(m => m.userId));
        const newMembers = response.party.members.filter(
          (m: PartyMember) => !prevMemberIds.has(m.userId)
        );
        
        if (newMembers.length > 0 && prevMembersRef.current.length > 0) {
          // Animate new members
          const newAnimating = new Set(animatingMembers);
          newMembers.forEach((m: PartyMember) => newAnimating.add(m.userId));
          setAnimatingMembers(newAnimating);
          
          // Remove animation class after animation completes
          setTimeout(() => {
            setAnimatingMembers(prev => {
              const next = new Set(prev);
              newMembers.forEach((m: PartyMember) => next.delete(m.userId));
              return next;
            });
          }, 600);
        }
        
        prevMembersRef.current = response.party.members;
        setParty(response.party);
        
        // Also fetch active raid status
        try {
          const raidResponse = await apiGet('/api/raids/active');
          if (raidResponse.raid) {
            setActiveRaid({
              id: raidResponse.raid.id,
              bossName: raidResponse.raid.bossName,
              bossColor: raidResponse.raid.bossColor,
              hpRemaining: raidResponse.raid.hpRemaining,
              hpTotal: raidResponse.raid.hpTotal,
            });
          } else {
            setActiveRaid(null);
          }
        } catch (e) {
          // Ignore raid fetch errors
        }
      } else {
        setParty(null);
        setActiveRaid(null);
        prevMembersRef.current = [];
      }
    } catch (error) {
      console.error('Error fetching party:', error);
      if (!silent) showMessage('Failed to fetch party data', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [animatingMembers]);

  // Initial fetch
  useEffect(() => {
    fetchParty();
  }, []);

  // Setup polling for real-time updates when in a party
  useEffect(() => {
    if (party && party.isActive) {
      // Start polling
      pollingIntervalRef.current = setInterval(() => {
        fetchParty(true); // Silent fetch
      }, POLL_INTERVAL);
    }
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [party?.id, fetchParty]);

  // Create party handler
  const handleCreateParty = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!partyName.trim()) {
      showMessage('Please enter a party name', 'error');
      return;
    }
    
    try {
      setActionLoading(true);
      const response = await apiPost('/api/parties', { name: partyName.trim() });
      showMessage(`Party "${response.party.name}" created!`, 'success');
      setParty(response.party);
      prevMembersRef.current = response.party.members;
      setShowCreateForm(false);
      setPartyName('');
    } catch (error: any) {
      showMessage(error.message || 'Failed to create party', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Preview party by invite code
  const handlePreviewParty = async () => {
    if (!inviteCode.trim()) {
      setPartyPreview(null);
      return;
    }
    
    try {
      setPreviewLoading(true);
      const response = await apiGet(`/api/parties/preview/${inviteCode.trim().toUpperCase()}`);
      setPartyPreview(response);
    } catch (error: any) {
      setPartyPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Debounced preview
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inviteCode.length >= 4) {
        handlePreviewParty();
      } else {
        setPartyPreview(null);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [inviteCode]);

  // Join party handler
  const handleJoinParty = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteCode.trim()) {
      showMessage('Please enter an invite code', 'error');
      return;
    }
    
    try {
      setActionLoading(true);
      const response = await apiPost('/api/parties/join', { inviteCode: inviteCode.trim() });
      showMessage(response.message, 'success');
      setParty(response.party);
      prevMembersRef.current = response.party.members;
      setShowJoinForm(false);
      setInviteCode('');
      setPartyPreview(null);
    } catch (error: any) {
      showMessage(error.message || 'Failed to join party', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Leave party handler
  const handleLeaveParty = async () => {
    if (!window.confirm('Are you sure you want to leave this party?')) return;
    
    try {
      setActionLoading(true);
      const response = await apiPost('/api/parties/leave');
      showMessage(response.message, 'success');
      setParty(null);
      prevMembersRef.current = [];
    } catch (error: any) {
      showMessage(error.message || 'Failed to leave party', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Regenerate invite code handler
  const handleRegenerateCode = async () => {
    if (!window.confirm('Are you sure? The old invite code will stop working.')) return;
    
    try {
      setActionLoading(true);
      const response = await apiPost('/api/parties/regenerate-code');
      showMessage('New invite code generated!', 'success');
      if (party) {
        setParty({ ...party, inviteCode: response.inviteCode });
      }
    } catch (error: any) {
      showMessage(error.message || 'Failed to regenerate code', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Kick member handler
  const handleKickMember = async (memberId: string, memberName: string) => {
    if (!window.confirm(`Remove ${memberName} from the party?`)) return;
    
    try {
      setActionLoading(true);
      await apiPost(`/api/parties/${party?.id}/kick/${memberId}`);
      showMessage(`${memberName} has been removed`, 'success');
      fetchParty();
    } catch (error: any) {
      showMessage(error.message || 'Failed to remove member', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Copy invite code to clipboard
  const copyInviteCode = () => {
    if (party?.inviteCode) {
      navigator.clipboard.writeText(party.inviteCode);
      showMessage('Invite code copied!', 'success');
    }
  };

  // Get member avatar or initial
  const getMemberAvatar = (member: PartyMember) => {
    if (member.avatarUrl) {
      return <img src={member.avatarUrl} alt={member.username} className="member-avatar-img" />;
    }
    return <span className="member-avatar-initial">{member.username.charAt(0).toUpperCase()}</span>;
  };

  // Render no party view
  const renderNoParty = () => (
    <div className="party-screen no-party">
      <div className="party-hero">
        <div className="party-hero-icon">PARTY</div>
        <h2>Workout Together</h2>
        <p>Create or join a party to work out with friends and track progress together!</p>
      </div>

      <div className="party-actions-grid">
        <div className="party-action-card create">
          <div className="action-icon">+</div>
          <h3>Create Party</h3>
          <p>Start your own workout party and invite friends</p>
          <button onClick={() => setShowCreateForm(true)} disabled={actionLoading}>
            Create Party
          </button>
        </div>

        <div className="party-action-card join">
          <div className="action-icon">#</div>
          <h3>Join Party</h3>
          <p>Have an invite code? Join an existing party</p>
          <button onClick={() => setShowJoinForm(true)} disabled={actionLoading}>
            Join Party
          </button>
        </div>
      </div>

      {/* Create Party Modal */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowCreateForm(false)}>×</button>
            <h3>Create New Party</h3>
            <form onSubmit={handleCreateParty}>
              <div className="form-group">
                <label>Party Name</label>
                <input
                  type="text"
                  value={partyName}
                  onChange={e => setPartyName(e.target.value)}
                  placeholder="Enter party name..."
                  maxLength={30}
                  autoFocus
                />
                <span className="char-count">{partyName.length}/30</span>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateForm(false)}>Cancel</button>
                <button type="submit" className="primary" disabled={actionLoading || !partyName.trim()}>
                  {actionLoading ? 'Creating...' : 'Create Party'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Party Modal */}
      {showJoinForm && (
        <div className="modal-overlay" onClick={() => setShowJoinForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowJoinForm(false)}>×</button>
            <h3>Join Party</h3>
            <form onSubmit={handleJoinParty}>
              <div className="form-group">
                <label>Invite Code</label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-digit code..."
                  maxLength={6}
                  className="invite-code-input"
                  autoFocus
                />
              </div>
              
              {previewLoading && (
                <div className="party-preview loading">
                  <span>Loading...</span>
                </div>
              )}
              
              {partyPreview && (
                <div className={`party-preview ${partyPreview.isFull ? 'full' : 'available'}`}>
                  <div className="preview-header">
                    <span className="preview-name">{partyPreview.name}</span>
                    <span className="preview-owner">by {partyPreview.ownerUsername}</span>
                  </div>
                  <div className="preview-stats">
                    <span className="preview-members">
                      {partyPreview.memberCount}/{partyPreview.maxMembers} members
                    </span>
                    {partyPreview.isFull && <span className="full-badge">Full</span>}
                  </div>
                </div>
              )}
              
              <div className="modal-actions">
                <button type="button" onClick={() => setShowJoinForm(false)}>Cancel</button>
                <button 
                  type="submit" 
                  className="primary" 
                  disabled={actionLoading || !inviteCode.trim() || partyPreview?.isFull}
                >
                  {actionLoading ? 'Joining...' : 'Join Party'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // Render party view
  const renderParty = () => {
    if (!party) return null;
    
    const isOwner = party.ownerId === userProfile?.uid;
    
    return (
      <div className="party-screen has-party">
        {/* Party Header */}
        <div className="party-header">
          <div className="party-info">
            <h2>{party.name}</h2>
            <div className="party-meta">
              <span className="member-count">
                {party.memberCount}/{party.maxMembers} members
              </span>
              {isOwner && <span className="owner-badge">Owner</span>}
            </div>
          </div>
          
          {/* Invite Code Section */}
          <div className="invite-section">
            <label>Invite Code</label>
            <div className="invite-code-display">
              <code>{party.inviteCode}</code>
              <button 
                className="copy-btn" 
                onClick={copyInviteCode}
                title="Copy code"
              >
                Copy
              </button>
              {isOwner && (
                <button 
                  className="regenerate-btn" 
                  onClick={handleRegenerateCode}
                  disabled={actionLoading}
                  title="Generate new code"
                >
                  New
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Active Raid Banner */}
        {activeRaid && (
          <div 
            className="active-raid-banner"
            style={{ '--raid-color': activeRaid.bossColor } as React.CSSProperties}
          >
            <div className="raid-banner-content">
              <span className="raid-banner-icon">RAID</span>
              <div className="raid-banner-info">
                <span className="raid-banner-title">Active Raid: {activeRaid.bossName}</span>
                <div className="raid-banner-hp">
                  <div className="mini-hp-bar">
                    <div 
                      className="mini-hp-fill"
                      style={{ width: `${(activeRaid.hpRemaining / activeRaid.hpTotal) * 100}%` }}
                    />
                  </div>
                  <span className="hp-text-mini">
                    {Math.round(activeRaid.hpRemaining)} / {activeRaid.hpTotal} HP
                  </span>
                </div>
              </div>
              <span className="raid-banner-cta">Go to Raid tab →</span>
            </div>
          </div>
        )}

        {/* Members List */}
        <div className="members-section">
          <div className="members-header">
            <h3>Party Members</h3>
            <span className="live-indicator">
              <span className="live-dot"></span>
              Live
            </span>
          </div>
          
          <div className="members-list">
            {party.members.map((member, index) => (
              <div 
                key={member.userId}
                className={`member-card ${member.role} ${animatingMembers.has(member.userId) ? 'animate-in' : ''}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="member-avatar">
                  {getMemberAvatar(member)}
                  {member.isOnline && <span className="online-indicator"></span>}
                </div>
                
                <div className="member-info">
                  <div className="member-name-row">
                    <span className="member-name">{member.username}</span>
                    {member.role === 'owner' && <span className="role-badge owner">Owner</span>}
                  </div>
                  <span className="member-handle">@{member.handle}</span>
                </div>
                
                <div className="member-stats">
                  <span className="member-level">Lv. {member.level}</span>
                  {member.workoutStreak !== undefined && member.workoutStreak > 0 && (
                    <span className="member-streak">{member.workoutStreak} day streak</span>
                  )}
                </div>
                
                {isOwner && member.userId !== userProfile?.uid && (
                  <button 
                    className="kick-btn"
                    onClick={() => handleKickMember(member.userId, member.username)}
                    disabled={actionLoading}
                    title="Remove from party"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Leave Party Button */}
        <button 
          className="leave-party-btn"
          onClick={handleLeaveParty}
          disabled={actionLoading}
        >
          {actionLoading ? 'Leaving...' : 'Leave Party'}
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="party-screen loading">
        <div className="loading-spinner"></div>
        <p>Loading party...</p>
      </div>
    );
  }

  return (
    <div className="party-container">
      {message && (
        <div className={`message-toast ${message.type}`}>
          {message.text}
        </div>
      )}
      
      {party ? renderParty() : renderNoParty()}
    </div>
  );
};

export default PartyScreen;

