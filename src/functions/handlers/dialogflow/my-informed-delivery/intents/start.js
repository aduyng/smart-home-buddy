const _ = require("lodash");
const moment = require("moment");
const { SignIn } = require("actions-on-google");
const firebase = require("../../../../libs/firebase");
const logger = require("../../../../libs/logger");

module.exports = async (conversation) => {
  const userId = _.attempt(() => conversation.user.profile.payload.sub);

  if (_.isError(userId) || !userId) {
    logger.debug("Could not find userId, asking the user to sign in.");
    return conversation.ask(new SignIn());
  }

  logger.debug(`userId: ${userId} started the conversation.`);


  const today = moment().utc();
  const yesterday = today.clone().subtract(1, "day");
  const theDayBeforeYesterday = today.clone().subtract(2, "days");

  const userSnapshot = await firebase.database().ref(`/users/${userId}`).once("value");
  const user = userSnapshot.val();
  if (!user) {
    return conversation.ask("You have not set up your account yet. Please follow the instructions on our website to get started.");
  }

  const { lastInformedDeliveryImportantCount = 0, lastInformedDeliveryCount = 0, lastMessageInternalDate, lastMessageId } = user;

  if (!lastMessageInternalDate) {
    return conversation.add("USPS has not told me about your mails yet. Please try again a later.");
  }

  const informedDate = moment(lastMessageInternalDate).utc();
  let dateToAnnounce;
  if (informedDate.isSame(today, "day")) {
    dateToAnnounce = "today";
  } else if (informedDate.isSame(yesterday, "day")) {
    dateToAnnounce = "yesterday";
  } else if (informedDate.isSame(theDayBeforeYesterday, "day")) {
    dateToAnnounce = "the day before yesterday";
  } else {
    dateToAnnounce = informedDate.format("dddd, MMMM Do, YYYY");
  }

  if (lastInformedDeliveryCount === 0) {
    return conversation.add(`You do not have any mail as of ${dateToAnnounce}.`);
  }

  const sayMailpieces = count => (count > 1 ? "mailpieces" : "mailpiece");
  const isOrAre = count => (count > 1 ? "are" : "is");
  const total = lastInformedDeliveryCount;
  const important = lastInformedDeliveryImportantCount;
  const spam = Math.abs(lastInformedDeliveryCount - lastInformedDeliveryImportantCount);
  let secondSentence;

  if (total === important) {
    secondSentence = `All ${sayMailpieces(total)} are important.`;
  } else if (spam === total) {
    secondSentence = `All ${sayMailpieces(total)} are spam.`;
  } else {
    secondSentence = `Only ${important} of them ${isOrAre(important)} important and ${spam} ${isOrAre(spam)} spam.`;
  }

  conversation.data.userId = userId; //eslint-disable-line
  conversation.data.lastMessageId = lastMessageId; //eslint-disable-line

  const speak = `
        <speak>
          <p>
            <s>There ${isOrAre(total)} <say-as interpret-as="cardinal">${total}</say-as> ${sayMailpieces(total)} in your mailbox as of ${dateToAnnounce}.</s>
            <s>${secondSentence}</s>
            <s>Do you want to review them now?</s>
          </p>
        </speak>
      `;

  return conversation.ask(speak);
};
