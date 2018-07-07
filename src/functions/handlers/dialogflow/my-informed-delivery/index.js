const { dialogflow } = require("actions-on-google");
const { LOG_LEVEL, ACTIONS_CLIENT_ID } = require("../../../config");

const start = require("./intents/start");
const reviewMails = require("./intents/reviewMails");
const reviewOneMail = require("./intents/reviewOneMail");
const acceptTheCategorization = require("./intents/acceptTheCategorization");
const correctTheCategorization = require("./intents/correctTheCategorization");
const goToNextMail = require("./intents/goToNextMail");

const app = dialogflow({
  clientId: ACTIONS_CLIENT_ID,
  debug: LOG_LEVEL === "debug",
});

app.intent("start", start);
app.intent("start - yes", reviewMails);
app.intent("start - yes - select.number", reviewOneMail);
app.intent("start - yes - select.number - yes", acceptTheCategorization);
app.intent("start - yes - select.number - yes - next", goToNextMail);
app.intent("start - yes - select.number - no", correctTheCategorization);
app.intent("actions.intent.OPTION", reviewOneMail);
app.intent("review_mails", reviewMails);

module.exports = app;
