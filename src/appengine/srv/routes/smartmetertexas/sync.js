const request = require("request-promise");
const _ = require("lodash");
const puppeteer = require('puppeteer');
const moment = require("moment");
const logger = require("../../libs/logger");
const firebase = require("../../libs/firebase");

const {
    SMART_METER_TEXAS_LOGIN_PAGE,
    SMART_METER_TEXAS_USERNAME,
    SMART_METER_TEXAS_PASSWORD
} = require("../../../config");

module.exports = async (req, res) => {
    try {
        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        logger.debug("browser instance has been created");
        const page = await browser.newPage();
        await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36");
        await page.setViewport({ width: 1024, height: 768 });
        logger.debug("browser page has been created");

        await page.goto(SMART_METER_TEXAS_LOGIN_PAGE);
        logger.debug(`navigated to ${SMART_METER_TEXAS_LOGIN_PAGE.magenta}`);

        await page.type('#username', SMART_METER_TEXAS_USERNAME, { delay: 100 });
        logger.debug("filled in username");
        await page.type('#txtPassword', SMART_METER_TEXAS_PASSWORD, { delay: 100 });
        logger.debug("filled in password");

        const loginNavigationPromise = page.waitForNavigation();
        logger.debug("clicked submit button to sign in");
        await page.click('input[type="submit"]');
        await loginNavigationPromise;
        logger.debug("landed on home page");

        const latestEndOfDateReadSpan = await page.$('[name="ler_date"]');
        const dateRead = await (await latestEndOfDateReadSpan.getProperty('innerText')).jsonValue();
        const dateReadValue = moment(dateRead, "MM/DD/YYYY");
        const dateKey = dateReadValue.format("YYYYMMDD");
        logger.debug(`dateRead ${dateRead}, dateKey: ${dateKey}`);

        const latestEndOfDateMeterReadSpan = await page.$('[name="ler_read"]');
        const meterRead = parseFloat(await (await latestEndOfDateMeterReadSpan.getProperty('innerText')).jsonValue());
        logger.debug(`meterRead ${meterRead}`);
        const dateInfo = {
            meterRead,
            entries: {}
        };

        const detailRowsNodeList = await page.$$('tr[name="DataContainer"][class^="TCP_Row"]');
        for (var row of detailRowsNodeList) {
            const [fromSpan, toSpan, usageSpan, typeSpan] = await row.$$('[name="ColumnData"]>span');

            const from = moment(await (await fromSpan.getProperty('innerText')).jsonValue(), "hh:mm a");
            logger.debug(`from ${from.format("HHmm")}`);

            const to = moment(await (await toSpan.getProperty('innerText')).jsonValue(), "hh:mm a");
            logger.debug(`to ${to.format("HHmm")}`);

            const usage = parseFloat(await (await usageSpan.getProperty('innerText')).jsonValue());
            logger.debug(`usage ${usage}`);

            const type = await (await typeSpan.getProperty('innerText')).jsonValue();
            logger.debug(`type ${type}`);
            const key = `${from.format("HHmm")}${to.format("HHmm")}`;

            dateInfo.entries[key] = {
                usage, type
            };
        }

        await browser.close();
        logger.debug("browser instance has been destroyed");

        const updates = {};
        dateInfo.usage = _.reduce(dateInfo.entries, (memo, { usage }) => memo + (usage || 0), 0);
        updates[`/meter/byDay/${dateKey}`] = dateInfo;
        await firebase.database().ref().update(updates);
        logger.info(`updated firebase for ${dateKey} with usage: ${dateInfo.usage}`);

        res.sendStatus(200);
    } catch (error) {
        logger.error(`error occurred while requesting for meter usage: ${error}`);
        res.sendStatus(500);
    }
};
