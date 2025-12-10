const logger = require('../../utils/logger');

// Determine which user service to use based on environment
// Default to Firestore in production, allow override with USE_FIRESTORE=false for local dev
const USE_FIRESTORE = process.env.USE_FIRESTORE !== 'false';

logger.info(`Using ${USE_FIRESTORE ? 'Firestore' : 'Local JSON'} user service`);

// Export Firestore service (JSON service has been deprecated)
module.exports = require('./user.service.firestore');
