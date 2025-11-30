const logger = require('../utils/logger');

// Determine which user service to use based on environment
const USE_FIRESTORE = process.env.USE_FIRESTORE === 'true';

logger.info(`Using ${USE_FIRESTORE ? 'Firestore' : 'Local JSON'} user service`);

// Export the appropriate service
if (USE_FIRESTORE) {
  module.exports = require('./user.service.firestore');
} else {
  module.exports = require('./user.service.json');
}
