const express = require("express");
const informedDelivery = require("./informed-delivery");

const router = express.Router();

router.use("/informed-delivery", informedDelivery);

module.exports = router;
