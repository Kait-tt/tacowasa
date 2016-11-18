'use strict';
module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('memberWorkTime', {
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
            promisedMinutes: {
                allowNull: false,
                type: Sequelize.INTEGER
            },
            actualMinutes: {
                allowNull: false,
                defaultValue: 0,
                type: Sequelize.INTEGER
            },
            startTime: {
                allowNull: false,
                type: Sequelize.DATE
            },
            endTime: {
                allowNull: false,
                type: Sequelize.DATE
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
        return queryInterface.dropTable('memberWorkTime');
    }
};
