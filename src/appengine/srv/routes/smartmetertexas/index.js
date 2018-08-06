const express = require("express");
const sync = require("./sync");

const router = express.Router();

router.get("/sync", sync);

module.exports = router;
