const winston = require('winston');

const options = {
  console: {
    level: `${process.env.LOG_LEVEL}`,
    handleExceptions: true,
    format: winston.format.simple(),
    colorized: true,
  },
};

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(options.console),
  ],
  exitOnError: false,
});

logger.stream = {
  write: (message, encoding) => {
    logger.info(message.replace('\n', ''));
  },
};

module.exports = logger;
