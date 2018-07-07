const request = require("request-promise");
const Promise = require("bluebird");
const firebase = require("../../libs/firebase");
const logger = require("../../libs/logger");

const { FIREBASE_CLOUD_FUNCTION_BASE_URL, INFORMED_DELIVERY_MAX_NUMBER_OF_CHECKING_THREADS } = require("../../../config");

module.exports = async (req, res) => {
  const usersSnapshot = await firebase.database().ref("/users").once("value");
  const userIds = [];
  usersSnapshot.forEach((userSnapshot) => {
    const { key: userId } = userSnapshot;
    userIds.push(userId);
  });

  // ignored the result to end the call and let the promises to continue to run
  Promise.map(userIds, (userId) => {
    logger.info(`Start informed delivery check for userId: ${userId.magenta}`);
    const url = `${FIREBASE_CLOUD_FUNCTION_BASE_URL}/checkInformedDeliveryEmails?userId=${userId}`;
    logger.info(`started requesting ${url}`);
    return request(url)
      .then(() => logger.info(`completed requesting ${url.magenta}`))
      .catch(error => logger.error(`failed requesting ${url}, error: ${error}`));
  }, { concurrency: INFORMED_DELIVERY_MAX_NUMBER_OF_CHECKING_THREADS })
    .then(() => logger.error(`Successfully started informed delivery checkers with base ${FIREBASE_CLOUD_FUNCTION_BASE_URL.magenta}`))
    .catch((error) => {
      logger.error(`Failed to start informed delivery checkers with base ${FIREBASE_CLOUD_FUNCTION_BASE_URL.magenta}, error: ${error}, stack: ${error.stack}`);
    });
  res.sendStatus(200);
};
