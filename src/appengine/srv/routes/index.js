const express = require("express");
const informedDelivery = require("./informed-delivery");
const smartmetertexas = require("./smartmetertexas");

const router = express.Router();

router.use("/informed-delivery", informedDelivery);
router.use("/smartmetertexas", smartmetertexas);

module.exports = router;
