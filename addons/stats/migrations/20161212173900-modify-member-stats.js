'use strict';
const co = require('co');
const tableName = 'memberStats';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return co(function* () {
            yield queryInterface.removeColumn(tableName, 'throughput');
            yield queryInterface.addColumn(tableName, 'costId', {
                allowNull: false,
                type: Sequelize.INTEGER
            });
            yield queryInterface.addColumn(tableName, 'mean', {
                allowNull: false,
                type: Sequelize.FLOAT
            });
            yield queryInterface.addColumn(tableName, 'low', {
                allowNull: false,
                type: Sequelize.FLOAT
            });
            yield queryInterface.addColumn(tableName, 'high', {
                allowNull: false,
                type: Sequelize.FLOAT
            });
            yield queryInterface.addIndex(tableName, ['memberId', 'costId'], {
                indexName: 'UniqueMemberAndCost',
                indicesType: 'UNIQUE'
            });
        });
    },
    down: function(queryInterface, Sequelize) {
        return co(function* () {
            yield queryInterface.removeColumn(tableName, 'costId');
            yield queryInterface.removeColumn(tableName, 'mean');
            yield queryInterface.removeColumn(tableName, 'low');
            yield queryInterface.removeColumn(tableName, 'high');
            yield queryInterface.addColumn(tableName, 'throughput', {
                allowNull: false,
                type: Sequelize.FLOAT
            });
            yield queryInterface.removeIndex(tableName, 'UniqueMemberAndCost');
        });
    }
};
