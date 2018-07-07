const { google } = require("googleapis");
const functions = require("firebase-functions");
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, FIREBASE_CLOUD_FUNCTION_BASE_URL } = require("../config");

module.exports = () => new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    `${FIREBASE_CLOUD_FUNCTION_BASE_URL}/authCallback`,
);
