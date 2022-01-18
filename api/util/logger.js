var path = require("path");
const winston = require("winston");
require('winston-daily-rotate-file');
const { conf } = require("./config");

const LOG_DIR = process.pkg ?
  path.join(path.dirname(process.execPath), './logs') :
  path.join(process.cwd(), './logs');

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: conf.get('general.loglevel'),
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({
          format: "YYYY-MM-DD HH:mm:ss",
        }),
        winston.format.printf(
          (info) => `${info.timestamp} ${info.level}: ${info.message}`
        )
      ),
      handleExceptions: true,
    }),
    new winston.transports.DailyRotateFile({
      level: conf.get('general.loglevel'),
      filename: path.join(LOG_DIR, `petio-%DATE%.log`),
      maxSize: '20m',
      maxFiles: '7d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(
          (info) => `${info.timestamp} ${info.level}: ${info.message}`
        )
      ),
    }),
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'live.log'),
      level: "silly",
      maxsize: 100000,
      maxFiles: 1,
      tailable: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf((info) => {
          return `${JSON.stringify({
            [info.timestamp]: {
              type: info.level,
              log: info.message,
            },
          })},`;
        })
      ),
    }),
  ],
});

module.exports = logger;
