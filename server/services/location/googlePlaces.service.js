/**
 * Google Places API Service - Fetches real gym locations
 */

const logger = require('../../utils/logger');

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACES_API_BASE = 'https://maps.googleapis.com/maps/api/place';

/**
 * Search for gyms near a location
 * Note: Google Places API has a max radius of 50,000 meters
 * For larger searches, we make multiple requests or use text search
 */
async function searchNearbyGyms(lat, lng, radiusMeters = 16000) {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      logger.warn('Google Places API key not configured, returning mock data');
      return getMockGyms(lat, lng, radiusMeters);
    }

    // Google Places API max radius is 50,000 meters (~31 miles)
    const effectiveRadius = Math.min(radiusMeters, 50000);
    
    const url = `${PLACES_API_BASE}/nearbysearch/json?` +
      `location=${lat},${lng}` +
      `&radius=${effectiveRadius}` +
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
      lng,
      radiusMeters: effectiveRadius
    });

    return data.results || [];
  } catch (error) {
    logger.error('Error searching nearby gyms', { error: error.message });
    // Return mock data as fallback
    return getMockGyms(lat, lng, radiusMeters);
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
 * Generates gyms spread across the search radius
 */
function getMockGyms(centerLat, centerLng, radiusMeters = 16000) {
  // Convert radius to approximate degrees (rough approximation)
  const radiusDegrees = radiusMeters / 111000; // ~111km per degree
  
  const mockGyms = [
    {
      place_id: 'mock_gym_1',
      name: 'Iron Paradise Fitness',
      vicinity: '123 Main St',
      formatted_address: '123 Main St, Your City',
      geometry: {
        location: {
          lat: centerLat + (radiusDegrees * 0.1),
          lng: centerLng + (radiusDegrees * 0.08),
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
          lat: centerLat - (radiusDegrees * 0.15),
          lng: centerLng + (radiusDegrees * 0.12),
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
          lat: centerLat + (radiusDegrees * 0.25),
          lng: centerLng - (radiusDegrees * 0.1),
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
          lat: centerLat - (radiusDegrees * 0.05),
          lng: centerLng - (radiusDegrees * 0.2),
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
          lat: centerLat + (radiusDegrees * 0.18),
          lng: centerLng + (radiusDegrees * 0.25),
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
          lat: centerLat - (radiusDegrees * 0.3),
          lng: centerLng + (radiusDegrees * 0.05),
        }
      },
      rating: 4.1,
      user_ratings_total: 345,
      types: ['gym', 'health', 'point_of_interest'],
    },
    {
      place_id: 'mock_gym_7',
      name: 'LA Fitness',
      vicinity: '777 Workout Way',
      formatted_address: '777 Workout Way, Your City',
      geometry: {
        location: {
          lat: centerLat + (radiusDegrees * 0.4),
          lng: centerLng - (radiusDegrees * 0.3),
        }
      },
      rating: 4.0,
      user_ratings_total: 423,
      types: ['gym', 'health', 'point_of_interest'],
    },
    {
      place_id: 'mock_gym_8',
      name: 'YMCA Fitness Center',
      vicinity: '100 Community Dr',
      formatted_address: '100 Community Dr, Your City',
      geometry: {
        location: {
          lat: centerLat - (radiusDegrees * 0.35),
          lng: centerLng - (radiusDegrees * 0.25),
        }
      },
      rating: 4.4,
      user_ratings_total: 567,
      types: ['gym', 'health', 'point_of_interest'],
    },
    {
      place_id: 'mock_gym_9',
      name: 'Equinox',
      vicinity: '200 Premium Plaza',
      formatted_address: '200 Premium Plaza, Your City',
      geometry: {
        location: {
          lat: centerLat + (radiusDegrees * 0.22),
          lng: centerLng + (radiusDegrees * 0.35),
        }
      },
      rating: 4.7,
      user_ratings_total: 289,
      types: ['gym', 'health', 'point_of_interest'],
    },
    {
      place_id: 'mock_gym_10',
      name: 'Crunch Fitness',
      vicinity: '400 Flex Ave',
      formatted_address: '400 Flex Ave, Your City',
      geometry: {
        location: {
          lat: centerLat - (radiusDegrees * 0.45),
          lng: centerLng + (radiusDegrees * 0.15),
        }
      },
      rating: 4.2,
      user_ratings_total: 198,
      types: ['gym', 'health', 'point_of_interest'],
    },
  ];

  logger.info('Returning mock gym data', { count: mockGyms.length, radiusMeters });
  return mockGyms;
}

module.exports = {
  searchNearbyGyms,
  searchGymsByText,
  getPlaceDetails,
  getPhotoUrl,
  getMockGyms,
};

