const { google } = require("googleapis");
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, FIREBASE_CLOUD_FUNCTION_BASE_URL } = require("../config");

module.exports = ({ clientId, redirectUri }) => new google.auth.OAuth2(
    clientId || GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    redirectUri || `${FIREBASE_CLOUD_FUNCTION_BASE_URL}/authCallback`,
);
