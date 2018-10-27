if (process.env.NODE_ENV === "production") {
  require('@google-cloud/debug-agent').start(); //eslint-disable-line
}

require("babel-polyfill");
require("colors");
require("./libs/initializeEnvironmentVariables");

const express = require("express");
const logger = require("./libs/logger");
const routes = require("./routes");

const { PORT = 3000 } = process.env;

const app = express();
app.use("/", routes);

const server = app.listen(PORT, () => {
  logger.info(`server is listening on port ${server.address().port}!`);
});
