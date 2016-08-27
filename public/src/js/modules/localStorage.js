'use strict';
const _ = require('lodash');

const defaultSettings = {
    viewMode: 'full'
};

const dummyStorage = {
    data: {},
    getItem: key => {
        return dummyStorage.data[key];
    },
    setItem: (key, val) => {
        dummyStorage.data[key] = [val];
    }
};

const storage = ('localStorage' in window && window.localStorage) || dummyStorage;

const storageWrap = {
    load: () => {
        _.each(defaultSettings, (defaultValue, key) => {
            if (_.isNil(storage.getItem(key))) {
                storage.setItem(key, defaultValue);
            }
        });
        storageWrap.validate();
        return storageWrap;
    },

    validate: () => {
        const viewMode = storage.getItem('viewMode');
        if (!_.includes(['full', 'compact'], viewMode)) {
            console.error('viewMode is invalid in localStorage: ' + viewMode);
            storage.setItem('viewMode', defaultSettings.viewMode);
        }
    },

    setItem: (key, val) => {
        storage.setItem(key, val);
    },

    getItem: key => {
        return storage.getItem(key);
    }
};

module.exports = storageWrap;
