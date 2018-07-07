require("colors");
const _ = require("lodash");
const { google } = require("googleapis");
const moment = require("moment");
const Promise = require("bluebird");
const { RECIPIENT_REGEXES, USPS_INFORMED_DELIVERY_SENDER_EMAIL, USPS_INFORMED_DELIVERY_SUBJECT } = require("../config");
const getOAuth2Client = require("../libs/getOAuth2Client");
const logger = require("../libs/logger");
const firebase = require("../libs/firebase");
const getImageAnnotatorClient = require("../libs/getImageAnnotatorClient");

function parseRecipientAndAddress({ text }) {
  const matchedRegex = _.find(RECIPIENT_REGEXES, regex => regex.test(text));

  const matches = text.match(matchedRegex);
  return {
    recipient: matches[1],
    address: matches[2],
  };
}

function cleanEmptyKeys(parameters) {
  if (!_.isArray(parameters) && !_.isObject(parameters)) {
    return parameters;
  }

  return _.reduce(parameters, (memo, value, key) => {
    if (_.isNil(value)) {
      return memo;
    }
    memo[key] = cleanEmptyKeys(value); //eslint-disable-line
    return memo;
  }, _.isArray(parameters) ? [] : {});
}

module.exports = async (req, res) => {
  const now = moment();
  const updates = {};

  const printErrorAndExit = (message) => {
    logger.error(message);
    return res.sendStatus(500);
  };

  const { userId } = req.query;

  logger.debug(`${__filename} started at ${now.toString("YYYY/MM/DD HH:mm:ss A")}`);

  try {
    const tokenSnapshot = await firebase.database().ref(`/users/${userId}`).once("value");
    const user = tokenSnapshot.val();
    const client = getOAuth2Client();
    client.setCredentials(user.tokens);

    const gmail = google.gmail({
      version: "v1",
      auth: client,
    });

    const startDate = moment().utc().subtract(2, "days");
    const q = `=:(${USPS_INFORMED_DELIVERY_SENDER_EMAIL}) subject:(${USPS_INFORMED_DELIVERY_SUBJECT}) after:${startDate.format("YYYY/MM/DD")} before:${startDate.add(3, "day").format("YYYY/MM/DD")}`;
    const maxResults = 1;
    const searchRequest = {
      userId: "me",
      q,
      maxResults,
    };

    logger.debug(`searching gmail with query: ${JSON.stringify(searchRequest).magenta}`);
    const { status, data } = await gmail.users.messages.list(searchRequest);
    if (status !== 200) {
      return printErrorAndExit("searching mail failed");
    }
    logger.debug(JSON.stringify(data.messages));
    const firstMessageId = _.get(data, ["messages", 0, "id"]);
    if (!firstMessageId) {
      return printErrorAndExit("Unable to retrieve the first message id");
    }

    logger.debug(`first message id: ${firstMessageId.magenta}`);

    const { status: getMessageStatus, data: message } = await gmail.users.messages.get({
      userId: "me",
      id: firstMessageId,
      format: "full",
    });

    if (getMessageStatus !== 200) {
      return printErrorAndExit("Unable to retrieve the first message content");
    }
    const internalDate = parseInt(_.get(message, ["internalDate"]), 10);
    const messageSnapshot = await firebase.database().ref(`/messages/${userId}/${firstMessageId}`).once("value");
    const messageInDb = messageSnapshot.val();

    _.set(updates, ["messages", userId, firstMessageId], _.extend({}, messageInDb || {}, {
      internalDate,
      userId,
      createdAt: new Date(),
    }));

    if (!_.get(updates, ["messages", userId, firstMessageId, "downloadedAt"])) {
      const parts = _.get(message, ["payload", "parts"]);
      const images = _.filter(parts, ({ mimeType }) => mimeType.split("/").shift() === "image");
      const attachmentsSnapshot = await firebase.database().ref(`/attachments/${userId}/${firstMessageId}`).once("value");
      const attachmentsInDb = attachmentsSnapshot.val();

      _.each(attachmentsInDb, (attachment, index) => {
        _.set(updates, ["attachments", userId, firstMessageId, index], attachment);
      });
      logger.debug(`found ${images.length.toString().magenta} attachment(s)`);
      await Promise.all(_.map(images, async ({ filename, mimeType, body: { attachmentId: id } }, index) => {
        logger.debug(`retrieved attachment id: ${id.magenta} successfully`);
        const { status: getAttachmentStatus, data: { data: base64Image } } = await gmail.users.messages.attachments.get({
          id,
          messageId: firstMessageId,
          userId: "me",
        });

        if (getAttachmentStatus !== 200) {
          logger.error(`Unable to retrieve attachmentId: ${id}`);
          return true;
        }
        logger.info(`able to retrieve content of attachment ${id}`);
        return _.set(updates, ["attachments", userId, firstMessageId, index], _.extend({}, _.get(updates, ["attachments", userId, firstMessageId, index]), {
          uid: id,
          filename,
          mimeType,
          base64Content: base64Image,
          downloadedAt: new Date(),
        }));
      }));
      _.set(updates, ["messages", userId, firstMessageId, "downloadedAt"], new Date());
    } else {
      logger.debug(`message ${firstMessageId.magenta} has already been downloaded at ${messageInDb.downloadedAt.toString().magenta}.`);
    }

    if (!_.get(updates, ["messages", userId, firstMessageId, "recognizedAt"])) {
      const imageAnnotatorClient = getImageAnnotatorClient();

      await Promise.all(_.map(_.get(updates, ["attachments", userId, firstMessageId]), async (attachment, index) => {
        const content = Buffer.from(attachment.base64Content, "base64");
        const image = {
          content,
        };
        let textDetectionResponse;
        try {
          [textDetectionResponse] = await imageAnnotatorClient.textDetection({ image });
        } catch (textDetectionError) {
          logger.error(`unable to perform text detection for image ${attachment.filename.magenta}, error: ${textDetectionError.toString().red}, stack: ${textDetectionError.stack}`);
          return true;
        }
        logger.debug(`successfully perform text detection for ${attachment.filename.magenta}.`);
        const { height, width } = _.get(textDetectionResponse, ["fullTextAnnotation", "pages", 0]);
        const midOfImageVertically = height / 2;

        const textBelowHalfOfImage = _.reduce(_.get(textDetectionResponse, ["textAnnotations"]), (keep, textAnnotation) => {
          const { boundingPoly: { vertices }, description } = textAnnotation;
          const vertexBelowHalfOfTheImage = _.find(vertices, ({ y }) => y >= midOfImageVertically);
          if (vertexBelowHalfOfTheImage) {
            keep.push(description);
          }

          return keep;
        }, []).join(" ").replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ");

        logger.debug(`width: ${width.toString().magenta}, height: ${height.toString().magenta}, middle point: ${midOfImageVertically.toString().magenta}, text: ${textBelowHalfOfImage}`);

        const { recipient, address } = parseRecipientAndAddress({ text: textBelowHalfOfImage });

        _.set(updates, ["attachments", userId, firstMessageId, index], _.extend({}, attachment, {
          width,
          height,
          text: textBelowHalfOfImage,
          recognizedAt: new Date(),
          recipient,
          address,
          important: !!recipient,
          confidence: 0,
        }));
        return true;
      }));

      const importantCount = _.reduce(_.get(updates, ["attachments", userId, firstMessageId]), (count, attachment) => count + (attachment.important ? 1 : 0), 0);
      const count = _.size(_.get(updates, ["attachments", userId, firstMessageId]));

      _.set(updates, ["messages", userId, firstMessageId, "recognizedAt"], new Date());
      _.set(updates, ["messages", userId, firstMessageId, "importantCount"], importantCount);
      _.set(updates, ["messages", userId, firstMessageId, "count"], count);
    } else {
      logger.debug(`message ${firstMessageId.magenta} has already been recognized at ${messageInDb.recognizedAt.toString().magenta}.`);
    }

    const updatesToSend = {};
    updatesToSend[`/messages/${userId}/${firstMessageId}`] = _.get(updates, ["messages", userId, firstMessageId]);
    updatesToSend[`/users/${userId}/lastInformedDeliveryImportantCount`] = _.get(updates, ["messages", userId, firstMessageId, "importantCount"]);
    updatesToSend[`/users/${userId}/lastInformedDeliveryCount`] = _.get(updates, ["messages", userId, firstMessageId, "count"]) || 0;
    updatesToSend[`/users/${userId}/lastMessageId`] = firstMessageId;
    updatesToSend[`/users/${userId}/lastMessageInternalDate`] = _.get(updates, ["messages", userId, firstMessageId, "internalDate"]);

    _.each(_.get(updates, ["attachments", userId, firstMessageId]), (attachment, index) => {
      updatesToSend[`/attachments/${userId}/${firstMessageId}/${index}`] = cleanEmptyKeys(attachment);
    });
    await firebase.database().ref().update(updatesToSend);
    return res.sendStatus(200);
  } catch (runtimeError) {
    return printErrorAndExit(`runtime error: ${runtimeError}, stack: ${runtimeError.stack}`);
  }
};
