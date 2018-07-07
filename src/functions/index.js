require("babel-polyfill");
const functions = require("firebase-functions");
const auth = require("./handlers/auth");
const authCallback = require("./handlers/authCallback");
const checkInformedDeliveryEmails = require("./handlers/checkInformedDeliveryEmails");
const getAttachmentImage = require("./handlers/getAttachmentImage");
const myInformedDelivery = require("./handlers/dialogflow/my-informed-delivery");

exports.auth = functions.https.onRequest(auth);
exports.authCallback = functions.https.onRequest(authCallback);
exports.checkInformedDeliveryEmails = functions.https.onRequest(checkInformedDeliveryEmails);
exports.myInformedDelivery = functions.https.onRequest(myInformedDelivery);
exports.getAttachmentImage = functions.https.onRequest(getAttachmentImage);
