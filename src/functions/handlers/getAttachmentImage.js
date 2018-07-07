const streamifier = require("streamifier");
const firebase = require("../libs/firebase");

module.exports = async (req, res) => {
  const { userId, messageId, index } = req.query;

  const attachmentSnapshot = await firebase.database().ref(`/attachments/${userId}/${messageId}/${index}`).once("value");
  const attachment = attachmentSnapshot.val();

  if (!attachment) {
    return res.sendStatus(404);
  }

  const buffer = Buffer.from(attachment.base64Content, "base64");
  const stream = streamifier.createReadStream(buffer);
  res.set("content-type", attachment.mimeType);
  res.status(200);
  return stream.pipe(res);
};
