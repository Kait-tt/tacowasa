'use strict';

const co = require('co');
const config = require('config');

const addons = (config.get('addons') || []).map(({path}) => require(path));

function callAddons (type, key, params, {sync = false} = {}) {
    if (sync) {
        for (let addon of addons) {
            if (addon[type] && addon[type][key]) {
                params = addon[type][key](params);
            }
        }
        return params;
    } else {
        return co(function* () {
            for (let addon of addons) {
                if (addon[type] && addon[type][key]) {
                    params = yield addon[type][key](params);
                }
            }
            return params;
        });
    }
}

module.exports = {
    addons,
    callAddons
};
