'use strict';

const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const db = require('../../../lib/schemes/');

let addonModelNames = [];

fs
    .readdirSync(__dirname)
    .filter(file => {
        return (file.indexOf('.') !== 0) && (file !== 'index.js');
    })
    .forEach(file => {
        const model = db.sequelize.import(path.join(__dirname, file));
        let name = _.upperFirst(model.name);
        db[name] = model;
        addonModelNames.push(name);
    });

Object.keys(db).forEach(modelName => {
    if ('associate' in db[modelName]) {
        db[modelName].associate(db);
    }
});

module.exports = db;
