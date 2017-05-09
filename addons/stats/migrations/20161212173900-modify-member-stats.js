'use strict';
const tableName = 'memberStats';
const db = require('../schemas');

module.exports = {
    up: async function(queryInterface, Sequelize) {
        await db.sequelize.query(`delete from ${tableName}`);
        await queryInterface.removeColumn(tableName, 'throughput');
        await queryInterface.addColumn(tableName, 'costId', {
            allowNull: false,
            type: Sequelize.INTEGER
        });
        await queryInterface.addColumn(tableName, 'mean', {
            allowNull: true,
            type: Sequelize.FLOAT
        });
        await queryInterface.addColumn(tableName, 'low', {
            allowNull: true,
            type: Sequelize.FLOAT
        });
        await queryInterface.addColumn(tableName, 'high', {
            allowNull: true,
            type: Sequelize.FLOAT
        });
        await queryInterface.addIndex(tableName, ['memberId', 'costId'], {
            indexName: 'UniqueMemberAndCost',
            indicesType: 'UNIQUE'
        });
    },
    down: async function(queryInterface, Sequelize) {
        await queryInterface.removeColumn(tableName, 'costId');
        await queryInterface.removeColumn(tableName, 'mean');
        await queryInterface.removeColumn(tableName, 'low');
        await queryInterface.removeColumn(tableName, 'high');
        await queryInterface.addColumn(tableName, 'throughput', {
            allowNull: false,
            type: Sequelize.FLOAT
        });
        await queryInterface.removeIndex(tableName, 'UniqueMemberAndCost');
    }
};
