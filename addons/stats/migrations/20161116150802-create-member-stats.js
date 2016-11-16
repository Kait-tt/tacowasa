'use strict';
module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('memberStats', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            memberId: {
                allowNull: false,
                type: Sequelize.INTEGER
            },
            throughput: {
                allowNull: false,
                type: Sequelize.FLOAT
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        }, {
            engine: process.env.NODE_ENV === 'test' ? 'MYISAM' : 'InnoDB',
        });
    },
    down: function(queryInterface, Sequelize) {
        return queryInterface.dropTable('memberStats');
    }
};
