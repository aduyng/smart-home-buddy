const { google } = require("googleapis");
const _ = require("lodash");
const getOAuth2Client = require("../libs/getOAuth2Client");
const firebase = require("../libs/firebase");
const logger = require("../libs/logger");

module.exports = async (req, res) => {
  try {
    const { query } = req;
    const client = getOAuth2Client();
    const { tokens } = await client.getToken(query.code);
    client.setCredentials(tokens);
    const plus = google.plus({
      version: "v1",
      auth: client,
    });

    const response = await plus.people.get({ userId: "me" });
    const uid = _.get(response, "data.id");

    const database = firebase.database();
    const tokensSnapshot = await database.ref(`/users/${uid}/tokens`)
      .once("value");

    const existingTokens = tokensSnapshot.val();
    const updates = {};
    updates[`/users/${uid}/tokens`] = _.extend({}, existingTokens, tokens);
    await database.ref().update(updates);
    res.sendStatus(200);
  } catch (error) {
    logger.error(`unable to authenticate, error: ${error}, stack: ${error.stack}`);
    res.sendStatus(500);
  }
};
