const winston = require('winston');
const path = require('path');
 // define log levels
 const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
 };

 // define log colors
 const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white'
 };

 // connect winston with colors
 winston.addColors(colors);
 
 const level = () => {
    const env = process.env.NODE_ENV || 'development';
    const isCI = process.env.CI === 'true';
    
    // CI: log everything (debug level)
    if (isCI) {
      console.log(' CI Environment Detected - Logging at DEBUG level');
      return 'debug';
    }
    // Development: everything
    return env === 'production' ? 'warn' : 'debug';
  };

  const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf((info) => {
      const { timestamp, level, message, stack, userId, action, ...meta } = info;
      
      let log = `${timestamp} [${level.toUpperCase()}]`;
      
      // Add user context if available
      if (userId) log += ` [User:${userId}]`;
      if (action) log += ` [${action}]`;
      
      log += `: ${message}`;
      
      // Add metadata if present
      if (Object.keys(meta).length > 0) {
        log += ` ${JSON.stringify(meta)}`;
      }
      
      // Add stack trace for errors
      if (stack) log += `\n${stack}`;
      
      return log;
    })
  );
  
  // Console format with colors
  const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    customFormat
  );
  
  // File format without colors
  const fileFormat = customFormat;
  
  // Define transports
  const transports = [
    // Console transport (always enabled)
    new winston.transports.Console({
      format: consoleFormat,
    }),
    
    // Error log file
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Separate file for user activities (info level and above)
    new winston.transports.File({
      filename: path.join('logs', 'user-activity.log'),
      level: 'info',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ];
  
  // Add cloud logging transports for production (exclude CI)
  if (process.env.NODE_ENV === 'production' && process.env.CI !== 'true') {
    // Sumo Logic (recommended - free tier available)
    // Get your HTTP Source URL from: Manage Data > Collection > Add HTTP Source
    if (process.env.SUMO_LOGIC_URL) {
      try {
        const SumoLogic = require('winston-sumologic-transport').SumoLogic;
        
        const sumoTransport = new SumoLogic({
          url: process.env.SUMO_LOGIC_URL,
          level: 'debug', // Log all levels to Sumo Logic for monitoring
          interval: 1000, // Send logs every 1 second for near real-time
          sourceName: 'ForgeArena-Server',
          sourceCategory: 'forgearena/production',
          sourceHost: process.env.HEROKU_APP_NAME || 'local',
        });
        
        transports.push(sumoTransport);

        console.log('[OK] Sumo Logic transport initialized for real-time log monitoring');
        console.log('   Source Category: forgearena/production');
        console.log('   Source Name: ForgeArena-Server');
        console.log('   Interval: 1000ms');
      } catch (err) {
        console.warn('[WARN] Sumo Logic transport failed to initialize:', err.message);
        console.warn('   Stack:', err.stack);
      }
    } else {
      console.warn('[WARN] SUMO_LOGIC_URL not set - Sumo Logic monitoring disabled');
    }
    
    // Logtail (optional)
    try {
      const { Logtail } = require('@logtail/node');
      const { LogtailTransport } = require('@logtail/winston');

      if (process.env.LOGTAIL_SOURCE_TOKEN) {
        const logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN);
        transports.push(new LogtailTransport(logtail));
        console.log('Logtail transport initialized for production logging');
      }
    } catch (e) {
      // If @logtail packages are not installed, skip silently
    }

    // AWS CloudWatch (optional)
    // Provide these environment variables to enable CloudWatch:
    // - CLOUDWATCH_LOG_GROUP (required to enable this transport)
    // - CLOUDWATCH_LOG_STREAM (optional - defaults to hostname)
    // - AWS_REGION (optional - defaults to AWS SDK defaults)
    // AWS credentials may come from environment variables, shared credentials file, or IAM role.
    if (process.env.CLOUDWATCH_LOG_GROUP) {
      try {
        const WinstonCloudWatch = require('winston-cloudwatch');
        const os = require('os');

        transports.push(new WinstonCloudWatch({
          logGroupName: process.env.CLOUDWATCH_LOG_GROUP,
          logStreamName: process.env.CLOUDWATCH_LOG_STREAM || os.hostname(),
          awsRegion: process.env.AWS_REGION || undefined,
          level: process.env.CLOUDWATCH_LEVEL || 'info',
          jsonMessage: true,
          createLogGroup: process.env.CLOUDWATCH_CREATE_LOG_GROUP === 'true'
        }));

        console.log('CloudWatch transport initialized for production logging');
      } catch (err) {
        console.warn('winston-cloudwatch not available or failed to initialize:', err.message);
      }
    }
  }
  
  // Create the logger instance
  const logger = winston.createLogger({
    level: level(),
    levels,
    format: fileFormat,
    transports,
    exitOnError: false,
  });
  
  // Create logs directory if it doesn't exist
  const fs = require('fs');
  const logsDir = path.join(__dirname, '..', 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  // Helper methods for context-rich logging
  logger.logUserAction = (userId, action, message, metadata = {}) => {
    logger.info(message, { userId, action, ...metadata });
  };
  
  logger.logQuestEvent = (questId, userId, event, metadata = {}) => {
    logger.info(`Quest ${event}`, { 
      userId, 
      questId, 
      action: 'QUEST', 
      ...metadata 
    });
  };
  
  logger.logAvatarUpdate = (userId, change, metadata = {}) => {
    logger.info(`Avatar ${change}`, { 
      userId, 
      action: 'AVATAR', 
      ...metadata 
    });
  };
  
  logger.logLeaderboardUpdate = (gymId, userId, metadata = {}) => {
    logger.info('Leaderboard updated', { 
      userId, 
      gymId, 
      action: 'LEADERBOARD', 
      ...metadata 
    });
  };
  
  // Log initialization
  logger.info('ForgeArena Logger Initialized', {
    environment: process.env.NODE_ENV || 'development',
    logLevel: level(),
    isCI: process.env.CI === 'true',
    sumoLogicEnabled: !!(process.env.NODE_ENV === 'production' && process.env.SUMO_LOGIC_URL && process.env.CI !== 'true'),
  });
  
  // Send a test log to verify Sumo Logic is working
  if (process.env.NODE_ENV === 'production' && process.env.SUMO_LOGIC_URL && process.env.CI !== 'true') {
    setTimeout(() => {
      logger.info('Test log - Sumo Logic integration check', {
        timestamp: new Date().toISOString(),
        testMessage: 'If you see this in Sumo Logic, the integration is working!',
      });
    }, 2000);
  }
  
  module.exports = logger;