const { isEqual } = require('lodash');
const getOAuth2Client = require("../libs/getOAuth2Client");
const { GOOGLE_SCOPES } = require("../config");
const logger = require('../libs/logger');

const getScopes = ({ req }) => {
  if (!req.query.scope) {
    return GOOGLE_SCOPES;
  }

  const scopes = req.query.scope.split(' ');
  return scopes.map((scope) => scope.replace('https:/www', 'https://www'));
}

module.exports = (req, res) => {
  const client = getOAuth2Client({ clientId: req.query.client_id, redirectUri: req.query.redirect_uri });
  const scope = getScopes({ req });

  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    scope,
  });

  res.redirect(authUrl);
};
