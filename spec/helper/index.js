'use strict';
const _ = require('lodash');
const config = require('config');
const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const Nightmare = require('nightmare');

module.exports = {
    db: require('./db'),
    nightmare: () => new Nightmare(_.defaults(config.get('nightmare'), {
        webPreferences: {
            preload: `${__dirname}/nightmare_preload.js`
        }
    })),
    startApp: () => require('../../bin/www'),
    expect
};
