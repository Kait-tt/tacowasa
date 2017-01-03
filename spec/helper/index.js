'use strict';
const _ = require('lodash');
const config = require('config');
const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const sinon = require('sinon');
const Nightmare = require('nightmare');
const User = require('../../lib/models/user');

const fetchIconUriStub = sinon.stub(User, 'fetchIconUri');
fetchIconUriStub.returns(Promise.resolve(null));

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
