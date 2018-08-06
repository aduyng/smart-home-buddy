const _ = require("lodash");
const config = require("../../config");

_.forEach(config, (value, key) => {
    if (!_.has(process.env, key)) {
        process.env[key] = value;
    }
});