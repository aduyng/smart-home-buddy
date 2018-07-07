const express = require("express");
const get = require("./get");

const router = express.Router();

router.get("/", get);

module.exports = router;
