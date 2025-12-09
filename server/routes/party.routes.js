/**
 * Party Routes - API endpoints for party management
 */

const express = require('express');
const router = express.Router();
const partyService = require('../services/social/party.service');
const authMiddleware = require('../middleware/auth.middleware');
const logger = require('../utils/logger');

// ============================================================================
// PARTY MANAGEMENT ROUTES
// ============================================================================

/**
 * GET /api/parties/my-party - Get current user's party (requires auth)
 */
router.get('/my-party', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const party = await partyService.getUserParty(req.user.uid);
    
    if (!party) {
      return res.json({ party: null });
    }
    
    // Get fresh member data
    const members = await partyService.getPartyMembers(party.id);
    
    res.json({
      party: {
        ...party,
        members,
      },
    });
  } catch (error) {
    logger.error('Error fetching user party', { error: error.message, userId: req.user.uid });
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/parties - Create a new party (requires auth)
 */
router.post('/', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Party name must be at least 2 characters' });
    }
    
    const party = await partyService.createParty(req.user.uid, { name });
    
    logger.info('Party created via API', { partyId: party.id, userId: req.user.uid });
    res.status(201).json({ party });
  } catch (error) {
    logger.error('Error creating party', { error: error.message, userId: req.user.uid });
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/parties/join - Join a party via invite code (requires auth)
 */
router.post('/join', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    
    if (!inviteCode || inviteCode.trim().length === 0) {
      return res.status(400).json({ error: 'Invite code is required' });
    }
    
    const result = await partyService.joinParty(req.user.uid, inviteCode.trim().toUpperCase());
    
    logger.info('User joined party via API', { userId: req.user.uid, partyId: result.party?.id });
    res.json(result);
  } catch (error) {
    logger.error('Error joining party', { error: error.message, userId: req.user.uid });
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/parties/leave - Leave current party (requires auth)
 */
router.post('/leave', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const result = await partyService.leaveParty(req.user.uid);
    
    logger.info('User left party via API', { userId: req.user.uid });
    res.json(result);
  } catch (error) {
    logger.error('Error leaving party', { error: error.message, userId: req.user.uid });
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/parties/regenerate-code - Regenerate invite code (owner only)
 */
router.post('/regenerate-code', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const party = await partyService.getUserParty(req.user.uid);
    
    if (!party) {
      return res.status(400).json({ error: 'You are not in a party' });
    }
    
    const result = await partyService.regenerateInviteCode(req.user.uid, party.id);
    
    logger.info('Invite code regenerated via API', { partyId: party.id, userId: req.user.uid });
    res.json(result);
  } catch (error) {
    logger.error('Error regenerating invite code', { error: error.message, userId: req.user.uid });
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/parties/:partyId - Get party details (requires auth)
 */
router.get('/:partyId', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const party = await partyService.getPartyById(req.params.partyId);
    
    if (!party) {
      return res.status(404).json({ error: 'Party not found' });
    }
    
    // Only allow party members to see full details
    const isMember = party.members.some(m => m.userId === req.user.uid);
    
    if (!isMember) {
      // Return limited info for non-members
      return res.json({
        id: party.id,
        name: party.name,
        memberCount: party.memberCount,
        maxMembers: party.maxMembers,
        ownerUsername: party.ownerUsername,
      });
    }
    
    // Get fresh member data for members
    const members = await partyService.getPartyMembers(party.id);
    
    res.json({
      ...party,
      members,
    });
  } catch (error) {
    logger.error('Error fetching party', { error: error.message, partyId: req.params.partyId });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/parties/:partyId/members - Get party members (requires auth)
 */
router.get('/:partyId/members', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const party = await partyService.getPartyById(req.params.partyId);
    
    if (!party) {
      return res.status(404).json({ error: 'Party not found' });
    }
    
    // Only allow party members to see member list
    const isMember = party.members.some(m => m.userId === req.user.uid);
    
    if (!isMember) {
      return res.status(403).json({ error: 'You must be a party member to view the member list' });
    }
    
    const members = await partyService.getPartyMembers(req.params.partyId);
    res.json(members);
  } catch (error) {
    logger.error('Error fetching party members', { error: error.message, partyId: req.params.partyId });
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/parties/:partyId - Update party settings (owner only)
 */
router.put('/:partyId', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const party = await partyService.updateParty(req.user.uid, req.params.partyId, req.body);
    res.json({ party });
  } catch (error) {
    logger.error('Error updating party', { error: error.message, partyId: req.params.partyId });
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/parties/:partyId/kick/:memberId - Kick a member (owner only)
 */
router.post('/:partyId/kick/:memberId', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const result = await partyService.kickMember(
      req.user.uid,
      req.params.partyId,
      req.params.memberId
    );
    
    logger.info('Member kicked via API', { 
      partyId: req.params.partyId, 
      kickedBy: req.user.uid,
      kickedMember: req.params.memberId 
    });
    res.json(result);
  } catch (error) {
    logger.error('Error kicking member', { error: error.message });
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/parties/preview/:inviteCode - Preview party by invite code (public)
 */
router.get('/preview/:inviteCode', async (req, res) => {
  try {
    const party = await partyService.getPartyByInviteCode(req.params.inviteCode);
    
    if (!party) {
      return res.status(404).json({ error: 'Party not found or invite code is invalid' });
    }
    
    // Return limited info for preview
    res.json({
      id: party.id,
      name: party.name,
      memberCount: party.memberCount,
      maxMembers: party.maxMembers,
      ownerUsername: party.ownerUsername,
      isFull: party.memberCount >= party.maxMembers,
    });
  } catch (error) {
    logger.error('Error previewing party', { error: error.message, inviteCode: req.params.inviteCode });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


