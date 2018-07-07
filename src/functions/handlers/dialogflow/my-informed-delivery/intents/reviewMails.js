const _ = require("lodash");
const { Image, Carousel } = require("actions-on-google");
const { FIREBASE_CLOUD_FUNCTION_BASE_URL } = require("../../../../config");
const firebase = require("../../../../libs/firebase");

module.exports = async (conversation) => {
  if (!conversation.surface.capabilities.has("actions.capability.SCREEN_OUTPUT")) {
    return conversation.ask("Sorry, try this on a screen device");
  }

  const { userId, lastMessageId } = conversation.data;

  const attachmentsSnapshot = await firebase.database().ref(`/attachments/${userId}/${lastMessageId}`).once("value");
  const attachments = attachmentsSnapshot.val();
  conversation.add("Here you go. Which one do you to know more about?");
  const items = _.reduce(attachments, (memo, attachment, index) => {
    const title = attachment.recipient ? `To: ${attachment.recipient}` : "To: unknown recipient";

    memo[index] = { //eslint-disable-line
      title,
      description: attachment.text,
      image: new Image({
        url: `${FIREBASE_CLOUD_FUNCTION_BASE_URL}/getAttachmentImage?userId=${userId}&messageId=${lastMessageId}&index=${index}`,
        alt: attachment.text,
      }),
    };
    return memo;
  }, {});

  return conversation.ask(new Carousel({ items }));
};
