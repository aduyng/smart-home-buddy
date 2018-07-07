const getOAuth2Client = require("../libs/getOAuth2Client");
const { GOOGLE_SCOPES } = require("../config");

module.exports = (req, res) => {
  const client = getOAuth2Client();

  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    scope: GOOGLE_SCOPES,
  });

  res.redirect(authUrl);
};
