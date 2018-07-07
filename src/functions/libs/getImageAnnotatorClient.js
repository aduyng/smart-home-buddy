require("colors");
const path = require("path");
const Promise = require("bluebird");
const vision = require("@google-cloud/vision");

module.exports = () => new vision.ImageAnnotatorClient({
  keyFilename: path.join(__dirname, "../serviceAccount.json"),
  promise: Promise,
});
