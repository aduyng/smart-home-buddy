/* eslint-disable no-param-reassign */
const _ = require("lodash");
const { BasicCard, Image } = require("actions-on-google");
const { FIREBASE_CLOUD_FUNCTION_BASE_URL } = require("../../../../config");
const logger = require("../../../../libs/logger");
const firebase = require("../../../../libs/firebase");

module.exports = async (conversation, parameters, attachmentIndex) => {
  const { userId, lastMessageId } = conversation.data;
  let index;

  if (attachmentIndex !== undefined) {
    index = parseInt(attachmentIndex, 10);
  } else {
    index = parseInt(_.get(parameters, ["number", 0]) || _.get(parameters, ["number"]) || 0, 10);
  }

  logger.debug(`userId=${userId}, lastMessageId=${lastMessageId}, index=${index}, attachmentIndex=${attachmentIndex}, parameters: ${JSON.stringify(parameters)}`);

  const attachmentsSnapshot = await firebase.database().ref(`/attachments/${userId}/${lastMessageId}/${index}`).once("value");
  const attachment = attachmentsSnapshot.val();

  let secondSentence;
  let thirdSentence;

  if (attachment.confirmedAsImportant !== undefined) {
    secondSentence = `You had confirmed it as ${attachment.confirmedAsImportant ? "important" : "spam"}.`;
    thirdSentence = "Is it still correct?";
    conversation.data.important = attachment.confirmedAsImportant;
  } else {
    secondSentence = `I categorized it as ${attachment.important ? "important" : "spam"}.`;
    thirdSentence = "Is it accurate?";
    conversation.data.important = attachment.important;
  }

  const ssml = `
    <speak>
      <p>
        <s>The <say-as interpret-as="ordinal">${index + 1}</say-as> mail was sent to ${attachment.recipient || "unknown recipient"}.</s>
        <s>${secondSentence}</s>
        <s>${thirdSentence}</s>
      </p>
    </speak>
  `;

  conversation.add(ssml);
  conversation.data.attachmentIndex = index;

  return conversation.ask(new BasicCard({
    text: attachment.text,
    // subtitle: 'This is a subtitle', //TODO: determine the sender and show here
    title: `${attachment.recipient || "unknown recipient"}`,
    image: new Image({
      url: `${FIREBASE_CLOUD_FUNCTION_BASE_URL}/getAttachmentImage?userId=${userId}&messageId=${lastMessageId}&index=${index}`,
      alt: attachment.text,
    }),
  }));
};
