'use strict';

const co = require('co');
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const _ = require('lodash');
const config = require('config');
const sequelize = new Sequelize(
    config.get('db.database'),
    config.get('db.username'),
    config.get('db.password'),
    config.get('db')
);
const db = {};

fs
    .readdirSync(__dirname)
    .filter(file => {
        return (file.indexOf('.') !== 0) && (file !== 'index.js');
    })
    .forEach(file => {
        const model = sequelize.import(path.join(__dirname, file));
        db[_.upperFirst(model.name)] = model;
    });

Object.keys(db).forEach(modelName => {
    if ('associate' in db[modelName]) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.lock = (projectId, transaction = null) => {
    return db.Project.update({updatedAt: Date()}, {where: {id: projectId}, transaction});
};

db.transaction = db.sequelize.transaction.bind(sequelize);

db.coTransaction = (...args) => {
    const options = args.length > 1 ? args[0] : {};
    const fn = args.length > 1 ? args[1] : args[0];
    return db.transaction(options, transaction => {
        return co(fn(transaction));
    });
};

module.exports = db;
