const admin = require("firebase-admin");
const path = require("path");
const serviceAccount = require("../serviceAccount.json");

const adminConfig = JSON.parse(process.env.FIREBASE_CONFIG);
adminConfig.credential = admin.credential.cert(serviceAccount);
admin.initializeApp(adminConfig);

module.exports = admin;
