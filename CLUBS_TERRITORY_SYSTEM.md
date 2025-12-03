# Clubs & Territory Control System

ForgeArena now features a **Clubs & Territory Control** system, similar to how Pokemon GO teams fight for control over gyms/pokestops. Users join clubs (teams) that compete for supremacy over real-world gym locations.

## Overview

- **Clubs** are teams that users join to compete together
- **Gym Locations** are real-world fitness centers discovered via **Google Maps Places API**
- **Interactive Google Map** displays gym locations with territory control status
- **Range slider** allows searching for gyms up to **100 miles** away
- Clubs **battle for control** of gym locations in their area
- **Territory control** gives clubs prestige and leaderboard rankings

## Key Features

### 1. Clubs (Teams)
- Create your own club with custom name, tag, color, and emblem
- Join existing clubs that are recruiting
- Club roles: Founder, Officer, Member
- Minimum level requirements to join certain clubs
- Club statistics: wins, losses, territories controlled, total power

### 2. Real Gym Discovery & Interactive Map
- Uses **Google Maps Places API** to find actual gyms near the user
- **Interactive Google Map** with markers showing gym locations
- **Range slider** to search 1-100 miles radius
- Color-coded markers indicate territory control (club color or gray for unclaimed)
- Click markers to view gym details and take actions
- Falls back to mock data if API key is not configured
- Gym details include: name, address, rating, distance

### 3. Territory Control
- **Claim** unclaimed gym locations for your club
- **Challenge** gyms controlled by other clubs
- **Defend** your club's territories by adding yourself as a defender
- Up to 6 defenders per gym location
- Control strength based on defender levels

### 4. Battle System
- Attack power = attacker's level × 10 + random factor
- Defense power = gym's control strength + random factor
- Winner takes/keeps control of the gym
- Losing attackers weaken the gym's defenses

## API Endpoints

### Club Management
```
GET    /api/clubs                    - List all clubs
GET    /api/clubs/leaderboard        - Club rankings
GET    /api/clubs/:clubId            - Get club details
GET    /api/clubs/:clubId/members    - Get club members
POST   /api/clubs                    - Create a club (auth required)
POST   /api/clubs/:clubId/join       - Join a club (auth required)
POST   /api/clubs/leave              - Leave current club (auth required)
PUT    /api/clubs/:clubId            - Update club settings (auth required)
```

### Territory Control
```
GET    /api/clubs/gyms/nearby        - Find nearby gyms (lat, lng, radius)
GET    /api/clubs/gyms/:gymId        - Get gym details
POST   /api/clubs/gyms/:gymId/claim  - Claim unclaimed gym (auth required)
POST   /api/clubs/gyms/:gymId/challenge - Challenge controlled gym (auth required)
POST   /api/clubs/gyms/:gymId/defend - Add yourself as defender (auth required)
GET    /api/clubs/:clubId/territories - Get club's controlled territories
```

## Configuration

### Google Maps & Places API
To enable real gym discovery and interactive maps, add your Google API keys:

**Server (.env):**
```env
GOOGLE_PLACES_API_KEY=your_places_api_key_here
```

**Client (.env or environment):**
```env
REACT_APP_GOOGLE_MAPS_API_KEY=your_maps_api_key_here
```

**Required Google APIs:**
- Maps JavaScript API (for interactive map)
- Places API (for gym discovery)

Without the API keys, the system uses mock gym data for development/testing.

### Firestore Collections
The system uses these Firestore collections:
- `clubs` - Club data
- `gymLocations` - Gym location and territory data
- `territoryBattles` - Battle history

## Frontend Components

### ClubsScreen
Located at `client/src/components/ClubsScreen.tsx`

Features four tabs:
1. **Map** - View nearby gyms and their control status
2. **Clubs** - Browse and join available clubs
3. **My Club** - View your club details and members
4. **Rankings** - Club leaderboard by territories controlled

## Data Models

### Club
```typescript
{
  id: string;
  name: string;
  tag: string;           // 5-char max club tag
  description: string;
  color: string;         // Hex color for club branding
  emblem: string;
  founderId: string;
  founderName: string;
  members: string[];
  officers: string[];
  memberCount: number;
  totalPower: number;    // Sum of member levels
  territoriesControlled: number;
  wins: number;
  losses: number;
  isRecruiting: boolean;
  minLevelToJoin: number;
}
```

### GymLocation
```typescript
{
  id: string;
  placeId: string;       // Google Places ID
  name: string;
  address: string;
  location: { lat: number; lng: number };
  rating: number;
  controllingClubId: string | null;
  controllingClubName: string | null;
  controllingClubColor: string | null;
  controlStrength: number;
  defenders: Array<{
    userId: string;
    username: string;
    level: number;
  }>;
  totalBattles: number;
}
```

## Future Enhancements

- Real-time map visualization with Mapbox/Google Maps
- Club chat and messaging
- Weekly territory wars/events
- Rewards for controlling territories
- Club alliances and rivalries
- Territory decay over time

