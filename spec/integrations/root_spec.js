'use strict';
require('../../bin/www');
const helper = require('../helper');
const expect = helper.expect;

describe('integrations', () => {
    describe('root', () => {
        let nightmare;
        let url = 'http://localhost:3000';

        before(() => {
            nightmare = helper.nightmare();
        });
        after(() => nightmare.end());
        beforeEach(() => nightmare
            .goto(url)
            .wait('body', 5000));

        it('should show index page', () => {
            nightmare
                .evaluate(() => document.getElementsByTagName('title')[0].text)
                .then(title => expect(title).to.eq('Tacowasa'));
        });
    });
});
