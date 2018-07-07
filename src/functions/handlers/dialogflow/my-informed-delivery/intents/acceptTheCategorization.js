const logger = require("../../../../libs/logger");
const firebase = require("../../../../libs/firebase");

module.exports = async (conversation) => {
  const { userId, lastMessageId, attachmentIndex, important } = conversation.data;

  logger.debug(`userId=${userId}, lastMessageId=${lastMessageId}, attachmentIndex=${attachmentIndex}, important=${important}`);

  await firebase.database().ref(`/attachments/${userId}/${lastMessageId}/${attachmentIndex}`).update({
    confirmedAsImportant: important,
  });

  const ssml = `
    <speak>
      Great! What do you want to do next?
    </speak>
  `;

  return conversation.add(ssml);
};
