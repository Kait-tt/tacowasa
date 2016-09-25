'use strict';

const fs = require('fs');
const path = require('path');
const co = require('co');

const addons = fs
    .readdirSync(__dirname)
    .filter(file => {
        return (file.indexOf('.') !== 0) && (file !== 'index.js');
    })
    .map(file => require(path.join(__dirname, file)));


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
