/**
 * Club Routes - API endpoints for club management and territory control
 */

const express = require('express');
const router = express.Router();
const clubService = require('../services/club.service');
const gymLocationService = require('../services/gymLocation.service');
const googlePlacesService = require('../services/googlePlaces.service');
const authMiddleware = require('../middleware/auth.middleware');
const logger = require('../utils/logger');

// ============================================================================
// STATIC ROUTES FIRST (before :clubId parameter routes)
// ============================================================================

/**
 * GET /api/clubs - Get all clubs (with optional filters)
 */
router.get('/', async (req, res) => {
  try {
    const { recruiting, minLevel, limit } = req.query;
    
    const clubs = await clubService.getClubs({
      isRecruiting: recruiting === 'true',
      minLevel: minLevel ? parseInt(minLevel) : undefined,
      limit: limit ? parseInt(limit) : 50,
    });
    
    res.json(clubs);
  } catch (error) {
    logger.error('Error fetching clubs', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/clubs/leaderboard - Get club leaderboard
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const leaderboard = await clubService.getClubLeaderboard(limit);
    res.json(leaderboard);
  } catch (error) {
    logger.error('Error fetching club leaderboard', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/clubs/leave - Leave current club (requires auth)
 * NOTE: Must be before /:clubId routes
 */
router.post('/leave', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const result = await clubService.leaveClub(req.user.uid);
    res.json(result);
  } catch (error) {
    logger.error('Error leaving club', { error: error.message });
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// GYM/TERRITORY ROUTES (before :clubId to prevent "gyms" matching as clubId)
// ============================================================================

/**
 * GET /api/clubs/gyms/nearby - Search for nearby gyms
 * @query lat - Latitude
 * @query lng - Longitude
 * @query radius - Radius in meters (default 16000, max ~161000 for 100 miles)
 */
router.get('/gyms/nearby', async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    // Default to ~10 miles (16km), max 100 miles (~161km)
    const radiusMeters = Math.min(parseInt(radius) || 16000, 161000);
    
    // Fetch from Google Places
    const placesResults = await googlePlacesService.searchNearbyGyms(
      latitude, 
      longitude, 
      radiusMeters
    );
    
    // Helper to calculate distance in miles
    const calculateDistanceMiles = (lat1, lng1, lat2, lng2) => {
      const R = 3959; // Earth's radius in miles
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };
    
    // Upsert to our database and get territory info with distance
    const gymsWithTerritory = await Promise.all(
      placesResults.map(async (place) => {
        const gym = await gymLocationService.upsertGymLocation(place);
        // Add distance in miles
        const distance = calculateDistanceMiles(
          latitude, 
          longitude, 
          place.geometry.location.lat, 
          place.geometry.location.lng
        );
        return { ...gym, distance };
      })
    );
    
    // Sort by distance
    gymsWithTerritory.sort((a, b) => a.distance - b.distance);
    
    res.json(gymsWithTerritory);
  } catch (error) {
    logger.error('Error fetching nearby gyms', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/clubs/gyms/:gymId - Get gym details
 */
router.get('/gyms/:gymId', async (req, res) => {
  try {
    const gym = await gymLocationService.getGymById(req.params.gymId);
    
    if (!gym) {
      return res.status(404).json({ error: 'Gym not found' });
    }
    
    res.json(gym);
  } catch (error) {
    logger.error('Error fetching gym', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/clubs/gyms/:gymId/claim - Claim an unclaimed gym (requires auth)
 */
router.post('/gyms/:gymId/claim', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    if (!user.clubId) {
      return res.status(400).json({ error: 'You must be in a club to claim territory' });
    }
    
    const result = await gymLocationService.claimGym(
      req.params.gymId,
      user.clubId,
      user.uid
    );
    
    logger.info('Gym claimed via API', { gymId: req.params.gymId, userId: user.uid });
    res.json(result);
  } catch (error) {
    logger.error('Error claiming gym', { error: error.message });
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/clubs/gyms/:gymId/challenge - Challenge a controlled gym (requires auth)
 */
router.post('/gyms/:gymId/challenge', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    if (!user.clubId) {
      return res.status(400).json({ error: 'You must be in a club to challenge territory' });
    }
    
    const result = await gymLocationService.challengeGym(
      req.params.gymId,
      user.clubId,
      user.uid
    );
    
    logger.info('Gym challenged via API', { 
      gymId: req.params.gymId, 
      userId: user.uid,
      victory: result.victory 
    });
    
    res.json(result);
  } catch (error) {
    logger.error('Error challenging gym', { error: error.message });
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/clubs/gyms/:gymId/defend - Add yourself as a defender (requires auth)
 */
router.post('/gyms/:gymId/defend', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    if (!user.clubId) {
      return res.status(400).json({ error: 'You must be in a club to defend territory' });
    }
    
    const result = await gymLocationService.addDefender(
      req.params.gymId,
      user.clubId,
      user.uid
    );
    
    res.json(result);
  } catch (error) {
    logger.error('Error adding defender', { error: error.message });
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// CLUB MANAGEMENT ROUTES WITH :clubId PARAMETER (must be after static routes)
// ============================================================================

/**
 * GET /api/clubs/:clubId - Get club details
 */
router.get('/:clubId', async (req, res) => {
  try {
    const club = await clubService.getClubById(req.params.clubId);
    
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }
    
    res.json(club);
  } catch (error) {
    logger.error('Error fetching club', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/clubs/:clubId/members - Get club members
 */
router.get('/:clubId/members', async (req, res) => {
  try {
    const members = await clubService.getClubMembers(req.params.clubId);
    res.json(members);
  } catch (error) {
    logger.error('Error fetching club members', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/clubs/:clubId/territories - Get club's controlled territories
 */
router.get('/:clubId/territories', async (req, res) => {
  try {
    const stats = await gymLocationService.getClubTerritoryStats(req.params.clubId);
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching club territories', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/clubs - Create a new club (requires auth)
 */
router.post('/', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { name, tag, description, color, emblem, minLevelToJoin } = req.body;
    
    if (!name || name.length < 3) {
      return res.status(400).json({ error: 'Club name must be at least 3 characters' });
    }
    
    const club = await clubService.createClub(req.user.uid, {
      name,
      tag,
      description,
      color,
      emblem,
      minLevelToJoin,
    });
    
    logger.info('Club created via API', { clubId: club.id, userId: req.user.uid });
    res.status(201).json(club);
  } catch (error) {
    logger.error('Error creating club', { error: error.message });
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/clubs/:clubId/join - Join a club (requires auth)
 */
router.post('/:clubId/join', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const result = await clubService.joinClub(req.user.uid, req.params.clubId);
    res.json(result);
  } catch (error) {
    logger.error('Error joining club', { error: error.message });
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/clubs/:clubId - Update club settings (requires auth + permission)
 */
router.put('/:clubId', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const club = await clubService.updateClub(req.user.uid, req.params.clubId, req.body);
    res.json(club);
  } catch (error) {
    logger.error('Error updating club', { error: error.message });
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
