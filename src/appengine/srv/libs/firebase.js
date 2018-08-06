const admin = require("firebase-admin");
const path = require("path");

const { GOOGLE_SERVICE_ACCOUNT_FILE_NAME, FIREBASE_DATABASE_URL } = process.env;

const serviceAccount = require(path.join(process.cwd(), GOOGLE_SERVICE_ACCOUNT_FILE_NAME)); //eslint-disable-line

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: FIREBASE_DATABASE_URL,
});

module.exports = admin;
