const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.NERINE_LOG_LEVEL || 'verbose',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.metadata(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.label({
          label: process.env.NERINE_LOG_LABEL || 'NERINE',
          message: false,
        }),
        winston.format.colorize(),
        winston.format.printf(
          (info) => [
            // process.stdout.isTTY ? info.timestamp : '',
            info.timestamp,
            info.label ? `${info.label}:` : '',
            `${info.level}:`,
            info.message || '',
            info.metadata && Object.keys(info.metadata).length ? JSON.stringify(info.metadata) : '',
          ].filter((item) => item).join(' ').trim(),
        ),
      ),
    }),
  ],
});

module.exports = logger;
