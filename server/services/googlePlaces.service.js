/**
 * Google Places API Service - Fetches real gym locations
 */

const logger = require('../utils/logger');

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACES_API_BASE = 'https://maps.googleapis.com/maps/api/place';

/**
 * Search for gyms near a location
 */
async function searchNearbyGyms(lat, lng, radiusMeters = 5000) {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      logger.warn('Google Places API key not configured, returning mock data');
      return getMockGyms(lat, lng);
    }

    const url = `${PLACES_API_BASE}/nearbysearch/json?` +
      `location=${lat},${lng}` +
      `&radius=${radiusMeters}` +
      `&type=gym` +
      `&key=${GOOGLE_PLACES_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      logger.error('Google Places API error', { status: data.status, error: data.error_message });
      throw new Error(`Google Places API error: ${data.status}`);
    }

    logger.info('Found gyms from Google Places', { 
      count: data.results?.length || 0, 
      lat, 
      lng 
    });

    return data.results || [];
  } catch (error) {
    logger.error('Error searching nearby gyms', { error: error.message });
    // Return mock data as fallback
    return getMockGyms(lat, lng);
  }
}

/**
 * Search for gyms by text query
 */
async function searchGymsByText(query, lat, lng) {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      logger.warn('Google Places API key not configured');
      return getMockGyms(lat, lng);
    }

    const url = `${PLACES_API_BASE}/textsearch/json?` +
      `query=${encodeURIComponent(query + ' gym fitness')}` +
      `&location=${lat},${lng}` +
      `&radius=10000` +
      `&type=gym` +
      `&key=${GOOGLE_PLACES_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    return data.results || [];
  } catch (error) {
    logger.error('Error searching gyms by text', { error: error.message });
    return getMockGyms(lat, lng);
  }
}

/**
 * Get place details
 */
async function getPlaceDetails(placeId) {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      return null;
    }

    const url = `${PLACES_API_BASE}/details/json?` +
      `place_id=${placeId}` +
      `&fields=name,formatted_address,geometry,rating,user_ratings_total,photos,opening_hours,website,formatted_phone_number` +
      `&key=${GOOGLE_PLACES_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    return data.result;
  } catch (error) {
    logger.error('Error getting place details', { error: error.message, placeId });
    return null;
  }
}

/**
 * Get photo URL for a place
 */
function getPhotoUrl(photoReference, maxWidth = 400) {
  if (!GOOGLE_PLACES_API_KEY || !photoReference) {
    return null;
  }

  return `${PLACES_API_BASE}/photo?` +
    `maxwidth=${maxWidth}` +
    `&photo_reference=${photoReference}` +
    `&key=${GOOGLE_PLACES_API_KEY}`;
}

/**
 * Mock gym data for development/testing
 */
function getMockGyms(centerLat, centerLng) {
  const mockGyms = [
    {
      place_id: 'mock_gym_1',
      name: 'Iron Paradise Fitness',
      vicinity: '123 Main St',
      formatted_address: '123 Main St, Your City',
      geometry: {
        location: {
          lat: centerLat + 0.005,
          lng: centerLng + 0.003,
        }
      },
      rating: 4.5,
      user_ratings_total: 234,
      types: ['gym', 'health', 'point_of_interest'],
    },
    {
      place_id: 'mock_gym_2',
      name: 'PowerHouse Gym',
      vicinity: '456 Oak Ave',
      formatted_address: '456 Oak Ave, Your City',
      geometry: {
        location: {
          lat: centerLat - 0.008,
          lng: centerLng + 0.006,
        }
      },
      rating: 4.2,
      user_ratings_total: 156,
      types: ['gym', 'health', 'point_of_interest'],
    },
    {
      place_id: 'mock_gym_3',
      name: 'CrossFit Thunder',
      vicinity: '789 Pine Rd',
      formatted_address: '789 Pine Rd, Your City',
      geometry: {
        location: {
          lat: centerLat + 0.012,
          lng: centerLng - 0.004,
        }
      },
      rating: 4.8,
      user_ratings_total: 89,
      types: ['gym', 'health', 'point_of_interest'],
    },
    {
      place_id: 'mock_gym_4',
      name: 'Planet Fitness',
      vicinity: '321 Elm St',
      formatted_address: '321 Elm St, Your City',
      geometry: {
        location: {
          lat: centerLat - 0.003,
          lng: centerLng - 0.009,
        }
      },
      rating: 3.9,
      user_ratings_total: 512,
      types: ['gym', 'health', 'point_of_interest'],
    },
    {
      place_id: 'mock_gym_5',
      name: 'Gold\'s Gym',
      vicinity: '555 Fitness Blvd',
      formatted_address: '555 Fitness Blvd, Your City',
      geometry: {
        location: {
          lat: centerLat + 0.007,
          lng: centerLng + 0.011,
        }
      },
      rating: 4.3,
      user_ratings_total: 678,
      types: ['gym', 'health', 'point_of_interest'],
    },
    {
      place_id: 'mock_gym_6',
      name: 'Anytime Fitness',
      vicinity: '999 24hr Lane',
      formatted_address: '999 24hr Lane, Your City',
      geometry: {
        location: {
          lat: centerLat - 0.015,
          lng: centerLng + 0.002,
        }
      },
      rating: 4.1,
      user_ratings_total: 345,
      types: ['gym', 'health', 'point_of_interest'],
    },
  ];

  logger.info('Returning mock gym data', { count: mockGyms.length });
  return mockGyms;
}

module.exports = {
  searchNearbyGyms,
  searchGymsByText,
  getPlaceDetails,
  getPhotoUrl,
  getMockGyms,
};

