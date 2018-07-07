const reviewOneMail = require("./reviewOneMail");

module.exports = async (conversation, parameters) => reviewOneMail(conversation, parameters, conversation.data.attachmentIndex + 1);
