const winston = require("winston");
const { LOG_LEVEL } = require("../config");

const logger = winston.createLogger({
  level: LOG_LEVEL || "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

module.exports = logger;
