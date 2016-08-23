"use strict";

const fs        = require("fs");
const path      = require("path");
const Sequelize = require("sequelize");
const _         = require('lodash');
const config    = require('config');
const sequelize = new Sequelize(
    config.get('db.database'),
    config.get('db.username'),
    config.get('db.password'),
    config.get('db')
);
const db        = {};

fs
    .readdirSync(__dirname)
    .filter(file => {
        return (file.indexOf(".") !== 0) && (file !== "index.js");
    })
    .forEach(file => {
        const model = sequelize.import(path.join(__dirname, file));
        if (model.name === 'githubRepository') {
            db['GitHubRepository'] = model;
        } else if (model.name === 'githubTask') {
            db['GitHubTask'] = model;
        } else {
            db[_.upperFirst(model.name)] = model;
        }
    });

Object.keys(db).forEach(modelName => {
    if ("associate" in db[modelName]) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;